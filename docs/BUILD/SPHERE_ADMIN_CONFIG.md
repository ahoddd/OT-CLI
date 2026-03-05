# Sphere Plans — Admin Config Schema

Source of truth for OrbPlans™ + Sphere Passport™ configuration.  
Admin can tune caps, eligibility, and per-sphere-type feature availability.

This doc describes the *shape* of the config and safe defaults.  
Actual storage (Firestore or local) should follow existing config patterns (e.g. Orbinomics).

## Document

Suggested Firestore path (server-authored): `config/spherePlans`.

### Types

```ts
type SphereType = 'COUPLE' | 'FAMILY' | 'SOLO' | 'PAL';

interface SpherePlansCapsConfig {
  dailyUserMaxPlanEarn: number;
  micro: {
    maxRewardedPlansPerDay: number;
    sameSphereCooldownMinutes: number;
    verifiedStepCap: number;
    completionBonusCap: number;
  };
  standard: {
    maxRewardedPlansPerDay: number;
    sameSphereCooldownMinutes: number;
    verifiedStepCap: number;
    completionBonusCap: number;
  };
  passport: {
    verifiedStepCap: number;
    weeklyBonusCap: number;
    monthlyBonusCap: number;
    weeklyTotalCap: number;
    monthlyTotalCap: number;
  };
  partnerRepeatCapHours: number;
}

interface SpherePlansEligibilityConfig {
  minAccountAgeHours: number;
  requirePriorVerifiedAction: boolean;
  minVerifiedActionsCount: number;
}

type WordFilterLevel = 'OFF' | 'BASIC' | 'STRICT';

interface SpherePlansModerationDefaults {
  defaultWordFilterLevel: WordFilterLevel;
  blockLinksForUnverified: boolean;
  blockPhoneEmailForUnverified: boolean;
}

interface SpherePlansEnabledBySphereType {
  COUPLE: boolean;
  FAMILY: boolean;
  SOLO: boolean;
  PAL: boolean;
}

interface SpherePlansEnabledFeatures {
  generator: boolean;
  microPlans: boolean;
  standardPlans: boolean;
  passportPlans: boolean;
  rewards: boolean;
  passportShare: boolean;
  surpriseReveal: boolean;
  weatherModes: boolean;
}

export interface SpherePlansConfig {
  enabledGlobal: boolean;
  enabledBySphereType: SpherePlansEnabledBySphereType;
  enabledFeatures: SpherePlansEnabledFeatures;
  caps: SpherePlansCapsConfig;
  eligibility: SpherePlansEligibilityConfig;
  moderationDefaults: SpherePlansModerationDefaults;
}
```

### Recommended defaults

- `enabledGlobal`: `true`
- `enabledBySphereType`: all `true` (admin can disable per type)
- `enabledFeatures`:
  - `generator`, `microPlans`, `standardPlans`: `true`
  - `passportPlans`, `rewards`, `passportShare`: `true`
  - `surpriseReveal`, `weatherModes`: `true`
- `caps`:
  - `dailyUserMaxPlanEarn`: `250`
  - `micro.maxRewardedPlansPerDay`: `2`
  - `micro.sameSphereCooldownMinutes`: `180`
  - `micro.verifiedStepCap`: `20`
  - `micro.completionBonusCap`: `20`
  - `standard.maxRewardedPlansPerDay`: `1`
  - `standard.sameSphereCooldownMinutes`: `18 * 60`
  - `standard.verifiedStepCap`: `35`
  - `standard.completionBonusCap`: `50`
  - `passport.verifiedStepCap`: `25`
  - `passport.weeklyBonusCap`: `100`
  - `passport.monthlyBonusCap`: `250`
  - `passport.weeklyTotalCap`: `200`
  - `passport.monthlyTotalCap`: `600`
  - `partnerRepeatCapHours`: `24`
- `eligibility`:
  - `minAccountAgeHours`: `24`
  - `requirePriorVerifiedAction`: `false`
  - `minVerifiedActionsCount`: `1`
- `moderationDefaults`:
  - `defaultWordFilterLevel`: `'BASIC'`
  - `blockLinksForUnverified`: `true`
  - `blockPhoneEmailForUnverified`: `true`

### Runtime behavior notes

- Client must treat this config as **server-authoritative** and fall back to safe defaults when missing.
- If `enabledGlobal` or `enabledFeatures.rewards` is `false`:
  - Sphere plans and Passports still generate and show cosmetic progress.
  - No plan-specific ledger entries should be written.
- Sphere-level settings (per-sphere toggles) must *not* be able to enable features that are disabled in this config.

