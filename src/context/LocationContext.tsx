// src/context/LocationContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { reverseGeocode, LocationInfo } from '../lib/geocoding';

interface LocationContextType {
  location: { lat: number; lng: number } | null;
  locationInfo: LocationInfo;
  loading: boolean;
}

const DEFAULT_INFO: LocationInfo = {
  municipality: 'DETECTING...',
  province: '',
  barangay: '',
  display: 'DETECTING...',
};

const LocationContext = createContext<LocationContextType>({
  location: null,
  locationInfo: DEFAULT_INFO,
  loading: true,
});

export const LocationProvider = ({ children }: { children: React.ReactNode }) => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationInfo, setLocationInfo] = useState<LocationInfo>(DEFAULT_INFO);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation({ lat: 14.9333, lng: 120.5333 });
      setLocationInfo({ municipality: 'LUBAO', province: 'PAMPANGA', barangay: '', display: 'LUBAO, PAMPANGA' });
      setLoading(false);
      return;
    }

    // Track last geocoded coords to avoid redundant API calls
    let lastLat = 0;
    let lastLng = 0;

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setLocation(coords);

        // Only re-geocode if position changed meaningfully (>~100m)
        const latDiff = Math.abs(coords.lat - lastLat);
        const lngDiff = Math.abs(coords.lng - lastLng);
        if (latDiff > 0.001 || lngDiff > 0.001 || lastLat === 0) {
          lastLat = coords.lat;
          lastLng = coords.lng;
          // zoom=10 in geocoding.ts gives municipality-level (not suburb/barangay)
          const info = await reverseGeocode(coords.lat, coords.lng);
          setLocationInfo(info);
        }
        setLoading(false);
      },
      () => {
        // Permission denied or error — fall back to Lubao
        setLocation({ lat: 14.9333, lng: 120.5333 });
        setLocationInfo({ municipality: 'LUBAO', province: 'PAMPANGA', barangay: '', display: 'LUBAO, PAMPANGA' });
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return (
    <LocationContext.Provider value={{ location, locationInfo, loading }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);
