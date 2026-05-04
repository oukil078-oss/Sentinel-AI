import { motion } from "framer-motion";
import { cn } from "../lib/utils";
import { ReactNode } from "react";

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
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-white leading-[1.05] text-balance">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-3 text-sm sm:text-base text-[#8A8A93] max-w-2xl leading-relaxed">{subtitle}</p>
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
  return (
    <div
      className={cn(
        "rounded-[24px] relative overflow-hidden",
        light ? "bg-white text-[#0B0B0D]" : "bg-[#151518] border border-white/5",
        padding,
        className
      )}
    >
      {children}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    new: "bg-[#5AC8FA]/10 text-[#5AC8FA] border-[#5AC8FA]/20",
    in_review: "bg-[#FFB800]/10 text-[#FFB800] border-[#FFB800]/20",
    escalated: "bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/20",
    resolved: "bg-[#C6F24E]/10 text-[#C6F24E] border-[#C6F24E]/20",
    false_positive: "bg-white/5 text-[#8A8A93] border-white/10",
    legitimate: "bg-[#C6F24E]/10 text-[#C6F24E] border-[#C6F24E]/20",
    fraud: "bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/20",
    low: "bg-white/5 text-[#8A8A93] border-white/10",
    medium: "bg-[#FFB800]/10 text-[#FFB800] border-[#FFB800]/20",
    high: "bg-[#FF8A00]/10 text-[#FF8A00] border-[#FF8A00]/20",
    critical: "bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/20",
  };
  const label = status.replace(/_/g, " ");
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-[0.12em]",
      map[status] || "bg-white/5 text-[#8A8A93] border-white/10"
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
    primary: "bg-[#C6F24E] text-[#0B0B0D] hover:bg-[#D4F475] shadow-[0_4px_20px_rgba(198,242,78,0.2)] hover:shadow-[0_4px_30px_rgba(198,242,78,0.4)]",
    secondary: "bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/20",
    ghost: "text-[#8A8A93] hover:text-white hover:bg-white/5",
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
          : "bg-transparent text-[#8A8A93] hover:text-white"
      )}
    >
      {children}
    </button>
  );
}
