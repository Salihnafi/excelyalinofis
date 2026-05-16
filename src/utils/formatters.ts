export const formatKpiValue = (value: number | null | undefined, unit: string | undefined): string => {
  if (value === null || value === undefined) return '-';

  const lowerUnit = (unit || '').toLowerCase().trim();

  if (lowerUnit === 'yüzde' || lowerUnit === '%') {
    // Check if value is already a percentage like 0.85 or 85
    // Assuming the Excel already gives it as percentage (e.g., 85 for 85%)
    return `%${value.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}`;
  }

  if (lowerUnit === 'tl' || lowerUnit === '₺') {
    return `₺${value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  if (lowerUnit === 'adet') {
    return `${value.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} Adet`;
  }

  if (lowerUnit === 'gün') {
    return `${value.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} Gün`;
  }

  return `${value.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} ${unit || ''}`.trim();
};
