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
    <Card className="my-8 bg-[#001211] bg-[linear-gradient(90deg,#001211,#001a18,#001f1c,#001f1c,#001a18,#001211)] text-[#f0eee9] ring-0 [--card-spacing:1.5rem] sm:[--card-spacing:2rem] lg:[--card-spacing:2.5rem]">
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
        className="py-6 text-left font-extrabold hover:no-underline sm:py-7 [&>span]:size-11 [&>span]:border-primary! [&>span]:bg-primary! [&>span]:text-primary-foreground!"
      >
        {question}
      </AccordionTrigger>
      <AccordionContent className="max-w-[70ch] pb-7 text-left leading-7">
        {children}
      </AccordionContent>
    </AccordionItem>
  );
}
