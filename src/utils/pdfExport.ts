import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const exportDashboardToPDF = async (elementId: string, filename: string = 'Yonetici_Ozeti.pdf') => {
  const container = document.getElementById(elementId);
  if (!container) {
    console.error(`Element with id ${elementId} not found.`);
    return;
  }

  const cards = Array.from(container.querySelectorAll('.kpi-card-export')) as HTMLElement[];
  if (cards.length === 0) {
    console.warn("No KPI cards found for export.");
    return;
  }

  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Sayfa Düzeni: 2 sütun x 4 satır = 8 KPI
    const cols = 2;
    const rows = 4;
    const kpisPerPage = cols * rows;
    
    const marginX = 10;
    const marginY = 10;
    const spacingX = 5;
    const spacingY = 5;
    
    const maxCardWidth = (pageWidth - (2 * marginX) - ((cols - 1) * spacingX)) / cols;
    const maxCardHeight = (pageHeight - (2 * marginY) - ((rows - 1) * spacingY)) / rows;

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      card.classList.add('pdf-export-mode');
      
      const canvas = await html2canvas(card, {
        scale: 2, // Yüksek çözünürlük
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      card.classList.remove('pdf-export-mode');
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      const pageIndex = Math.floor(i / kpisPerPage);
      const indexOnPage = i % kpisPerPage;
      
      if (pageIndex > 0 && indexOnPage === 0) {
         pdf.addPage();
      }
      
      const col = indexOnPage % cols;
      const row = Math.floor(indexOnPage / cols);
      
      const xOffsetGrid = marginX + col * (maxCardWidth + spacingX);
      const yOffsetGrid = marginY + row * (maxCardHeight + spacingY);
      
      const imgRatio = canvas.width / canvas.height;
      let finalWidth = maxCardWidth;
      let finalHeight = maxCardWidth / imgRatio;
      
      if (finalHeight > maxCardHeight) {
         finalHeight = maxCardHeight;
         finalWidth = finalHeight * imgRatio;
      }
      
      const x = xOffsetGrid + (maxCardWidth - finalWidth) / 2;
      const y = yOffsetGrid + (maxCardHeight - finalHeight) / 2;

      pdf.addImage(imgData, 'JPEG', x, y, finalWidth, finalHeight);
    }

    pdf.save(filename);
    return true;
  } catch (error) {
    console.error('PDF export failed:', error);
    throw error;
  }
};

export const exportKpiDataToPDF = async (
  data: any[],
  kpiName: string,
  filename: string = 'Rapor.pdf',
  department: string = ''
) => {
  // Container oluştur
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '800px'; 
  container.style.backgroundColor = '#ffffff';
  container.style.padding = '40px';
  container.style.fontFamily = 'Inter, system-ui, sans-serif';
  container.style.color = '#0f172a';
  container.style.zIndex = '-1';
  
  // Başlık
  const header = document.createElement('div');
  header.style.marginBottom = '30px';
  header.style.borderBottom = '2px solid #e2e8f0';
  header.style.paddingBottom = '20px';
  
  const title = document.createElement('h1');
  title.innerText = `${kpiName} - Performans Raporu`;
  title.style.margin = '0 0 10px 0';
  title.style.fontSize = '26px';
  title.style.fontWeight = '800';
  title.style.color = '#dc2626'; // red-600

  const depStr = document.createElement('h2');
  depStr.innerText = department ? `Departman: ${department}` : '';
  depStr.style.margin = '0 0 10px 0';
  depStr.style.fontSize = '16px';
  depStr.style.fontWeight = '600';
  depStr.style.color = '#334155'; // slate-700
  if (!department) depStr.style.display = 'none';
  
  const dateStr = document.createElement('p');
  dateStr.innerText = `Oluşturulma Tarihi: ${new Date().toLocaleDateString('tr-TR')}`;
  dateStr.style.margin = '0';
  dateStr.style.fontSize = '14px';
  dateStr.style.fontWeight = '500';
  dateStr.style.color = '#64748b'; // slate-500
  
  header.appendChild(title);
  header.appendChild(depStr);
  header.appendChild(dateStr);
  container.appendChild(header);

  // Tablo
  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  table.style.marginTop = '20px';
  
  // Tablo Başlıkları (thead)
  const thead = document.createElement('thead');
  const trHead = document.createElement('tr');
  const headers = ['Ay', 'Hedef', 'Gerçekleşen', 'Oran (%)'];
  
  headers.forEach(h => {
    const th = document.createElement('th');
    th.innerText = h;
    th.style.backgroundColor = '#dc2626'; // red-600
    th.style.color = '#ffffff';
    th.style.padding = '14px 16px';
    th.style.textAlign = 'left';
    th.style.fontSize = '15px';
    th.style.fontWeight = 'bold';
    th.style.border = '1px solid #dc2626';
    trHead.appendChild(th);
  });
  thead.appendChild(trHead);
  table.appendChild(thead);
  
  // Tablo Verileri (tbody)
  const tbody = document.createElement('tbody');
  
  data.forEach((row, index) => {
    const tr = document.createElement('tr');
    tr.style.backgroundColor = index % 2 === 0 ? '#f8fafc' : '#ffffff';
    
    // Değerleri formatla
    const targetStr = row.target !== null ? `${row.target} ${row.unit || ''}` : '-';
    const actualStr = row.actual !== null ? `${row.actual} ${row.unit || ''}` : '-';
    let ratioStr = '-';
    if (row.ratio !== null && row.ratio !== undefined) {
       ratioStr = `%${row.ratio.toFixed(1)}`;
    }
    
    const vals = [row.name || '-', targetStr, actualStr, ratioStr];
    
    vals.forEach((val, colIndex) => {
      const td = document.createElement('td');
      td.innerText = val;
      td.style.padding = '12px 16px';
      td.style.border = '1px solid #e2e8f0'; 
      td.style.fontSize = '14px';
      td.style.color = '#334155'; // slate-700
      
      // Oran sütununu özel renklendir (isteğe bağlı)
      if (colIndex === 3 && row.ratio !== null) {
         td.style.fontWeight = 'bold';
         td.style.color = row.ratio >= 1 ? '#16a34a' : '#ea580c'; // yeşil veya turuncu (kabaca)
      }
      
      tr.appendChild(td);
    });
    
    tbody.appendChild(tr);
  });
  
  table.appendChild(tbody);
  container.appendChild(table);
  
  // Geçici olarak DOM'a ekle
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2, // Yüksek çözünürlük
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    
    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    
    // A4 Dikey (Portrait)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    // Genişliği A4'e sığacak şekilde ölçeklendir
    const ratio = pdfWidth / imgWidth;
    const finalWidth = pdfWidth;
    const finalHeight = imgHeight * ratio;
    
    // Eğer tablo boyutu bir sayfayı aşıyorsa, jspdf sayfa kırma yapamaz (çünkü tek bir görsel). 
    // Ancak genellikle bu tarz aylık veriler 1 sayfaya sığar.
    pdf.addImage(imgData, 'JPEG', 0, 0, finalWidth, finalHeight);
    pdf.save(filename);
    
    return true;
  } catch (error) {
    console.error('Data PDF export failed:', error);
    throw error;
  } finally {
    // İşlem bitince DOM'dan temizle
    document.body.removeChild(container);
  }
};
