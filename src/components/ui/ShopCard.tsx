// src/components/ui/ShopCard.tsx
import React from 'react';
import { Phone, Navigation, MessageSquare } from 'lucide-react';
import { formatDistance } from '../../lib/distance';

export const ShopCard = ({ shop, distance }: any) => {
  const km = typeof distance === 'number' ? distance : 0;
  return (
    <div className="bg-white rounded-[2rem] p-6 mb-5 shadow-sm border border-gray-50">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-black text-theme">{shop.name}</h3>
          <p className="text-[11px] font-bold text-gray-400 mt-1">
            📍 {shop.brgy} •{' '}
            <span className="text-[#27ae60]">{formatDistance(km)} away</span>
          </p>
          <p className="text-[10px] font-bold text-gray-300 mt-0.5">{shop.type}</p>
        </div>
        <div
          className={`px-2 py-1 rounded-full text-[8px] font-black ${
            shop.isOpen ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
          }`}
        >
          {shop.isOpen ? '● OPEN' : '● CLOSED'}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mt-6">
        <a
          href={`tel:${shop.contact}`}
          className="flex flex-col items-center py-3 bg-gray-50 dark:bg-[#1f1f1f] rounded-2xl text-theme"
        >
          <Phone size={18} />
          <span className="text-[8px] font-black mt-1">CALL</span>
        </a>
        <a
          href={`sms:${shop.contact}`}
          className="flex flex-col items-center py-3 bg-gray-50 dark:bg-[#1f1f1f] rounded-2xl text-theme"
        >
          <MessageSquare size={18} />
          <span className="text-[8px] font-black mt-1">SMS</span>
        </a>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${shop.lat},${shop.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center py-3 bg-[#27ae60] text-white rounded-2xl shadow-md shadow-green-100"
        >
          <Navigation size={18} />
          <span className="text-[8px] font-black mt-1">GO NOW</span>
        </a>
      </div>
    </div>
  );
};
