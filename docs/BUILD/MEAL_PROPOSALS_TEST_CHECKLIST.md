# Meal Proposals — Test Checklist

## Partner Side

- [ ] Partner can navigate to Meal Studio from Partner Dashboard
- [ ] Partner can create a Breakfast proposal with title, description, pricing, menu items, party size
- [ ] Partner can create a Lunch proposal
- [ ] Partner can create a Dinner proposal
- [ ] Photos: can add 0-2 (Silver) or 0-3 (Gold/Platinum) photos
- [ ] Validation: title too short (<6 chars) shows error
- [ ] Validation: description too short (<20 chars) shows error
- [ ] Validation: no menu items shows error
- [ ] Validation: no price shows error
- [ ] Validation: links/email/phone in fields are blocked
- [ ] Tier gate: Silver cannot create more than 2 active proposals
- [ ] Tier gate: Gold cannot create more than 6 active proposals
- [ ] Tier gate: Platinum can create up to 15 active proposals
- [ ] Tier gate: Silver cannot use scheduling (startAt/endAt)
- [ ] Tier gate: Silver cannot use targeting (radius/tags)
- [ ] "Pricing is accurate" checkbox required before publish
- [ ] Non-verified partner: can only save drafts, sees "Get verified" message
- [ ] Partner can Pause/Resume/Remove proposals
- [ ] Pro partner: can Duplicate a proposal
- [ ] Analytics card shows funnel data (Premium/Pro)
- [ ] Studio insights show best time + recommended party size (Premium/Pro)

## User Side — Meal Mode

- [ ] Meal Mode opens full-screen with top rail filters
- [ ] Meal type filter (Breakfast/Lunch/Dinner) works
- [ ] Budget filter works (Under $10/20/35/Any)
- [ ] Party size filter works (1/2/4/6/10)
- [ ] Vibe chips filter works (Date Night, Family, Friends, Budget, Healthy)
- [ ] Cards display: meal type badge, partner name, verified badge, price, party size, menu highlights, why label
- [ ] Countdown shown for proposals ending soon (<3 hours)
- [ ] Proof momentum shown when available
- [ ] Swipe right adds to tray + creates SavedIntent
- [ ] Swipe left dismisses
- [ ] Swipe up ("Lock it in") opens detail sheet
- [ ] Detail sheet shows: full menu, party size picker, price estimate, CTAs
- [ ] Detail sheet: "Add to Tray" works
- [ ] Detail sheet: "Create Plan" works (Solo and Sphere)
- [ ] Detail sheet: "View Partner" navigates to partner page
- [ ] Detail sheet: "Show on Map" navigates to map
- [ ] Detail sheet: "Report" navigates to report flow

## Tray & Fuse

- [ ] Tray shows added proposals as chips
- [ ] Locked proposal shows lock icon in tray
- [ ] "Compare" button appears when tray has 2+ items
- [ ] Compare sheet shows side-by-side comparison (max 3)
- [ ] Compare: selecting a proposal sets it as primary (locked)
- [ ] "Fuse My Meal" CTA appears when tray has 1+ items
- [ ] Fuse returns 1-3 options: Best Pick, Best Value, Best Tonight
- [ ] Fuse respects locked proposal (highest priority)
- [ ] Fuse results are deterministic (same inputs = same outputs)
- [ ] Selecting a fuse option creates MealPlan

## Sphere Mode

- [ ] Sphere detail page shows "OrbSwipe Meals" entry card
- [ ] Opening from sphere pre-filters to sphere type
- [ ] Sphere Vote module appears when in sphere context
- [ ] Members can vote (thumbs up) on tray items
- [ ] Fuse CTA reads "Fuse for [SphereName]"
- [ ] Votes affect Fuse ranking (voted items score higher)
- [ ] "Ready?" indicator shows member count

## Plan & Completion

- [ ] MealPlan detail sheet shows steps: Navigate, QR Check-in, Verified Review
- [ ] "Start Now" navigates to map
- [ ] "Scan" opens scan/check-in flow
- [ ] QR check-in creates VerifiedAction with type MEAL_PLAN_COMPLETE
- [ ] Plan status updates to COMPLETED
- [ ] Meal Recap share card appears after check-in
- [ ] Share card shows: partner name, verified stamp, meal type, party size, points, top menu pick
- [ ] Share deep links to `/meal-mode`

## Verified Review

- [ ] After check-in, verified review CTA appears
- [ ] Star rating picker (1-5) works
- [ ] Text input accepts 8+ characters
- [ ] Links/email/phone in review text are blocked
- [ ] Submit creates review linked to proofId
- [ ] Same proofId cannot create duplicate review
- [ ] Skip option dismisses CTA

## Trust & Safety

- [ ] Report button in detail sheet navigates to report flow
- [ ] No external links in proposal fields
- [ ] Expired proposals don't appear in deck
- [ ] Removed proposals don't appear in deck

## Type Safety

- [ ] `npx tsc --noEmit` passes with 0 errors
- [ ] No missing routes
- [ ] No dead buttons
