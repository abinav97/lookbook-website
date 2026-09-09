import Link from "next/link";
import type { ReactNode } from "react";

interface NoticeProps {
  /** small caps label above the message, e.g. "NO LOOKS" or "IN DEVELOPMENT" */
  label?: string;
  title: ReactNode;
  children?: ReactNode;
  action?: { label: string; href?: string; onClick?: () => void };
  tone?: "neutral" | "error";
  className?: string;
}

/**
 * Editorial empty / error / status block. Hairline frame, serif title,
 * one optional action. Used for filter empty states now and by the
 * purchase assistant's loading, low-confidence, and error states later.
 */
export default function Notice({ label, title, children, action, tone = "neutral", className = "" }: NoticeProps) {
  const actionClass =
    "inline-block mt-6 text-[11px] tracking-[0.18em] border-b pb-1 transition-colors duration-300 " +
    (tone === "error"
      ? "text-text border-text hover:text-accent-dark hover:border-accent-dark"
      : "text-accent-dark border-accent/60 hover:text-text hover:border-text");

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`border border-border px-6 py-10 md:px-10 md:py-14 text-center max-w-xl mx-auto ${className}`}
    >
      {label && (
        <p className="text-[9px] tracking-[0.25em] text-text-muted mb-4">{label}</p>
      )}
      <p className="font-serif text-2xl md:text-3xl font-light text-text leading-snug">{title}</p>
      {children && (
        <div className="text-text-muted text-sm leading-relaxed mt-4 max-w-md mx-auto">{children}</div>
      )}
      {action &&
        (action.href ? (
          <Link href={action.href} className={actionClass}>
            {action.label}
          </Link>
        ) : (
          <button type="button" onClick={action.onClick} className={actionClass}>
            {action.label}
          </button>
        ))}
    </div>
  );
}
