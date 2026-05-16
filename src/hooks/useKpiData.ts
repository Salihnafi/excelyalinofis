import { useState, useEffect } from 'react';

export interface KpiEntry {
  target: number | null;
  actual: number | null;
  ratio: number | null;
  unit: string;
}

export interface MonthData {
  monthKey: string; // e.g. '2026-01'
  kpis: Record<string, KpiEntry>;
}

export const useKpiData = () => {
  const [data, setData] = useState<MonthData[]>([]);
  const [department, setDepartment] = useState<string>('Departman Yükleniyor...');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadLocalData = () => {
    try {
      setLoading(true);
      const localString = localStorage.getItem('local_kpi_data');
      if (localString) {
        const parsed = JSON.parse(localString);
        // Map'i diziye çevir
        const fetchedData: MonthData[] = Object.entries(parsed).map(([monthKey, kpis]) => ({
          monthKey,
          kpis: kpis as any
        }));
        
        // YYYY-MM formatına göre sırala
        fetchedData.sort((a, b) => a.monthKey.localeCompare(b.monthKey));
        setData(fetchedData);
        
        const localDepartment = localStorage.getItem('local_department');
        if (localDepartment) {
          setDepartment(localDepartment);
        } else {
          setDepartment('Bilinmeyen Departman');
        }
      } else {
        setData([]);
        setDepartment('Bilinmeyen Departman');
      }
    } catch (err: any) {
      console.error("Local veriler okunurken hata:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocalData();

    // Veri eklendiğinde veya silindiğinde arayüzün anında güncellenmesi için event listener
    const handleStorageChange = () => {
      loadLocalData();
    };

    window.addEventListener('kpiDataUpdated', handleStorageChange);
    return () => window.removeEventListener('kpiDataUpdated', handleStorageChange);
  }, []);

  return { data, department, loading, error };
};
