import Dashboard from '../components/Dashboard';
import ExcelDropzone from '../components/ExcelDropzone';
import HeaderClock from '../components/HeaderClock';
import Sidebar from '../components/Sidebar';

export default function Home() {
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar />
      <main className="flex-1 ml-72 relative py-16 px-4 sm:px-6 lg:px-8">
        <HeaderClock />
        <div className="max-w-7xl mx-auto space-y-16 mt-4">
          
          {/* Yükleme Modülü */}
          <section>
            <div className="mb-8">
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Veri Güncelleme Merkezi</h2>
              <p className="text-slate-500 mt-2 font-medium">Excel dosyasını yükleyerek Yönetici Dashboard'unu veritabanında güncelleyin.</p>
            </div>
            <ExcelDropzone />
          </section>

          {/* Ayırıcı */}
          <div className="h-px bg-slate-200 w-full" />

          {/* Dashboard */}
          <section>
            <Dashboard />
          </section>

        </div>
      </main>
    </div>
  );
}
