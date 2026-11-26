"""Read-only checks of the live service after a deployment. Credentials are never printed.

WHAT THIS SCRIPT DOES
    Called by .github/workflows/deploy.yml after a deployment:
        python3 deploy/smoke_test.py SERVICE_URL
    Exits non-zero (failing the workflow) if any check fails. Each public check
    is retried up to 5 times, 3 seconds apart, to tolerate Cloud Run cold starts.

    Checks (in order)
      1. GET /api/health        -> {"status": "ok"}
      2. GET /api/ready         -> {"db": "connected"}  (the database answers)
      3. GET /                  -> HTML (the built React app is served)
      4. GET /requests          -> HTML (client routes fall back to the app)
      5. GET /api/auth/me       -> 401 without a session (protection is on)
      6. OPTIONAL version    -> GET /api/version reports EXPECTED_COMMIT (#41).
         Runs only if EXPECTED_COMMIT is set; the deploy workflow sets it.
         On a rollback (ROLLBACK=true) "unknown" is accepted too: images built
         before #41 have no commit baked in, and the traffic has already moved.
      7. OPTIONAL login         -> POST /api/auth/login, GET /api/auth/me, logout.
         Runs only if BOTH SMOKE_EMAIL and SMOKE_PASSWORD are set (a demo
         account, never an admin). The session cookie is always logged out.

    Uses only the Python standard library. Offline tests: deploy/tests/test_smoke.py
"""
import http.cookiejar
import json
import os
import sys
import time
import urllib.error
import urllib.request


# --- HTTP helpers ---------------------------------------------------------------
# `opener` keeps the session cookie (af_session) between calls of one login check.
def request(base, path, data=None, opener=None):
    """Returns the response body; raises on HTTP errors and timeouts."""
    headers = {'Content-Type': 'application/json'} if data is not None else {}
    req = urllib.request.Request(base + path, headers=headers,
        data=json.dumps(data).encode() if data is not None else None)
    with (opener or urllib.request.build_opener()).open(req, timeout=30) as response:
        return response.read()


def status_of(base, path):
    """Returns the HTTP status code of a GET, including 4xx/5xx."""
    try:
        request(base, path)
        return 200
    except urllib.error.HTTPError as err:
        return err.code


def retry(name, fn):
    # A cold Cloud Run instance may need a few seconds to start.
    for attempt in range(5):
        try:
            if not fn():
                raise ValueError('Unexpected response')
            print('PASS ' + name)
            return
        except (urllib.error.URLError, TimeoutError, ValueError):
            if attempt == 4:
                raise RuntimeError('Smoke check failed: ' + name) from None
            time.sleep(3)


def check(base):
    is_html = lambda b: b'<html' in b.lower()
    retry('/api/health', lambda: json.loads(request(base, '/api/health')).get('status') == 'ok')
    retry('/api/ready', lambda: json.loads(request(base, '/api/ready')).get('db') == 'connected')
    retry('/', lambda: is_html(request(base, '/')))
    retry('/requests (client route)', lambda: is_html(request(base, '/requests')))
    retry('/api/auth/me is 401 without a session', lambda: status_of(base, '/api/auth/me') == 401)

    # --- Optional: the running build is the one that was deployed (#41) -------
    expected = os.getenv('EXPECTED_COMMIT')
    if expected:
        accepted = {expected, 'unknown'} if os.getenv('ROLLBACK') == 'true' else {expected}
        retry('/api/version is ' + expected[:7],
              lambda: json.loads(request(base, '/api/version')).get('commit') in accepted)

    # --- Optional login check (only when both credentials are provided) -------
    email, password = os.getenv('SMOKE_EMAIL'), os.getenv('SMOKE_PASSWORD')
    if bool(email) != bool(password):
        raise RuntimeError('Set both SMOKE_EMAIL and SMOKE_PASSWORD, or neither.')
    if not email:
        print('SKIP login: optional smoke credentials not configured')
        return
    session = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
    signed_in = False
    try:
        request(base, '/api/auth/login', {'email': email, 'password': password}, opener=session)
        signed_in = True
        me = json.loads(request(base, '/api/auth/me', opener=session))
        if me.get('user', {}).get('email') != email.strip().lower():
            raise ValueError('Signed in as someone else')
        print('PASS login and authenticated /api/auth/me')
    except (urllib.error.URLError, TimeoutError, ValueError, KeyError, AttributeError):
        raise RuntimeError('Login smoke check failed') from None
    finally:
        # Always end the session, even when a check above failed.
        if signed_in:
            request(base, '/api/auth/logout', data={}, opener=session)
            print('PASS logout')


# --- Entry point ----------------------------------------------------------------
if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit('Usage: python3 deploy/smoke_test.py SERVICE_URL')
    check(sys.argv[1].rstrip('/'))
