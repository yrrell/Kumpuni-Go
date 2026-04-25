// src/components/layout/BottomNav.tsx
import React, { useState } from 'react';
import { Home, Map as MapIcon, GitPullRequest, Info, PlusCircle, Edit3, History, X } from 'lucide-react';
import { useRouter } from 'next/router';

export function BottomNav({ activeTab, setActiveTab }: any) {
  const router = useRouter();
  const [showContributeMenu, setShowContributeMenu] = useState(false);

  const handleContributeClick = () => {
    setShowContributeMenu(prev => !prev);
  };

  const tabs = [
    { id: 'home',  icon: Home,           label: 'HOME',        action: () => { setShowContributeMenu(false); setActiveTab('home'); } },
    { id: 'map',   icon: MapIcon,         label: 'MAP',         action: () => { setShowContributeMenu(false); setActiveTab('map'); } },
    { id: 'contribute', icon: GitPullRequest, label: 'CONTRIBUTE', action: handleContributeClick },
    { id: 'about', icon: Info,            label: 'ABOUT',       action: () => { setShowContributeMenu(false); router.push('/about'); } },
  ];

  return (
    <>
      {/* Contribute sub-menu popup */}
      {showContributeMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowContributeMenu(false)}
          />
          {/* Menu card */}
          <div className="fixed bottom-[72px] left-1/2 -translate-x-1/2 z-50 bg-white rounded-3xl shadow-2xl border border-gray-100 p-4 w-64">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contribute</span>
              <button onClick={() => setShowContributeMenu(false)} className="text-gray-300">
                <X size={16} />
              </button>
            </div>

            <button
              onClick={() => { setShowContributeMenu(false); router.push('/contribute/add'); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-green-50 text-[#27ae60] font-black text-sm mb-2 active:scale-95 transition-all"
            >
              <PlusCircle size={18} />
              <div className="text-left">
                <p className="text-[11px] font-black uppercase">Add Shop</p>
                <p className="text-[9px] font-bold text-green-400">Submit a new shop</p>
              </div>
            </button>

            <button
              onClick={() => { setShowContributeMenu(false); router.push('/contribute/update'); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-50 text-amber-600 font-black text-sm mb-2 active:scale-95 transition-all"
            >
              <Edit3 size={18} />
              <div className="text-left">
                <p className="text-[11px] font-black uppercase">Update Shop</p>
                <p className="text-[9px] font-bold text-amber-400">Report changes / corrections</p>
              </div>
            </button>

            <button
              onClick={() => { setShowContributeMenu(false); router.push('/contribute/history'); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-gray-50 text-gray-500 font-black text-sm active:scale-95 transition-all"
            >
              <History size={18} />
              <div className="text-left">
                <p className="text-[11px] font-black uppercase">My History</p>
                <p className="text-[9px] font-bold text-gray-300">View your submissions</p>
              </div>
            </button>
          </div>
        </>
      )}

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-between items-center z-50 rounded-t-[2.5rem] shadow-[0_-10px_25px_rgba(0,0,0,0.05)]">
        {tabs.map((tab) => {
          const isActive = tab.id === 'contribute'
            ? showContributeMenu
            : activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={tab.action}
              className={`flex flex-col items-center gap-1 transition-all ${
                isActive ? 'text-[#27ae60] scale-110' : 'text-gray-500'
              }`}
            >
              <tab.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[8px] font-black tracking-tighter">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
