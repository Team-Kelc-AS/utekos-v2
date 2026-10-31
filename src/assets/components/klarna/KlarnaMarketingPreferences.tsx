"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import {
  emptyPreferences,
  interestOptions,
  sizeOptions,
  colorOptions,
  type Preferences,
} from "@/lib/klarna/preferences";
import {
  requestPreferences,
  publishSavedPreferences,
} from "@/lib/klarna/preferences-client";
import { Check, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import styles from "./KlarnaMarketingPreferences.module.css";

export function KlarnaMarketingPreferences({
  profile,
}: {
  profile: Preferences | null;
}) {
  const id = useId();
  const [value, setValue] = useState<Preferences>(profile ?? emptyPreferences);
  const [status, setStatus] = useState<"ready" | "saving" | "saved" | "error">(
    "ready",
  );
  const [syncPending, setSyncPending] = useState(false);
  const editVersion = useRef(0);

  function changeValue(update: (current: Preferences) => Preferences) {
    editVersion.current++;
    setValue(update);
    setStatus((current) => (current === "saving" ? current : "ready"));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "saving") return;
    const savingVersion = editVersion.current;
    setStatus("saving");
    try {
      const result = await requestPreferences({ action: "save", ...value });
      if (!("saved" in result))
        throw new Error("Preference save was not confirmed");
      publishSavedPreferences(value);
      setSyncPending(result.shopifySync === "pending");
      setStatus(editVersion.current === savingVersion ? "saved" : "ready");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div data-klarna-preferences className={styles.theme}>
      <form
        onSubmit={(event) => {
          void save(event);
        }}
        className={styles.form}
      >
        <FieldGroup>
          <FieldSet>
            <FieldLegend>Litt om deg</FieldLegend>
            <Field>
              <FieldLabel htmlFor={`${id}-size`}>
                Foretrukket Comfyrobe™-passform
              </FieldLabel>
              <Select
                items={sizeOptions}
                value={value.comfyrobeSize ?? ""}
                onValueChange={(next) => {
                  changeValue((current) => ({
                    ...current,
                    comfyrobeSize: next === "XS" || next === "XL" ? next : null,
                  }));
                }}
              >
                <SelectTrigger id={`${id}-size`} className="min-h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  className={styles.theme}
                  alignItemWithTrigger={false}
                >
                  <SelectGroup>
                    {sizeOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="min-h-11"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor={`${id}-color`}>
                Favorittfarge fra utvalget vårt
              </FieldLabel>
              <Select
                items={colorOptions}
                value={value.favoriteColor ?? ""}
                onValueChange={(next) => {
                  changeValue((current) => ({
                    ...current,
                    favoriteColor:
                      next === "Vargnatt" ||
                      next === "Fjellblå" ||
                      next === "Havdyp" ||
                      next === "Fjellnatt"
                        ? next
                        : null,
                  }));
                }}
              >
                <SelectTrigger id={`${id}-color`} className="min-h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  className={styles.theme}
                  alignItemWithTrigger={false}
                >
                  <SelectGroup>
                    {colorOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="min-h-11"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldSet>
          <FieldSet>
            <FieldLegend>Dette er jeg interessert i</FieldLegend>
            <div className={styles.interests}>
              {interestOptions.map((interest) => (
                <Field
                  key={interest.value}
                  orientation="horizontal"
                  className={styles.interest}
                >
                  <Checkbox
                    id={`${id}-${interest.value}`}
                    checked={value.interests.includes(interest.value)}
                    onCheckedChange={(checked) =>
                      changeValue((current) => ({
                        ...current,
                        interests: checked
                          ? [...current.interests, interest.value]
                          : current.interests.filter(
                              (item) => item !== interest.value,
                            ),
                      }))
                    }
                  />
                  <FieldLabel htmlFor={`${id}-${interest.value}`}>
                    {interest.label}
                  </FieldLabel>
                </Field>
              ))}
            </div>
          </FieldSet>
          <FieldSet className={styles.consents}>
            <FieldLegend>
              Hvordan kan Utekos bruke opplysningene dine?
            </FieldLegend>
            <Field orientation="horizontal">
              <Checkbox
                id={`${id}-email`}
                checked={value.emailMarketing}
                onCheckedChange={(checked) =>
                  changeValue((current) => ({
                    ...current,
                    emailMarketing: checked,
                  }))
                }
              />
              <FieldContent>
                <FieldLabel htmlFor={`${id}-email`}>
                  Send meg tilbud og produktnyheter på e-post.
                </FieldLabel>
              </FieldContent>
            </Field>
            <Field orientation="horizontal">
              <Checkbox
                id={`${id}-cart`}
                aria-describedby={`${id}-cart-help`}
                checked={value.cartReminders}
                onCheckedChange={(checked) =>
                  changeValue((current) => ({
                    ...current,
                    cartReminders: checked,
                  }))
                }
              />
              <FieldContent>
                <FieldLabel htmlFor={`${id}-cart`}>
                  Send meg påminnelse på e-post hvis jeg forlater handlekurven.
                </FieldLabel>
                <FieldDescription id={`${id}-cart-help`}>
                  Du kan lagre ønsket nå. Påminnelser er ikke aktivert ennå.
                </FieldDescription>
              </FieldContent>
            </Field>
            <Field orientation="horizontal">
              <Checkbox
                id={`${id}-ads`}
                checked={value.adMatching}
                onCheckedChange={(checked) =>
                  changeValue((current) => ({
                    ...current,
                    adMatching: checked,
                  }))
                }
              />
              <FieldContent>
                <FieldLabel htmlFor={`${id}-ads`}>
                  Utekos kan bruke mine Klarna-opplysninger til å vise personlig
                  tilpasset innhold.
                </FieldLabel>
              </FieldContent>
            </Field>
          </FieldSet>
        </FieldGroup>
        <p className={styles.privacy}>
          Du kan endre valgene her senere. Innlogging alene gir ikke
          markedsføringssamtykke.{" "}
          <a href="/personvern#klarna-innlogging">Les om personvern</a>.
        </p>
        <Button
          type="submit"
          disabled={status === "saving"}
          className="min-h-11 w-full whitespace-normal"
        >
          {status === "saving" && (
            <LoaderCircle aria-hidden="true" className={styles.spinner} />
          )}
          {status === "saving" ? "Lagrer …" : "Lagre valgene mine"}
        </Button>
        {status === "saved" && (
          <p role="status" className={styles.status}>
            <Check aria-hidden="true" className="size-4 shrink-0" />
            <span>
              Valgene er lagret.
              {syncPending ? " E-postvalget venter på synkronisering." : ""}
            </span>
          </p>
        )}
        {status === "error" && (
          <p role="alert" className={styles.status}>
            Valgene kunne ikke lagres. Prøv igjen.
          </p>
        )}
      </form>
    </div>
  );
}
