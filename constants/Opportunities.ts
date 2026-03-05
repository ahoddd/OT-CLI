/**
 * OrbOpportunities™ — Partner hiring + verified work receipts.
 * MVP: types, enums, mock store. Backend/Firestore can replace later.
 * Legal: do not use "employee/employer"; use applicant, participant, worker, candidate.
 */

export type OpportunityType =
  | 'shift'
  | 'gig'
  | 'event'
  | 'trial'
  | 'apprenticeship'
  | 'part-time'
  | 'full-time';

export type OpportunityStatus = 'DRAFT' | 'PUBLISHED' | 'PAUSED' | 'CLOSED';

export type ApplicationStatus =
  | 'SUBMITTED'
  | 'REVIEWED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN';

export type NoShowReason = 'no_show' | 'late_cancel' | 'no_contact' | 'other';

export const OPPORTUNITY_TYPE_LABELS: Record<OpportunityType, string> = {
  shift: 'Shift',
  gig: 'Gig',
  event: 'Event staffing',
  trial: 'Trial',
  apprenticeship: 'Apprenticeship',
  'part-time': 'Part-time',
  'full-time': 'Full-time',
};

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  SUBMITTED: 'Submitted',
  REVIEWED: 'Reviewed',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
};

export interface CompensationDisclosure {
  type: 'pay_range' | 'perk_value' | 'fixed';
  payMin?: number;
  payMax?: number;
  perkValue?: string;
  fixedLabel?: string;
}

export interface Opportunity {
  id: string;
  partnerId: string;
  locationId?: string;
  title: string;
  type: OpportunityType;
  status: OpportunityStatus;
  locationRef?: { address?: string; lat?: number; lon?: number };
  startAt: number;
  durationHours?: number;
  compensation: CompensationDisclosure;
  capacity?: number;
  requirementsTags: string[];
  createdAt: number;
  updatedAt: number;
  createdByPartnerId: string;
  publishedAt?: number;
}

export interface OpportunityApplication {
  id: string;
  opportunityId: string;
  userId: string;
  availability?: string;
  note?: string;
  status: ApplicationStatus;
  submittedAt: number;
  updatedAt: number;
  reviewedAt?: number;
  acceptedAt?: number;
  rejectedAt?: number;
  withdrawnAt?: number;
}

export interface WorkReceipt {
  receiptId: string;
  userId: string;
  partnerId: string;
  locationId?: string;
  opportunityId: string;
  opportunityTitle: string;
  verifiedAt: number;
  hours?: number;
  compensationSnapshot: CompensationDisclosure;
  verificationMethod: 'partner-confirm';
  createdAt: number;
  notes?: string;
}

export interface UserReliability {
  userId: string;
  acceptedCount: number;
  completedVerifiedCount: number;
  noShowCount: number;
  noShowDates: number[];
}

export const NO_SHOW_RESTRICT_THRESHOLD = 2;
export const NO_SHOW_LOOKBACK_DAYS = 30;

/** Export CSV column headers (spec). */
export const OPPORTUNITIES_EXPORT_COLUMNS = [
  'opportunityId',
  'title',
  'type',
  'locationId',
  'status',
  'createdAt',
  'publishedAt',
  'startAt',
  'compensationType',
  'compensationMin',
  'compensationMax',
  'perkValue',
  'capacity',
];

export const APPLICATIONS_EXPORT_COLUMNS = [
  'applicationId',
  'opportunityId',
  'userId',
  'status',
  'submittedAt',
  'updatedAt',
  'acceptedAt',
  'withdrawnAt',
];

export const RECEIPTS_EXPORT_COLUMNS = [
  'receiptId',
  'opportunityId',
  'userId',
  'partnerId',
  'locationId',
  'verifiedAt',
  'hours',
  'compensationType',
  'compensationMin',
  'compensationMax',
  'perkValue',
  'notes',
];

/** Mock in-memory store (replace with Firestore/API later). */
let mockOpportunities: Opportunity[] = [];
let mockApplications: OpportunityApplication[] = [];
let mockReceipts: WorkReceipt[] = [];
let mockReliability: Record<string, UserReliability> = {};

let nextOppId = 1;
let nextAppId = 1;
let nextReceiptId = 1;

function genId(prefix: string, n: number): string {
  return `${prefix}_${String(n).padStart(6, '0')}`;
}

export function getMockOpportunities(): Opportunity[] {
  return [...mockOpportunities];
}

export function getMockApplications(): OpportunityApplication[] {
  return [...mockApplications];
}

export function getMockReceipts(): WorkReceipt[] {
  return [...mockReceipts];
}

export function getMockReliability(): Record<string, UserReliability> {
  return { ...mockReliability };
}

export function setMockOpportunities(list: Opportunity[]): void {
  mockOpportunities = list;
}

export function setMockApplications(list: OpportunityApplication[]): void {
  mockApplications = list;
}

export function setMockReceipts(list: WorkReceipt[]): void {
  mockReceipts = list;
}

export function addMockOpportunity(opp: Omit<Opportunity, 'id' | 'createdAt' | 'updatedAt'>): Opportunity {
  const now = Date.now();
  const id = genId('opp', nextOppId++);
  const o: Opportunity = {
    ...opp,
    id,
    createdAt: now,
    updatedAt: now,
  };
  mockOpportunities.push(o);
  return o;
}

export function updateMockOpportunity(id: string, updates: Partial<Opportunity>): Opportunity | null {
  const i = mockOpportunities.findIndex((o) => o.id === id);
  if (i === -1) return null;
  mockOpportunities[i] = { ...mockOpportunities[i], ...updates, updatedAt: Date.now() };
  return mockOpportunities[i];
}

export function addMockApplication(
  app: Omit<OpportunityApplication, 'id' | 'submittedAt' | 'updatedAt'>
): OpportunityApplication {
  const now = Date.now();
  const id = genId('app', nextAppId++);
  const a: OpportunityApplication = {
    ...app,
    id,
    submittedAt: now,
    updatedAt: now,
  };
  mockApplications.push(a);
  return a;
}

export function updateMockApplication(
  id: string,
  updates: Partial<OpportunityApplication>
): OpportunityApplication | null {
  const i = mockApplications.findIndex((a) => a.id === id);
  if (i === -1) return null;
  const now = Date.now();
  mockApplications[i] = { ...mockApplications[i], ...updates, updatedAt: now };
  return mockApplications[i];
}

export function addMockReceipt(receipt: Omit<WorkReceipt, 'receiptId' | 'createdAt'>): WorkReceipt {
  const receiptId = genId('rcpt', nextReceiptId++);
  const now = Date.now();
  const r: WorkReceipt = {
    ...receipt,
    receiptId,
    createdAt: now,
  };
  mockReceipts.push(r);
  return r;
}

export function recordNoShow(userId: string, _reason: NoShowReason): void {
  const now = Date.now();
  const cut = now - NO_SHOW_LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
  if (!mockReliability[userId]) {
    mockReliability[userId] = {
      userId,
      acceptedCount: 0,
      completedVerifiedCount: 0,
      noShowCount: 0,
      noShowDates: [],
    };
  }
  const r = mockReliability[userId];
  r.noShowCount++;
  r.noShowDates.push(now);
  r.noShowDates = r.noShowDates.filter((d) => d >= cut);
}

export function canUserApply(userId: string): boolean {
  const r = mockReliability[userId];
  if (!r) return true;
  const cut = Date.now() - NO_SHOW_LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
  const recentNoShows = r.noShowDates.filter((d) => d >= cut).length;
  return recentNoShows < NO_SHOW_RESTRICT_THRESHOLD;
}

/** Seed a few mock opportunities for demo. */
export function seedMockOpportunitiesIfEmpty(partnerId: string): void {
  if (mockOpportunities.length > 0) return;
  const now = Date.now();
  addMockOpportunity({
    partnerId,
    title: 'Weekend Barista',
    type: 'shift',
    status: 'PUBLISHED',
    startAt: now + 7 * 24 * 60 * 60 * 1000,
    durationHours: 6,
    compensation: { type: 'pay_range', payMin: 18, payMax: 22 },
    capacity: 2,
    requirementsTags: ['barista', 'customer service'],
    createdByPartnerId: partnerId,
    publishedAt: now,
  });
  addMockOpportunity({
    partnerId,
    title: 'Event Staff — Holiday Pop-up',
    type: 'event',
    status: 'PUBLISHED',
    startAt: now + 14 * 24 * 60 * 60 * 1000,
    durationHours: 8,
    compensation: { type: 'perk_value', perkValue: 'Meal + $150 stipend' },
    capacity: 5,
    requirementsTags: ['event', 'setup'],
    createdByPartnerId: partnerId,
    publishedAt: now,
  });
}
