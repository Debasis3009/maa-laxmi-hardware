import { requireAdmin } from '@/lib/session';
import CsvImportDropzone from '@/components/admin/CsvImportDropzone';

export default async function AdminImportPage() {
  await requireAdmin();
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#07527f]">Data tools</p><h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Bulk import</h1><p className="mt-1 max-w-2xl text-sm text-slate-500">Upload a CSV of new products. Rows are validated against live categories and units before anything is written.</p></section>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><CsvImportDropzone /></div>
    </div>
  );
}
