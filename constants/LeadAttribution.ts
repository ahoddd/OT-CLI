/**
 * Lead attribution — OrbTap-affiliated traffic for rev share and partner reporting.
 * Mission completions and map-driven visits are recorded with leadSource so partners
 * and OrbTap can attribute foot traffic and apply rev share on affiliated leads.
 *
 * Partner dashboard / admin: use getPartnerAnalyticsSummary(partnerId, days, {
 *   leadSourceForAttribution: ORBTAP_LEAD_SOURCE_MISSION
 * }) to get summary.missionsCompletedOrbTapAttributed for billing.
 * Or use getPartnerOrbTapAttributedMissions(partnerId, days) from partnerAnalytics.
 */

/** Value sent to partner analytics for mission completions (OrbTap pay cut on affiliated leads). */
export const ORBTAP_LEAD_SOURCE_MISSION = 'orbtap_mission';

/** Value for map-originated visits (e.g. user tapped partner from map after mission focus). */
export const ORBTAP_LEAD_SOURCE_MAP = 'orbtap_map';
