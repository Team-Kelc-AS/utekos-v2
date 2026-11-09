// Platform adapters exchange the document format, never Konva nodes or DOM objects.
export interface StudioPersistence {
  load(): Promise<string | null>;
  save(serializedDocument: string): Promise<void>;
}

export interface StudioFileDelivery {
  saveFile(bytes: Uint8Array, mime: string, filename: string): Promise<void>;
}
