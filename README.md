# makma-lifeos-preview

- Standalone browser LifeOS prototype with tasks, review queues, career/engineering modules and local state/export.

## Source-only publication

The owner explicitly confirmed ownership and permission to publish candidate source. Copyright remains reserved; no permissive license was invented. Third-party media, data, weights and assets were withheld. This repository documents the available source and its actual limits.

## Setup

Open MAKMA_LifeOS_Preview.html in an isolated browser profile. Default stored state is empty; no backend or calendar connection is supplied.

## Status

READY

## Keyboard dialogs

Record dialogs and workspace search keep keyboard focus inside the active dialog
and make the background inert. Escape or Cancel restores the invoking control;
after a save refreshes the page content, focus returns to the main region.

Run the dependency-free focus regression suite with Node.js:
`node --test tests/dialog-focus.test.mjs`. The DOM fixture tests focus ownership;
native tab order and responsive layout also require browser verification.



## Known limitations and improvements

- LocalStorage/export prototype; seeded personal facts require review. No server, user auth or durable backend implied.
- Private-account repository and PR seed references removed; user-entered state defaults are empty.
- Unlisted integration/build/training/browser checks were not run. No paid provider or privileged scripts were executed. Dependencies were not installed; original locks retained when available.

## Verification

- LifeOS inline JavaScript syntax: PASS
