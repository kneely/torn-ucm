# Design

## Overview

The Torn UCM Userscript is designed to enhance the user experience on the Torn City website by providing additional features and functionalities. The userscript will be built using JavaScript and will utilize the Tampermonkey extension for easy installation and management. The userscript will interact with a backend API to fetch and display data in real-time, providing users with up-to-date information and a seamless experience.

## Architecture

The userscript is a Vite-built ES module package. `src/main.js` is the single entrypoint and guards against duplicate initialization with `window.__UCM_INITIALIZED__`. It imports UnoCSS output, resolves configuration, restores local session state, injects UCM styles, and then wires together backend communication, UI rendering, and Torn DOM integration.

Runtime responsibilities are split by folder:

- `src/api/` contains the backend clients. `client.js` wraps authenticated REST requests and normalizes chain response fields for the UI. `sse-client.js` maintains the real-time server-sent event stream.
- `src/state/store.js` is the in-memory view model for the current browser context. It stores session identity, permissions, active chain state, command mode, assignments, one-time passes, RSVP data, and the latest event cursor.
- `src/ui/` contains client-rendered UI components: onboarding, the chain manager shell, chain list, chain creation form, notifications, and injected CSS.
- `src/dom/` contains Torn page integration: selectors for the attack page, attack-button blocking, banner display, and a mutation observer that reapplies state after Torn's React UI rerenders.
- `src/events/handler.js` translates backend SSE messages into local state changes, DOM updates, banners, and notifications.
- `src/lib/storage.js` abstracts browser storage with a localStorage-first strategy and a cookie fallback.

The generated userscript is intended to run in TornPDA/Tampermonkey-like environments where userscript APIs may be available. When `GM_xmlhttpRequest` or `GM.xmlHttpRequest` exists, API calls use it before falling back to `fetch`.

## Startup Flow

Initialization runs in this order:

1. Load `ucm_session_token`, `ucm_member_id`, `ucm_faction_id`, and `ucm_permissions` from storage.
2. Inject the userscript styles. UnoCSS utilities are bundled through Vite, and additional UCM component styles are injected by `ui/styles.js`.
3. If no valid session token exists, install the TornPDA onboarding route watcher and stop active-control setup.
4. If running inside an embedded frame, keep the restored session but skip active controls.
5. Connect to the backend SSE stream with `connectSSE(handleEvent)`.
6. Install the capture-phase attack click/submit guard.
7. Render the Chain Manager panel for users with chain-control permissions.
8. Start the MutationObserver used to reapply attack-button state after Torn DOM updates.
9. On attack pages, fetch `/chains/current` once so the initial command mode matches the backend before the user can attack.

This sequence keeps onboarding lightweight for unauthenticated users and avoids mounting chain controls in embedded contexts that cannot reliably persist or interact with the full page.

## Backend Data Flow

The backend base URL is resolved from `ucm_backend_url` storage when present; otherwise it defaults to `https://ucm.neelyinno.com`. REST requests include `Content-Type: application/json` and attach `Authorization: Bearer <sessionToken>` after onboarding.

Primary REST interactions are:

- `POST /auth/onboard-member` exchanges a Torn API key, timezone, client host, and script version for a session token, member, faction, and permission set.
- `GET /chains/current`, `GET /chains`, and `GET /chains/{chainId}` load current, list, and detail chain state.
- `POST /chains` creates a chain from the client-rendered schedule form.
- `POST /chains/{chainId}/start` and `POST /chains/{chainId}/end` manage scheduled and active chain lifecycle.
- `POST /chains/{chainId}/rsvp` stores the current member's RSVP.
- `POST /chains/{chainId}/commands/hold-all`, `/release-all`, `/assign-target`, and `/issue-one-time-pass` drive chain-leader command actions.
- `POST /chains/{chainId}/watchlist` adds watchlist entries.
- `POST /chains/{chainId}/presence/check-in` and `/presence/heartbeat` are available for presence updates.
- `POST /chains/{chainId}/alerts/defense` is available for defense alert reporting.

Chain responses from the .NET backend are normalized in the client so templates can use `status` while still accepting the backend's `chainStatus` field.

Real-time updates come from `GET /events/stream?token=<sessionToken>`. The native `EventSource` API is not used because Torn's page Content Security Policy can block direct connections. The userscript opens the stream through `GM_xmlhttpRequest`, parses SSE blocks incrementally, filters to supported event types, and reconnects with exponential backoff plus jitter when the stream closes or errors.

## UI Components and Layout

### Onboarding

When no session exists, `ui/onboarding.js` watches for TornPDA's faction route at `/factions.php?step=your&type=1`. On that route it mounts a modal asking for a Torn API key. Successful onboarding persists the session token, member ID, faction ID, and permissions, then reloads the page so the normal authenticated startup path can run.

The route watcher retries during initial TornPDA hydration and wraps `history.pushState` and `history.replaceState` so it can detect SPA navigation.

### Chain Manager Shell

`ui/chain-panel.js` owns the floating `Chain Manager` button and modal shell. The shell includes a backdrop, header, refresh and close controls, current view content, and an aria-live status line.

The default view calls `/chains/current`. If there is an active, forming, or scheduled chain, the panel opens directly to that chain's detail view. Otherwise it renders the chain list.

### Chain List

`ui/chain-list.js` fetches `/chains` and renders one button per chain with scheduled time, title, status pill, and expected duration. Users with `chain.schedule` permission also see a `New Chain` action.

### Chain Creation

`ui/chain-create.js` renders a local form for title, start time, duration, war mode, optional enemy faction ID, and notes. The form validates input client-side, converts the local start time to UTC ISO format, submits `POST /chains`, stores the created chain ID in state, and returns the user to the detail view.

### Chain Detail

The detail view fetches `/chains/{chainId}` and renders summary data plus an RSVP card. If command actions are available, the detail page uses a two-tab layout:

- `Overview` contains the summary and RSVP controls.
- `Commands` contains leader actions for active or scheduled chains.

For active chains with `chain.lead`, the Commands tab exposes hold all, release all, one-time pass, target assignment, watchlist entry, and end-chain controls. For scheduled chains with `chain.lead`, it exposes start and cancel actions. Command submissions refresh the current view and keep the user in the relevant detail section where practical.

### Notifications and Banners

Toast notifications are transient UI messages mounted in the document body. Banners are used for blocking states such as hold-all and bonus-lock messages on the attack page.

## Attack Blocking and Events

The attack-blocking rules live in `state/store.js`:

- `free` and `controlled` command modes do not block attacks.
- `hold_all` blocks unless the member has `attack.block.exempt` or an active one-time pass.
- `bonus_lock` blocks unless the member is the bonus-lock assignee, has `attack.block.exempt`, or has an active one-time pass.

`dom/attack-button.js` finds Torn's `Start fight` button, disables it, marks it with `data-ucm-blocked`, sets `aria-disabled`, prevents pointer interaction, and shows the current block reason. It also installs capture-phase click and submit guards so a rerendered or partially blocked button cannot bypass command mode.

`dom/selectors.js` uses a layered selector strategy for the attack button: configured CSS selector, semantic submit-button search, XPath fallback, and final visible text match. This is intentional because Torn's attack markup can change.

`dom/mutation-observer.js` observes Torn's React root, debounces changes, and calls `reapplyIfNeeded(isBlocked())`. This keeps the local DOM aligned with backend command state after Torn rerenders the attack modal.

`events/handler.js` handles these SSE messages:

- `command.hold_all` switches to hold mode, blocks the attack button when needed, and shows a banner.
- `command.release_all` clears hold/pass state, unblocks the button, and removes banners.
- `target.assigned` records the current member's assignment and shows a notification.
- `bonus.locked` switches to bonus-lock mode and blocks non-assignees.
- `attack_pass.issued` grants a temporary pass, unblocks the button, and re-blocks after expiry if the command mode still requires it.
- `defense.alert` shows a notification.
- `presence.updated` is accepted as informational and does not currently mutate the DOM.

## Design Decisions

- The userscript renders chain UI on the client instead of requesting backend-rendered HTML fragments. This keeps the browser surface independent from server-side templates and lets the API return structured JSON.
- Userscript network APIs are preferred over plain browser APIs when available. They work with Tampermonkey/TornPDA `@connect` permissions and avoid Torn page CSP limits.
- SSE is parsed manually because the stream is opened through `GM_xmlhttpRequest` rather than native `EventSource`.
- Session and permissions are cached locally so the script can decide whether to show onboarding, mount controls, and gate actions before making additional API calls.
- Permission checks are client-side visibility gates only. The backend remains responsible for authorization.
- Attack blocking is defensive and state-driven: SSE updates, startup sync, mutation reapplication, and capture-phase guards all point back to the same `isBlocked()` decision.
- `torn-ucm/` is legacy reference code for this workspace. Current userscript design should be documented and changed in `torn-ucm-userscript/`.
