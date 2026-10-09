import "server-only";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/Accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const questions = [
  {
    question: "Hva mener dere egentlig med 3-i-1 funksjonalitet?",
    answer:
      "Det betyr at plagget tilpasser seg forholdene. Du får et slitesterkt og vindavvisende ytterlag, og et varmeisolerende innerlag. Bruk dem sammen når kulda biter, eller hver for seg når været skifter. Ett plagg løser tre ulike behov i fjellet.",
  },
  {
    question: "På hvilken måte er CloudWeave™ bedre enn tradisjonell dun?",
    answer:
      "Tradisjonell dun kollapser og mister isolasjonsevnen når den blir våt. CloudWeave™ er en syntetisk struktur som beholder loftet og varmen selv i øsende regn, samtidig som fukten fra kroppen transporteres raskere ut. Du holder deg varm, uansett vær.",
  },
  {
    question: "Hva gjør jeg hvis jeg har valgt feil størrelse?",
    answer:
      "Pakk varen tilbake i originalemballasjen og registrer returen i vår portal. Vi dekker returfrakten ved bytte, slik at du raskt og kostnadsfritt får riktig passform til din neste tur.",
  },
  {
    question: "Ved hvilken årstid kan jeg bruke Utekos TechDown™?",
    answer:
      "TechDown™ er konstruert for det skandinaviske halvåret med kuldegrader. Den presterer optimalt fra sen høst til tidlig vår, og fungerer utmerket som ditt ess i ermet når den kalde, sta norske trekken smyger seg frem når du koser deg som mest midt i fellesferien.",
  },
  {
    question:
      "Hvordan vedlikeholder jeg skalljakken for å bevare vanntettheten?",
    answer:
      "Vask jakken jevnlig på 30 grader med flytende vaskemiddel uten enzymer, og unngå skyllemiddel. For å reaktivere den vannavvisende impregneringen (DWR), tørketromler du plagget på lav varme i 20 minutter etter vask.",
  },
];

export function UtekosFAQ() {
  return (
    <section aria-labelledby="techdown-faq-title">
      <Card className="mx-auto w-full max-w-3xl border-none bg-[#012622] text-[#f0eee9] shadow-2xl ring-0">
        <CardHeader className="px-2 pt-4 pb-8">
          <CardTitle
            id="techdown-faq-title"
            role="heading"
            aria-level={2}
            className="text-left text-3xl font-extrabold tracking-tight md:text-4xl"
          >
            Ofte stilte spørsmål
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2">
          <Accordion multiple={false} className="flex w-full flex-col gap-4">
            {questions.map(({ question, answer }, index) => (
              <AccordionItem
                key={question}
                value={`item-${index + 1}`}
                className="rounded-xl border border-[#f0eee920] bg-[#012622] px-6 transition-all duration-300 ease-out data-open:border-[#b44701] data-open:bg-[#f0eee908] motion-reduce:transition-none"
              >
                <AccordionTrigger className="group py-6 hover:no-underline">
                  <span className="text-left text-lg font-extrabold transition-colors group-hover:text-[#b44701] motion-reduce:transition-none">
                    {question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-6 text-base leading-relaxed font-medium text-[#f0eee9e6]">
                  {answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </section>
  );
}
