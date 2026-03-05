/**
 * OrbPilot™ Seed Script
 * Creates a demo partner campaign + window for local QA.
 *
 * Usage (from repo root):
 *   npx ts-node scripts/seed-orbpilot.ts
 *
 * Alternatively, call `orbPilotAdminSeed` Cloud Function from admin hub.
 *
 * Requires GOOGLE_APPLICATION_CREDENTIALS env var pointing to a
 * Firebase service account JSON, or run inside the Firebase emulator.
 */

import * as admin from 'firebase-admin';

// ─── Init ─────────────────────────────────────────────────────────────────────
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// ─── Seed config ──────────────────────────────────────────────────────────────
const DEMO_PARTNER_ID = 'demo_orbpilot_partner';
const DEMO_CAMPAIGN_ID = 'demo_orbpilot_campaign';
const DEMO_WINDOW_ID = 'demo_orbpilot_window';

const NOW = new Date();
const WINDOW_START = new Date(NOW.getTime() - 5 * 60 * 1000); // started 5min ago
const WINDOW_END = new Date(NOW.getTime() + 55 * 60 * 1000);  // ends in 55min

async function seed() {
  console.log('🌱 OrbPilot Seed: starting...');

  // ── 1. Demo partner doc ────────────────────────────────────────────────────
  await db.collection('partners').doc(DEMO_PARTNER_ID).set({
    id: DEMO_PARTNER_ID,
    name: 'OrbPilot Demo Café',
    category: 'Café',
    lat: 51.5074,
    lng: -0.1278,
    cityId: 'london',
    tier: 'premium',
    reliabilityScore: 85,
    verified: true,
    createdAt: NOW.toISOString(),
  }, { merge: true });
  console.log('  ✓ Partner doc written:', DEMO_PARTNER_ID);

  // ── 2. Campaign doc ────────────────────────────────────────────────────────
  await db.collection('orbPilotCampaigns').doc(DEMO_CAMPAIGN_ID).set({
    id: DEMO_CAMPAIGN_ID,
    partnerId: DEMO_PARTNER_ID,
    cityId: 'london',
    status: 'active',
    objective: 'fill_rate',
    weeklyBudgetUsd: 50,
    dailyMaxUsd: 10,
    remainingWeeklyUsd: 50,
    remainingDailyUsd: 10,
    weekStartISO: getMondayISO(),
    dayISO: NOW.toISOString().slice(0, 10),
    schedule: [{ dow: [0, 1, 2, 3, 4, 5, 6], startTime: '09:00', endTime: '21:00' }],
    blackoutDates: [],
    rewardLadder: { basePoints: 50, boostPoints: 75, rescuePoints: 100 },
    maxVVPerDay: 20,
    maxVVPerUserPerWeek: 3,
    minTrustTier: 'bronze',
    claimRadiusMeters: 500,
    verifyRadiusMeters: 150,
    maxAccuracyMeters: 50,
    completeWithinSeconds: 300,
    cpaMaxUsd: 5.0,
    pinRequired: false,
    walkInEnabled: false,
    avgTicketUsd: 12,
    grossMarginPct: 0.65,
    profitFloorUsdPerVV: 2.0,
    maxDiscountCostUsdPerVV: 1.0,
    profitStopLossStage: 'none',
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
    createdByUid: 'seed_script',
  });
  console.log('  ✓ Campaign doc written:', DEMO_CAMPAIGN_ID);

  // ── 3. Window doc ──────────────────────────────────────────────────────────
  await db.collection('orbPilotWindows').doc(DEMO_WINDOW_ID).set({
    id: DEMO_WINDOW_ID,
    campaignId: DEMO_CAMPAIGN_ID,
    partnerId: DEMO_PARTNER_ID,
    state: 'open',
    startISO: WINDOW_START.toISOString(),
    endISO: WINDOW_END.toISOString(),
    dow: NOW.getDay(),
    targetSlotsToRelease: 5,
    slotsReleased: 3,
    slotsClaimed: 0,
    slotsUsed: 0,
    rewardTier: 'base',
    createdAt: NOW.toISOString(),
  });
  console.log('  ✓ Window doc written:', DEMO_WINDOW_ID);

  // ── 4. Released slots ──────────────────────────────────────────────────────
  const slotsBatch = db.batch();
  for (let i = 0; i < 3; i++) {
    const slotRef = db.collection('orbPilotSlots').doc(`seed_slot_${i}`);
    slotsBatch.set(slotRef, {
      id: `seed_slot_${i}`,
      windowId: DEMO_WINDOW_ID,
      campaignId: DEMO_CAMPAIGN_ID,
      partnerId: DEMO_PARTNER_ID,
      status: 'released',
      rewardTier: 'base',
      rewardPoints: 50,
      releasedISO: NOW.toISOString(),
      unclaimedExpiresISO: new Date(NOW.getTime() + 15 * 60 * 1000).toISOString(),
    });
  }
  await slotsBatch.commit();
  console.log('  ✓ 3 released slots written');

  // ── 5. Partner PIN ─────────────────────────────────────────────────────────
  const pin = Math.floor(100000 + Math.random() * 900000).toString();
  await db.collection('orbPilotPartnerPins').doc(DEMO_PARTNER_ID).set({
    partnerId: DEMO_PARTNER_ID,
    pin,
    expiresISO: new Date(NOW.getTime() + 45 * 1000).toISOString(),
    createdAt: NOW.toISOString(),
  });
  console.log(`  ✓ Partner PIN written: ${pin}`);

  // ── 6. QR payload example ──────────────────────────────────────────────────
  console.log('\n📋 QR Payload (encode this as QR for scanning):');
  const qrPayload = {
    v: 1,
    pid: DEMO_PARTNER_ID,
    lid: DEMO_PARTNER_ID,
    ts: Math.floor(NOW.getTime() / 1000),
    // In production, sig is added server-side via HMAC-SHA256
    // sig: computed in orbPilotVerifyInitiate on server
  };
  console.log(JSON.stringify(qrPayload));

  console.log('\n✅ OrbPilot seed complete!');
  console.log(`   Partner: ${DEMO_PARTNER_ID}`);
  console.log(`   Campaign: ${DEMO_CAMPAIGN_ID}`);
  console.log(`   Window: ${DEMO_WINDOW_ID} (open until ${WINDOW_END.toISOString()})`);
  console.log(`   Slots: seed_slot_0, seed_slot_1, seed_slot_2`);
  console.log(`   PIN: ${pin} (valid for ~45s, then rotate)`);
}

function getMondayISO(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
