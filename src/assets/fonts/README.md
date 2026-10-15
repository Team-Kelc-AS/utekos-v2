# Google Sans Flex 120pt

`GoogleSansFlex120pt-Variable.woff2` is the existing Google Sans Flex **4.005**
with optical size **120** baked in. The source font's STAT table names that
optical size “120pt”; this does not set the CSS text size.

The file retains all 535 Unicode mappings, all OpenType layout features and
the complete variable weight range **1–1000**, including Medium 500 and
ExtraBold 800. Other axes are fixed to the site's existing values:
`opsz=120`, `wdth=100`, `GRAD=0`, `ROND=0`, `slnt=0`.
Hinting is retained. Norwegian letters, extended Latin, combining marks,
™ and the font's mathematical symbols remain available. Arrows and ✓ are
absent from the original font and still use the existing system fallback,
without downloading large font subsets that do not contain those characters.

The complete web file is 88,832 bytes. `src/lib/fonts.ts` loads it through
`next/font/local` as an on-demand fallback behind the smaller subset below,
retaining the public CSS variable and swap behavior. The separate Medium TTF used by PDF generation is unchanged.

## Source and reproduction

The latest upstream font is a different version; use the pinned 4.005 source
to preserve the existing design. Source: [Google Fonts at 3874ed4](https://github.com/google/fonts/tree/3874ed444dd2ffa234f2cf90272d61971c4e8abb/ofl/googlesansflex).
The accompanying [OFL.txt](./OFL.txt) is copied from that revision.

Run outside the checkout with Python, fontTools 4.66.1 and Brotli 1.2.0:

```sh
python3 -m venv font-env
font-env/bin/pip install fonttools==4.66.1 brotli==1.2.0
curl -fsSL 'https://raw.githubusercontent.com/google/fonts/3874ed444dd2ffa234f2cf90272d61971c4e8abb/ofl/googlesansflex/GoogleSansFlex%5BGRAD%2CROND%2Copsz%2Cslnt%2Cwdth%2Cwght%5D.ttf' -o original.ttf
font-env/bin/fonttools varLib.instancer original.ttf opsz=120 wdth=100 GRAD=0 ROND=0 slnt=0 --output GoogleSansFlex120pt-Variable.ttf
font-env/bin/fonttools subset GoogleSansFlex120pt-Variable.ttf --unicodes='*' --layout-features='*' --name-IDs='*' --name-languages='*' --flavor=woff2 --output-file=GoogleSansFlex120pt-Variable.woff2
```

Source SHA-256:
`c31a482fbecbf2e07e6890134d20078723aadf732c9b9c6c9a44f86f8265b6fe`.
Generated WOFF2 SHA-256:
`ee9fe19ec4245dcc621b3e9684ab2a9b143d9acc1c5b95454650dd06d1ebbcd0`.

Next.js serves a hashed copy. Font generation is an explicit maintenance step,
not a build-time download or a new application dependency.

## Initial-page subset (2026-10-15)

The storefront now preloads `GoogleSansFlex120pt-Latin.woff2` (61,684 bytes,
245 Unicode mappings), generated from the existing full WOFF2 above. It keeps
Norwegian letters, common Latin, combining marks, punctuation and ™, all layout
features, hinting and the full variable weight range. Glyph outlines and advance
widths were compared against the original at Medium 500 and ExtraBold 800.

`src/lib/fonts.ts` retains the original complete face as a non-preloaded fallback.
Its `unicode-range` is the original cmap minus the subset cmap, so unsupported
characters such as arrows do not trigger a pointless download of the complete
font. An actual extended character such as Ł still loads the original face.
Pages using extended characters may therefore download both files.

Reproduce with the same fontTools/Brotli environment described above:

```sh
font-env/bin/fonttools subset src/assets/fonts/GoogleSansFlex120pt-Variable.woff2 \
  --unicodes='U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0300-036F,U+2000-206F,U+20AC,U+2122,U+2212,U+2215,U+FEFF,U+FFFD' \
  --layout-features='*' --name-IDs='*' --name-languages='*' --flavor=woff2 \
  --output-file=src/assets/fonts/GoogleSansFlex120pt-Latin.woff2
```

If changing the subset, regenerate the complete face's `unicode-range` from
`TTFont(full).getBestCmap().keys() - TTFont(subset).getBestCmap().keys()`.
The original complete font and PDF font remain unchanged.
