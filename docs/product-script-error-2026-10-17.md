# Product-page browser error at 1:11853

## Current evidence

- VERIFIED: The supplied export contains 14 browser error reports at line 1, column 11853, all on the redacted product-page route. Their filename is `/:other` and there is no stack. The original script cannot be recovered from those records.
- VERIFIED: A Vercel error-log query covering 2026-10-16 22:19–22:27 UTC returned no errors. This short window does not prove resolution.
- VERIFIED: Live probes of Comfyrobe, TechDown and Dun in mobile Chromium, mobile WebKit and desktop Chromium did not reproduce this signature. Probes exercised loading/scrolling and desktop variant navigation. Non-GET requests were blocked to prevent checkout, writes and error-report submission; some tracking GETs were also blocked in mobile probes. The probes therefore do not establish behavior with every vendor request enabled or inside native in-app browsers.
- VERIFIED: The storefront and backend sanitizers are identical. Both discarded every unlisted external hostname, even when the browser supplied the original filename.

## Local diagnostic change

Unknown HTTP(S) script hosts now receive `/:script/external-origin-<16 hex digits>`. This is a deterministic FNV-1a grouping label computed from the hostname only. It can be compared with candidate script hosts observed in a reproduction. It is not a cryptographic identifier, does not distinguish scripts on the same host, and is not proof of a cause by itself.

URL credentials, path, query, fragment and port do not contribute to the label and are not retained. Known provider labels remain unchanged. Blob, data, WebKit-masked and other non-HTTP sources receive fixed categories. The labels survive the browser, frontend validation, backend validation and app-log mapping.

## Remaining work

- UNVERIFIED: The actual source and trigger of the historical 1:11853 errors. No vendor has been identified as responsible.
- UNVERIFIED: Deployment and a natural production report containing the new source label. This is a diagnostic patch, not a fix to the historical script failure.
- After publication, correlate any new source label with candidate script hosts, then reproduce and fix the identified code. Do not suppress the error or patch a vendor integration based only on the column number.

Reference: [MDN ErrorEvent.filename](https://developer.mozilla.org/en-US/docs/Web/API/ErrorEvent/filename), retrieved through the MDN connector. The installed Next.js instrumentation-client documentation was also inspected.
