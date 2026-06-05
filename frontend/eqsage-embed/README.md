# EQ Sage Embed

This package contains the native React/Babylon EQ Sage zone editor embed used by Spire's `/sage` route.

## Default local workflow

1. Run `npm --prefix frontend run watch:eqsage-embed`
2. In a second terminal run `npm --prefix frontend run serve`

The watch build writes the embed bundle into `frontend/public/eqsage-embed`, and the Vue dev server serves those files from the same origin.
That directory is generated build output and should not be source-controlled; the source static assets live in `frontend/eqsage-embed/public`.

## Production build

`npm --prefix frontend run build`

This automatically:

1. installs embed dependencies if needed
2. builds the embed bundle
3. builds the Vue frontend

## Optional direct Vite dev server

The default workflow does not require a second browser-facing server. If you want to iterate against a direct Vite server anyway, set `VUE_APP_EQSAGE_EMBED_URL` to that server origin before starting the Vue app. `Sage.vue` will load `/eqsage-embed.js` and `/eqsage-embed.css` from that override instead of the default same-origin `/eqsage-embed` path.
