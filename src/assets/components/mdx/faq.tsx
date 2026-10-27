import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/Accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function Faq({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="my-6 bg-[#001211] bg-[linear-gradient(90deg,#001211,#001a18,#001f1c,#001f1c,#001a18,#001211)] text-[#f0eee9] ring-0">
      <CardHeader>
        <CardTitle>
          <h2 className="m-0 text-[clamp(1.4rem,2vw,1.8rem)] leading-[1.3] font-extrabold text-balance">
            {title}
          </h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion className="w-full">{children}</Accordion>
      </CardContent>
    </Card>
  );
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
      className="border-b border-[#18504a] bg-transparent px-0 text-[#f0eee9] last:border-b-0 data-panel-open:border-[#287166]"
    >
      <AccordionTrigger
        className="py-5 text-left font-extrabold hover:no-underline [&_span]:border-[#18504a] [&_span]:group-hover:text-[#f0eee9]"
      >
        {question}
      </AccordionTrigger>
      <AccordionContent className="pb-5 text-left">
        {children}
      </AccordionContent>
    </AccordionItem>
  );
}
