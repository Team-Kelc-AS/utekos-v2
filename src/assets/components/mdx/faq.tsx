import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/Accordion";

export function Faq({ children }: { children: React.ReactNode }) {
  return <Accordion className="my-6 w-full space-y-3">{children}</Accordion>;
}

export function FaqItem({
  value,
  question,
  children,
}: {
  value: string;
  question: string;
  children: React.ReactNode;
}) {
  return (
    <AccordionItem
      value={value}
      className="rounded-xl border border-border bg-card px-6 text-card-foreground"
    >
      <AccordionTrigger typography="inherit" className="py-5 text-left hover:no-underline">
        {question}
      </AccordionTrigger>
      <AccordionContent typography="inherit" className="pb-5 text-left">
        {children}
      </AccordionContent>
    </AccordionItem>
  );
}
