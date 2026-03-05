# OrbPilot™ API Route Inventory

> Auto-generated from `functions/src/orbPilot.ts` + `functions/src/index.ts`
> All routes are Firebase Cloud Functions (HTTPS Callable) in region `us-central1`.
> Client wrappers are in `services/orbPilot.ts`.

---

## Auth Levels

| Symbol | Meaning |
|--------|---------|
| 🔓 | Any authenticated user |
| 🤝 | Authenticated partner owner (owns the `partnerId`) |
| 🛡️ | Admin only (email in `ADMIN_EMAILS` env var) |
| ⚙️ | System/admin (engine tick) |

---

## Campaign CRUD

| Function Name | Client Wrapper | Auth | Params | Returns |
|---|---|---|---|---|
| `orbPilotCampaignCreate` | `pilotCampaignCreate(data)` | 🤝 | `{ partnerId, objective, weeklyBudgetUsd, dailyMaxUsd, schedule, blackoutDates, rewardLadder, maxVVPerDay, maxVVPerUserPerWeek, minTrustTier, cpaMaxUsd, avgTicketUsd?, grossMarginPct?, profitFloorUsdPerVV?, maxDiscountCostUsdPerVV? }` | `{ success, campaignId }` |
| `orbPilotCampaignGet` | `pilotCampaignGet(campaignId)` | 🤝 | `{ campaignId, partnerId }` | `{ success, campaign: CampaignDoc }` |
| `orbPilotCampaignUpdate` | `pilotCampaignUpdate(id, patch)` | 🤝 | `{ campaignId, partnerId, ...fields }` | `{ success }` |
| `orbPilotCampaignActivate` | `pilotCampaignActivate(id, pid)` | 🤝 | `{ campaignId, partnerId }` | `{ success }` |
| `orbPilotCampaignPause` | `pilotCampaignPause(id, pid)` | 🤝 | `{ campaignId, partnerId }` | `{ success }` |
| `orbPilotCampaignResume` | `pilotCampaignResume(id, pid)` | 🤝 | `{ campaignId, partnerId }` | `{ success }` |
| `orbPilotCampaignEnd` | `pilotCampaignEnd(id, pid)` | 🤝 | `{ campaignId, partnerId }` | `{ success }` |

---

## Engine

| Function Name | Client Wrapper | Auth | Params | Returns |
|---|---|---|---|---|
| `orbPilotEngineTick` | `pilotEngineTick(nowISO?)` | ⚙️ | `{ nowISO? }` | `{ success, runId, slotsReleased, windowsOpened }` |

---

## Slot Lifecycle (User)

| Function Name | Client Wrapper | Auth | Params | Returns |
|---|---|---|---|---|
| `orbPilotOfferNearby` | `pilotOfferNearby(lat, lng, radiusM?)` | 🔓 | `{ lat, lng, radiusM? }` | `{ success, offers: OrbPilotOffer[] }` |
| `orbPilotOfferClaim` | `pilotOfferClaim(slotId, lat, lng)` | 🔓 | `{ slotId, lat, lng }` | `{ success, slotId, claimExpiresISO }` |
| `orbPilotOfferCancel` | `pilotOfferCancel(slotId)` | 🔓 | `{ slotId }` | `{ success }` |

---

## Verification (User)

| Function Name | Client Wrapper | Auth | Params | Returns |
|---|---|---|---|---|
| `orbPilotVerifyInitiate` | `pilotVerifyInitiate(partnerId, locationId, slotId, qrPayload, lat, lng, accuracyM)` | 🔓 | `{ partnerId, locationId, slotId, qrPayload, lat, lng, accuracyM }` | `{ success, attemptId, nonce, requiresPin, pinLength, expiresISO }` |
| `orbPilotVerifyComplete` | `pilotVerifyComplete(attemptId, nonce, pin, lat, lng, accuracyM)` | 🔓 | `{ attemptId, nonce, pin, lat, lng, accuracyM }` | `{ success, outcome, visitId?, rewardGranted, rewardPoints, ledgerTxnId?, rejectionReason? }` |

---

## PIN Rotation (Partner)

| Function Name | Client Wrapper | Auth | Params | Returns |
|---|---|---|---|---|
| `orbPilotPinCurrent` | `pilotPinCurrent(partnerId)` | 🤝 | `{ partnerId }` | `{ success, pin, expiresISO }` |
| `orbPilotPinRotate` | `pilotPinRotate(partnerId)` | 🤝 | `{ partnerId }` | `{ success, pin, expiresISO }` |

---

## Analytics

| Function Name | Client Wrapper | Auth | Params | Returns |
|---|---|---|---|---|
| `orbPilotMetricsPartner` | `pilotMetricsPartner(partnerId, from, to)` | 🤝 | `{ partnerId, from, to }` | `{ success, metrics: OrbPilotMetrics }` |
| `orbPilotMetricsCampaign` | `pilotMetricsCampaign(campaignId, partnerId, from, to)` | 🤝 | `{ campaignId, partnerId, from, to }` | `{ success, metrics: OrbPilotMetrics }` |

---

## Partner Console

| Function Name | Client Wrapper | Auth | Params | Returns |
|---|---|---|---|---|
| `orbPilotPartnerListCampaigns` | `pilotPartnerListCampaigns(partnerId)` | 🤝 | `{ partnerId }` | `{ success, campaigns: CampaignDoc[] }` |
| `orbPilotPartnerActivity` | `pilotPartnerActivity(partnerId, limit?)` | 🤝 | `{ partnerId, limit? }` | `{ success, attempts[] }` (userId redacted) |

---

## User History

| Function Name | Client Wrapper | Auth | Params | Returns |
|---|---|---|---|---|
| `orbPilotUserHistory` | `pilotUserHistory(limit?)` | 🔓 | `{ limit? }` | `{ success, visits: VisitDoc[] }` |

---

## Admin

| Function Name | Client Wrapper | Auth | Params | Returns |
|---|---|---|---|---|
| `orbPilotAdminKillSwitch` | `pilotAdminKillSwitch(scope, targetId, kill)` | 🛡️ | `{ scope: FlagType, targetId, kill: boolean }` | `{ success }` |
| `orbPilotAdminAudit` | `pilotAdminAudit(query)` | 🛡️ | `{ userId?, partnerId?, campaignId?, limit? }` | `{ success, attempts[] }` |
| `orbPilotAdminUserTrust` | `pilotAdminUserTrust(userId, tier, reason)` | 🛡️ | `{ userId, tier: TrustTier, reason }` | `{ success }` |
| `orbPilotAdminPartnerRisk` | `pilotAdminPartnerRisk(partnerId, riskProfile, forcePinRequired)` | 🛡️ | `{ partnerId, riskProfile: RiskProfile, forcePinRequired: boolean }` | `{ success }` |
| `orbPilotAdminListCampaigns` | `pilotAdminListCampaigns(status?, limit?)` | 🛡️ | `{ status?, limit? }` | `{ success, campaigns[] }` |
| `orbPilotAdminListTrust` | `pilotAdminListTrust(tier?, limit?)` | 🛡️ | `{ tier?, limit? }` | `{ success, trust[] }` |
| `orbPilotAdminGetConfig` | `pilotAdminGetConfig()` | 🛡️ | `{}` | `{ success, config }` |
| `orbPilotAdminUpdateConfig` | `pilotAdminUpdateConfig(patch)` | 🛡️ | `{ ...configFields }` | `{ success }` |
| `orbPilotAdminEngineLastRun` | `pilotAdminEngineLastRun()` | 🛡️ | `{}` | `{ success, run: EngineTickRunDoc }` |

---

## Appendix 3 — Consent Gates

| Function Name | Client Wrapper | Auth | Params | Returns |
|---|---|---|---|---|
| `orbPilotConsentUser` | `pilotConsentUser()` | 🔓 | `{}` | `{ success, alreadyConsented? }` |
| `orbPilotConsentPartner` | `pilotConsentPartner(partnerId)` | 🤝 | `{ partnerId }` | `{ success, alreadyConsented? }` |
| `orbPilotConsentStatus` | `pilotConsentStatus(partnerId?)` | 🔓 | `{ partnerId? }` | `{ success, userConsent: boolean, partnerConsent: boolean }` |

---

## Appendix 3 — Entitlements

| Function Name | Client Wrapper | Auth | Params | Returns |
|---|---|---|---|---|
| `orbPilotEntitlementsUser` | `pilotEntitlementsUser()` | 🔓 | `{}` | `{ success, data: UserEntitlements }` |
| `orbPilotEntitlementsPartner` | `pilotEntitlementsPartner(partnerId)` | 🤝 | `{ partnerId }` | `{ success, data: PartnerEntitlements }` |

---

## Appendix 3 — Disputes

| Function Name | Client Wrapper | Auth | Params | Returns |
|---|---|---|---|---|
| `orbPilotDisputeSubmit` | `pilotDisputeSubmit(visitId, reason, submittedBy)` | 🔓/🤝 | `{ visitId, reason, submittedBy: 'user'\|'partner' }` | `{ success, disputeId }` |
| `orbPilotDisputeListPartner` | `pilotDisputeListPartner(partnerId, status?, limit?)` | 🤝 | `{ partnerId, status?, limit? }` | `{ success, disputes: DisputeDoc[] }` |
| `orbPilotDisputeListAdmin` | `pilotDisputeListAdmin(status?, limit?)` | 🛡️ | `{ status?, limit? }` | `{ success, disputes: DisputeDoc[] }` |
| `orbPilotDisputeResolve` | `pilotDisputeResolve(disputeId, resolution, adminNote)` | 🛡️ | `{ disputeId, resolution: 'approved'\|'denied', adminNote }` | `{ success, resolution, reversalLedgerTxnId? }` |
| `orbPilotDisputeReview` | `pilotDisputeReview(disputeId)` | 🛡️ | `{ disputeId }` | `{ success }` |

---

## Appendix 3 — Restrictions

| Function Name | Client Wrapper | Auth | Params | Returns |
|---|---|---|---|---|
| `orbPilotRestrictUser` | `pilotRestrictUser(userId, type, reason, expiresISO?)` | 🛡️ | `{ userId, type: RestrictionType, reason, expiresISO? }` | `{ success }` |
| `orbPilotLiftUserRestriction` | `pilotLiftUserRestriction(userId)` | 🛡️ | `{ userId }` | `{ success }` |
| `orbPilotRestrictPartner` | `pilotRestrictPartner(partnerId, type, reason, expiresISO?)` | 🛡️ | `{ partnerId, type, reason, expiresISO? }` | `{ success }` |
| `orbPilotLiftPartnerRestriction` | `pilotLiftPartnerRestriction(partnerId)` | 🛡️ | `{ partnerId }` | `{ success }` |

---

## Appendix 2 — Spend Ledger + Health/Abuse

| Function Name | Client Wrapper | Auth | Params | Returns |
|---|---|---|---|---|
| `orbPilotSpendLedger` | `pilotSpendLedger(partnerId, monthKey?)` | 🤝 | `{ partnerId, monthKey? }` | `{ success, entries: PartnerSpendEntry[], totalDebits, totalCredits, netUsd, monthKey }` |
| `orbPilotAdminHealth` | `pilotAdminHealth()` | 🛡️ | `{}` | `{ success, activeCampaigns, vv24h, failureRate24h, openDisputes, engineLastRun, globalKillActive, activeKillSwitches }` |
| `orbPilotAdminAbuse` | `pilotAdminAbuse(limit?)` | 🛡️ | `{ limit? }` | `{ success, bruteForceFlags[], highRejection[], restricted[] }` |

---

## Firestore Collections (backend-only, all `allow read,write: if false`)

| Collection | Purpose | Key Indexes |
|---|---|---|
| `orbPilotCampaigns` | Partner campaigns | partnerId+status+updatedAt, status+updatedAt |
| `orbPilotWindows` | Engine-generated time windows | campaignId+state+startISO, state+startISO, state+endISO |
| `orbPilotSlots` | Individual claimable slots | windowId+status, campaignId+status+releasedISO |
| `orbPilotVisits` | Verified visit records | partnerId+verifiedISO, userId+verifiedISO, campaignId+verifiedISO |
| `orbPilotUserTrust` | Per-user trust tier + counters | tier+lastUpdatedISO |
| `orbPilotPartnerPins` | Rotating PIN per partner | — |
| `orbPilotAttempts` | Verification attempt trail | partnerId+initiatedISO, userId+initiatedISO |
| `orbPilotEngineRuns` | Engine tick decisions | — |
| `orbPilotAuditLogs` | Audit trail | — |
| `orbPilotKillSwitches` | Kill switch state | — |
| `orbPilotDisputes` | Dispute records | partnerId+status+createdAt, userId+createdAt, status+createdAt |
| `partnerSpendLedger` | Partner debit/credit per VV | partnerId+monthKey+createdAt, partnerId+type+createdAt |
| `orbPilotUserRestrictions` | User bans/rate-limits | type+createdAt |
| `orbPilotPartnerRestrictions` | Partner suspensions | type+createdAt |
| `orbPilotConsentRecords` | Consent audit log | uid+consentType+acceptedAtISO |
| `orbtapConfig/orbPilot` | Global defaults doc | — |
| `earnIdempotency` | Reward idempotency keys | — (keyed by "visit:{visitId}" and "reverse:visit:{visitId}") |

---

## Sample E2E Run Log

```
[ENGINE TICK] 2026-03-03T09:00:00Z
  → 3 active campaigns evaluated
  → Campaign camp_abc: fill_rate=0.82, releasedSlots=4, tier=base
  → Campaign camp_def: fill_rate=0.31, releasedSlots=6, tier=boost (below 0.5 threshold)
  → Campaign camp_ghi: fill_rate=0.18, rescueEnabled=true, releasedSlots=8, tier=rescue
  → EngineTickRun doc: run_2026030309 (slotsReleased=18, windowsOpened=3, durationMs=312)

[USER CLAIM] 2026-03-03T10:14:22Z uid=user_123
  → orbPilotOfferNearby(lat=51.5, lng=-0.1) → 3 offers returned
  → orbPilotOfferClaim(slotId=slot_xyz) → slot: released→claimed, claimExpiresISO=+30min

[VERIFY INITIATE] 2026-03-03T10:28:05Z uid=user_123
  → orbPilotVerifyInitiate(slotId=slot_xyz, qrPayload=signed_payload, lat=51.5002, lng=-0.1001)
  → HMAC validated ✓ | slot state=claimed ✓ | geo=48m from partner ✓
  → attemptId=att_789, nonce=abc123, requiresPin=true, expiresISO=+5min

[VERIFY COMPLETE] 2026-03-03T10:28:41Z uid=user_123
  → orbPilotVerifyComplete(attemptId=att_789, nonce=abc123, pin=482917)
  → geo=51m ✓ | accuracy=22m ✓ | pin valid ✓ | weekly cap: 1/3 ✓ | cooldown: last=none ✓
  → outcome=verified | rewardPoints=50 | ledgerTxnId=txn_orbpilot_visit_slot_xyz
  → earnIdempotency["visit:slot_xyz"] written ✓
  → visit doc written ✓ | slot: claimed→used ✓ | trust tier eval: bronze (consecutive=1)
  → partnerSpendLedger debit: $0.50 (50pts × $0.01) written ✓
```

---

## 10 Acceptance Tests (Spec §17)

| # | Test | Expected |
|---|---|---|
| AT-1 | **Atomic Claim**: two users simultaneously call `orbPilotOfferClaim` for the same `slotId` | Exactly one succeeds; second gets `SLOT_ALREADY_CLAIMED` |
| AT-2 | **Idempotent Ledger**: call `orbPilotVerifyComplete` with same `attemptId+nonce` twice | Second call returns `idempotent_duplicate`; ledger entry count = 1 |
| AT-3 | **PIN Brute Force**: submit 6 wrong PINs within 10 minutes | 5th attempt sets `pinBruteForceFlagged=true`; 6th is rejected with `pin_brute_force` |
| AT-4 | **Geo Gate**: `orbPilotVerifyComplete` with GPS coords 300m from partner | Rejected with `geo_too_far` |
| AT-5 | **Time Gate**: call `orbPilotVerifyComplete` after `completeWithinSeconds` elapses | Rejected with `attempt_expired` |
| AT-6 | **Cooldown**: Bronze-tier user submits second visit < 24h after first | Rejected with `cooldown_tier` |
| AT-7 | **New-Only Campaign** (`objective=new_customers`): existing customer claims slot | Rejected with `trust_tier_insufficient` (or filtered from offer feed) |
| AT-8 | **Stop-Loss P4**: campaign CPA exceeds `cpaMaxUsd` for 3 consecutive ticks | Engine tick logs `stop_loss` action, campaign status set to `paused` |
| AT-9 | **Kill Switch**: admin calls `orbPilotAdminKillSwitch('global','global',true)` | `orbPilotOfferNearby` returns empty; `orbPilotOfferClaim` rejects with `kill_switch` |
| AT-10 | **Timezone**: engine tick runs at 09:00 UTC for partner in UTC+5 | Windows computed in partner timezone; 09:00 UTC = 14:00 local, correct DOW slot opened |
