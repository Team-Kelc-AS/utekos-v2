"use client";

import * as React from "react";

import { ChevronDown, Minus, Plus } from "lucide-react";

import { Accordion as BaseAccordion } from "@base-ui/react/accordion";
import { cn } from "@/lib/utils";

/**
 * Utekos Premium Accordion
 * Bygget på `@base-ui/react/accordion` med Utekos Nordic Sanctuary design tokens.
 *
 * Støtter to distinkte varianter:
 * - 'flush': Minimalistisk skillelinjestil for ProductDetails (tekniske spesifikasjoner, materialer)
 * - 'card': Frittstående paneler med subtil kantlinje og glassaktig bakgrunn for FAQ & veiledning
 */

interface AccordionProps extends React.ComponentPropsWithoutRef<
  typeof BaseAccordion.Root
> {
  className?: string;
}

const Accordion = React.forwardRef<
  React.ElementRef<typeof BaseAccordion.Root>,
  AccordionProps
>(({ className, ...props }, ref) => (
  <BaseAccordion.Root
    ref={ref}
    className={cn("flex flex-col w-full", className)}
    {...props}
  />
));
Accordion.displayName = "Accordion";

interface AccordionItemProps extends React.ComponentPropsWithoutRef<
  typeof BaseAccordion.Item
> {
  variant?: "flush" | "card";
}

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof BaseAccordion.Item>,
  AccordionItemProps
>(({ className, variant = "flush", ...props }, ref) => (
  <BaseAccordion.Item
    ref={ref}
    className={cn(
      "transition-all duration-300 ease-out",
      variant === "flush" &&
        "border-b border-[#f0eee9]/15 last:border-b-0 data-panel-open:border-[#f0eee9]/30",
      variant === "card" &&
        "rounded-2xl border border-[#f0eee9]/10 bg-[#012622]/60 px-6 backdrop-blur-sm data-panel-open:border-[#b44701]/60 data-panel-open:bg-[#012622]/90 data-panel-open:shadow-lg data-panel-open:shadow-[#001110]/50",
      className,
    )}
    {...props}
  />
));
AccordionItem.displayName = "AccordionItem";

interface AccordionTriggerProps extends React.ComponentPropsWithoutRef<
  typeof BaseAccordion.Trigger
> {
  iconStyle?: "chevron" | "plus-minus";
  badge?: string | React.ReactNode;
  headingLevel?: 2 | 3 | 4 | 5 | 6;
}

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof BaseAccordion.Trigger>,
  AccordionTriggerProps
>(({ className, children, iconStyle = "chevron", badge, headingLevel = 3, ...props }, ref) => (
  <BaseAccordion.Header render={React.createElement(`h${headingLevel}`)} className="flex m-0">
    <BaseAccordion.Trigger
      ref={ref}
      className={cn(
        "group flex flex-1 items-center justify-between py-5 font-semibold text-[#f0eee9] text-left transition-all hover:text-[#f0eee9]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b44701] focus-visible:ring-offset-2 focus-visible:ring-offset-[#001715] disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-3 pr-4">
        <span className="text-lg md:text-xl font-bold tracking-tight text-[#f0eee9] group-hover:text-white transition-colors duration-200">
          {children}
        </span>
        {badge && (
          <span className="inline-flex items-center rounded-full bg-[#b44701]/20 px-2.5 py-0.5 text-xs font-medium text-[#f0eee9] border border-[#b44701]/40">
            {badge}
          </span>
        )}
      </div>

      {iconStyle === "chevron" ? (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#f0eee9]/15 bg-[#01201d]/60 text-[#f0eee9]/80 transition-all duration-300 group-hover:border-[#b44701]/40 group-hover:text-white group-data-panel-open:rotate-180 group-data-panel-open:bg-[#b44701] group-data-panel-open:border-[#b44701] group-data-panel-open:text-white">
          <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-300" />
        </span>
      ) : (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#f0eee9]/15 bg-[#01201d]/60 text-[#f0eee9]/80 transition-all duration-300 group-hover:border-[#b44701]/40 group-data-panel-open:border-[#b44701] group-data-panel-open:bg-[#b44701] group-data-panel-open:text-white">
          <Plus className="h-4 w-4 shrink-0 transition-transform duration-300 group-data-panel-open:hidden" />
          <Minus className="hidden h-4 w-4 shrink-0 transition-transform duration-300 group-data-panel-open:block" />
        </span>
      )}
    </BaseAccordion.Trigger>
  </BaseAccordion.Header>
));
AccordionTrigger.displayName = "AccordionTrigger";

interface AccordionContentProps extends React.ComponentPropsWithoutRef<
  typeof BaseAccordion.Panel
> {
  className?: string;
}

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof BaseAccordion.Panel>,
  AccordionContentProps
>(({ className, children, ...props }, ref) => (
  <BaseAccordion.Panel
    ref={ref}
    className={cn(
      "overflow-hidden text-[#f0eee9]/85 text-base leading-relaxed transition-all data-ending-style:h-0 data-starting-style:h-0",
      className,
    )}
    {...props}
  >
    <div className="pb-6 pt-1 font-normal">{children}</div>
  </BaseAccordion.Panel>
));
AccordionContent.displayName = "AccordionContent";

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
