# OrbOps MVP — Manual Test Checklist

1. **Customer request**
   - Open a partner page → Proof Portfolio section → tap **Request Work** (or go to Master Directory → OrbWork Orders → create from list if you have a partnerId).
   - On create screen: pick category, optional template, title, description → Submit. Work order is created with status REQUESTED; you are taken to work order detail.

2. **Partner accept → schedule**
   - As partner (same user or different account that matches `partnerId` on the work order): open Work Orders, switch to "Partner inbox". Open the work order.
   - Tap **Accept** → status ACCEPTED. Tap **Confirm schedule** → status SCHEDULED.

3. **Partner milestones**
   - Tap **Mark En Route** → status EN_ROUTE and milestone appears in timeline.
   - Tap **Mark Started** → status STARTED.
   - Optionally **Add midpoint proof**. Enter completion summary, tap **Submit completion** → status COMPLETED_PENDING_APPROVAL; Proof Pack created.

4. **Customer approve → Proof + Wallet**
   - As requester: open same work order. See **Approve · Get Job Proof Receipt** and **Dispute**.
   - Tap **Approve**. Verify: redirect to Job Proof Receipt card (proof screen with summaryLine); Wallet shows new earn entry (WORK_ORDER_COMPLETE, 60 pts); no duplicate on second approve (idempotent).

5. **Proof Portfolio**
   - On partner page, Proof Portfolio section shows verified 30d/90d counts (and categories if any) after at least one completed job.

6. **Dispute**
   - Create another work order, partner accept/schedule/milestones/submit completion. As customer tap **Dispute / Request fix** with a reason. Status becomes DISPUTED; partner sees it.

7. **Feature flags**
   - In Admin Hub, turn OFF `isOrbOpsEnabled`. Confirm: OrbWork Orders tile and partner Proof Portfolio + Request Work are hidden; app does not crash. Turn ON again.

8. **App compiles and runs**
   - No navigation rewrite; existing routes work. Work order list/detail/create use existing ScreenWrapper/safe-area patterns.
