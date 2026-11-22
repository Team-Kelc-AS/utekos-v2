"use client";

import { useObject } from "@ai-sdk/react";
import {
  Brain,
  ChevronDown,
  FileText,
  Quote,
  Sparkles,
  Star,
  Truck,
} from "lucide-react";
import { useReducedMotion } from "motion/react";
import type { MouseEvent, ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";

import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtSearchResult,
  ChainOfThoughtSearchResults,
  ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought";
import { Shimmer } from "@/components/ai-elements/shimmer";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
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

const shimmerColors =
  "[--color-background:var(--summary-ink)] [--color-muted-foreground:color-mix(in_srgb,var(--summary-ink)_55%,transparent)]";
const badgeClassName =
  "h-6 border border-(--summary-border) bg-transparent px-2.5 font-semibold text-[#75dbd3] tabular-nums";

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
    <Shimmer as="span" className={shimmerColors} duration={1.8}>
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
  const [chainToggle, setChainToggle] = useState<boolean | null>(null);
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

  // Fold the analysis away once the result is shown; the reader can reopen it.
  const finished = phase >= DONE;
  const chainOpen = chainToggle ?? !finished;

  const paragraphClassName = "mx-0! mt-0! mb-3.5! max-w-[55ch] leading-[1.65]!";
  const noteClassName = `${paragraphClassName} text-[.8125rem]!`;
  const actionClassName =
    "min-h-11 cursor-pointer rounded-[.5rem] border border-(--summary-border) px-3 py-2 [font:inherit] focus-visible:outline-2 focus-visible:outline-current focus-visible:outline-offset-4 hover:bg-[color-mix(in_srgb,var(--summary-ink)_5%,transparent)]";
  const appear =
    "animate-in fade-in slide-in-from-bottom-1 duration-500 motion-reduce:animate-none";

  const reviewCount = reviews?.count ?? 0;
  const reviewBadges = reviews && reviews.count > 0 && (
    <ChainOfThoughtSearchResults>
      <ChainOfThoughtSearchResult className={badgeClassName}>
        <Star className="fill-current" aria-hidden="true" />
        {formatRating(reviews.average)}/5
      </ChainOfThoughtSearchResult>
      <ChainOfThoughtSearchResult className={badgeClassName}>
        {reviews.count} {reviewWord(reviews.count)}
      </ChainOfThoughtSearchResult>
      <ChainOfThoughtSearchResult className={badgeClassName}>
        Judge.me
      </ChainOfThoughtSearchResult>
    </ChainOfThoughtSearchResults>
  );

  const reviewStepLabel: ReactNode =
    phase < REVIEWS_READ
      ? "Kundeomtaler fra Judge.me"
      : reviews === null
        ? "Kundeomtalene er midlertidig utilgjengelige"
        : reviewCount === 0
          ? "Ingen kundeomtaler ennå"
          : `Gikk gjennom ${reviews?.includedCount ?? reviewCount} kundeomtaler`;

  const sources = (
    <Sources className="mb-3.5 text-[.8125rem] text-(--summary-ink)">
      <SourcesTrigger
        count={reviewCount > 0 ? 2 : 1}
        className="group/sources min-h-11 cursor-pointer gap-2 rounded-[.5rem] font-semibold opacity-80 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-current focus-visible:outline-offset-4"
      >
        <span>Basert på {reviewCount > 0 ? "2 kilder" : "1 kilde"}</span>
        <ChevronDown
          className="size-4 transition-transform group-data-[panel-open]/sources:rotate-180 motion-reduce:transition-none"
          aria-hidden="true"
        />
      </SourcesTrigger>
      <SourcesContent className="mt-1 mb-1 gap-1">
        <Source
          href="#produktbeskrivelse"
          target="_self"
          rel={undefined}
          onClick={(event) => scrollToSection(event, "produktbeskrivelse")}
          className="flex min-h-11 items-center gap-2.5 rounded-[.5rem] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-current"
        >
          <FileText
            className="size-4 shrink-0 text-[#75dbd3]"
            aria-hidden="true"
          />
          Produktbeskrivelsen og detaljene
        </Source>
        {reviews && reviews.count > 0 && (
          <Source
            href="#produktomtaler"
            target="_self"
            rel={undefined}
            onClick={(event) => scrollToSection(event, "produktomtaler")}
            className="flex min-h-11 items-center gap-2.5 rounded-[.5rem] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-current"
          >
            <Star
              className="size-4 shrink-0 text-[#75dbd3]"
              aria-hidden="true"
            />
            {reviews.count} {reviewWord(reviews.count)} på Judge.me ·{" "}
            {formatRating(reviews.average)}/5
          </Source>
        )}
      </SourcesContent>
    </Sources>
  );

  const rating = reviews && reviews.count > 0 && (
    <p
      className={`${paragraphClassName} flex items-center gap-1.5 text-base! font-extrabold!`}
    >
      <Star className="size-4 fill-current text-[#d7a700]" aria-hidden="true" />
      {formatRating(reviews.average)}/5 · {reviews.count}{" "}
      {reviewWord(reviews.count)} på Judge.me
    </p>
  );

  const shippingNote = (
    <p className={`${paragraphClassName} flex items-start gap-2.5 text-base!`}>
      <Truck
        className="mt-1 size-4 shrink-0 text-[#75dbd3]"
        aria-hidden="true"
      />
      <span>
        Gratis frakt fra 999 kr. Gratis størrelsesbytte. 90 % levert innen to
        virkedager.
      </span>
    </p>
  );

  function activate() {
    setInvalid(false);
    setStarted(true);
    setOpen(true);
    setShownPhase(READING);
    setChainToggle(null);
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
        {!failed && (
          <ChainOfThought
            open={chainOpen}
            onOpenChange={setChainToggle}
            className="mb-4 space-y-0 rounded-xl border border-(--summary-border) bg-[color-mix(in_srgb,var(--summary-ink)_3%,transparent)] px-3.5 py-1 text-(--summary-ink)"
          >
            <ChainOfThoughtHeader className="min-h-11 cursor-pointer gap-2.5 text-[.875rem] font-semibold text-[color-mix(in_srgb,var(--summary-ink)_80%,transparent)] hover:text-(--summary-ink) focus-visible:outline-2 focus-visible:outline-current focus-visible:outline-offset-2 [&>svg:first-child]:text-[#75dbd3]">
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
            </ChainOfThoughtHeader>
            <ChainOfThoughtContent className="mt-1 mb-3.5 space-y-3.5">
              <ChainOfThoughtStep
                icon={FileText}
                status={phase > READING ? "complete" : "active"}
                className="text-(--summary-ink) motion-reduce:animate-none [&_svg]:text-[#75dbd3]"
                label={
                  phase > READING ? (
                    "Leste produktbeskrivelsen og detaljene"
                  ) : (
                    <ShimmerText reduced={reducedMotion}>
                      Leser produktbeskrivelsen og detaljene
                    </ShimmerText>
                  )
                }
              />
              <ChainOfThoughtStep
                icon={Star}
                status={
                  phase > REVIEWS_READ
                    ? "complete"
                    : phase === REVIEWS_READ
                      ? "active"
                      : "pending"
                }
                className="text-(--summary-ink) motion-reduce:animate-none [&>div:first-child_svg]:text-[#75dbd3]"
                label={
                  phase === READING ? (
                    <span className="opacity-60">{reviewStepLabel}</span>
                  ) : (
                    reviewStepLabel
                  )
                }
              >
                {phase >= REVIEWS_READ && reviewBadges}
              </ChainOfThoughtStep>
              {phase >= REVIEWS_READ && (
                <ChainOfThoughtStep
                  icon={Sparkles}
                  status={phase >= DONE ? "complete" : "active"}
                  className="text-(--summary-ink) motion-reduce:animate-none [&_svg]:text-[#75dbd3]"
                  label={
                    phase >= DONE ? (
                      "Skrev kortversjonen"
                    ) : (
                      <ShimmerText reduced={reducedMotion}>
                        Skriver kortversjonen
                      </ShimmerText>
                    )
                  }
                />
              )}
            </ChainOfThoughtContent>
          </ChainOfThought>
        )}

        {!failed && phase >= WRITING && summary && (
          <div className={appear}>
            <p className={`${paragraphClassName} text-lg!`}>{summary}</p>
            {phase >= DONE && (
              <div className={appear}>
                {reviewSummary && (
                  <figure className="mx-0 mt-0 mb-3.5 max-w-[55ch] border-l-2 border-[#75dbd3]/60 pl-4">
                    <Quote
                      className="mb-1 size-4 text-[#75dbd3]"
                      aria-hidden="true"
                    />
                    <blockquote className="m-0 text-base leading-[1.65]">
                      {reviewSummary}
                    </blockquote>
                    <figcaption className="mt-1 text-[.8125rem] opacity-70">
                      Fra en kundeomtale på Judge.me
                    </figcaption>
                  </figure>
                )}
                {rating}
                {shippingNote}
                {sources}
                <p className={`${noteClassName} opacity-70`}>
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
            <p className={`${noteClassName} opacity-70`}>
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
