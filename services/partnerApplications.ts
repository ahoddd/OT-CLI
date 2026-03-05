/**
 * Partner application submission — persists to Firestore.
 * Sprint 15: Silver tier partners are auto-approved instantly ("Go live in 10 minutes").
 * Collection: partnerApplications
 */

import { collection, addDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export interface PartnerApplicationInput {
  businessName: string;
  contactName: string;
  contactEmail: string;
  category?: string;
  description: string;
  placementInterest: 'featured' | 'sponsored' | 'both';
  userId?: string | null;
  /** Referral code from another partner — both get bonus when approved */
  referredByCode?: string | null;
  /** Ad spot details (when placement is sponsored or both) */
  adPlacementPreference?: 'orb_carousel' | 'daily_ritual_reward' | null;
  adCtaUrl?: string | null;
  adCreativeType?: 'image' | 'video' | null;
  adNotes?: string | null;
}

export async function submitPartnerApplication(input: PartnerApplicationInput): Promise<{ success: boolean; id?: string; error?: string }> {
  const businessName = (input.businessName || '').trim();
  const contactName = (input.contactName || '').trim();
  const contactEmail = (input.contactEmail || '').trim().toLowerCase();
  const description = (input.description || '').trim();

  if (!businessName || businessName.length < 2) {
    return { success: false, error: 'Please enter your business name.' };
  }
  if (!contactName || contactName.length < 2) {
    return { success: false, error: 'Please enter a contact name.' };
  }
  if (!contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }
  if (!description || description.length < 20) {
    return { success: false, error: 'Please describe your business in at least 20 characters.' };
  }

  try {
    const ref = await addDoc(collection(db, 'partnerApplications'), {
      businessName,
      contactName,
      contactEmail,
      category: (input.category || '').trim() || null,
      description,
      placementInterest: input.placementInterest || 'both',
      userId: input.userId || null,
      referredByCode: (input.referredByCode || '').trim() || null,
      adPlacementPreference: input.adPlacementPreference ?? null,
      adCtaUrl: (input.adCtaUrl || '').trim() || null,
      adCreativeType: input.adCreativeType ?? null,
      adNotes: (input.adNotes || '').trim() || null,
      createdAt: serverTimestamp(),
      status: 'pending',
    });
    return { success: true, id: ref.id };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Failed to submit. Please try again.' };
  }
}

// ─── Sprint 15 — Auto-approve Silver tier ────────────────────────────────────

export interface AutoApproveResult {
  success: boolean;
  partnerId?: string;
  applicationId?: string;
  error?: string;
}

/**
 * Auto-approves a Silver-tier partner application instantly.
 * Creates the partner document in Firestore and marks the application 'approved'.
 * The partner can then proceed directly to the onboarding wizard.
 */
export async function submitAndAutoApprovePartner(
  input: PartnerApplicationInput & { userId: string },
): Promise<AutoApproveResult> {
  const businessName = (input.businessName || '').trim();
  const contactEmail = (input.contactEmail || '').trim().toLowerCase();
  if (!businessName || !contactEmail || !input.userId) {
    return { success: false, error: 'Business name, email, and user ID are required.' };
  }

  try {
    // 1. Write the application record (for audit trail)
    const appRef = await addDoc(collection(db, 'partnerApplications'), {
      businessName,
      contactName: (input.contactName || '').trim(),
      contactEmail,
      category: (input.category || '').trim() || null,
      description: (input.description || '').trim() || 'Auto-approved Silver partner',
      placementInterest: input.placementInterest || 'featured',
      userId: input.userId,
      referredByCode: (input.referredByCode || '').trim() || null,
      createdAt: serverTimestamp(),
      status: 'auto_approved',
      autoApprovedAt: serverTimestamp(),
    });

    // 2. Create the partner document (Silver tier, immediately live)
    const partnerRef = doc(collection(db, 'partners'));
    await setDoc(partnerRef, {
      id: partnerRef.id,
      name: businessName,
      ownerUid: input.userId,
      ownerEmail: contactEmail,
      category: (input.category || '').trim() || 'Other',
      tier: 'silver',
      status: 'active',
      applicationId: appRef.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // Onboarding state — wizard checks these to know which steps are complete
      onboardingStep: 0,
      onboardingComplete: false,
    });

    // 3. Mark user as partner in their profile
    await setDoc(
      doc(db, 'users', input.userId),
      { partnerMode: true, partnerId: partnerRef.id, updatedAt: serverTimestamp() },
      { merge: true },
    );

    return { success: true, partnerId: partnerRef.id, applicationId: appRef.id };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Auto-approval failed. Please try again.' };
  }
}
