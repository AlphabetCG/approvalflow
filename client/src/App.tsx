import { useState } from "react";
import { BrowserRouter, Link, Route, Routes } from "react-router";
import { AuthProvider, ROLE_LABELS, useAuth } from "./auth/AuthContext";
import LoginPage from "./auth/LoginPage";
import MyRequestsPage from "./requests/MyRequestsPage";
import NewRequestPage from "./requests/NewRequestPage";
import RequestDetailPage from "./requests/RequestDetailPage";
import ReviewQueuePage from "./reviews/ReviewQueuePage";

// Signed-in pages. Each feature adds its route here, for example:
//   <Route path="/requests/new" element={<NewRequestPage />} />   // F-02
//   <Route path="/requests/:id" element={<RequestDetailPage />} />  // F-03
function SignedInApp() {
  const { user, logout } = useAuth();
  const [signOutError, setSignOutError] = useState<string | null>(null);
  if (!user) return null;

  async function signOut() {
    setSignOutError(null);
    try {
      await logout();
    } catch {
      setSignOutError("Sign out failed. Try again.");
    }
  }

  return (
    <>
      <header>
        <strong>ApprovalFlow</strong>
        <nav>
          <Link to="/requests">My requests</Link>
          <Link to="/requests/new">New request</Link>
        </nav>
        <span>
          <span>{user.name}</span> · <span>{ROLE_LABELS[user.role]}</span>
        </span>
        <button type="button" onClick={() => void signOut()}>
          Sign out
        </button>
        {signOutError && <p role="alert">{signOutError}</p>}
      </header>
      <main>
        <Routes>
          <Route path="/requests" element={<MyRequestsPage />} />
          <Route path="/requests/new" element={<NewRequestPage />} />
          <Route path="/requests/:id" element={<RequestDetailPage currentUserId={user.id} />} />
          <Route path="/reviews" element={<ReviewQueuePage />} />
          <Route path="*" element={<p>Welcome, {user.name}.</p>} />
        </Routes>
      </main>
    </>
  );
}

function Shell() {
  const { user, loading } = useAuth();
  if (loading) return <p role="status">Loading…</p>;
  return user ? <SignedInApp /> : <LoginPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Shell />
      </BrowserRouter>
    </AuthProvider>
  );
}
