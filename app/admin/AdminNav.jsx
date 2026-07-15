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
  return (
    <nav className="admin-nav">
      <span className="admin-nav-brand">Facilitator Matrix Admin</span>
      {LINKS.map((link) => (
        <a key={link.href} href={link.href} className={pathname.startsWith(link.href) ? "active" : ""}>
          {link.label}
        </a>
      ))}
    </nav>
  );
}
