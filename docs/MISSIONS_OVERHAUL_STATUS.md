# Missions Overhaul — Status

## Completed

- **constants/MissionsConfig.ts** — Admin config: `rewardPointsPerMission`, `rewardSphereXpPerMission`, `missionPartnerIds` (1–5), `deadlineEndOfDay`, `deadlineHoursFromNow`, `dailyFullCompletionBonusPoints`.
- **hooks/useMissionsConfig.ts** — Load/save config from AsyncStorage (admin-editable).
- **constants/MockData.ts** — `MissionStepDef`, `MissionTemplate`, `MISSION_TEMPLATES` (multi-step templates), `getPartnerById()`.
- **context/MissionsContext.tsx** — Multi-step missions, deadlines, `completeStep(..., onMissionFullyComplete?)`, `completeMission`, partner names in step labels, award/count when last step done.
- **app/missions.tsx** — Revamped UI: Missions hero, deadline countdown (“Due by 11:59 PM”), steps with “Done” per step, OT + Sphere XP rewards, “Your Spheres earn XP” CTA to Spheres, daily bonus hint.
- **app/admin/index.tsx** — “Missions (OrbQuest)” section: OT per mission, Sphere XP per mission, Partner IDs (1–5 comma-separated), Deadline end-of-day toggle, Deadline hours, Daily full completion bonus, Save / Reset.

## Map & cross-app integrations

- **OrbTapMap** — `missionPartnerIds` prop; mission orbs in gold; TierLegend "Mission stop" when applicable.
- **Map tab** — Mission strip, OrbSheet "Part of your mission" CTA for mission partners.
- **Partner page** — "View on map" button.
- **Tonight** — Empty state "Open map" CTA.
- **Bookmarks** — Empty state: "Explore map" + "Daily missions" CTAs.
