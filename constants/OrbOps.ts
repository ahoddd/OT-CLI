/**
 * OrbOps™ / OrbWork Orders™ — Work order types, status machine, Proof Pack, Job Proof Receipt, Proof Portfolio.
 * Blueprint: single unified WorkOrder model; completion is server-authoritative and mints OrbProof.
 */

export type WorkOrderStatus =
  | 'DRAFT'
  | 'REQUESTED'
  | 'CLARIFYING'
  | 'ACCEPTED'
  | 'SCHEDULED'
  | 'EN_ROUTE'
  | 'STARTED'
  | 'MIDPOINT_PROOF'
  | 'COMPLETED_PENDING_APPROVAL'
  | 'COMPLETED'
  | 'DISPUTED'
  | 'CANCELED';

export type WorkOrderCategory =
  | 'phoneRepair'
  | 'plumbing'
  | 'cleaning'
  | 'handyman'
  | 'delivery'
  | 'other';

export type MilestoneType =
  | 'SCHEDULED'
  | 'EN_ROUTE'
  | 'STARTED'
  | 'MIDPOINT_PROOF'
  | 'COMPLETED_SUBMITTED'
  | 'APPROVED';

export type VerificationLevel = 'BRONZE' | 'SILVER' | 'GOLD';

export interface WorkOrderSchedule {
  proposedTimes?: number[];
  confirmedStartAt?: number;
  confirmedEndAt?: number;
}

export interface WorkOrderMilestone {
  type: MilestoneType;
  createdAt: number;
  completedAt?: number;
  notes?: string;
  mediaRefs?: string[];
  checklistProgress?: Record<string, boolean>;
}

export interface WorkOrder {
  id: string;
  cityId?: string;
  requesterUid: string;
  partnerId: string;
  category: WorkOrderCategory;
  title: string;
  description: string;
  intakeTemplateId?: string;
  intakeAnswers?: Record<string, string | number | boolean>;
  mediaRefs?: string[];
  status: WorkOrderStatus;
  schedule?: WorkOrderSchedule;
  milestones: WorkOrderMilestone[];
  createdAt: number;
  updatedAt: number;
}

export interface ProofPack {
  id: string;
  workOrderId: string;
  beforeMediaRefs: string[];
  afterMediaRefs: string[];
  timeline: {
    acceptedAt?: number;
    enRouteAt?: number;
    startedAt?: number;
    completedSubmittedAt?: number;
    approvedAt?: number;
  };
  checklistResults?: Record<string, boolean>;
  materialsUsed?: string;
  warrantyInfo?: string;
  customerApproval?: {
    approvedAt: number;
    method: 'TAP_APPROVE';
  };
  disputeWindowEndsAt?: number;
  verificationLevel: VerificationLevel;
  createdAt: number;
}

export interface JobProofReceipt {
  id: string;
  workOrderId: string;
  partnerId: string;
  requesterUid: string;
  category: WorkOrderCategory;
  summaryLine: string;
  completedAt: number;
  verificationLevel: VerificationLevel;
  deepLinkTarget: string;
  shareCardSpec: {
    partnerName: string;
    category: string;
    summaryLine: string;
    completedAt: number;
    verificationLevel: VerificationLevel;
  };
}

export interface PartnerProofPortfolio {
  partnerId: string;
  verifiedJobs30d: number;
  verifiedJobs90d: number;
  categoriesTop: WorkOrderCategory[];
  responseTimeAvgMs?: number;
  approvalRate?: number;
  disputeRate?: number;
  trustedPathScore?: number;
  featuredProofTiles?: { receiptId: string; summaryLine: string; completedAt: number }[];
}

/** Work order intake templates — config-driven structured forms */
export interface IntakeTemplate {
  id: string;
  name: string;
  category: WorkOrderCategory;
  subCategory?: string;
  fields: { key: string; label: string; type: 'text' | 'select' | 'boolean' | 'number'; options?: string[] }[];
}

export const WORK_ORDER_TEMPLATES: IntakeTemplate[] = [
  {
    id: 'phoneRepair.screenReplace',
    name: 'Screen replacement',
    category: 'phoneRepair',
    subCategory: 'screenReplace',
    fields: [
      { key: 'deviceModel', label: 'Device model', type: 'text' },
      { key: 'screenType', label: 'Screen type', type: 'select', options: ['OEM', 'Aftermarket', 'Not sure'] },
      { key: 'urgency', label: 'Urgency', type: 'select', options: ['ASAP', 'This week', 'Flexible'] },
    ],
  },
  {
    id: 'plumbing.leak',
    name: 'Leak repair',
    category: 'plumbing',
    subCategory: 'leak',
    fields: [
      { key: 'location', label: 'Where is the leak?', type: 'text' },
      { key: 'severity', label: 'Severity', type: 'select', options: ['Drip', 'Steady flow', 'Spray/Flood'] },
      { key: 'shutoffAvailable', label: 'Shutoff valve available?', type: 'boolean' },
    ],
  },
  {
    id: 'cleaning.basic',
    name: 'Basic cleaning',
    category: 'cleaning',
    subCategory: 'basic',
    fields: [
      { key: 'rooms', label: 'Rooms / areas', type: 'text' },
      { key: 'pets', label: 'Pets present?', type: 'boolean' },
      { key: 'supplies', label: 'Provide supplies?', type: 'boolean' },
    ],
  },
  {
    id: 'handyman.general',
    name: 'General handyman',
    category: 'handyman',
    fields: [
      { key: 'taskDescription', label: 'What needs to be done?', type: 'text' },
      { key: 'urgency', label: 'Urgency', type: 'select', options: ['ASAP', 'This week', 'Flexible'] },
    ],
  },
  {
    id: 'delivery.local',
    name: 'Local delivery',
    category: 'delivery',
    fields: [
      { key: 'pickup', label: 'Pickup location/notes', type: 'text' },
      { key: 'dropoff', label: 'Drop-off location/notes', type: 'text' },
      { key: 'itemDescription', label: 'Item description', type: 'text' },
    ],
  },
];

export const WORK_ORDER_CATEGORY_LABELS: Record<WorkOrderCategory, string> = {
  phoneRepair: 'Phone repair',
  plumbing: 'Plumbing',
  cleaning: 'Cleaning',
  handyman: 'Handyman',
  delivery: 'Delivery',
  other: 'Other',
};

export const ORBOPS_STORAGE_KEYS = {
  WORK_ORDERS: 'ORBTAP_WORK_ORDERS_V1',
  PROOF_PACKS: 'ORBTAP_PROOF_PACKS_V1',
  JOB_RECEIPTS: 'ORBTAP_JOB_PROOF_RECEIPTS_V1',
  PORTFOLIOS: 'ORBTAP_PARTNER_PROOF_PORTFOLIOS_V1',
} as const;
