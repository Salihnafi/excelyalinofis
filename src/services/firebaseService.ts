import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';

import { db } from '../lib/firebase';

export const saveKpiDataToFirestore = async (parsedData: Record<string, any>) => {
  try {
    const kpiReportsRef = collection(db, 'kpi_reports');
    
    // We will save each month's data as a document where document ID is the month (e.g. "2026-01")
    const promises = Object.entries(parsedData).map(async ([monthKey, kpis]) => {
      const monthDocRef = doc(kpiReportsRef, monthKey);
      
      await setDoc(monthDocRef, {
        updatedAt: new Date().toISOString(),
        kpis: kpis
      }, { merge: true }); // Use merge to avoid overwriting existing fields not present in this upload
    });

    await Promise.all(promises);
    return true;
  } catch (error) {
    console.error('Error saving KPI data to Firestore:', error);
    throw error;
  }
};

export const clearKpiDataFromFirestore = async () => {
  try {
    const kpiReportsRef = collection(db, 'kpi_reports');
    const snapshot = await getDocs(kpiReportsRef);
    
    const promises = snapshot.docs.map(docSnapshot => deleteDoc(doc(db, 'kpi_reports', docSnapshot.id)));
    await Promise.all(promises);
    
    return true;
  } catch (error) {
    console.error('Error clearing KPI data from Firestore:', error);
    throw error;
  }
};
