import { useEffect, useState } from "react";
import { api } from "./api";

interface Version {
  commit: string;
  revision: string | null;
}

// #41: the build that is running, on every page (also the login page), so
// UAT testers can record the exact version (Lab 5 R-08, Lab 6).
export default function VersionFooter() {
  const [version, setVersion] = useState<Version | null>(null);

  useEffect(() => {
    let active = true;
    api<Version>("/api/version")
      .then((v) => active && setVersion(v))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (!version) return null;
  const label = [version.commit.slice(0, 7), version.revision].filter(Boolean).join(" · ");
  return (
    <footer>
      <small title={version.commit}>Version {label}</small>
    </footer>
  );
}
