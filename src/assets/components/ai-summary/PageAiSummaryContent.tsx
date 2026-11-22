"use client";

import { Brain, ChevronDown } from "lucide-react";
import { useReducedMotion } from "motion/react";
import type { MouseEvent, ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";

import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Shimmer } from "@/components/ai-elements/shimmer";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
import { Task, TaskContent, TaskItem } from "@/components/ai-elements/task";

// The summary is prepared ahead of time by AI from the product description.
// Opening it replays that work: reading the description, then writing the
// text, which streams in. No request is made while the page is open.
const READ_MS = 900;
const WRITE_MS = 700;
const MS_PER_CHARACTER = 9;

// Browser module memory survives client navigation, but resets on a full reload.
const presentedProducts = new Set<string>();

const shimmerColors =
  "[--color-background:var(--summary-ink)] [--color-muted-foreground:color-mix(in_srgb,var(--summary-ink)_45%,transparent)]";

function ShimmerText({ children }: { children: string }) {
  return (
    <Shimmer as="span" className={shimmerColors} duration={1.6} spread={3}>
      {children}
    </Shimmer>
  );
}

function scrollToSection(event: MouseEvent<HTMLAnchorElement>, id: string) {
  const section = document.getElementById(id);
  if (!section) return;
  event.preventDefault();
  // The description hides its full text in a disclosure; open it on arrival.
  section.querySelector("details")?.setAttribute("open", "");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  section.scrollIntoView({
    behavior: reduced ? "auto" : "smooth",
    block: "start",
  });
  history.replaceState(null, "", `#${id}`);
}

function Step({ done, children }: { done: boolean; children: ReactNode }) {
  return (
    <TaskItem
      className={`animate-in fade-in slide-in-from-top-1 text-[.875rem] leading-[1.5] duration-300 motion-reduce:animate-none ${
        done
          ? "text-[color-mix(in_srgb,var(--summary-ink)_72%,transparent)]"
          : "text-(--summary-ink)"
      }`}
    >
      {children}
    </TaskItem>
  );
}

export function PageAiSummaryContent({
  slug,
  text,
}: {
  slug: string;
  text: string;
}) {
  const reducedMotion = useReducedMotion() ?? false;
  const [open, setOpen] = useState(true);
  const regionId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const textMs = text.length * MS_PER_CHARACTER;
  const doneMs = READ_MS + WRITE_MS + textMs;
  const [replay] = useState(
    () => !reducedMotion && !presentedProducts.has(slug),
  );
  const [elapsed, setElapsed] = useState(replay ? 0 : doneMs);

  useEffect(() => {
    trigger.current?.focus({ preventScroll: true });
    presentedProducts.add(slug);
    if (!replay) return;
    const startedAt = performance.now();
    let frame: number;
    const tick = () => {
      const next = Math.min(doneMs, performance.now() - startedAt);
      setElapsed(next);
      if (next < doneMs) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [doneMs, replay, slug]);

  const reading = elapsed < READ_MS;
  const writing = elapsed >= READ_MS && elapsed < doneMs;
  const finished = elapsed >= doneMs;
  const streamed = Math.max(0, elapsed - READ_MS - WRITE_MS);
  const visible = finished
    ? text.length
    : Math.floor(streamed / MS_PER_CHARACTER);

  const paragraphClassName = "mx-0! mt-0! mb-3.5! max-w-[55ch] leading-[1.65]!";
  const appear =
    "animate-in fade-in slide-in-from-bottom-1 duration-500 motion-reduce:animate-none";

  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="flex min-h-18 w-full cursor-pointer items-center gap-3.5 rounded-[inherit] p-4 text-left text-inherit [font:inherit] font-extrabold! leading-[1.4]! hover:bg-[color-mix(in_srgb,var(--summary-ink)_5%,transparent)] focus-visible:outline-2 focus-visible:outline-current focus-visible:outline-offset-4 sm:px-5"
        aria-expanded={open}
        aria-controls={regionId}
        onClick={() => setOpen(!open)}
      >
        <Brain size={20} className="shrink-0 text-primary" aria-hidden="true" />
        <span>Kortversjonen</span>
        <ChevronDown
          size={20}
          aria-hidden="true"
          className={`ml-auto shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        id={regionId}
        hidden={!open}
        className="px-4 pb-4 sm:px-5 sm:pb-5 [[hidden]]:hidden! [&>*:last-child]:mb-0!"
        aria-busy={!finished}
      >
        <Reasoning
          isStreaming={!finished}
          defaultOpen={replay}
          className="mb-4 rounded-xl border border-(--summary-border) px-3.5 text-(--summary-ink)"
        >
          <ReasoningTrigger className="group/reasoning min-h-11 cursor-pointer gap-2 text-[.875rem] font-semibold text-[color-mix(in_srgb,var(--summary-ink)_75%,transparent)] hover:text-(--summary-ink) focus-visible:outline-2 focus-visible:outline-current focus-visible:outline-offset-2">
            <span className="flex-1 text-left">
              {finished ? (
                "Kortversjon av produktbeskrivelsen"
              ) : (
                <ShimmerText>Tenker …</ShimmerText>
              )}
            </span>
            <ChevronDown
              className="size-4 shrink-0 transition-transform group-data-[panel-open]/reasoning:rotate-180 motion-reduce:transition-none"
              aria-hidden="true"
            />
          </ReasoningTrigger>
          <ReasoningContent className="mt-0 pb-3.5">
            <Task open>
              <TaskContent className="[&>div]:mt-1 [&>div]:space-y-2.5 [&>div]:border-(--summary-border)">
                <Step done={!reading}>
                  {reading ? (
                    <ShimmerText>
                      Leser produktbeskrivelsen og detaljene
                    </ShimmerText>
                  ) : (
                    "Leste produktbeskrivelsen og detaljene"
                  )}
                </Step>
                {!reading && (
                  <Step done={finished}>
                    {writing ? (
                      <ShimmerText>Skriver kortversjonen</ShimmerText>
                    ) : (
                      "Skrev kortversjonen"
                    )}
                  </Step>
                )}
              </TaskContent>
            </Task>
          </ReasoningContent>
        </Reasoning>

        {visible > 0 && (
          <p className={`${paragraphClassName} text-lg!`}>
            {/* Screen readers get the whole text once instead of each letter. */}
            <span aria-hidden={!finished}>
              {text.slice(0, visible)}
              {!finished && (
                <span
                  className="ml-[.12em] inline-block h-[1em] w-[.08em] align-[-.1em] bg-current animate-summary-cursor motion-reduce:animate-none"
                  aria-hidden="true"
                />
              )}
            </span>
          </p>
        )}

        {finished && (
          <div className={appear}>
            <p className={`${paragraphClassName} text-base!`}>
              Gratis frakt fra 999 kr. Gratis størrelsesbytte. 90 % levert innen
              to virkedager.
            </p>
            <Sources className="mb-3.5 text-[.8125rem] text-(--summary-ink)">
              <SourcesTrigger
                count={1}
                className="group/sources min-h-11 cursor-pointer gap-2 rounded-[.5rem] font-semibold text-[color-mix(in_srgb,var(--summary-ink)_75%,transparent)] hover:text-(--summary-ink) focus-visible:outline-2 focus-visible:outline-current focus-visible:outline-offset-4"
              >
                <span>Basert på 1 kilde</span>
                <ChevronDown
                  className="size-4 transition-transform group-data-[panel-open]/sources:rotate-180 motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </SourcesTrigger>
              <SourcesContent className="mt-0 mb-1 gap-0 border-l-2 border-(--summary-border) pl-3.5">
                <Source
                  href="#produktbeskrivelse"
                  target="_self"
                  rel={undefined}
                  onClick={(event) =>
                    scrollToSection(event, "produktbeskrivelse")
                  }
                  className="flex min-h-11 items-center rounded-[.5rem] text-[color-mix(in_srgb,var(--summary-ink)_80%,transparent)] underline decoration-[color-mix(in_srgb,var(--summary-ink)_30%,transparent)] underline-offset-4 hover:text-(--summary-ink) hover:decoration-current focus-visible:outline-2 focus-visible:outline-current"
                >
                  Produktbeskrivelsen og detaljene
                </Source>
              </SourcesContent>
            </Sources>
            <p
              className={`${paragraphClassName} text-[.8125rem]! text-[color-mix(in_srgb,var(--summary-ink)_60%,transparent)]`}
            >
              AI-generert fra produktbeskrivelsen. Les den for alle detaljer.
            </p>
          </div>
        )}
        <p className="sr-only" role="status">
          {finished ? "Kortversjonen er klar." : ""}
        </p>
      </div>
    </>
  );
}
