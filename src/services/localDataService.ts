export const saveKpiDataLocally = async (parsedData: Record<string, any>) => {
  try {
    // Mevcut verileri al
    const existingStr = localStorage.getItem('local_kpi_data');
    let existingData = existingStr ? JSON.parse(existingStr) : {};

    // Yeni verilerle birleştir
    const newData = { ...existingData, ...parsedData };

    localStorage.setItem('local_kpi_data', JSON.stringify(newData));
    
    // Uygulama içinde güncellemeyi haber ver
    window.dispatchEvent(new Event('kpiDataUpdated'));
    
    return true;
  } catch (error) {
    console.error('Veriler kaydedilirken hata oluştu:', error);
    throw error;
  }
};

export const clearKpiDataLocally = async () => {
  try {
    localStorage.removeItem('local_kpi_data');
    window.dispatchEvent(new Event('kpiDataUpdated'));
    return true;
  } catch (error) {
    console.error('Veriler silinirken hata oluştu:', error);
    throw error;
  }
};
