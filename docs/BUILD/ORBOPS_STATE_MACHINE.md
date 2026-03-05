# OrbOps™ — Work Order State Machine & Role Permissions

Work orders use a single unified status enum. Only authorized roles can perform transitions; all transitions are audited and server-authoritative.

## Status enum

- `DRAFT` → not used in MVP (create goes to `REQUESTED`)
- `REQUESTED` — customer submitted
- `CLARIFYING` — partner asked a question
- `ACCEPTED` — partner accepted (may propose times)
- `SCHEDULED` — time confirmed
- `EN_ROUTE` — partner marked en route
- `STARTED` — partner marked started
- `MIDPOINT_PROOF` — partner added midpoint proof
- `COMPLETED_PENDING_APPROVAL` — partner submitted completion; customer must approve or dispute
- `COMPLETED` — customer approved (or future: conservative auto-complete)
- `DISPUTED` — customer disputed
- `CANCELED`

## Role permissions

### Requester (customer)

- **Create** work order → status `REQUESTED`
- **Approve** when status is `COMPLETED_PENDING_APPROVAL` → `COMPLETED` (mints VerifiedAction, Job Proof Receipt, ledger entry)
- **Dispute** when status is `COMPLETED_PENDING_APPROVAL` → `DISPUTED` (integrity event recorded)

### Partner

- **Accept** `REQUESTED` → `ACCEPTED`
- **Clarify** `REQUESTED` → `CLARIFYING`
- **Schedule** `ACCEPTED` → `SCHEDULED` (with confirmedStartAt/confirmedEndAt)
- **Submit milestone** (idempotent by clientNonce):
  - `SCHEDULED` → `EN_ROUTE` (milestone EN_ROUTE)
  - `EN_ROUTE` → `STARTED` (milestone STARTED)
  - `STARTED` or `MIDPOINT_PROOF` → `MIDPOINT_PROOF` (milestone MIDPOINT_PROOF) or **Submit completion** → `COMPLETED_PENDING_APPROVAL` (creates ProofPack, milestone COMPLETED_SUBMITTED)

## Completion flow

1. Partner calls **Submit completion** (after photos + checklist + summary) → status `COMPLETED_PENDING_APPROVAL`, ProofPack created.
2. Customer sees Proof Pack preview; **Approve** or **Dispute**.
3. On **Approve**: status → `COMPLETED`; server mints VerifiedAction (`WORK_ORDER_COMPLETE`), ledger earn (OrbinomicsPolicy `EMIT_WORK_ORDER_COMPLETE`), Job Proof Receipt; Proof Portfolio updated.

## Fraud controls

- Idempotency keys for milestone and completion submit (clientNonce).
- Rate limits on create, milestone, approval/dispute.
- All transitions written to `workOrderAudit`.
- Integrity events: e.g. `WORK_ORDER_DISPUTE` (and future media duplicate / rate limit) recorded server-side; admin can view OrbOps integrity section.

## Files

- Backend: `functions/src/index.ts` — `REQUester_TRANSITIONS`, `PARTNER_TRANSITIONS`, `canTransition()`, callables.
- Client: `services/orbOps.ts`, `hooks/useWorkOrders.ts`, `app/work-orders/*`.
