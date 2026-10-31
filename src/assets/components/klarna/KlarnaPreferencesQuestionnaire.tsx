"use client";

import { useState, type FormEvent } from "react";
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoices,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSkip,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from "@/components/ui/questionnaire";
import {
  colorOptions,
  consentOptions,
  emptyPreferences,
  interestOptions,
  sizeOptions,
  type Preferences,
} from "@/lib/klarna/preferences";
import {
  publishSavedPreferences,
  requestPreferences,
} from "@/lib/klarna/preferences-client";
import styles from "./KlarnaMarketingPreferences.module.css";

const steps = [
  { name: "size" },
  { name: "color" },
  { name: "interests" },
  { name: "consents" },
];
export function KlarnaPreferencesQuestionnaire({
  profile,
  onSaved,
}: {
  profile: Preferences | null;
  onSaved: () => void;
}) {
  const [value, setValue] = useState<Preferences>(profile ?? emptyPreferences);
  const [status, setStatus] = useState<"ready" | "saving" | "error">("ready");
  const [syncPending, setSyncPending] = useState(false);
  const [step, setStep] = useState("size");
  const unanswered =
    step === "interests"
      ? value.interests.length === 0
      : step === "consents" &&
        !consentOptions.some((option) => value[option.value]);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "saving") return;
    setStatus("saving");
    try {
      const result = await requestPreferences({ action: "save", ...value });
      if (!("saved" in result)) throw new Error("Save not confirmed");
      publishSavedPreferences(value);
      if (result.shopifySync === "pending") {
        setSyncPending(true);
        setStatus("ready");
        return;
      }
      onSaved();
    } catch {
      setStatus("error");
    }
  }
  return (
    <Questionnaire
      items={steps}
      item={step}
      onItemChange={setStep}
      onSubmit={(event) => {
        void save(event);
      }}
      className={styles.questionnaire}
    >
      <QuestionnaireProgress
        render={(props, { current, total }) => (
          <p {...props}>
            Spørsmål {current} av {total}
          </p>
        )}
      />
      <QuestionnaireItem name="size">
        <QuestionnaireTitle>Foretrukket Comfyrobe™-passform</QuestionnaireTitle>
        <QuestionnaireChoices>
          {sizeOptions.map((option) => (
            <QuestionnaireChoice
              disabled={status === "saving"}
              key={option.value}
              value={option.value || "none"}
              checked={(value.comfyrobeSize ?? "") === option.value}
              onChange={() =>
                setValue((current) => ({
                  ...current,
                  comfyrobeSize:
                    option.value === "XS" || option.value === "XL"
                      ? option.value
                      : null,
                }))
              }
            >
              {option.label}
            </QuestionnaireChoice>
          ))}
        </QuestionnaireChoices>
      </QuestionnaireItem>
      <QuestionnaireItem name="color">
        <QuestionnaireTitle>Favorittfarge fra utvalget vårt</QuestionnaireTitle>
        <QuestionnaireChoices>
          {colorOptions.map((option) => (
            <QuestionnaireChoice
              disabled={status === "saving"}
              key={option.value}
              value={option.value || "none"}
              checked={(value.favoriteColor ?? "") === option.value}
              onChange={() =>
                setValue((current) => ({
                  ...current,
                  favoriteColor:
                    option.value === "Vargnatt" ||
                    option.value === "Fjellblå" ||
                    option.value === "Havdyp" ||
                    option.value === "Fjellnatt"
                      ? option.value
                      : null,
                }))
              }
            >
              {option.label}
            </QuestionnaireChoice>
          ))}
        </QuestionnaireChoices>
      </QuestionnaireItem>
      <QuestionnaireItem name="interests" multiple>
        <QuestionnaireTitle>Dette er jeg interessert i</QuestionnaireTitle>
        <QuestionnaireChoices>
          {interestOptions.map((option) => (
            <QuestionnaireChoice
              disabled={status === "saving"}
              key={option.value}
              value={option.value}
              checked={value.interests.includes(option.value)}
              onChange={(event) => {
                const checked = event.target.checked;
                setValue((current) => ({
                  ...current,
                  interests: checked
                    ? [...current.interests, option.value]
                    : current.interests.filter((item) => item !== option.value),
                }));
              }}
            >
              {option.label}
            </QuestionnaireChoice>
          ))}
        </QuestionnaireChoices>
      </QuestionnaireItem>
      <QuestionnaireItem name="consents" multiple>
        <QuestionnaireTitle>
          Hvordan kan Utekos bruke opplysningene dine?
        </QuestionnaireTitle>
        <QuestionnaireChoices>
          {consentOptions.map((option) => (
            <QuestionnaireChoice
              disabled={status === "saving"}
              key={option.value}
              value={option.value}
              checked={value[option.value]}
              onChange={(event) => {
                const checked = event.target.checked;
                setValue((current) => ({
                  ...current,
                  [option.value]: checked,
                }));
              }}
            >
              {option.label}
              {option.value === "cartReminders" && (
                <span className={styles.privacy}>
                  Påminnelser er ikke aktivert ennå.
                </span>
              )}
            </QuestionnaireChoice>
          ))}
        </QuestionnaireChoices>
        <p className={styles.privacy}>
          <a href="/personvern#klarna-innlogging">Les om personvern</a>.
        </p>
      </QuestionnaireItem>
      {status === "error" && (
        <p role="alert">Valgene kunne ikke lagres. Prøv igjen.</p>
      )}
      {syncPending && (
        <p role="status">
          Valgene er lagret. E-postvalget venter på synkronisering.
        </p>
      )}
      <QuestionnaireActions>
        <QuestionnairePrevious disabled={status === "saving"}>
          Forrige
        </QuestionnairePrevious>
        {unanswered ? (
          <QuestionnaireSkip disabled={status === "saving"}>
            {step === "consents"
              ? status === "saving"
                ? "Lagrer …"
                : "Lagre valgene mine"
              : "Neste"}
          </QuestionnaireSkip>
        ) : (
          <>
            <QuestionnaireNext disabled={status === "saving"}>
              Neste
            </QuestionnaireNext>
            <QuestionnaireSubmit disabled={status === "saving"}>
              {status === "saving" ? "Lagrer …" : "Lagre valgene mine"}
            </QuestionnaireSubmit>
          </>
        )}
      </QuestionnaireActions>
    </Questionnaire>
  );
}
