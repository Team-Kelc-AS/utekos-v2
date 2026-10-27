import { CheckCircle2, XCircle } from "lucide-react";

export function DoDont({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-8 grid grid-cols-1 gap-6 md:grid-cols-2">{children}</div>
  );
}

export function Do({
  title = "Gjør alltid dette",
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-[#001211] bg-[linear-gradient(90deg,#001211,#001a18,#001f1c,#001f1c,#001a18,#001211)] p-6 text-left text-card-foreground">
      <div className="mb-4 flex items-center gap-2.5 border-b border-border pb-3">
        <CheckCircle2 className="size-5 text-primary" />
        <h3>{title}</h3>
      </div>
      {children}
    </div>
  );
}

export function Dont({
  title = "Unngå alltid dette",
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-destructive/40 bg-[#001211] bg-[linear-gradient(90deg,#001211,#001a18,#001f1c,#001f1c,#001a18,#001211)] p-6 text-left text-foreground">
      <div className="mb-4 flex items-center gap-2.5 border-b border-border pb-3">
        <XCircle className="size-5 text-destructive" />
        <h3>{title}</h3>
      </div>
      {children}
    </div>
  );
}
