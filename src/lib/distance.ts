// src/lib/distance.ts
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const checkIsOpen = (shop: any): boolean => {
  const now = new Date();
  const day = now.getDay();    // 0=Sun … 6=Sat
  const hour = now.getHours();
  const minute = now.getMinutes();

  // Support both camelCase (static data) and snake_case (Supabase DB)
  const workDays: number[] = shop.work_days ?? shop.workDays ?? [];
  const openTime: number  = shop.open_time  ?? shop.openTime  ?? 0;
  const closeTime: number = shop.close_time ?? shop.closeTime ?? 24;

  if (!workDays.includes(day)) return false;
  if (openTime === 0 && closeTime === 24) return true;

  // Use fractional hours so e.g. 14:30 correctly compares
  const nowFraction = hour + minute / 60;
  return nowFraction >= openTime && nowFraction < closeTime;
};

export const formatDistance = (km: number): string => {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
};
