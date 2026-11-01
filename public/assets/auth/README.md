# Google sign-in assets

Checked 2026-11-01 against Google's current branding documentation:
https://developers.google.com/identity/branding-guidelines

- `google-g.png` is the original Google G from
  https://developers.google.com/static/identity/images/g-logo.png.
  Preserve its colors and aspect ratio.
- `/fonts/google-sans-medium.ttf` is Google's Google Sans Medium font,
  downloaded through the Google Fonts CSS API with `wght@500` and the
  text subset `Fortsett med Google`. It is only used by the Google button.
- The button uses the documented light theme: white fill, `#747775` border,
  `#1f1f1f` text, 14/20 typography, 12px outer horizontal padding and a 10px
  logo-to-text gap.

This is the HTML button option for server-side Google OAuth through the
dedicated Utekos Supabase Auth project. The button opens `/auth/google`.
It does not use Google Identity Services or enable Google on Shopify.
