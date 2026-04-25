// src/lib/geocoding.ts

export interface LocationInfo {
  municipality: string;
  province: string;
  barangay: string;
  display: string; // "Municipality, Province"
}

export const reverseGeocode = async (lat: number, lng: number): Promise<LocationInfo> => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
      { headers: { 'User-Agent': 'KumpuniGo/1.0', 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    const a = data.address || {};

    // Philippine address hierarchy: city_district > city > town > municipality > county
    // zoom=10 gives us municipality-level accuracy (not suburb/barangay level)
    const municipality = (
      a.city_district ||
      a.city ||
      a.town ||
      a.municipality ||
      a.county ||
      'Unknown'
    ).toUpperCase();

    const province = (
      a.state || a.province || 'Unknown'
    ).toUpperCase()
      .replace('PROVINCE OF ', '')
      .replace(' PROVINCE', '');

    const barangay = (
      a.suburb || a.village || a.neighbourhood || a.quarter || ''
    ).toUpperCase();

    return {
      municipality,
      province,
      barangay,
      display: `${municipality}, ${province}`,
    };
  } catch {
    return {
      municipality: 'LUBAO',
      province: 'PAMPANGA',
      barangay: '',
      display: 'LUBAO, PAMPANGA',
    };
  }
};

// Autocomplete address search using Nominatim
export const searchAddress = async (query: string): Promise<any[]> => {
  if (!query || query.length < 3) return [];
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ph&limit=6&addressdetails=1`,
      { headers: { 'User-Agent': 'KumpuniGo/1.0' } }
    );
    const data = await res.json();
    return data.map((item: any) => ({
      label: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      address: item.address,
    }));
  } catch {
    return [];
  }
};
