"use client";

import { useObject } from "@ai-sdk/react";
import { Brain, ChevronDown, Star } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import {
  productSummaryResponseSchema,
  type SummaryTarget,
} from "@/lib/ai-summary/schema";

export function PageAiSummaryContent({ target }: { target: SummaryTarget }) {
  const [open, setOpen] = useState(true);
  const [started, setStarted] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const regionId = useId();
  const { object, submit, isLoading, error, stop, clear } = useObject({
    api: "/api/ai-summary",
    fetch: (url, options) =>
      fetch(url, {
        ...options,
        signal: AbortSignal.any([
          ...(options?.signal ? [options.signal] : []),
          AbortSignal.timeout(5_000),
        ]),
      }),
    schema: productSummaryResponseSchema,
    onFinish: ({ object, error }) => setInvalid(Boolean(error) || !object),
    onError: () => setInvalid(true),
  });
  const initialSubmit = useRef(submit);
  const initialTarget = useRef(target);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    trigger.current?.focus({ preventScroll: true });
    initialSubmit.current(initialTarget.current);
    return () => stop();
  }, [stop]);
  const failed = invalid || Boolean(error);
  const paragraphClassName = "mx-0! mt-0! mb-3.5! max-w-[55ch] leading-[1.65]!";
  const noteClassName = `${paragraphClassName} text-[.8125rem]!`;
  const actionClassName =
    "min-h-11 cursor-pointer rounded-[.5rem] border border-(--summary-border) px-3 py-2 [font:inherit] focus-visible:outline-2 focus-visible:outline-current focus-visible:outline-offset-4 hover:bg-[color-mix(in_srgb,var(--summary-ink)_5%,transparent)]";

  function activate() {
    setInvalid(false);
    setStarted(true);
    setOpen(true);
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
        <Brain size={20} className="shrink-0" aria-hidden="true" />
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
        className="px-4 pb-4 sm:px-5 sm:pb-5 [[hidden]]:hidden! [&>p:last-child]:mb-0!"
        aria-busy={isLoading}
      >
        {isLoading && !object?.content?.summary && (
          <div
            className="flex flex-col gap-3 py-2"
            role="status"
            aria-label="Laster"
          >
            <div className="h-4 w-[95%] rounded bg-current opacity-15 animate-pulse" />
            <div className="h-4 w-[85%] rounded bg-current opacity-15 animate-pulse [animation-delay:150ms]" />
            <div className="h-4 w-[60%] rounded bg-current opacity-15 animate-pulse [animation-delay:300ms]" />
          </div>
        )}
        {!failed && object ? (
          <div className="animate-in fade-in duration-500">
            {object.content?.summary && (
              <p className={`${paragraphClassName} text-lg!`}>
                {object.content.summary}
              </p>
            )}
            {target.kind === "product" &&
              object.reviews?.count !== undefined &&
              object.reviews.average !== undefined && (
                <p
                  className={`${paragraphClassName} flex items-center gap-1.5 text-base! font-extrabold!`}
                >
                  {object.reviews.count > 0 ? (
                    <>
                      <Star size={16} className="shrink-0" aria-hidden="true" />
                      {object.reviews.average.toLocaleString("nb-NO", {
                        maximumFractionDigits: 2,
                      })}
                      /5 · {object.reviews.count}{" "}
                      {object.reviews.count === 1 ? "omtale" : "omtaler"} på
                      Judge.me
                    </>
                  ) : (
                    "Ingen produktomtaler ennå."
                  )}
                </p>
              )}
            {object.content?.reviewSummary && (
              <p className={`${paragraphClassName} text-base!`}>
                {object.content.reviewSummary}
              </p>
            )}
            {object.reviews?.includedCount !== undefined &&
              object.reviews.count !== undefined &&
              object.reviews.includedCount < object.reviews.count && (
                <p className={noteClassName}>
                  Omtaleteksten bygger på {object.reviews.includedCount} av{" "}
                  {object.reviews.count} omtaler.
                </p>
              )}
            {!isLoading &&
              target.kind === "product" &&
              object.reviews === null && (
                <p className={noteClassName}>
                  Kundeomtaler er midlertidig utilgjengelige.
                </p>
              )}
          </div>
        ) : null}
        {failed && (
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
        {isLoading && (
          <button
            type="button"
            className={`${actionClassName} mt-4`}
            onClick={() => {
              clear();
              setStarted(false);
              setOpen(false);
              setInvalid(false);
            }}
          >
            Avbryt
          </button>
        )}
        {!isLoading && !failed && object && (
          <p className={`${noteClassName} opacity-70`}>
            AI-generert. Les{" "}
            {target.kind === "product"
              ? "produktdetaljene og omtalene"
              : "hele artikkelen"}{" "}
            for alle nyanser.
          </p>
        )}
      </div>
    </>
  );
}
