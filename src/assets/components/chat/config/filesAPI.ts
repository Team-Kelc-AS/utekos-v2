import "server-only";

import { createOpenaiFiles, openaiFiles } from "@tanstack/ai-openai";
import {
  deleteFile,
  fileSourceFromHandle,
  getFile,
  uploadFile,
  type FileHandle,
  type FilesAdapter,
  type FileUploadInput,
} from "@tanstack/ai";

// Pass an installed provider's adapter. Importing this module never uploads or deletes a file.
export function createFilesAPI<TProvider extends string>(adapter: FilesAdapter<TProvider>) {
  return {
    upload(input: FileUploadInput) {
      return uploadFile({ adapter, input });
    },
    get(id: string | FileHandle<TProvider>) {
      return getFile({ adapter, id });
    },
    delete(id: string | FileHandle<TProvider>) {
      return deleteFile({ adapter, id });
    },
    source(handle: FileHandle<TProvider>) {
      return fileSourceFromHandle(handle);
    },
  };
}

export function createOpenaiFilesAPI(apiKey?: string) {
  return createFilesAPI(apiKey === undefined ? openaiFiles() : createOpenaiFiles(apiKey));
}
