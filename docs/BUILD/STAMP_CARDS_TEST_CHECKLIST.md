# Stamp Cards — Acceptance Test Checklist

## V1 (all ON by default)

1. **Partner creates and publishes**  
   Partner can create and publish an ACTIVE Stamp Program via Stamp Studio.  
   - [ ] Create program: name, stamps required, cooldown, reward type + label, template.  
   - [ ] Save draft.  
   - [ ] Publish (ACTIVE).  
   - [ ] Program appears in list and on partner profile (Stamp Card module).

2. **Partner page Stamp Card module**  
   Partner page shows Stamp Card module with progress when partner has an active program.  
   - [ ] Progress X/N visible.  
   - [ ] Next eligible time or “Ready to stamp” shown.  
   - [ ] “Scan to stamp” CTA goes to Scan tab.

3. **User scans QR → stamp earned**  
   User scans partner stamp QR; stamp is awarded; cooldown enforced; idempotent.  
   - [ ] Scan `orbtap://stamp?partnerId=…&programId=…` → success “Stamp earned!” or “Next stamp in X hours”.  
   - [ ] Second scan within cooldown returns friendly message (no double stamp).  
   - [ ] Progress increments in Wallet Stamp Cards and on partner page.

4. **Complete card → reward in Reward Locker**  
   Completing `stampsRequired` stamps → reward earned appears in Reward Locker.  
   - [ ] Wallet → Reward Locker shows item.  
   - [ ] “Redeem now” shows QR/code for staff.

5. **Partner redeems reward**  
   Partner redeems reward via code (or scan); reward marked redeemed; cannot redeem twice.  
   - [ ] Partner Dashboard → Redeem Stamp Reward → enter code → Confirm.  
   - [ ] Success message.  
   - [ ] Same code again → “Already redeemed” or idempotent success.

6. **VerifiedAction receipts**  
   STAMP_EARNED and REWARD_REDEEMED mint VerifiedAction; /proof/[id] opens.  
   - [ ] Proof list shows stamp actions.  
   - [ ] Proof receipt has Stamp Card badge/source when applicable.

7. **OT Points bonuses**  
   If enabled, OT Points bonuses obey caps and are awarded once.  
   - [ ] Completion bonus (if configured) applied once per completion.  
   - [ ] OT_POINTS_BONUS reward type (if allowed) capped.

8. **Partner analytics**  
   Partner analytics populate after events (stamps issued, rewards earned/redeemed).  
   - [ ] Stamp events written; partner can see counts (if Stamp Analytics screen exists).

9. **Admin**  
   Admin can pause program and change config; behavior updates.  
   - [ ] Admin Hub has Stamp Cards section (or link to config).  
   - [ ] Pause program → program no longer active for users.

10. **V1.1 hidden**  
    V1.1 features (boost windows, reminders, multi-location, staff roles, quarantine, city passport) remain OFF by default and do not appear unless enabled.  
    - [ ] No Double Stamp / boost UI when flag off.  
    - [ ] No multi-location / staff UI when flags off.

## Optional

- **StampCardStack** — Scroll snaps to each card; tap expands to detail; back returns to stack.  
- **Wallet collapsible** — Stamp Cards section collapses by default when other modules exist; state persists.  
- **Verified Review** — After REWARD_REDEEMED, “Leave a verified review” CTA; review stores proofId; Verified badge on review.
