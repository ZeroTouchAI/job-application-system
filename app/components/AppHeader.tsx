"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { BellIcon, MailIcon, ChevronDownIcon } from "./icons";

interface AppHeaderProps {
  active: "dashboard" | "resume" | "jobs";
}

export default function AppHeader({ active }: AppHeaderProps) {
  const [fullName, setFullName] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => setFullName(data.profile?.fullName || null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        <Link href="/dashboard" className="app-logo-block">
          Joby
          <span className="powered-by">
            Powered by{" "}
            <a href="https://zerotouchai.com" target="_blank" rel="noreferrer">
              ZeroTouchAI.com
            </a>
          </span>
        </Link>

        <nav className="app-nav-links">
          <Link href="/dashboard" className={active === "dashboard" ? "active-nav" : ""}>
            Dashboard
          </Link>
          <Link href="/profile" className={active === "resume" ? "active-nav" : ""}>
            Add/Edit Resume
          </Link>
          <Link href="/jobs" className={active === "jobs" ? "active-nav" : ""}>
            Add/Edit Jobs
          </Link>
        </nav>

        <div className="app-header-right">
          <button className="icon-btn" type="button" aria-label="Notifications">
            <BellIcon width={18} height={18} />
          </button>
          <button className="icon-btn" type="button" aria-label="Messages">
            <MailIcon width={18} height={18} />
          </button>

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
                    signOut({ callbackUrl: "/" });
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
