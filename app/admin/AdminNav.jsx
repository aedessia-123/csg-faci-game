'use client';
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin/games", label: "Games" },
  { href: "/admin/scenarios", label: "Scenarios" },
  { href: "/admin/levels", label: "Levels" },
  { href: "/admin/competencies", label: "Competencies" },
];

export default function AdminNav() {
  const pathname = usePathname();
  if (pathname === "/admin/login") return null;

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  };

  return (
    <nav className="admin-nav">
      <span className="admin-nav-brand">Facilitator Matrix Admin</span>
      {LINKS.map((link) => (
        <a key={link.href} href={link.href} className={pathname.startsWith(link.href) ? "active" : ""}>
          {link.label}
        </a>
      ))}
      <button
        onClick={logout}
        className="admin-btn secondary"
        style={{ marginLeft: "auto" }}
        type="button"
      >
        Log out
      </button>
    </nav>
  );
}
