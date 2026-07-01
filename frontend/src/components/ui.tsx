import { motion } from "framer-motion";
import { cn } from "../lib/utils";
import { ReactNode } from "react";
import BorderGlow from "./ui/BorderGlow";
import { useTheme } from "../context/ThemeContext";

export function PageHeader({
  eyebrow, title, subtitle, actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="mb-8 flex flex-col sm:flex-row gap-4 sm:items-end sm:justify-between"
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[11px] uppercase tracking-[0.25em] text-[#C6F24E] font-bold mb-3">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-[var(--th-text)] leading-[1.05] text-balance">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-3 text-sm sm:text-base text-[var(--th-text-secondary)] max-w-2xl leading-relaxed">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </motion.div>
  );
}

export function Panel({
  children, className, light = false, padding = "p-6 sm:p-8",
}: {
  children: ReactNode;
  className?: string;
  light?: boolean;
  padding?: string;
}) {
  const { isDark } = useTheme();

  if (light) {
    return (
      <div
        className={cn(
          "rounded-[24px] relative overflow-hidden",
          "bg-[var(--th-invert)] text-[var(--th-invert-text)]",
          padding,
          className
        )}
      >
        {children}
      </div>
    );
  }

  return (
    <BorderGlow
      className={className}
      borderRadius={24}
      backgroundColor={isDark ? "#151518" : "#FFFFFF"}
      glowColor={isDark ? "78 80 60" : "100 120 40"}
      glowRadius={30}
      glowIntensity={isDark ? 0.8 : 0.5}
      edgeSensitivity={25}
      colors={isDark
        ? ['#C6F24E', '#9FC63B', '#151518']
        : ['#C6F24E', '#9FC63B', '#FFFFFF']
      }
    >
      <div className={padding}>
        {children}
      </div>
    </BorderGlow>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    new: "bg-[#5AC8FA]/10 text-[#5AC8FA] border-[#5AC8FA]/20",
    in_review: "bg-[#FFB800]/10 text-[#FFB800] border-[#FFB800]/20",
    escalated: "bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/20",
    resolved: "bg-[#C6F24E]/10 text-[#C6F24E] border-[#C6F24E]/20",
    false_positive: "bg-[var(--th-subtle)] text-[var(--th-text-secondary)] border-[var(--th-border-strong)]",
    legitimate: "bg-[#C6F24E]/10 text-[#C6F24E] border-[#C6F24E]/20",
    fraud: "bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/20",
    low: "bg-[var(--th-subtle)] text-[var(--th-text-secondary)] border-[var(--th-border-strong)]",
    medium: "bg-[#FFB800]/10 text-[#FFB800] border-[#FFB800]/20",
    high: "bg-[#FF8A00]/10 text-[#FF8A00] border-[#FF8A00]/20",
    critical: "bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/20",
  };
  const label = status.replace(/_/g, " ");
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-[0.12em]",
      map[status] || "bg-[var(--th-subtle)] text-[var(--th-text-secondary)] border-[var(--th-border-strong)]"
    )}>
      {status === "new" && <span className="w-1.5 h-1.5 rounded-full bg-[#5AC8FA] pulse-dot" />}
      {status === "in_review" && <span className="w-1.5 h-1.5 rounded-full bg-[#FFB800]" />}
      {status === "fraud" && <span className="w-1.5 h-1.5 rounded-full bg-[#FF3B30] pulse-dot" />}
      {label}
    </span>
  );
}

export function Button({
  children, onClick, variant = "primary", size = "md", className, disabled, type, testid,
}: {
  children: ReactNode;
  onClick?: (e: any) => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
  testid?: string;
}) {
  const sizes = {
    sm: "px-3.5 py-2 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3.5 text-sm",
  };
  const variants = {
    primary: "bg-[#C6F24E] text-[#0B0B0D] hover:bg-[#D4F475] shadow-[0_4px_20px_var(--th-glow-medium)] hover:shadow-[0_4px_30px_rgba(198,242,78,0.4)]",
    secondary: "bg-[var(--th-subtle)] text-[var(--th-text)] border border-[var(--th-border-strong)] hover:bg-[var(--th-subtle-hover)] hover:border-[var(--th-border-strong)]",
    ghost: "text-[var(--th-text-secondary)] hover:text-[var(--th-text)] hover:bg-[var(--th-subtle)]",
    danger: "bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20 hover:bg-[#FF3B30]/20",
  };
  return (
    <button
      type={type || "button"}
      onClick={onClick}
      disabled={disabled}
      data-testid={testid}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed",
        sizes[size], variants[variant], className
      )}
    >
      {children}
    </button>
  );
}

export function Chip({
  children, active, onClick, testid,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  testid?: string;
}) {
  return (
    <button
      onClick={onClick}
      data-testid={testid}
      className={cn(
        "px-4 py-1.5 rounded-full text-xs font-medium transition-all",
        active
          ? "bg-[#C6F24E] text-[#0B0B0D] shadow-[0_0_20px_rgba(198,242,78,0.3)]"
          : "bg-transparent text-[var(--th-text-secondary)] hover:text-[var(--th-text)]"
      )}
    >
      {children}
    </button>
  );
}
