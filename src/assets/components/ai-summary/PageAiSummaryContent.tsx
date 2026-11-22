"use client";

import { useObject } from "@ai-sdk/react";
import { Brain, ChevronDown, Star } from "lucide-react";
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
import {
  Task,
  TaskContent,
  TaskItem,
  TaskItemFile,
} from "@/components/ai-elements/task";
import {
  productSummaryResponseSchema,
  type SummaryTarget,
} from "@/lib/ai-summary/schema";

// Each analysis step stays visible long enough to be read, even when the
// summary comes straight from cache. Steps only advance on real progress.
const STEP_MS = 450;
const REQUEST_TIMEOUT_MS = 5_000;

const READING = 0;
const REVIEWS_READ = 1;
const WRITING = 2;
const DONE = 3;

// Colours follow the product page: Mist text in steps of opacity so every
// variant theme (Havdyp, Comfyrobe, Vargnatt …) keeps its own surface, and
// the brand orange only where the page already uses it (stars, main icon).
const shimmerColors = `[--color-background:var(--summary-ink)] [--color-muted-foreground:color-mix(in_srgb,var(--summary-ink)_45%,transparent)]`;

function formatRating(average: number) {
  return average.toLocaleString("nb-NO", { maximumFractionDigits: 1 });
}

function reviewWord(count: number) {
  return count === 1 ? "omtale" : "omtaler";
}

function ShimmerText({
  children,
  reduced,
}: {
  children: string;
  reduced: boolean;
}) {
  if (reduced) return <span>{children}</span>;
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

function Step({
  status,
  children,
}: {
  status: "active" | "complete";
  children: ReactNode;
}) {
  return (
    <TaskItem
      className={`animate-in fade-in slide-in-from-top-1 text-[.875rem] leading-[1.5] duration-300 motion-reduce:animate-none ${
        status === "complete"
          ? `text-[color-mix(in_srgb,var(--summary-ink)_72%,transparent)]`
          : "text-(--summary-ink)"
      }`}
    >
      {children}
    </TaskItem>
  );
}

export function PageAiSummaryContent({
  target,
  fallback,
}: {
  target: SummaryTarget;
  fallback?: string;
}) {
  const reducedMotion = useReducedMotion() ?? false;
  const [open, setOpen] = useState(true);
  const [started, setStarted] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [shownPhase, setShownPhase] = useState(READING);
  const [attempt, setAttempt] = useState(0);
  const regionId = useId();
  // The AI SDK treats an aborted request as a deliberate stop, not an error,
  // so a timed-out request must mark the summary as failed itself.
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const clearRequestTimeout = () => clearTimeout(timeoutRef.current);
  const { object, submit, isLoading, error, stop, clear } = useObject({
    api: "/api/ai-summary",
    fetch: (url, options) => {
      const timeout = new AbortController();
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        timeout.abort();
        setInvalid(true);
      }, REQUEST_TIMEOUT_MS);
      return fetch(url, {
        ...options,
        signal: AbortSignal.any([
          ...(options?.signal ? [options.signal] : []),
          timeout.signal,
        ]),
      });
    },
    schema: productSummaryResponseSchema,
    onFinish: ({ object, error }) => {
      clearRequestTimeout();
      setInvalid(Boolean(error) || !object);
    },
    onError: () => {
      clearRequestTimeout();
      setInvalid(true);
    },
  });
  const initialSubmit = useRef(submit);
  const initialTarget = useRef(target);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    trigger.current?.focus({ preventScroll: true });
    initialSubmit.current(initialTarget.current);
    return () => {
      clearTimeout(timeoutRef.current);
      stop();
    };
  }, [stop]);

  const failed = invalid || Boolean(error);
  // Ratings stream in before the summary text; use them only once complete.
  const streamedReviews = object?.reviews;
  const reviews =
    streamedReviews === null
      ? null
      : typeof streamedReviews?.count === "number" &&
          typeof streamedReviews.average === "number"
        ? {
            count: streamedReviews.count,
            average: streamedReviews.average,
            includedCount:
              streamedReviews.includedCount ?? streamedReviews.count,
          }
        : undefined;
  const summary = object?.content?.summary;
  const reviewSummary = object?.content?.reviewSummary;
  const realPhase =
    summary && !isLoading
      ? DONE
      : summary
        ? WRITING
        : reviews !== undefined
          ? REVIEWS_READ
          : READING;
  const phase = reducedMotion ? realPhase : shownPhase;

  useEffect(() => {
    if (reducedMotion || shownPhase >= realPhase) return;
    const timer = setTimeout(() => setShownPhase(shownPhase + 1), STEP_MS);
    return () => clearTimeout(timer);
  }, [reducedMotion, realPhase, shownPhase]);

  const finished = phase >= DONE;
  const reviewCount = reviews?.count ?? 0;

  const paragraphClassName = "mx-0! mt-0! mb-3.5! max-w-[55ch] leading-[1.65]!";
  const noteClassName = `${paragraphClassName} text-[.8125rem]!`;
  const actionClassName =
    "min-h-11 cursor-pointer rounded-[.5rem] border border-(--summary-border) px-3 py-2 [font:inherit] focus-visible:outline-2 focus-visible:outline-current focus-visible:outline-offset-4 hover:bg-[color-mix(in_srgb,var(--summary-ink)_5%,transparent)]";
  const appear =
    "animate-in fade-in slide-in-from-bottom-1 duration-500 motion-reduce:animate-none";
  const sourceLinkClassName = `flex min-h-11 items-center rounded-[.5rem] text-[color-mix(in_srgb,var(--summary-ink)_80%,transparent)] underline decoration-[color-mix(in_srgb,var(--summary-ink)_30%,transparent)] underline-offset-4 hover:text-(--summary-ink) hover:decoration-current focus-visible:outline-2 focus-visible:outline-current`;

  const reviewStep =
    reviews === null
      ? "Kundeomtalene er midlertidig utilgjengelige"
      : reviewCount === 0
        ? "Ingen kundeomtaler ennå"
        : `Gikk gjennom ${reviews?.includedCount ?? reviewCount} kundeomtaler, snitt ${formatRating(reviews?.average ?? 0)} av 5`;

  const analysis = (
    <Reasoning
      key={attempt}
      isStreaming={!finished}
      defaultOpen
      className="mb-4 rounded-xl border border-(--summary-border) px-3.5 text-(--summary-ink)"
    >
      <ReasoningTrigger
        className={`group/reasoning min-h-11 cursor-pointer gap-2 text-[.875rem] font-semibold text-[color-mix(in_srgb,var(--summary-ink)_75%,transparent)] hover:text-(--summary-ink) focus-visible:outline-2 focus-visible:outline-current focus-visible:outline-offset-2`}
      >
        <span className="flex-1 text-left">
          {finished ? (
            reviewCount > 0 ? (
              `Analyserte produktet og ${reviewCount} ${reviewWord(reviewCount)}`
            ) : (
              "Analyserte produktbeskrivelsen"
            )
          ) : (
            <ShimmerText reduced={reducedMotion}>
              Analyserer produktet …
            </ShimmerText>
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
            <Step status={phase > READING ? "complete" : "active"}>
              {phase > READING ? (
                "Leste produktbeskrivelsen og detaljene"
              ) : (
                <ShimmerText reduced={reducedMotion}>
                  Leser produktbeskrivelsen og detaljene
                </ShimmerText>
              )}
            </Step>
            {phase >= REVIEWS_READ && (
              <Step status={phase > REVIEWS_READ ? "complete" : "active"}>
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  {reviewStep}
                  {reviewCount > 0 && (
                    <TaskItemFile
                      className={`border-(--summary-border) bg-transparent text-[.75rem] font-semibold text-[color-mix(in_srgb,var(--summary-ink)_80%,transparent)]`}
                    >
                      Judge.me
                    </TaskItemFile>
                  )}
                </span>
              </Step>
            )}
            {phase >= REVIEWS_READ && (
              <Step status={finished ? "complete" : "active"}>
                {finished ? (
                  "Skrev kortversjonen"
                ) : (
                  <ShimmerText reduced={reducedMotion}>
                    Skriver kortversjonen
                  </ShimmerText>
                )}
              </Step>
            )}
          </TaskContent>
        </Task>
      </ReasoningContent>
    </Reasoning>
  );

  const sources = (
    <Sources className="mb-3.5 text-[.8125rem] text-(--summary-ink)">
      <SourcesTrigger
        count={reviewCount > 0 ? 2 : 1}
        className={`group/sources min-h-11 cursor-pointer gap-2 rounded-[.5rem] font-semibold text-[color-mix(in_srgb,var(--summary-ink)_75%,transparent)] hover:text-(--summary-ink) focus-visible:outline-2 focus-visible:outline-current focus-visible:outline-offset-4`}
      >
        <span>Basert på {reviewCount > 0 ? "2 kilder" : "1 kilde"}</span>
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
          onClick={(event) => scrollToSection(event, "produktbeskrivelse")}
          className={sourceLinkClassName}
        >
          Produktbeskrivelsen og detaljene
        </Source>
        {reviews && reviews.count > 0 && (
          <Source
            href="#produktomtaler"
            target="_self"
            rel={undefined}
            onClick={(event) => scrollToSection(event, "produktomtaler")}
            className={sourceLinkClassName}
          >
            {reviews.count} {reviewWord(reviews.count)} på Judge.me
          </Source>
        )}
      </SourcesContent>
    </Sources>
  );

  const rating = reviews && reviews.count > 0 && (
    <p
      className={`${paragraphClassName} flex items-center gap-1.5 text-base! font-extrabold!`}
    >
      <Star className="size-4 fill-current text-primary" aria-hidden="true" />
      {formatRating(reviews.average)} av 5 · {reviews.count}{" "}
      {reviewWord(reviews.count)} på Judge.me
    </p>
  );

  const shippingNote = (
    <p className={`${paragraphClassName} text-base!`}>
      Gratis frakt fra 999 kr. Gratis størrelsesbytte. 90 % levert innen to
      virkedager.
    </p>
  );

  function activate() {
    setInvalid(false);
    setStarted(true);
    setOpen(true);
    setShownPhase(READING);
    setAttempt((value) => value + 1);
    submit(target);
  }

  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="flex min-h-18 w-full cursor-pointer items-center gap-3.5 rounded-[inherit] p-4 text-left text-inherit [font:inherit] font-extrabold! leading-[1.4]! hover:bg-[color-mix(in_srgb,var(--summary-ink)_5%,transparent)] focus-visible:outline-2 focus-visible:outline-current focus-visible:outline-offset-4 sm:px-5"
        aria-expanded={open}
        aria-controls={regionId}
        onClick={() => (started ? setOpen(!open) : activate())}
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
        aria-busy={isLoading && !failed}
      >
        {!failed && analysis}

        {!failed && phase >= WRITING && summary && (
          <div className={appear}>
            <p className={`${paragraphClassName} text-lg!`}>{summary}</p>
            {finished && (
              <div className={appear}>
                {reviewSummary && (
                  <figure className="mx-0 mt-0 mb-3.5 max-w-[55ch] border-l-2 border-(--summary-border) pl-4">
                    <blockquote className="m-0 text-base leading-[1.65] italic">
                      «{reviewSummary}»
                    </blockquote>
                    <figcaption
                      className={`mt-1 text-[.8125rem] text-[color-mix(in_srgb,var(--summary-ink)_65%,transparent)]`}
                    >
                      Fra en kundeomtale på Judge.me
                    </figcaption>
                  </figure>
                )}
                {rating}
                {shippingNote}
                {sources}
                <p
                  className={`${noteClassName} text-[color-mix(in_srgb,var(--summary-ink)_60%,transparent)]`}
                >
                  AI-generert. Les produktdetaljene og omtalene for alle
                  nyanser.
                </p>
              </div>
            )}
          </div>
        )}

        {failed && fallback && (
          <div className={appear}>
            <p className={`${paragraphClassName} text-lg!`}>{fallback}</p>
            {rating}
            {shippingNote}
            {sources}
            <p
              className={`${noteClassName} text-[color-mix(in_srgb,var(--summary-ink)_60%,transparent)]`}
            >
              Les produktdetaljene og omtalene for alle nyanser.
            </p>
          </div>
        )}
        {failed && !fallback && (
          <div className="animate-in fade-in">
            <p className={`${paragraphClassName} text-base!`} role="status">
              Oppsummeringen kunne ikke lastes.
            </p>
            <button
              type="button"
              className={actionClassName}
              onClick={activate}
            >
              Prøv igjen
            </button>
          </div>
        )}

        {isLoading && !failed && (
          <button
            type="button"
            className={`${actionClassName} mt-4`}
            onClick={() => {
              clearRequestTimeout();
              clear();
              setStarted(false);
              setOpen(false);
              setInvalid(false);
            }}
          >
            Avbryt
          </button>
        )}
        <p className="sr-only" role="status">
          {(failed && fallback) || finished ? "Kortversjonen er klar." : ""}
        </p>
      </div>
    </>
  );
}
