import { BrowserRouter, Link, Route, Routes } from "react-router";
import { AuthProvider, ROLE_LABELS, useAuth } from "./auth/AuthContext";
import LoginPage from "./auth/LoginPage";
import NewRequestPage from "./requests/NewRequestPage";

// Signed-in pages. Each feature adds its route here, for example:
//   <Route path="/requests/new" element={<NewRequestPage />} />   // F-02
function SignedInApp() {
  const { user, logout } = useAuth();
  if (!user) return null;
  return (
    <>
      <header>
        <strong>ApprovalFlow</strong>
        <nav>
          <Link to="/requests/new">New request</Link>
        </nav>
        <span>
          <span>{user.name}</span> · <span>{ROLE_LABELS[user.role]}</span>
        </span>
        <button type="button" onClick={() => void logout()}>
          Sign out
        </button>
      </header>
      <main>
        <Routes>
          <Route path="/requests/new" element={<NewRequestPage />} />
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
