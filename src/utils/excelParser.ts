import * as xlsx from 'xlsx';

export interface KpiData {
  kpiName: string;
  unit: string;
  [month: string]: any; // will contain YYYY-MM keys dynamically
}

export interface ParsedKpiResult {
  [month: string]: {
    [kpiName: string]: {
      target: number | null;
      actual: number | null;
      ratio: number | null;
      unit: string;
    };
  };
}

export interface ExcelParseResult {
  department: string;
  data: ParsedKpiResult;
}

const cleanData = (value: any): number | null => {
  // Eğer hücre boşsa null dön
  if (value === null || value === undefined || value === '') return null;
  
  // Eğer hücre metin formatındaysa
  if (typeof value === 'string') {
    const trimmed = value.trim();
    // Eksi işareti veya Excel formül hataları varsa null dön
    if (trimmed === '-' || trimmed.includes('#SAYI/0!') || trimmed.includes('#DIV/0!') || trimmed.includes('#DEĞER!')) {
      return null;
    }
    
    // Yüzde işareti varsa temizle
    let strNum = trimmed.replace('%', '').trim();
    
    // Virgüllü sayıları (ör: 1,84) noktalı formata (1.84) çevir
    strNum = strNum.replace(',', '.');
    const parsed = parseFloat(strNum);
    return isNaN(parsed) ? null : parsed;
  }
  
  // Eğer hücre doğrudan sayı formatındaysa (ör: Excel içindeki oran olan 0.85 vb.)
  if (typeof value === 'number') return value;
  
  return null;
};

export const parseKpiExcel = async (file: File): Promise<ExcelParseResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = xlsx.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // defval: null kullanarak boş hücrelerin atlanmasını önlüyor, null olarak gelmesini sağlıyoruz.
        const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: null }) as any[][];

        if (rows.length < 2) {
          throw new Error('Excel dosyası boş veya beklenen formatta değil.');
        }

        // Başlık satırını bul ("İzlenen KPI" sütun B'de, yani index 1'de olmalı)
        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(20, rows.length); i++) {
          const row = rows[i];
          if (!row) continue;
          
          const valB = row[1];
          if (valB !== null && valB !== undefined) {
            const strB = String(valB).toLowerCase();
            // Excel'de yanlışlıkla "izlenen kpl" yazılmış olabilir
            if (strB.includes('izlenen kpi') || strB.includes('izlenen kpl') || strB.includes('kpi')) {
               headerRowIndex = i;
               break;
            }
          }
        }

        // Bulamazsak -1'de bırakıyoruz ki, r = headerRowIndex + 1 formülüyle 0. satırdan okumaya başlasın
        // (Eskiden 0 atanıyordu, bu da 0. satırdaki ilk verinin atlanmasına neden olabilirdi)

        const monthColumns: { index: number; monthKey: string }[] = [];

        // Görsele göre aylar J (index 9) sütunundan U (index 20) sütununa kadar uzanıyor
        // Dinamik başlık taramasında tarih formatı bozulabileceği için 
        // dosyanızdaki standart 12 ayı (Ocak - Aralık) indekslerine göre sabitliyoruz.
        const monthStrs = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
        for (let i = 0; i < 12; i++) {
           monthColumns.push({
               index: 9 + i, // 9 = J Sütunu (Ocak)
               monthKey: `2026-${monthStrs[i]}`
           });
        }

        const parsedData: ParsedKpiResult = {};
        
        // Ay anahtarlarını önceden oluşturuyoruz
        monthColumns.forEach(col => {
          parsedData[col.monthKey] = {};
        });

        let currentKpiName: string | null = null;
        let currentUnit: string = '';
        let departmentName: string = 'Bilinmeyen Departman';

        // Başlık satırından sonra verileri okumaya başlıyoruz
        for (let r = headerRowIndex + 1; r < rows.length; r++) {
          const row = rows[r];
          if (!row || row.length === 0) continue;

          const colA = row[0]; // Departman
          const colB = row[1]; // İzlenen KPI
          const colC = row[2]; // Birim
          const colDataType = row[8]; // I Sütunu (Hedef / Gerçekleşen / Oran %)

          // Departman ismini kaydet (merged hücreler olabileceği için boş değilse güncelle)
          if (colA !== null && colA !== undefined) {
            const strA = String(colA).trim();
            // Başlık kelimelerini atla
            if (strA !== '' && !strA.toLowerCase().includes('departman') && !strA.toLowerCase().includes('bölüm')) {
              departmentName = strA;
            }
          }

          // Excel'de "İzlenen KPI" sütunları alt satırlarda merged (birleşik) olduğu için boş gelebilir.
          // Bu durumda bir önceki değeri tutmaya devam etmeliyiz.
          if (colB !== null && colB !== undefined) {
            const strB = String(colB).trim();
            // Başlık satırının kendisini KPI ismi yapmamak için kontrol
            if (strB !== '' && !strB.toLowerCase().includes('izlenen kpi') && !strB.toLowerCase().includes('izlenen kpl')) {
              currentKpiName = strB;
            }
          }

          if (colC !== null && colC !== undefined && String(colC).trim() !== '') {
             currentUnit = String(colC).trim();
          }

          // Eğer hala bir KPI ismimiz yoksa veya Hedef/Gerçekleşen/Oran kolonu boşsa o satırı atla
          if (!currentKpiName || !colDataType) continue;

          const dataType = String(colDataType).trim().toLowerCase();
          
          let dataKey: 'target' | 'actual' | 'ratio' | null = null;
          if (dataType.includes('hedef')) dataKey = 'target';
          else if (dataType.includes('gerçekleşen')) dataKey = 'actual';
          else if (dataType.includes('oran') || dataType.includes('%')) dataKey = 'ratio';

          if (dataKey) {
            // İlgili satırın tüm aylarını dön ve kaydet
            monthColumns.forEach((col) => {
              const cellValue = cleanData(row[col.index]);
              const monthData = parsedData[col.monthKey];

              if (!monthData[currentKpiName!]) {
                monthData[currentKpiName!] = {
                  target: null,
                  actual: null,
                  ratio: null,
                  unit: currentUnit
                };
              }

              monthData[currentKpiName!][dataKey!] = cellValue;
            });
          }
        }

        // Boş bir obje dönmediğinden emin olmak için ek kontrol
        const hasAnyData = Object.values(parsedData).some(month => Object.keys(month).length > 0);
        if (!hasAnyData) {
          throw new Error('Dosya okundu fakat içindeki KPI verileri veya Hedef/Gerçekleşen satırları tespit edilemedi.');
        }

        resolve({ department: departmentName, data: parsedData });
      } catch (error) {
        console.error('Parser Hatası Detayı:', error);
        reject(error);
      }
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsArrayBuffer(file);
  });
};
