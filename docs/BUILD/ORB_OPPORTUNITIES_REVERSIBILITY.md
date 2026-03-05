# OrbOpportunities — Full Removal Checklist

If you want to **remove** the OrbOpportunities module entirely (not just disable it):

1. **Feature flag**
   - In `constants/Flags.ts`: remove `isOrbOpportunitiesEnabled` from `DEFAULT_FLAGS` and from type.
   - In `constants/AdminConfig.ts`: remove from `FLAG_LABELS`, remove the `orbopportunities` category from `FLAG_CATEGORIES`, remove `opportunities` from `DIRECTORY_LABELS_DEFAULT` and `DEFAULT_DIRECTORY_ORDER`, and remove any `dir_opportunities` entry from `DISPLAY_NAME_ENTRIES` if present.

2. **Directory**
   - In `components/MasterDirectory.tsx`: remove `OPPORTUNITIES_ITEM`, remove `opportunities` from `ITEM_SECTION`, remove the `case 'opportunities':` block in `DirectoryVisual`, and remove the conditional `flags.isOrbOpportunitiesEnabled && base.push(OPPORTUNITIES_ITEM)` and the flag from the `useMemo` dependency array.

3. **Partner dashboard**
   - In `app/partner/dashboard.tsx`: remove the entire “OrbOpportunities” section block that links to `/partner/opportunities`.

4. **Routes and screens**
   - Delete `app/opportunities/index.tsx`
   - Delete `app/opportunities/[id].tsx`
   - Delete `app/opportunities/my-applications.tsx`
   - Delete `app/partner/opportunities/index.tsx`
   - Delete `app/partner/opportunities/create.tsx`
   - Delete `app/partner/opportunities/[id].tsx`
   - Delete `app/partner/opportunities/records.tsx`

5. **Constants and hooks**
   - Delete `constants/Opportunities.ts`
   - Delete `hooks/useOpportunities.ts`

6. **Docs**
   - In `docs/BUILD/ROUTES_MAP.md`: remove the OrbOpportunities route table rows and the OrbOpportunities entry-point bullet.
   - Optionally delete this file after removal.

**Quick disable (no file deletion):** Set `isOrbOpportunitiesEnabled` to `false` in `constants/Flags.ts` (it is already `false` by default). The directory tile and partner dashboard section will not show; routes remain but are not linked.
