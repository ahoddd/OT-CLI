import { useCallback, useEffect, useState } from 'react';
import { auth } from '../firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Circle } from './useSocial';
import {
  type OrbPlan,
  type PlanConstraints,
  type PlanMode,
  type PlanSize,
  type PlanStep,
  type PlanStepStatus,
  type SphereType,
  computePlanProgress,
  isVerifiedStepType,
} from '../constants/OrbPlans';
import { usePartners } from '../context/PartnersContext';
import { useDrops } from './useDrops';

const STORAGE_KEY = 'ORBTAP_SPHERE_PLANS_V1';

interface StoredPlansState {
  plans: OrbPlan[];
}

export interface UseOrbPlansResult {
  plans: OrbPlan[];
  getPlansForSphere: (sphereId: string) => OrbPlan[];
  getActivePlanForSphere: (sphereId: string) => OrbPlan | undefined;
  generatePlanForSphere: (params: {
    circle: Circle;
    sphereType: SphereType;
    mode: PlanMode;
    size: PlanSize;
    /** Optional Tune overrides (radius, budget, time window, weather). */
    constraints?: Partial<PlanConstraints>;
  }) => OrbPlan | undefined;
  markStepCompleted: (planId: string, stepId: string) => void;
  cancelPlan: (planId: string, onlyIfCreatorUid?: string) => boolean;
}

function toSphereType(circleType: Circle['type']): SphereType {
  if (circleType === 'couple') return 'COUPLE';
  if (circleType === 'fami') return 'FAMILY';
  return 'PAL';
}

function generateId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export const useOrbPlans = (): UseOrbPlansResult => {
  const [plans, setPlans] = useState<OrbPlan[]>([]);
  const { drops } = useDrops();
  const { partners } = usePartners();

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed: StoredPlansState = JSON.parse(raw);
        if (Array.isArray(parsed.plans)) {
          setPlans(parsed.plans);
        }
      } catch (e) {
        if (__DEV__) console.warn('useOrbPlans load error', e);
      }
    })();
  }, []);

  const persist = useCallback(
    async (next: OrbPlan[]) => {
      try {
        const payload: StoredPlansState = { plans: next };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch (e) {
        if (__DEV__) console.warn('useOrbPlans persist error', e);
      }
    },
    []
  );

  const getPlansForSphere = useCallback(
    (sphereId: string) => plans.filter((p) => p.sphereId === sphereId),
    [plans]
  );

  const getActivePlanForSphere = useCallback(
    (sphereId: string) => plans.find((p) => p.sphereId === sphereId && p.status === 'ACTIVE'),
    [plans]
  );

  const markStepCompleted = useCallback(
    (planId: string, stepId: string) => {
      setPlans((prev): OrbPlan[] => {
        const now = Date.now();
        const next: OrbPlan[] = prev.map((plan): OrbPlan => {
          if (plan.id !== planId) return plan;
          const steps: PlanStep[] = plan.steps.map((step): PlanStep => {
            if (step.id !== stepId) return step;
            const nextStatus: PlanStepStatus = 'COMPLETED';
            return {
              ...step,
              status: nextStatus,
              completedAt: step.completedAt ?? now,
            };
          });
          const progress = computePlanProgress(steps);
          const allRequiredDone = steps.every(
            (s) => !s.verification.required || s.status === 'COMPLETED'
          );
          const nextPlanStatus = allRequiredDone ? ('COMPLETED' as const) : plan.status;
          return {
            ...plan,
            steps,
            progress,
            status: nextPlanStatus,
            updatedAt: now,
          };
        });
        // fire-and-forget persist
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const generatePlanForSphere = useCallback(
    ({
      circle,
      sphereType,
      mode,
      size,
      constraints: tune,
    }: {
      circle: Circle;
      sphereType: SphereType;
      mode: PlanMode;
      size: PlanSize;
      constraints?: Partial<PlanConstraints>;
    }): OrbPlan | undefined => {
      if (!circle) return undefined;

      const now = Date.now();
      const defaultRadius =
        mode === 'TONIGHT' ? 10 : mode === 'DAY' ? 12 : mode === 'WEEKEND' ? 15 : mode === 'WEEK' ? 20 : 25;
      const radiusMiles = tune?.radiusMiles ?? defaultRadius;
      let startAt = now;
      let endAt =
        mode === 'TONIGHT'
          ? now + 4 * 60 * 60 * 1000
          : mode === 'DAY'
          ? now + 12 * 60 * 60 * 1000
          : mode === 'WEEKEND'
          ? now + 2 * 24 * 60 * 60 * 1000
          : mode === 'WEEK'
          ? now + 7 * 24 * 60 * 60 * 1000
          : now + 30 * 24 * 60 * 60 * 1000;
      if (tune?.timeWindow) {
        startAt = tune.timeWindow.startAt;
        endAt = tune.timeWindow.endAt;
      }

      // Basic deterministic partner selection using context partners and drops
      const foodPartner = partners[0];
      const activityPartner = partners[1] ?? partners[0];
      const dessertPartner = partners[2] ?? partners[0];

      const tonightSteps: PlanStep[] = [];

      // 1) Food/drink — prefer active drop if available
      const foodDrop =
        drops.find(
          (d) =>
            d.partnerId === foodPartner.id &&
            now >= d.startAt &&
            now <= d.endAt &&
            d.qtyRemaining > 0
        ) ?? drops.find((d) => now >= d.startAt && now <= d.endAt && d.qtyRemaining > 0);

      tonightSteps.push({
        id: generateId('step'),
        planId: '', // will fill later
        orderIndex: 0,
        type: foodDrop ? 'DROP' : 'VISIT',
        title: foodDrop ? foodDrop.title : `Start at ${foodPartner.name}`,
        description: foodDrop
          ? `Claim tonight's drop at ${foodDrop.partnerName}.`
          : `Grab food or drinks at ${foodPartner.name}.`,
        partnerId: foodDrop ? foodDrop.partnerId : foodPartner.id,
        targetRef: foodDrop ? { dropId: foodDrop.id } : { route: '/(tabs)' },
        verification: {
          required: !!foodDrop,
          verifiedActionType: foodDrop ? 'DROP_REDEEM' : undefined,
        },
        rewards: {
          otPointsEarnMax: size === 'MICRO' ? 20 : 35,
        },
        status: 'PENDING',
      });

      // 2) Activity
      tonightSteps.push({
        id: generateId('step'),
        planId: '',
        orderIndex: 1,
        type: 'VISIT',
        title: `Activity at ${activityPartner.name}`,
        description: `Walk, explore, or enjoy an activity near ${activityPartner.name}.`,
        partnerId: activityPartner.id,
        targetRef: { route: '/(tabs)' },
        verification: {
          required: false,
        },
        rewards: {
          otPointsEarnMax: size === 'MICRO' ? 10 : 20,
        },
        status: 'PENDING',
      });

      // 3) Dessert / coffee
      const dessertDrop =
        drops.find(
          (d) =>
            d.partnerId === dessertPartner.id &&
            now >= d.startAt &&
            now <= d.endAt &&
            d.qtyRemaining > 0
        ) ?? undefined;

      if (size !== 'MICRO') {
        tonightSteps.push({
          id: generateId('step'),
          planId: '',
          orderIndex: 2,
          type: dessertDrop ? 'DROP' : 'VISIT',
          title: dessertDrop ? dessertDrop.title : `Dessert or coffee at ${dessertPartner.name}`,
          description: dessertDrop
            ? `Wrap up with a sweet drop at ${dessertDrop.partnerName}.`
            : `Find dessert or coffee near ${dessertPartner.name}.`,
          partnerId: dessertDrop ? dessertDrop.partnerId : dessertPartner.id,
          targetRef: dessertDrop ? { dropId: dessertDrop.id } : { route: '/(tabs)' },
          verification: {
            required: !!dessertDrop,
            verifiedActionType: dessertDrop ? 'DROP_REDEEM' : undefined,
          },
          rewards: {
            otPointsEarnMax: 15,
          },
          status: 'PENDING',
        });
      }

      // 4) Optional photo moment checklist
      if (size !== 'PASSPORT') {
        tonightSteps.push({
          id: generateId('step'),
          planId: '',
          orderIndex: tonightSteps.length,
          type: 'CHECKLIST',
          title: 'Photo moment',
          description: 'Capture a photo together and share it in your Sphere feed.',
          verification: {
            required: false,
          },
          rewards: {},
          status: 'PENDING',
        });
      }

      // For non-tonight modes, re-use the same skeleton but scale counts and labels.
      let stepsTemplate: PlanStep[] = tonightSteps;
      if (mode !== 'TONIGHT') {
        stepsTemplate = tonightSteps.map((step, index) => {
          let title = step.title;
          if (mode === 'WEEKEND') title = title.replace('Tonight', 'Weekend').replace('tonight', 'this weekend');
          if (mode === 'WEEK') title = title.replace('Tonight', 'This week').replace('tonight', 'this week');
          if (mode === 'MONTH') title = title.replace('Tonight', 'This month').replace('tonight', 'this month');
          return {
            ...step,
            orderIndex: index,
            title,
          };
        });

        // Passport size can get an extra checklist anchor at the end for longer modes.
        if (size === 'PASSPORT') {
          stepsTemplate = [
            ...stepsTemplate,
            {
              id: generateId('step'),
              planId: '',
              orderIndex: stepsTemplate.length,
              type: 'CHECKLIST',
              title: mode === 'MONTH' ? 'Monthly highlight' : 'Weekend highlight',
              description:
                mode === 'MONTH'
                  ? 'Pick one standout moment this month and share it in your Sphere.'
                  : 'Pick one standout moment from this weekend and share it in your Sphere.',
              verification: { required: false },
              rewards: {},
              status: 'PENDING',
            },
          ];
        }
      }

      const planId = generateId('plan');
      const stepsWithPlanId: PlanStep[] = stepsTemplate.map((step, index) => ({
        ...step,
        planId,
        orderIndex: index,
      }));

      const plan: OrbPlan = {
        id: planId,
        sphereId: circle.id,
        sphereType: sphereType ?? toSphereType(circle.type),
        createdByUid: auth.currentUser?.uid ?? 'anon',
        cityId: undefined,
        regionId: undefined,
        title:
          mode === 'TONIGHT'
            ? circle.type === 'couple'
              ? 'Tonight: Date Night'
              : circle.type === 'pal'
              ? 'Tonight: Friends Night'
              : 'Tonight Plan'
            : mode === 'WEEKEND'
            ? 'Weekend Sphere Plan'
            : mode === 'DAY'
            ? 'Day Plan'
            : mode === 'WEEK'
            ? 'This Week in Your Sphere'
            : 'Passport Month Plan',
        mode,
        size,
        constraints: {
          radiusMiles,
          timeWindow: { startAt, endAt },
          budgetCentsMax: tune?.budgetCentsMax,
          durationMinutes: tune?.durationMinutes,
          weatherModeAtCreate: tune?.weatherModeAtCreate,
        },
        steps: stepsWithPlanId,
        status: 'ACTIVE',
        progress: computePlanProgress(stepsWithPlanId),
        createdAt: now,
        updatedAt: now,
      };

      const next = [plan, ...plans.filter((p) => p.sphereId !== circle.id || p.status !== 'ACTIVE')];
      setPlans(next);
      persist(next);

      return plan;
    },
    [drops, persist, plans]
  );

  const cancelPlan = useCallback(
    (planId: string, onlyIfCreatorUid?: string): boolean => {
      let ok = false;
      setPlans((prev): OrbPlan[] => {
        const plan = prev.find((p) => p.id === planId);
        if (!plan || plan.status !== 'ACTIVE') return prev;
        if (onlyIfCreatorUid != null && plan.createdByUid !== onlyIfCreatorUid) return prev;
        ok = true;
        const next = prev.map((p) =>
          p.id === planId ? { ...p, status: 'CANCELED' as const, updatedAt: Date.now() } : p
        );
        persist(next);
        return next;
      });
      return ok;
    },
    [persist]
  );

  return {
    plans,
    getPlansForSphere,
    getActivePlanForSphere,
    generatePlanForSphere,
    markStepCompleted,
    cancelPlan,
  };
};

