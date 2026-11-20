"""Offline unit tests for deploy/smoke_test.py (the network is mocked).

Run (repo root):  python3 -m unittest discover -s deploy/tests -p 'test_smoke.py'
CI runs it too (.github/workflows/ci-docker.yml).

Covers: public checks pass and login is skipped without credentials; a database
that is not ready fails; an unprotected /api/auth/me fails; the session is
logged out even when a check after login fails.
"""
import importlib.util
from pathlib import Path
import unittest
import urllib.error
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('smoke', Path(__file__).parents[1] / 'smoke_test.py')
smoke = importlib.util.module_from_spec(spec)
spec.loader.exec_module(smoke)

ME = b'{"user":{"id":"u1","email":"req.eng1@example.com"}}'


def unauthorized(path):
    return urllib.error.HTTPError('https://demo.test' + path, 401, 'Unauthorized', {}, None)


class SmokeTests(unittest.TestCase):
    def response(self, base, path, data=None, opener=None):
        if path == '/api/auth/me' and opener is None:
            raise unauthorized(path)
        return {
            '/api/health': b'{"status":"ok"}',
            '/api/ready': b'{"status":"ready","db":"connected"}',
            '/': b'<html></html>',
            '/requests': b'<html></html>',
            '/api/auth/login': ME,
            '/api/auth/me': ME,
            '/api/auth/logout': b'',
        }[path]

    @patch.dict('os.environ', {}, clear=True)
    def test_public_checks_pass_and_skip_optional_login(self):
        with patch.object(smoke, 'request', side_effect=self.response) as req:
            smoke.check('https://demo.test')
            self.assertEqual([c.args[1] for c in req.call_args_list],
                             ['/api/health', '/api/ready', '/', '/requests', '/api/auth/me'])

    @patch.dict('os.environ', {}, clear=True)
    def test_db_not_ready_fails_even_when_http_responds(self):
        def disconnected(base, path, data=None, opener=None):
            return b'{"db":"disconnected"}' if path == '/api/ready' else self.response(base, path, data, opener)
        with patch.object(smoke, 'request', side_effect=disconnected), patch.object(smoke.time, 'sleep'):
            with self.assertRaisesRegex(RuntimeError, '/api/ready'):
                smoke.check('https://demo.test')

    @patch.dict('os.environ', {}, clear=True)
    def test_unprotected_me_fails(self):
        def open_me(base, path, data=None, opener=None):
            return ME if path == '/api/auth/me' else self.response(base, path, data, opener)
        with patch.object(smoke, 'request', side_effect=open_me), patch.object(smoke.time, 'sleep'):
            with self.assertRaisesRegex(RuntimeError, '401 without a session'):
                smoke.check('https://demo.test')

    @patch.dict('os.environ', {'SMOKE_EMAIL': 'req.eng1@example.com', 'SMOKE_PASSWORD': 'test-only'}, clear=True)
    def test_login_check_uses_the_session_and_logs_out(self):
        with patch.object(smoke, 'request', side_effect=self.response) as req:
            smoke.check('https://demo.test')
            self.assertEqual(req.call_args.args[1], '/api/auth/logout')
            self.assertIsNotNone(req.call_args.kwargs.get('opener'))

    @patch.dict('os.environ', {'SMOKE_EMAIL': 'req.eng1@example.com', 'SMOKE_PASSWORD': 'test-only'}, clear=True)
    def test_session_is_logged_out_even_if_me_fails(self):
        def broken_me(base, path, data=None, opener=None):
            if path == '/api/auth/me' and opener is not None:
                raise ValueError('Broken response')
            return self.response(base, path, data, opener)
        with patch.object(smoke, 'request', side_effect=broken_me) as req:
            with self.assertRaisesRegex(RuntimeError, 'Login smoke'):
                smoke.check('https://demo.test')
            self.assertEqual(req.call_args.args[1], '/api/auth/logout')


if __name__ == '__main__':
    unittest.main()
