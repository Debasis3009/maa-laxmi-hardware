import { requireAdmin } from '@/lib/session';
import CsvImportDropzone from '@/components/admin/CsvImportDropzone';

export default function AdminImportPage() {
  requireAdmin();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-semibold">Bulk import</h1>
        <p className="text-sm text-steel-grey">
          Upload a CSV of new products. Every row is validated against your live categories and units before
          anything is written — bad rows are shown with the reason and never touch the database.
        </p>
      </div>
      <CsvImportDropzone />
    </div>
  );
}
