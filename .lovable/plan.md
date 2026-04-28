Switch to Build mode and trigger a rebuild to recover the stuck preview (the runtime error showed `virtual:tanstack-start-client-entry` failed to load — a preview environment hiccup, not a code issue).

## Steps
1. Verify dev-server logs to confirm it's a transient bundling/HMR issue rather than a real code problem.
2. Touch a harmless file (or restart the dev server) to force Vite to re-bundle the client entry.
3. Confirm the preview reloads and LinkUp renders correctly.

## Notes
- No code/feature changes — your LinkUp app, README, calendar dropdowns, and everything else stay exactly as they are.
- If the rebuild doesn't clear it, fall back to the published URL (https://linkup4210.lovable.app) while we investigate further.