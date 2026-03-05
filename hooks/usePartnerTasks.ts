/**
 * Partner task notifications: no perks, no menu, menu needs review.
 * Used by partner dashboard for task banner and quick-link badges.
 */

import { useMemo } from 'react';
import { usePartners } from '../context/PartnersContext';
import { useMenuContext } from '../context/MenuContext';

export interface PartnerTask {
  id: string;
  type: 'perks' | 'menu' | 'menu-review';
  priority: 'high' | 'medium' | 'low';
  message: string;
  route: string;
}

export function usePartnerTasks(partnerId: string): { tasks: PartnerTask[]; taskCount: number } {
  const { getPerksForPartner } = usePartners();
  const { getMenuForPartner, getCurrentVersion, reports } = useMenuContext();

  const tasks = useMemo(() => {
    const list: PartnerTask[] = [];
    const perks = getPerksForPartner(partnerId);
    const menuDoc = getMenuForPartner(partnerId);
    const menuVersion = menuDoc ? getCurrentVersion(menuDoc) : null;

    if (perks.length === 0) {
      list.push({
        id: 'no-perks',
        type: 'perks',
        priority: 'high',
        message: 'Add your first perk to appear on the map',
        route: '/partner/perks',
      });
    }

    if (!menuDoc || !menuVersion || menuDoc.status !== 'PUBLISHED') {
      list.push({
        id: 'no-menu',
        type: 'menu',
        priority: 'medium',
        message: 'Upload your menu to help customers discover items',
        route: '/partner/menu',
      });
    } else if (menuDoc.status === 'NEEDS_REVIEW') {
      const openReports = reports.filter((r) => r.menuId === menuDoc.id && r.status === 'OPEN');
      list.push({
        id: 'menu-review',
        type: 'menu-review',
        priority: 'high',
        message:
          openReports.length > 0
            ? `${openReports.length} menu report${openReports.length > 1 ? 's' : ''} need attention`
            : 'Menu needs attention',
        route: '/partner/menu',
      });
    }

    return list;
  }, [partnerId, getPerksForPartner, getMenuForPartner, getCurrentVersion, reports]);

  return { tasks, taskCount: tasks.length };
}
