"use client";

import { useContext, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { ChevronDownIcon } from "../icons";
import { InFrameContext } from "./frameContext";

interface AppHeaderProps {
  /** Kept for older pages; the active tab now comes from the URL. */
  active?: string;
}

const NAV: { href: string; label: string; match: string[] }[] = [
  { href: "/dashboard", label: "Dashboard", match: ["/dashboard", "/deck"] },
  { href: "/list", label: "List view", match: ["/list"] },
  { href: "/profile", label: "Add/Edit Resume", match: ["/profile"] },
  { href: "/interested", label: "Interested", match: ["/interested", "/queue"] },
  { href: "/passed", label: "Passed", match: ["/passed"] },
  { href: "/jobs", label: "Add/Edit Jobs", match: ["/jobs"] },
];

export default function AppHeader(_props: AppHeaderProps) {
  const inFrame = useContext(InFrameContext);
  const pathname = usePathname() || "";
  const [fullName, setFullName] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (inFrame) return;
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => setFullName(data.profile?.fullName || null))
      .catch(() => {});
  }, [inFrame]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // The frame renders the one real header; pages that still render their own
  // inside it would otherwise show a second copy.
  if (inFrame) return null;

  const initials = fullName
    ? fullName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0]?.toUpperCase())
        .join("")
    : "?";

  return (
    <header className="app-header">
      <div className="container app-header-inner">
        <Link href="/dashboard" className="app-logo-block-wrap">
          <span className="app-logo-icon">
            <img src="/joby-logo.png" alt="Joby" width={24} height={24} />
          </span>
          <span className="app-logo-block">Joby</span>
        </Link>

        <nav className="app-nav-links">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                item.match.some((m) => pathname === m || pathname.startsWith(m + "/"))
                  ? "active-nav"
                  : ""
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="app-header-right">
          <div className="user-menu" ref={menuRef}>
            <button
              className="user-menu-trigger"
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span className="avatar-circle">{initials}</span>
              <span className="user-menu-name">{fullName || "Your account"}</span>
              <ChevronDownIcon width={16} height={16} />
            </button>

            {menuOpen && (
              <div className="user-menu-dropdown">
                <Link href="/account" onClick={() => setMenuOpen(false)}>
                  Profile
                </Link>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    signOut({ callbackUrl: "/login" });
                  }}
                >
                  Log out
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
