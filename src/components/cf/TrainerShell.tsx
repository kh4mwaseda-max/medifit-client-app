"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Icon, Avatar, Logo, cn } from "./primitives";

type NavKey = "dashboard" | "clients" | "reports" | "settings";

const NAV_ITEMS: { key: NavKey; label: string; icon: string; href: string }[] =
  [
    {
      key: "dashboard",
      label: "ダッシュボード",
      icon: "layout-dashboard",
      href: "/trainer",
    },
    { key: "clients", label: "クライアント", icon: "users", href: "/trainer" },
    {
      key: "reports",
      label: "レポート",
      icon: "file-text",
      href: "/trainer",
    },
    {
      key: "settings",
      label: "設定",
      icon: "settings",
      href: "/trainer/settings",
    },
  ];

function NavItem({
  item,
  isActive,
  onClick,
}: {
  item: (typeof NAV_ITEMS)[number];
  isActive: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "w-full h-10 px-3 rounded-xl flex items-center gap-3 text-sm font-semibold transition",
        isActive
          ? "bg-brand-50 text-brand-700"
          : "text-ink-600 hover:bg-ink-100",
      )}
    >
      <Icon name={item.icon} className="text-[1.05em]" />
      <span>{item.label}</span>
    </Link>
  );
}

export function TrainerShell({
  children,
  active,
  title,
  subtitle,
  actions,
  trainerName,
  trainerEmail,
}: {
  children: React.ReactNode;
  active: NavKey;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  trainerName?: string;
  trainerEmail?: string;
}) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleLogout = async () => {
    await fetch("/api/trainer/auth", { method: "DELETE" });
    router.push("/trainer/login");
  };

  return (
    <div className="min-h-screen bg-ink-50 flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-ink-200 bg-white">
        <div className="h-16 px-5 flex items-center border-b border-ink-100">
          <Logo />
        </div>
        <div className="p-3 flex-1 flex flex-col gap-1">
          {NAV_ITEMS.map((it) => (
            <NavItem key={it.key} item={it} isActive={active === it.key} />
          ))}
        </div>
        <div className="p-3 border-t border-ink-100">
          <div className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-ink-50">
            <Avatar name={trainerName || "T"} size={34} />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-ink-800 truncate">
                {trainerName || "トレーナー"}
              </div>
              {trainerEmail && (
                <div className="text-[11px] text-ink-500 truncate">
                  {trainerEmail}
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              title="ログアウト"
              className="w-7 h-7 rounded-lg hover:bg-ink-100 flex items-center justify-center text-ink-500"
            >
              <Icon name="log-out" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink-900/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white p-3 shadow-pop">
            <div className="h-14 px-2 flex items-center">
              <Logo />
            </div>
            {NAV_ITEMS.map((it) => (
              <NavItem
                key={it.key}
                item={it}
                isActive={active === it.key}
                onClick={() => setMobileOpen(false)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-white border-b border-ink-200 px-4 sm:px-6 flex items-center gap-3 sticky top-0 z-20">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden h-9 w-9 rounded-xl hover:bg-ink-100 flex items-center justify-center"
          >
            <Icon name="menu" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="font-black text-[17px] text-ink-800 truncate">
              {title}
            </div>
            {subtitle && (
              <div className="text-xs text-ink-500 truncate">{subtitle}</div>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden nice-scroll">
          {children}
        </main>
      </div>
    </div>
  );
}
