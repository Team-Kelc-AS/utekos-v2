import { AlertTriangle } from "lucide-react";
import {
  Callout as DocumentCallout,
  type CalloutProps as DocumentCalloutProps,
} from "./document-callout";
import { cx } from "./shared";

export type CalloutProps = DocumentCalloutProps & {
  variant?: "warning" | "info";
};

export function Callout({
  title,
  children,
  variant,
  type,
  className,
  ...props
}: CalloutProps) {
  if (variant == null) {
    return (
      <DocumentCallout {...props} type={type} title={title} className={className}>
        {children}
      </DocumentCallout>
    );
  }

  const label = title ?? (variant === "warning" ? "Advarsel" : "Merk");
  return (
    <aside
      {...props}
      aria-label={props["aria-label"] ?? label}
      className={cx(
        "my-10 rounded-xl border border-primary/50 border-l-4 border-l-primary bg-card p-6 text-left text-card-foreground sm:p-8",
        className,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <AlertTriangle className="size-5" />
        </div>
        <div className="space-y-2">
          <h3>{label}</h3>
          <div>{children}</div>
        </div>
      </div>
    </aside>
  );
}
