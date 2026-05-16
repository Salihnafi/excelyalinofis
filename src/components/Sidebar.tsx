"use client";

import React, { useMemo } from 'react';
import { useKpiData } from '../hooks/useKpiData';

export default function Sidebar() {
  const { data } = useKpiData();
  
  const allKpis = useMemo(() => {
    const kpiSet = new Set<string>();
    data.forEach(month => {
      Object.keys(month.kpis).forEach(kpi => kpiSet.add(kpi));
    });
    return Array.from(kpiSet).sort();
  }, [data]);

  const scrollToKpi = (kpi: string) => {
    const element = document.getElementById(kpi);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <aside className="w-72 h-screen fixed top-0 left-0 bg-red-600 flex flex-col z-50 text-white shadow-2xl">
      <div className="p-6 flex items-center justify-center bg-white border-b-4 border-red-700">
        <img 
          src="/logo.png" 
          alt="Kelebek Logo" 
          className="w-full max-h-36 object-contain drop-shadow-sm"
        />
      </div>
      <div className="flex-1 overflow-y-auto py-6 custom-scrollbar">
        <h3 className="px-6 mb-4 text-xs font-black uppercase tracking-widest text-red-200">
          KPI BAŞLIKLARI
        </h3>
        {allKpis.length > 0 ? (
          <ul className="space-y-1 px-3">
            {allKpis.map((kpi) => (
              <li key={kpi}>
                <button
                  onClick={() => scrollToKpi(kpi)}
                  className="w-full text-left px-4 py-3 rounded-xl hover:bg-red-500 transition-colors text-sm font-semibold text-white/90 hover:text-white group flex items-center"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-300 mr-3 group-hover:bg-white group-hover:scale-150 transition-all"></span>
                  {kpi}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-6 py-8 text-white/70 text-sm font-medium text-center bg-red-500/20 mx-4 rounded-xl border border-red-500/30">
            Henüz veri yok. <br/><br/> Lütfen Excel dosyasını yükleyin. Başlıklar otomatik olarak burada listelenecektir.
          </div>
        )}
      </div>
    </aside>
  );
}
