"use client";

import { useState, type RefObject } from "react";
import { ImageIcon, XIcon } from "lucide-react";
import { Attachment, AttachmentMedia, AttachmentContent, AttachmentTitle, AttachmentDescription, AttachmentActions, AttachmentAction } from "@/components/ui/attachment";
import { Field, FieldGroup, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { CONTACT_ATTACHMENT_ACCEPT, CONTACT_ATTACHMENT_HINT, validateContactAttachmentSelection } from "@/lib/contact-attachments";
import styles from "./contact.module.css";

// Keep native FormData in sync, including retries after React resets the form.
export function syncAttachmentInput(input: HTMLInputElement | null, files: File[]) {
  if (!input) return;
  const transfer = new DataTransfer();
  for (const file of files) transfer.items.add(file);
  input.files = transfer.files;
}

type Props = {
  files: File[];
  onChange: (files: File[]) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  error?: string;
  pending: boolean;
};

export default function ContactAttachments({ files, onChange, inputRef, error, pending }: Props) {
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [edited, setEdited] = useState(false);
  const message = selectionError || (!edited && error) || undefined;

  function selectFiles(selected: FileList | null) {
    if (!selected?.length) return;
    const next = [...files];
    for (const file of Array.from(selected)) {
      if (!next.some((existing) => existing.name === file.name && existing.size === file.size && existing.lastModified === file.lastModified)) next.push(file);
    }
    const invalid = validateContactAttachmentSelection(next);
    setSelectionError(invalid);
    setEdited(true);
    if (!invalid) onChange(next);
    syncAttachmentInput(inputRef.current, invalid ? files : next);
  }

  return (
    <FieldGroup className={styles.attachments}>
      <Field data-invalid={Boolean(message)} data-disabled={pending || undefined}>
        <FieldLabel htmlFor="attachments">Bilder (valgfritt)</FieldLabel>
        <FieldDescription id="attachments-hint">{CONTACT_ATTACHMENT_HINT}</FieldDescription>
        <Input
          ref={inputRef} id="attachments" name="attachments" type="file" multiple
          accept={CONTACT_ATTACHMENT_ACCEPT} disabled={pending}
          aria-invalid={Boolean(message) || undefined}
          aria-describedby={`attachments-hint${message ? " attachments-error" : ""}`}
          onChange={(event) => selectFiles(event.currentTarget.files)}
          className="h-auto min-h-12 cursor-pointer py-2.5"
        />
        {message && <FieldError id="attachments-error">{message}</FieldError>}
        {files.length > 0 && (
          <ul className="grid min-w-0 gap-2" aria-label="Valgte bilder">
            {files.map((file, index) => (
              <li key={`${file.name}-${file.size}-${file.lastModified}`} className="min-w-0">
                <Attachment className="w-full flex-nowrap">
                  <AttachmentMedia><ImageIcon aria-hidden="true" /></AttachmentMedia>
                  <AttachmentContent>
                    <AttachmentTitle title={file.name}>{file.name}</AttachmentTitle>
                    <AttachmentDescription>{new Intl.NumberFormat("nb-NO", { maximumFractionDigits: 1 }).format(file.size / 1000)} kB</AttachmentDescription>
                  </AttachmentContent>
                  <AttachmentActions>
                    <AttachmentAction type="button" disabled={pending} aria-label={`Fjern ${file.name}`} className="min-h-11 min-w-11" onClick={() => {
                      onChange(files.filter((_, position) => position !== index));
                      setSelectionError(null);
                      setEdited(true);
                      inputRef.current?.focus();
                    }}><XIcon aria-hidden="true" /></AttachmentAction>
                  </AttachmentActions>
                </Attachment>
              </li>
            ))}
          </ul>
        )}
      </Field>
    </FieldGroup>
  );
}
