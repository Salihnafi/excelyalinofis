"use client";

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function HeaderClock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!time) return null; // Sunucu tarafında render uyumsuzluğunu önlemek için

  const timeString = time.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const dateString = time.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="absolute top-6 right-6 md:top-8 md:right-8 flex items-center gap-3 bg-white border border-red-100 shadow-[0_4px_20px_-5px_rgba(220,38,38,0.15)] rounded-full px-5 py-2.5 z-50 transition-all hover:shadow-[0_4px_25px_-5px_rgba(220,38,38,0.25)]">
      <div className="bg-red-50 p-1.5 rounded-full text-red-600">
        <Clock className="w-5 h-5" />
      </div>
      <div className="flex flex-col">
        <span className="text-red-600 font-bold text-base leading-tight tracking-wide">{timeString}</span>
        <span className="text-slate-500 text-[11px] font-medium uppercase tracking-wider">{dateString}</span>
      </div>
    </div>
  );
}
