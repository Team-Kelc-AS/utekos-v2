import { Droplets, Thermometer, Wind } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function MdxTabs({
  defaultValue,
  items,
  children,
}: {
  defaultValue: string;
  items: { value: string; label: string }[];
  children: React.ReactNode;
}) {
  return (
    // Typeset excludes data-slot subtrees; keep the controls excluded, but let
    // the root and panels expose their article content to the document styles.
    <Tabs defaultValue={defaultValue} typography="inherit" className="my-8 w-full">
      <TabsList className="mb-6 flex h-auto w-full flex-wrap justify-start gap-2 rounded-xl bg-muted p-2 ring-1 ring-border">
        {items.map((item) => (
          <TabsTrigger
            key={item.value}
            value={item.value}
            className="rounded-lg px-4 py-2.5 text-sm font-extrabold text-muted-foreground transition-all data-active:bg-primary data-active:text-primary-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  );
}

export function MdxTab({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) {
  return (
    <TabsContent
      value={value}
      typography="inherit"
      className="mt-0 rounded-2xl border border-border bg-card p-6 text-left text-card-foreground sm:p-8"
    >
      {children}
    </TabsContent>
  );
}

export function SpecRow({
  temp,
  soap,
  drying,
}: {
  temp: string;
  soap: string;
  drying: string;
}) {
  return (
    <div className="my-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="rounded-xl bg-background p-4 ring-1 ring-border">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Thermometer className="size-4 text-primary" />
          <span>Temperatur</span>
        </div>
        <p>{temp}</p>
      </div>
      <div className="rounded-xl bg-background p-4 ring-1 ring-border">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Droplets className="size-4 text-primary" />
          <span>Vaskemiddel</span>
        </div>
        <p>{soap}</p>
      </div>
      <div className="rounded-xl bg-background p-4 ring-1 ring-border">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Wind className="size-4 text-primary" />
          <span>Tørkemetode</span>
        </div>
        <p>{drying}</p>
      </div>
    </div>
  );
}
