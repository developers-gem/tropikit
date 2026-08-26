# Tropikit — Full-Stack Rebuild

A production-structured rebuild of the Tropikit travel-health prototype: React + Vite + TypeScript
frontend, Node + Express + TypeScript + MongoDB backend, JWT auth, and a REST API — built per the
project spec, migrating the original Lovable prototype's 76 destinations and preserving its UX.

## Status: what's real vs. what's left

This was built and verified as far as a sandboxed environment allows, but two things could not be
tested here and need your own environment: **a live MongoDB connection** (the sandbox's network
policy blocks the MongoDB binary download used for in-memory testing) and **a real frontend↔backend
integration run** (no way to run two long-lived dev servers and click through the app here).
Everything else below has been genuinely checked, not just written and assumed correct.

**Verified in this environment:**
- Backend compiles with `tsc` — zero TypeScript errors, and the compiled JS loads without import errors.
- Frontend compiles with `tsc` and builds with `vite build` — zero errors, production bundle serves and loads correctly (checked with `vite preview` + `curl`).
- The malaria-planner date math was unit-tested against your original prototype's own screenshot (Malarone, 18 Sep–2 Oct trip → 16 Sep start, 9 Oct last dose, 24 total dose-days) — **exact match**.
- Auth/trip/checklist ownership logic, error handling, and route wiring were exercised via a scripted request-level test against the real Express app (mocked at the database layer, since a live Mongo wasn't reachable here).
- All 76 destinations from the original prototype's `travel-data.ts` were migrated and normalized — verified by count and spot-checked content.

**Not done / needs you:**
- Running this against a real MongoDB instance and clicking through the live app end-to-end.
- Real audio files for the storytelling module (3 sample stories are seeded with transcripts but `audioUrl: null` — the player correctly falls back to "read the transcript" until real audio is hosted).
- Admin/CMS UI (intentionally deferred per spec section 27 — the data models support it).
- Automated test suite (no unit/integration test files were part of this build; the verification above was ad hoc and not left behind as a runnable suite — that's a good next task).
- A manual review pass over the 76 auto-generated CDC/TravelHealthPro source URLs (flagged `needsReview: true` in the seed data — see "Known limitations" below).
- Production deployment config, HTTPS, real secrets.

## Architecture decision made on your behalf

The original prototype was built on TanStack Start (SSR framework), not React Router as the spec's
non-negotiable rules require. This rebuild is a **plain Vite SPA + React Router + separate Express
backend**, matching your spec literally. This was a real trade-off (see the Phase 1 audit for
detail) — flagging again here in case you'd rather have kept TanStack Start's server layer.

## Project structure

```
tropikit/
├── backend/          Express + TypeScript + MongoDB API
├── frontend/          React + Vite + TypeScript + Tailwind SPA
└── README.md           (this file)
```

## Setup

### Backend

```bash
cd backend
npm install
cp .env.example .env      # edit MONGODB_URI and JWT_SECRET at minimum
npm run seed               # loads all 76 destinations + 3 sample stories
npm run dev                 # http://localhost:5000
```

Requires a real MongoDB instance — local (`mongodb://localhost:27017/tropikit`) or Atlas.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env       # VITE_API_URL, defaults to http://localhost:5000
npm run dev                 # http://localhost:5173
```

### Verify it's working

1. `GET http://localhost:5000/api/v1/health` → `{"success":true,"data":{"status":"ok"}}`
2. `GET http://localhost:5000/api/v1/destinations` → array of 76 destinations
3. Open `http://localhost:5173` — destination grid, checklist, stories, emergency should all load.

## Known limitations carried over from the audit

1. **76 source URLs need a manual review pass.** They were programmatically generated from
   destination names during migration (matching the original prototype's behavior) and are marked
   `sources[].needsReview: true` in the seed data and surfaced with an "unverified link" badge in
   the UI. Don't treat them as confirmed until reviewed — this was flagged as the top medical-content
   risk in the Phase 1 audit.
2. **Browser notification reminders ("Notify me on start day" / "Nightly bite window") only work
   while the tab stays open.** This is a real limitation of browser `setTimeout`, inherited from the
   original prototype and now explicitly surfaced in the UI copy rather than silently trusted. The
   `.ics` download and Google Calendar export are the reliable options and are recommended first.
3. **Malaria regimen data** (drug-specific start/stop offsets) was carried over from the original
   prototype's already-correct table and unit-tested against known values, but should still get a
   final clinician/source review before going live, per the project's medical-safety policy.

## What each phase from the original spec covers

| Phase | Status |
|---|---|
| 1. Audit | Done (see `tropikit-phase1-audit-v2.md` from earlier in this thread) |
| 2. Foundation | Done |
| 3. Destination API | Done |
| 4. Health module (advice/vaccines/malaria/emergency) | Done |
| 5. Authentication | Done |
| 6. Trips | Done |
| 7. Checklist (local + cloud sync) | Done |
| 8. Malaria engine | Done, pending clinician source review (see above) |
| 9. Storytelling | Done (model, API, UI) — 3 sample stories seeded |
| 10. Audio | Player built; no real audio files hosted yet |
| 11. Calendar/reminders | Done, with the reminder limitation now surfaced honestly |
| 12. Emergency | Done — fixed a gap where global emergency numbers lacked `tel:` links |
| 13. Responsive/accessibility | Base Tailwind responsive classes throughout; no dedicated a11y audit pass was run |
| 14. Security | JWT, bcrypt, Zod validation, ownership checks, Helmet, CORS, rate limiting all in place; no external security audit |
| 15. Final QA | Partial — see "Status" section above for exactly what was and wasn't verified |
