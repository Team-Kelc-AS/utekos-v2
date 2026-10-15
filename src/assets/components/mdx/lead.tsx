import { Badge } from "@/components/ui/badge";

export function Lead({
  badge,
  meta,
  children,
}: {
  badge?: string;
  meta?: string;
  children: React.ReactNode;
}) {
  return (
    <header className="mb-10 border-b border-border pb-8 text-left">
      {(badge || meta) && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {badge && <Badge variant="default">{badge}</Badge>}
          {meta && (
            <span className="text-xs font-medium text-muted-foreground">
              {meta}
            </span>
          )}
        </div>
      )}
      <div>{children}</div>
    </header>
  );
}
