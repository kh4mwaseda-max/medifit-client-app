"use client";

import * as React from "react";
import {
  Users,
  Activity,
  AlertTriangle,
  MessageCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  UserPlus,
  FileText,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Settings as SettingsIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
  X,
  Camera,
  Utensils,
  Dumbbell,
  type LucideIcon,
} from "lucide-react";

// ---------- Icon map (lucide-react) ----------
const ICONS: Record<string, LucideIcon> = {
  users: Users,
  activity: Activity,
  "alert-triangle": AlertTriangle,
  "message-circle": MessageCircle,
  "trending-up": TrendingUp,
  "trending-down": TrendingDown,
  minus: Minus,
  search: Search,
  "user-plus": UserPlus,
  "file-text": FileText,
  "chevron-right": ChevronRight,
  "chevron-down": ChevronDown,
  "chevron-left": ChevronLeft,
  settings: SettingsIcon,
  "layout-dashboard": LayoutDashboard,
  "log-out": LogOut,
  menu: Menu,
  bell: Bell,
  "check-circle": CheckCircle,
  "alert-circle": AlertCircle,
  info: Info,
  x: X,
  camera: Camera,
  utensils: Utensils,
  dumbbell: Dumbbell,
};

export function Icon({
  name,
  className = "",
  size,
}: {
  name: string;
  className?: string;
  size?: number;
}) {
  const I = ICONS[name];
  if (!I) return null;
  return <I className={className} size={size ?? 16} aria-hidden />;
}

// ---------- cn helper ----------
export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

// ---------- Button ----------
type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "success"
  | "line";
type ButtonSize = "sm" | "md" | "lg" | "xl";

export function Button({
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  loading,
  disabled,
  className = "",
  children,
  type = "button",
  onClick,
  ...rest
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: string;
  iconRight?: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  type?: "button" | "submit";
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type">) {
  const sizes: Record<ButtonSize, string> = {
    sm: "h-8 px-3 text-sm rounded-lg gap-1.5",
    md: "h-10 px-4 text-sm rounded-xl gap-2",
    lg: "h-12 px-5 text-base rounded-xl gap-2",
    xl: "h-14 px-7 text-base rounded-2xl gap-2.5",
  };
  const variants: Record<ButtonVariant, string> = {
    primary:
      "text-white shadow-[0_8px_20px_-8px_rgba(59,130,246,0.6)] hover:brightness-110 active:brightness-95",
    secondary:
      "bg-white text-ink-800 border border-ink-200 hover:bg-ink-50 shadow-card",
    ghost: "text-ink-700 hover:bg-ink-100",
    danger: "bg-red-600 text-white hover:bg-red-700",
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
    line: "bg-[#06C755] text-white hover:brightness-110 shadow-[0_8px_20px_-8px_rgba(6,199,85,0.6)]",
  };
  const style =
    variant === "primary"
      ? { background: "linear-gradient(135deg,#3b82f6,#0ea5e9)" }
      : undefined;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={style}
      className={cn(
        "inline-flex items-center justify-center font-semibold transition whitespace-nowrap",
        sizes[size],
        variants[variant],
        (disabled || loading) && "opacity-60 pointer-events-none",
        className,
      )}
      {...rest}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
      )}
      {!loading && icon && <Icon name={icon} className="text-[1.1em]" />}
      {children && <span>{children}</span>}
      {!loading && iconRight && <Icon name={iconRight} className="text-[1.1em]" />}
    </button>
  );
}

// ---------- Card ----------
export function Card({
  className = "",
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl shadow-card border border-ink-200/70",
        className,
      )}
    >
      {children}
    </div>
  );
}

// ---------- StatCard ----------
type IconTint = "brand" | "amber" | "emerald" | "red" | "slate";
type Trend = "up" | "down" | "flat";

export function StatCard({
  label,
  value,
  unit,
  delta,
  trend,
  icon,
  iconTint = "brand",
  subtitle,
  className = "",
}: {
  label: string;
  value: string | number;
  unit?: string;
  delta?: string;
  trend?: Trend;
  icon?: string;
  iconTint?: IconTint;
  subtitle?: string;
  className?: string;
}) {
  const tints: Record<IconTint, string> = {
    brand: "bg-brand-50 text-brand-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
    slate: "bg-ink-100 text-ink-700",
  };
  const deltaColor =
    trend === "up"
      ? "text-emerald-600"
      : trend === "down"
        ? "text-red-600"
        : "text-ink-500";
  const deltaIcon =
    trend === "up" ? "trending-up" : trend === "down" ? "trending-down" : "minus";

  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-center justify-between">
        <div className="text-sm text-ink-500 font-medium">{label}</div>
        {icon && (
          <div
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center",
              tints[iconTint],
            )}
          >
            <Icon name={icon} className="text-base" />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <div className="text-3xl font-black tracking-tight font-mono">{value}</div>
        {unit && <div className="text-sm text-ink-500 font-medium">{unit}</div>}
      </div>
      {(delta || subtitle) && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          {delta && (
            <span
              className={cn(
                "inline-flex items-center gap-1 font-semibold",
                deltaColor,
              )}
            >
              <Icon name={deltaIcon} className="text-[1em]" />
              {delta}
            </span>
          )}
          {subtitle && <span className="text-ink-500">{subtitle}</span>}
        </div>
      )}
    </Card>
  );
}

// ---------- Badge ----------
type BadgeTone = "slate" | "brand" | "emerald" | "amber" | "red";
type BadgeDot = "red" | "amber" | "emerald" | "brand";

export function Badge({
  tone = "slate",
  children,
  icon,
  className = "",
  dot,
}: {
  tone?: BadgeTone;
  children?: React.ReactNode;
  icon?: string;
  className?: string;
  dot?: BadgeDot;
}) {
  const tones: Record<BadgeTone, string> = {
    slate: "bg-ink-100 text-ink-700 border-ink-200",
    brand: "bg-brand-50 text-brand-700 border-brand-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    red: "bg-red-50 text-red-700 border-red-100",
  };
  const dotColors: Record<BadgeDot, string> = {
    red: "bg-red-500",
    amber: "bg-amber-500",
    emerald: "bg-emerald-500",
    brand: "bg-brand-500",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold rounded-md border",
        tones[tone],
        className,
      )}
    >
      {dot && <span className={cn("dot", dotColors[dot])} />}
      {icon && <Icon name={icon} className="text-[1em]" />}
      {children}
    </span>
  );
}

// ---------- Avatar ----------
export function Avatar({
  name,
  size = 36,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const initial = (name || "?")[0];
  const hues = [
    "from-blue-500 to-cyan-500",
    "from-fuchsia-500 to-pink-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500",
    "from-violet-500 to-indigo-500",
    "from-rose-500 to-red-500",
  ];
  const idx =
    (name || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0) % hues.length;
  return (
    <div
      className={cn(
        "rounded-full bg-gradient-to-br text-white font-bold flex items-center justify-center shrink-0",
        hues[idx],
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {initial}
    </div>
  );
}

// ---------- Input / Select ----------
export function Input({
  className = "",
  icon,
  trailing,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className={cn("relative", className)}>
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-ink-500 pointer-events-none">
          <Icon name={icon} />
        </div>
      )}
      <input
        {...props}
        className={cn(
          "w-full h-11 rounded-xl border border-ink-200 bg-white text-ink-800 placeholder:text-ink-400 transition",
          "focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:outline-none",
          icon ? "pl-9" : "pl-3.5",
          trailing ? "pr-9" : "pr-3.5",
        )}
      />
      {trailing && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-ink-500">
          {trailing}
        </div>
      )}
    </div>
  );
}

export function Select({
  className = "",
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...props}
        className={cn(
          "w-full h-11 pl-3.5 pr-10 rounded-xl border border-ink-200 bg-white text-ink-800 appearance-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:outline-none",
          className,
        )}
      >
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 pr-3 flex items-center text-ink-500">
        <Icon name="chevron-down" />
      </div>
    </div>
  );
}

// ---------- Tabs ----------
type TabItem = { value: string; label: string; icon?: string; count?: number };

export function Tabs({
  tabs,
  value,
  onChange,
  variant = "underline",
}: {
  tabs: TabItem[];
  value: string;
  onChange?: (v: string) => void;
  variant?: "underline" | "pill";
}) {
  if (variant === "pill") {
    return (
      <div className="inline-flex bg-ink-100 p-1 rounded-xl">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => onChange?.(t.value)}
            className={cn(
              "h-8 px-3 text-sm font-semibold rounded-lg transition",
              value === t.value
                ? "bg-white text-ink-800 shadow-sm"
                : "text-ink-500 hover:text-ink-700",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 border-b border-ink-200">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange?.(t.value)}
          className={cn(
            "h-10 px-4 text-sm font-semibold relative transition",
            value === t.value ? "text-brand-600" : "text-ink-500 hover:text-ink-700",
          )}
        >
          <span className="inline-flex items-center gap-2">
            {t.icon && <Icon name={t.icon} />}
            {t.label}
            {t.count != null && (
              <span
                className={cn(
                  "px-1.5 text-[10px] rounded-md",
                  value === t.value
                    ? "bg-brand-100 text-brand-700"
                    : "bg-ink-100 text-ink-500",
                )}
              >
                {t.count}
              </span>
            )}
          </span>
          {value === t.value && (
            <span className="absolute left-2 right-2 bottom-0 h-0.5 bg-brand-500 rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}

// ---------- Progress ----------
export function Progress({
  value,
  max = 100,
  className = "",
  tone = "brand",
}: {
  value: number;
  max?: number;
  className?: string;
  tone?: "brand" | "emerald" | "amber" | "red";
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const tones = {
    brand: "bg-gradient-to-r from-brand-500 to-brand-cyan",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
  };
  return (
    <div className={cn("w-full", className)}>
      <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", tones[tone])}
          style={{ width: pct + "%" }}
        />
      </div>
    </div>
  );
}

// ---------- Logo ----------
export function Logo({
  size = 22,
  compact = false,
}: {
  size?: number;
  compact?: boolean;
}) {
  return (
    <div className="inline-flex items-center gap-2 text-ink-800">
      <div
        className="grad-brand rounded-lg flex items-center justify-center text-white"
        style={{ width: size + 8, height: size + 8 }}
      >
        <svg
          viewBox="0 0 24 24"
          width={size * 0.7}
          height={size * 0.7}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 14L9 9l4 4 7-8" />
          <path d="M14 5h6v6" />
        </svg>
      </div>
      {!compact && (
        <span
          className="font-black tracking-tight"
          style={{ fontSize: size * 0.85 }}
        >
          Client Fit
        </span>
      )}
    </div>
  );
}
