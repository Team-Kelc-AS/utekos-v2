import "server-only";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/Accordion";
import { HelpCircle } from "lucide-react";

export interface FAQItem {
  question: string;
  answer: string;
  category?: string;
  highlight?: boolean;
}

const defaultQuestions: FAQItem[] = [
  {
    question: "Hva mener dere egentlig med 3-i-1 funksjonalitet?",
    answer:
      "Det betyr at plagget tilpasser seg forholdene. Du får et slitesterkt og vindavvisende ytterlag, og et varmeisolerende innerlag. Bruk dem sammen når kulda biter, eller hver for seg når været skifter. Ett plagg løser tre ulike behov i fjellet.",
    category: "Funksjon",
  },
  {
    question: "På hvilken måte er CloudWeave™ bedre enn tradisjonell dun?",
    answer:
      "Tradisjonell dun kollapser og mister isolasjonsevnen når den blir våt. CloudWeave™ er en syntetisk struktur som beholder loftet og varmen selv i øsende regn, samtidig som fukten fra kroppen transporteres raskere ut. Du holder deg varm, uansett vær.",
    category: "Materiale",
    highlight: true,
  },
  {
    question: "Hva gjør jeg hvis jeg har valgt feil størrelse?",
    answer:
      "Pakk varen tilbake i originalemballasjen og registrer returen i vår portal. Vi dekker returfrakten ved bytte, slik at du raskt og kostnadsfritt får riktig passform til din neste tur.",
    category: "Kjøp & Retur",
  },
  {
    question: "Ved hvilken årstid kan jeg bruke Utekos TechDown™?",
    answer:
      "TechDown™ er konstruert for det skandinaviske halvåret med kuldegrader. Den presterer optimalt fra sen høst til tidlig vår, og fungerer utmerket som ditt ess i ermet når den kalde, sta norske trekken smyger seg frem når du koser deg som mest midt i fellesferien.",
    category: "Bruk",
  },
  {
    question:
      "Hvordan vedlikeholder jeg skalljakken for å bevare vanntettheten?",
    answer:
      "Vask jakken jevnlig på 30 grader med flytende vaskemiddel uten enzymer, og unngå skyllemiddel. For å reaktivere den vannavvisende impregneringen (DWR), tørketromler du plagget på lav varme i 20 minutter etter vask.",
    category: "Vedlikehold",
  },
];

interface UtekosFAQProps {
  items?: FAQItem[];
  title?: string;
  subtitle?: string;
}

export function UtekosFAQ({
  items = defaultQuestions,
  title = "Ofte stilte spørsmål",
  subtitle = "Alt du trenger å vite om konstruksjon, vedlikehold og levetid i krevende nordisk klima.",
}: UtekosFAQProps) {
  return (
    <section aria-labelledby="techdown-faq-title" className="w-full">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#f0eee9]/15 bg-[#012622]/80 px-3 py-1 text-xs font-semibold tracking-wider uppercase text-[#f0eee9]/70 mb-3">
            <HelpCircle className="h-3.5 w-3.5 text-[#b44701]" />
            FAQ & Veiledning
          </div>
          <h2
            id="techdown-faq-title"
            className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[#f0eee9]"
          >
            {title}
          </h2>
          {subtitle && (
            <p className="mt-2 text-sm sm:text-base text-[#f0eee9]/70 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        <Accordion
          multiple={false}
          className="flex flex-col gap-3.5 w-full"
        >
          {items.map((item, index) => (
            <AccordionItem
              key={item.question}
              value={`item-${index + 1}`}
              variant="card"
              className="border-[#f0eee9]/15 bg-[#012622]/70 backdrop-blur-md hover:border-[#f0eee9]/30 data-[state=open]:border-[#b44701]/70 data-[state=open]:bg-[#01201d]/95 transition-all duration-300"
            >
              <AccordionTrigger
                iconStyle="plus-minus"
                badge={item.highlight ? "Nøkkelinfo" : undefined}
                className="py-5"
              >
                <span className="text-left font-bold text-base sm:text-lg leading-snug">
                  {item.question}
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-6 pt-1 text-sm sm:text-base leading-relaxed text-[#f0eee9]/80 font-normal border-t border-[#f0eee9]/10 mt-1">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
