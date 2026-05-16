"use client";

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { parseKpiExcel } from '../utils/excelParser';
import { saveKpiDataLocally, clearKpiDataLocally } from '../services/localDataService';

export default function ExcelDropzone() {
  const [status, setStatus] = useState<'idle' | 'parsing' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  const handleClearData = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Dashboard üzerindeki tüm eski excel verileri kalıcı olarak silinecek. Onaylıyor musunuz?')) {
      return;
    }
    
    try {
      setIsClearing(true);
      await clearKpiDataLocally();
      localStorage.removeItem('local_department');
      alert('Tüm eski veriler başarıyla silindi. Yeni excel yükleyebilirsiniz.');
      setStatus('idle');
    } catch (err) {
      console.error('Silme hatası:', err);
      alert('Veriler silinirken bir hata oluştu.');
      setIsClearing(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    try {
      setStatus('parsing');
      setErrorMessage(null);

      const parsedResult = await parseKpiExcel(file);
      
      setStatus('uploading');

      await saveKpiDataLocally(parsedResult.data);
      localStorage.setItem('local_department', parsedResult.department);
      
      // Notify components about the new data
      window.dispatchEvent(new Event('kpiDataUpdated'));

      setStatus('success');
    } catch (err: any) {
      console.error("Yükleme sırasında hata:", err);
      setStatus('error');
      setErrorMessage(err.message || 'Dosya işlenirken bilinmeyen bir hata oluştu.');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    multiple: false,
    noClick: status === 'success' || status === 'error', // Prevent double trigger if we manually call open
    disabled: status === 'parsing' || status === 'uploading'
  });

  return (
    <div className="w-full max-w-3xl mx-auto p-6 md:p-10 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-red-100 relative overflow-hidden">
      {/* Dekoratif üst kırmızı çizgi */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 to-red-400"></div>

      <div className="mb-8 text-center pt-2">
        <h2 className="text-3xl font-extrabold text-red-600 mb-3 tracking-tight">
          KPI Verisi Yükleme
        </h2>
        <p className="text-slate-500 text-sm md:text-base font-medium">
          Düzce Döşeme Üretim KPI Excel dosyasını (.xlsx) sürükleyip bırakın veya seçin.
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`relative group cursor-pointer flex flex-col items-center justify-center w-full min-h-[300px] rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden bg-slate-50 ${
          isDragActive 
            ? 'border-red-500 bg-red-50/50' 
            : 'border-slate-300 hover:border-red-400 hover:bg-red-50/20'
        } ${(status === 'parsing' || status === 'uploading') ? 'opacity-80 pointer-events-none' : ''}`}
      >
        <input {...getInputProps()} />
        
        {/* Glow effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {status === 'idle' && (
          <div className="flex flex-col items-center text-center p-8 z-10 space-y-5 animate-in fade-in zoom-in duration-300">
            <div className="p-5 rounded-full bg-white shadow-sm border border-red-100 group-hover:scale-110 group-hover:shadow-red-500/10 transition-all duration-300">
              <UploadCloud className="w-12 h-12 text-red-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800 mb-2">
                Dosyayı buraya sürükleyin
              </p>
              <p className="text-sm text-slate-500 font-medium">
                veya bilgisayarınızdan seçmek için tıklayın
              </p>
            </div>
          </div>
        )}

        {status === 'parsing' && (
          <div className="flex flex-col items-center text-red-500 space-y-4 z-10 animate-in fade-in zoom-in duration-300">
            <Loader2 className="w-14 h-14 animate-spin" />
            <p className="text-xl font-bold tracking-wide">Excel Ayrıştırılıyor...</p>
            <p className="text-sm text-red-500/70 font-medium">Satırlar ve hücreler temizleniyor</p>
          </div>
        )}

        {status === 'uploading' && (
          <div className="flex flex-col items-center text-red-600 space-y-4 z-10 animate-in fade-in zoom-in duration-300">
            <Loader2 className="w-14 h-14 animate-spin" />
            <p className="text-xl font-bold tracking-wide">Kaydediliyor...</p>
            <p className="text-sm text-red-600/70 font-medium">Veriler tarayıcıya işleniyor</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center text-emerald-600 space-y-4 z-10 p-8 text-center animate-in fade-in zoom-in duration-300">
            <div className="p-4 rounded-full bg-emerald-50 mb-2">
              <CheckCircle className="w-16 h-16" />
            </div>
            <p className="text-2xl font-bold">Başarılı!</p>
            <p className="text-sm text-emerald-600/80 mb-4 font-medium">Veriler başarıyla tarayıcıya aktarıldı.</p>
            <button 
              type="button"
              onClick={(e) => { 
                e.stopPropagation(); 
                setStatus('idle'); 
                setTimeout(() => open(), 100); 
              }}
              className="mt-2 px-6 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold rounded-xl transition-all duration-200 shadow-sm active:scale-95"
            >
              Yeni Dosya Yükle
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center text-red-600 space-y-4 z-10 p-8 text-center animate-in fade-in zoom-in duration-300">
            <div className="p-4 rounded-full bg-red-50 mb-2">
              <AlertCircle className="w-16 h-16" />
            </div>
            <p className="text-xl font-bold">Yükleme Başarısız</p>
            <p className="text-sm text-red-500/80 max-w-md font-medium">{errorMessage}</p>
            <button 
              type="button"
              onClick={(e) => { 
                e.stopPropagation(); 
                setStatus('idle'); 
                setTimeout(() => open(), 100);
              }}
              className="mt-4 px-6 py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold rounded-xl transition-all duration-200 shadow-sm active:scale-95"
            >
              Tekrar Dene
            </button>
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-col md:flex-row items-center justify-between p-5 bg-slate-50 rounded-xl border border-slate-200 gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
            <FileSpreadsheet className="w-6 h-6 text-red-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-700">Tam Uyumlu Veri Modeli</span>
            <span className="text-xs text-slate-500 font-medium">Hedef, Gerçekleşen, Oran % formatı</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleClearData}
            disabled={isClearing || status === 'uploading' || status === 'parsing'}
            className="flex items-center space-x-2 text-sm font-bold px-5 py-2.5 bg-white hover:bg-red-50 text-red-600 border-2 border-red-200 hover:border-red-400 rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isClearing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
            <span>Eski Verileri Sil</span>
          </button>
        </div>
      </div>
    </div>
  );
}
