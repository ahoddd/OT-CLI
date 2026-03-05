import { collection, getDocs } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app, db } from '../firebaseConfig';
import type { Partner, Perk } from '../constants/MockData';
import type { PartnerTier } from '../constants/PartnerTiers';

const PARTNERS_COLLECTION = 'partners';
const PERKS_COLLECTION = 'perks';

function docToPartner(id: string, data: Record<string, unknown>): Partner {
  const loc = (data.location as { lat?: number; lng?: number; address?: string }) || {};
  return {
    id,
    name: typeof data.name === 'string' ? data.name : '',
    category: typeof data.category === 'string' ? data.category : '',
    tier: (data.tier === 'silver' || data.tier === 'gold' || data.tier === 'platinum' ? data.tier : 'silver') as PartnerTier,
    location: {
      lat: typeof loc.lat === 'number' ? loc.lat : 0,
      lng: typeof loc.lng === 'number' ? loc.lng : 0,
      address: typeof loc.address === 'string' ? loc.address : '',
    },
    description: typeof data.description === 'string' ? data.description : '',
    hours: typeof data.hours === 'string' ? data.hours : '',
    verified: data.verified === true,
    termsShort: typeof data.termsShort === 'string' ? data.termsShort : undefined,
    featuredImageUrl: typeof data.featuredImageUrl === 'string' ? data.featuredImageUrl : (data.featuredImageUrl === null ? null : undefined),
    logoUrl: typeof data.logoUrl === 'string' ? data.logoUrl : (data.logoUrl === null ? null : undefined),
    about: typeof data.about === 'string' ? data.about : (data.about === null ? null : undefined),
    showOrbOpsButton: data.showOrbOpsButton !== false,
    offersCatering: data.offersCatering === true,
    ownerUid: typeof data.ownerUid === 'string' ? data.ownerUid : (data.ownerUid === null ? null : undefined),
    phone: typeof data.phone === 'string' ? data.phone : (data.phone === null ? null : undefined),
    website: typeof data.website === 'string' ? data.website : (data.website === null ? null : undefined),
    socialInstagram: typeof data.socialInstagram === 'string' ? data.socialInstagram : (data.socialInstagram === null ? null : undefined),
    socialTwitter: typeof data.socialTwitter === 'string' ? data.socialTwitter : (data.socialTwitter === null ? null : undefined),
  };
}

function docToPerk(id: string, data: Record<string, unknown>): Perk {
  return {
    id,
    partnerId: typeof data.partnerId === 'string' ? data.partnerId : '',
    title: typeof data.title === 'string' ? data.title : '',
    description: typeof data.description === 'string' ? data.description : '',
    cost: typeof data.cost === 'number' ? data.cost : 0,
    tier: (data.tier === 'silver' || data.tier === 'gold' || data.tier === 'platinum' ? data.tier : 'silver') as PartnerTier,
    cooldown: typeof data.cooldown === 'string' ? data.cooldown : '24h',
    imageUrl: typeof data.imageUrl === 'string' ? data.imageUrl : (data.imageUrl === null ? null : undefined),
    active: data.active === false ? false : true,
  };
}

export async function fetchPartnersFromFirestore(): Promise<Partner[]> {
  const snap = await getDocs(collection(db, PARTNERS_COLLECTION));
  const list: Partner[] = [];
  snap.docs.forEach((d) => {
    const data = d.data() as Record<string, unknown>;
    list.push(docToPartner(d.id, data));
  });
  return list;
}

export async function fetchPerksFromFirestore(): Promise<Perk[]> {
  const snap = await getDocs(collection(db, PERKS_COLLECTION));
  const list: Perk[] = [];
  snap.docs.forEach((d) => {
    const data = d.data() as Record<string, unknown>;
    list.push(docToPerk(d.id, data));
  });
  return list;
}

export type PartnerUpdateSelfPayload = {
  partnerId: string;
  hours?: string;
  description?: string;
  about?: string;
  logoUrl?: string | null;
  phone?: string | null;
  website?: string | null;
  socialInstagram?: string | null;
  socialTwitter?: string | null;
  showOrbOpsButton?: boolean;
  offersCatering?: boolean;
};

export async function partnerUpdateSelf(
  payload: PartnerUpdateSelfPayload
): Promise<{ success: boolean; message?: string }> {
  const fn = getFunctions(app, 'us-central1');
  const callable = httpsCallable<PartnerUpdateSelfPayload, { success: boolean; message?: string }>(
    fn,
    'partnerUpdateSelf'
  );
  const result = await callable(payload);
  return result.data;
}
