"use client";

import React, { useState, useMemo } from 'react';
import { useKpiData } from '../hooks/useKpiData';
import { formatKpiValue } from '../utils/formatters';
import { exportDashboardToPDF } from '../utils/pdfExport';
import { Download, AlertTriangle, Activity, Loader2 } from 'lucide-react';
import {
  ResponsiveContainer, ComposedChart, Bar, Line, LabelList,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, BarChart, Cell
} from 'recharts';

// Excel'den gelen verileri kesinlikle sayı formatına çeviren güvenli dönüştürücü
const parseValue = (val) => {
  if (val === null || val === undefined || val === '') return null;
  const num = Number(val);
  return isNaN(num) ? null : num;
};

export default function Dashboard() {
  const { data, department, loading, error } = useKpiData();
  const [isExporting, setIsExporting] = useState(false);

  const allKpis = useMemo(() => {
    const kpiSet = new Set();
    data.forEach(month => {
      Object.keys(month.kpis).forEach(kpi => kpiSet.add(kpi));
    });
    return Array.from(kpiSet).sort();
  }, [data]);

  const getChartDataForKpi = (kpi) => {
    return data.map(month => {
      const kpiData = month.kpis[kpi];
      
      const parsedRatio = parseValue(kpiData?.ratio);
      const ratioValue = parsedRatio !== null 
        ? (Math.abs(parsedRatio) < 2 ? parsedRatio * 100 : parsedRatio)
        : null;

      return {
        name: month.monthKey,
        target: parseValue(kpiData?.target),
        actual: parseValue(kpiData?.actual),
        ratio: ratioValue ? Number(ratioValue.toFixed(1)) : null,
        unit: kpiData?.unit || ''
      };
    });
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportDashboardToPDF('dashboard-export-area', `${department}_Tum_KPI_Raporu.pdf`);
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-red-600">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="text-lg font-bold">Dashboard Yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-600 shadow-sm">
        <AlertTriangle className="w-8 h-8 mb-2" />
        <p className="font-medium">Veriler yüklenirken bir hata oluştu: {error.message}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="p-10 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
        <Activity className="w-16 h-16 mx-auto text-slate-300 mb-4" />
        <h3 className="text-xl font-bold text-slate-700">Henüz Veri Bulunamadı</h3>
        <p className="text-slate-500 mt-2 font-medium">Lütfen önce Excel dosyanızı yükleyin.</p>
      </div>
    );
  }

  const latestMonth = data[data.length - 1];

  return (
    <div className="max-w-[1600px] mx-auto space-y-8">
      {/* Üst Bar: Başlık ve Export */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-red-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Tüm KPI Gösterge Paneli</h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">Bütün izlenen metriklerin genel görünümü</p>
        </div>

        <button
          onClick={handleExport}
          disabled={isExporting}
          className={`flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl font-bold transition-all shadow-lg w-full lg:w-auto border ${
            isExporting 
              ? 'bg-red-100 border-red-200 text-red-400 cursor-not-allowed' 
              : 'bg-red-600 hover:bg-red-700 border-red-600 text-white shadow-red-600/20 hover:shadow-red-600/40 active:scale-95'
          }`}
        >
          {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
          <span>{isExporting ? 'PDF Hazırlanıyor...' : 'Raporu İndir (PDF)'}</span>
        </button>
      </div>

      <div id="dashboard-export-area" className="space-y-8 pb-10">
        {allKpis.map(kpi => {
           const chartData = getChartDataForKpi(kpi);
           const currentKpiLatestData = latestMonth?.kpis[kpi];
           const isLowerBetterKpi = kpi.toLocaleLowerCase('tr-TR').includes('gider bütçesine uyum') || kpi.toLocaleLowerCase('tr-TR').includes('iş kazası');

           return (
             <div id={kpi} key={kpi} className="kpi-card-export bg-white p-6 md:p-8 rounded-3xl border border-red-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden break-inside-avoid scroll-mt-12">
               <div className="absolute top-0 left-0 w-full h-1.5 bg-red-600"></div>
               
               <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-100 pb-4 mb-6 pt-2">
                 <div>
                   <div className="inline-block px-3 py-1 mb-2 text-xs font-bold uppercase tracking-wider text-red-600 bg-red-100 rounded-full">
                     {department}
                   </div>
                   <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                     {kpi}
                   </h2>
                 </div>
                 
                 {currentKpiLatestData && (
                   <div className="mt-4 md:mt-0 flex items-center space-x-4 bg-slate-50 px-5 py-2.5 rounded-xl border border-slate-200 shadow-sm">
                     <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Son Ay ({latestMonth.monthKey}):</span>
                     <span className="text-xl font-black text-red-600">
                       {formatKpiValue(currentKpiLatestData.actual, currentKpiLatestData.unit)}
                     </span>
                   </div>
                 )}
               </div>

               <div className="h-[400px] w-full mt-4">
                 <ResponsiveContainer width="100%" height="100%">
                   {(() => {
                     const unit = chartData[0]?.unit || '';
                     const lowerUnit = unit.toLowerCase().trim();
                     const isLineChart = ['%', 'yüzde'].includes(lowerUnit);
                     const isBarChart = ['gün', 'dakika', 'saat'].includes(lowerUnit);
                     
                     const isZeroTarget = chartData.every(d => d.target === 0 || d.target === null);
                     const hideRatio = isZeroTarget || kpi.toLowerCase().includes('iş kazası');

                     if (isLineChart) {
                       return (
                         <LineChart data={chartData} margin={{ top: 35, right: 10, left: -10, bottom: 0 }}>
                           <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                           <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
                           <YAxis 
                             stroke="#94a3b8" 
                             tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} 
                             axisLine={false} 
                             tickLine={false} 
                             tickFormatter={(value) => `%${value}`}
                           />
                           <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px' }} />
                           <Legend wrapperStyle={{ paddingTop: '20px' }} />
                           
                           <Line name="Hedef" type="stepAfter" dataKey="target" stroke="#94a3b8" strokeWidth={3} strokeDasharray="5 5" dot={false} activeDot={false} />
                           
                           <Line name="Gerçekleşen" type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={4} 
                             dot={(props) => {
                                const { cx, cy, payload, value } = props;
                                const isGreen = payload.target === null || (isLowerBetterKpi ? value <= payload.target : value >= payload.target);
                                return <circle cx={cx} cy={cy} r={5} fill="#ffffff" strokeWidth={2} stroke={isGreen ? "#10b981" : "#ef4444"} key={`dot-${props.index}`} />;
                             }}
                             activeDot={(props) => {
                                const { cx, cy, payload, value } = props;
                                const isGreen = payload.target === null || (isLowerBetterKpi ? value <= payload.target : value >= payload.target);
                                return <circle cx={cx} cy={cy} r={7} fill={isGreen ? "#10b981" : "#ef4444"} strokeWidth={0} key={`activedot-${props.index}`} />;
                             }}
                           >
                             <LabelList dataKey="actual" position="top" content={(props) => {
                                const { x, y, value, index } = props;
                                const dataPoint = chartData[index];
                                const isGreen = dataPoint && (dataPoint.target === null || (isLowerBetterKpi ? value <= dataPoint.target : value >= dataPoint.target));
                                return (
                                  <text x={x} y={y - 14} fill={isGreen ? "#10b981" : "#ef4444"} fontSize={14} fontWeight="bold" textAnchor="middle">
                                    {value !== null && value !== undefined ? `%${value}` : ''}
                                  </text>
                                );
                             }} />
                           </Line>
                         </LineChart>
                       );
                     } else if (isBarChart) {
                       return (
                         <BarChart data={chartData} margin={{ top: 35, right: 10, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
                            <YAxis 
                              stroke="#94a3b8" 
                              tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} 
                              axisLine={false} 
                              tickLine={false} 
                              tickFormatter={(value) => {
                                if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                                return value;
                              }}
                            />
                            <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px' }} />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            
                            <Bar name="Hedef" dataKey="target" fill="#cbd5e1" radius={[4, 4, 0, 0]} maxBarSize={60}>
                              <LabelList dataKey="target" position="top" fill="#64748b" fontSize={14} fontWeight="bold" />
                            </Bar>
                            <Bar name="Gerçekleşen" dataKey="actual" radius={[4, 4, 0, 0]} maxBarSize={60}>
                              {chartData.map((entry, index) => {
                                const isGreen = entry.target === null || (isLowerBetterKpi ? entry.actual <= entry.target : entry.actual >= entry.target);
                                return <Cell key={`cell-${index}`} fill={isGreen ? "#10b981" : "#ef4444"} />;
                              })}
                              <LabelList dataKey="actual" position="top" content={(props) => {
                                const { x, y, value, index } = props;
                                const dataPoint = chartData[index];
                                const isGreen = dataPoint && (dataPoint.target === null || (isLowerBetterKpi ? value <= dataPoint.target : value >= dataPoint.target));
                                return (
                                  <text x={x} y={y - 14} fill={isGreen ? "#10b981" : "#ef4444"} fontSize={14} fontWeight="bold" textAnchor="middle">
                                    {value !== null && value !== undefined ? value : ''}
                                  </text>
                                );
                              }} />
                            </Bar>
                         </BarChart>
                       );
                     } else {
                       return (
                         <ComposedChart data={chartData} margin={{ top: 35, right: 10, left: -10, bottom: 0 }}>
                           <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                           <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
                           
                           <YAxis 
                             yAxisId="left"
                             stroke="#94a3b8" 
                             tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} 
                             axisLine={false} 
                             tickLine={false} 
                             tickFormatter={(value) => {
                               if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                               return value;
                             }}
                           />
                           {!hideRatio && (
                             <YAxis 
                               yAxisId="right"
                               orientation="right"
                               stroke="#3b82f6" 
                               tick={{ fill: '#3b82f6', fontSize: 12, fontWeight: 600 }} 
                               axisLine={false} 
                               tickLine={false}
                               tickFormatter={(value) => `%${value}`}
                             />
                           )}
                           
                           <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px' }} />
                           <Legend wrapperStyle={{ paddingTop: '20px' }} />
                           
                           <Bar yAxisId="left" name="Hedef" dataKey="target" fill="#cbd5e1" radius={[4, 4, 0, 0]} maxBarSize={60}>
                             <LabelList dataKey="target" position="top" fill="#64748b" fontSize={14} fontWeight="bold" />
                           </Bar>
                           <Bar yAxisId="left" name="Gerçekleşen" dataKey="actual" radius={[4, 4, 0, 0]} maxBarSize={60}>
                             {chartData.map((entry, index) => {
                               const isGreen = entry.target === null || (isLowerBetterKpi ? entry.actual <= entry.target : entry.actual >= entry.target);
                               return <Cell key={`cell-${index}`} fill={isGreen ? "#10b981" : "#ef4444"} />;
                             })}
                             <LabelList dataKey="actual" position="top" content={(props) => {
                                const { x, y, value, index } = props;
                                const dataPoint = chartData[index];
                                const isGreen = dataPoint && (dataPoint.target === null || (isLowerBetterKpi ? value <= dataPoint.target : value >= dataPoint.target));
                                return (
                                  <text x={x} y={y - 14} fill={isGreen ? "#10b981" : "#ef4444"} fontSize={14} fontWeight="bold" textAnchor="middle">
                                    {value !== null && value !== undefined ? value : ''}
                                  </text>
                                );
                             }} />
                           </Bar>
                           {!hideRatio && (
                             <Line yAxisId="right" name="Oran (%)" type="monotone" dataKey="ratio" stroke="#3b82f6" strokeWidth={4} dot={{ r: 5, fill: '#ffffff', strokeWidth: 2, stroke: '#3b82f6' }} activeDot={{ r: 7, fill: '#3b82f6', strokeWidth: 0 }}>
                               <LabelList dataKey="ratio" position="top" fill="#3b82f6" fontSize={14} fontWeight="bold" formatter={(value) => `%${value}`} />
                             </Line>
                           )}
                         </ComposedChart>
                       );
                     }
                   })()}
                 </ResponsiveContainer>
               </div>
             </div>
           );
        })}
      </div>
    </div>
  );
}
