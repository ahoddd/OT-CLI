# Sphere Plans + Passport — Manual Test Checklist

This checklist covers OrbPlans™ + Sphere Passport™ behavior across Couple / Family / Solo / Pal Spheres.
Use it alongside the global MVP checklist.

## 1. Flags & Config

- [ ] `moduleSpheresPlans` flag ON enables plan UI in Spheres.
- [ ] Per-type flags (`spheresPlansCouple`, `spheresPlansFamily`, `spheresPlansSolo`, `spheresPlansPal`) gate features correctly.
- [ ] `spheresPlansPassportShare` toggles Passport share entry points.
- [ ] `spheresPlansRewards` toggles plan rewards (UI shows “Cosmetic only” when OFF).
- [ ] `SpherePlansConfig` loads successfully; app falls back safely if missing.

## 2. Generate Plan — Per Sphere

For each sphere type (Couple, Family, Solo, Pal):

- [ ] “Generate Plan” CTA visible when module + type flags enabled.
- [ ] Templates show for that sphere type (3 templates).
- [ ] “Tune” panel defaults to Standard size, 10 miles, mid budget, Auto weather.
- [ ] Plan size selector:
  - [ ] Micro (1–2 steps)
  - [ ] Standard (2–4 steps)
  - [ ] Passport (Pick-any X of Y) where applicable.

## 3. Plan Generation Rules

- [ ] Couple / Pal TONIGHT plans generate 2–4 steps with:
  - [ ] Food/drink (Drop or Visit) first.
  - [ ] Activity second (Visit or Quest).
  - [ ] Dessert/Coffee third (if present).
  - [ ] Optional “Photo Moment” checklist step.
  - [ ] At least one verifiable step (Drop redeem or Quest complete).
- [ ] Family Day plan includes:
  - [ ] At least one indoor-friendly option when weather is RAIN/SNOW.
  - [ ] A budget-friendly step.
  - [ ] At-home fallback checklist.
- [ ] Family Week / Month plans use “Pick any X of Y”.
- [ ] Solo Day / Week plans include bad-weather-safe steps (indoor/at-home).

## 4. Micro Plans

- [ ] Couple: “Quick Date” and “Surprise Mini” generate 1–2 steps as specified.
- [ ] Family: “1-Hour Win” generates 1–2 steps, indoor-friendly + optional at-home fallback.
- [ ] Solo: “Solo Win” can be a single Drop/Quest or at-home checklist.
- [ ] Pal: “Quick Link-up” generates 1–2 steps as specified.
- [ ] Micro plans respect their reward caps; checklist-only steps produce cosmetic progress only.

## 5. Passport Timeline & Completion

- [ ] Plan Detail / Passport view shows:
  - [ ] All steps with statuses (Pending / In Progress / Completed / Skipped).
  - [ ] Primary CTA per step (Reserve/Claim, Start Mission, Navigate, Mark done).
- [ ] Completing a Drop step via `/drop/[id]` marks the step complete when a matching VerifiedAction exists.
- [ ] Completing a Quest step via `/missions` marks the step complete when a matching VerifiedAction exists.
- [ ] Passport progress increments correctly on each completed step.
- [ ] Plan completion rules (X-of-Y) behave correctly per mode.

## 6. Rewards & Anti-farm

- [ ] Plan rewards only apply when steps have VerifiedActions.
- [ ] Micro / Standard / Passport plans respect per-step and per-plan caps.
- [ ] Global daily Sphere Plan earn cap enforced (no additional OT after cap; cosmetic only).
- [ ] Same partnerId cannot be farmed for plan rewards multiple times per 24h.
- [ ] Plan step rewards and completion bonus are idempotent (no double-award on retries).

## 7. Passport Share

- [ ] When a plan completes, a Sphere Passport Receipt Card can be shared:
  - [ ] Shows sphere type + plan name.
  - [ ] Shows verified stamps for completed steps.
  - [ ] Shows total OT Points earned (or “Cosmetic only” when rewards disabled).
- [ ] Deep link from share opens the correct sphere + plan detail and/or proof route.

## 8. Safety & Flags

- [ ] When module or per-type flags are OFF, plan UI is hidden without crashes.
- [ ] If rewards disabled via config or flags, UI clearly states “Cosmetic only” and no plan ledger entries are written.

