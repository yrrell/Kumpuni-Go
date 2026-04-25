// src/hooks/useShopFiltering.ts
import { useMemo } from 'react';
import { calculateDistance, checkIsOpen } from '../lib/distance';

export const useShopFiltering = (shops: any[], location: any, search: string) => {
  return useMemo(() => {
    if (!location) return [];
    return shops
      .filter((s) => s.status === 'approved')
      .filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.brgy.toLowerCase().includes(search.toLowerCase()) ||
          s.type.toLowerCase().includes(search.toLowerCase())
      )
      .map((s) => ({
        ...s,
        dist: calculateDistance(location.lat, location.lng, s.lat, s.lng),
        isOpen: checkIsOpen(s),
      }))
      .sort((a, b) => {
        // Open shops first, then by distance
        if (a.isOpen !== b.isOpen) return a.isOpen ? -1 : 1;
        return a.dist - b.dist;
      });
  }, [shops, location, search]);
};
