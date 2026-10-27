import { Info } from "lucide-react";

export function Steps({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative my-8 space-y-6 rounded-2xl border border-border bg-[#001211] bg-[linear-gradient(90deg,#001211,#001a18,#001f1c,#001f1c,#001a18,#001211)] p-6 before:absolute before:top-10 before:bottom-10 before:left-10.75 before:w-px before:bg-linear-to-b before:from-primary before:via-border before:to-transparent sm:p-10 sm:before:left-15.75">
      {children}
    </div>
  );
}

export function Step({
  number,
  title,
  badge,
  children,
}: {
  number: string;
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative pl-12 sm:pl-16">
      <div className="absolute top-0 left-0 flex size-10 items-center justify-center rounded-full border-2 border-primary bg-background text-sm font-extrabold text-foreground sm:size-12">
        {number}
      </div>
      <div className="rounded-xl border border-border bg-[#001211] bg-[linear-gradient(90deg,#001211,#001a18,#001f1c,#001f1c,#001a18,#001211)] p-5 text-left text-card-foreground sm:p-6">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <h3>{title}</h3>
          {badge && (
            <span className="inline-flex w-fit items-center gap-1.5 rounded-md bg-background px-3 py-1 text-xs font-medium text-foreground ring-1 ring-border">
              <Info className="size-3.5 text-primary" />
              {badge}
            </span>
          )}
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
