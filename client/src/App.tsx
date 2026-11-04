import { useEffect, useState } from "react";
import { getJson } from "./api";

type Status = "checking" | "ok" | "down";

export default function App() {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    getJson<{ db: string }>("/api/ready")
      .then((body) => setStatus(body.db === "connected" ? "ok" : "down"))
      .catch(() => setStatus("down"));
  }, []);

  return (
    <main>
      <h1>ApprovalFlow</h1>
      <p role="status">
        {status === "checking" && "Checking server…"}
        {status === "ok" && "Server and database are ready."}
        {status === "down" && "Server or database is not reachable."}
      </p>
    </main>
  );
}
