'use client';

import { useCallback, useRef, useState } from 'react';
import { validateImportCsv, applyImportCsv } from '@/app/admin/import/actions';

interface InvalidRow { line: number; row: Record<string, string>; errors: string[] }
interface ValidationResult { totalRows: number; valid: unknown[]; invalid: InvalidRow[]; duplicates: unknown[] }

const TEMPLATE_HEADER = 'name,sku,category,unit,purchase_price,mrp,selling_price,gst,stock,min_stock';

export default function CsvImportDropzone() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [csvText, setCsvText] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState<{ createdCount: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setApplied(null);
    setValidation(null);
    setFileName(file.name);
    const text = await file.text();
    setCsvText(text);
    setBusy(true);
    try {
      const result = await validateImportCsv(text);
      setValidation(result as ValidationResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not validate file.');
    } finally {
      setBusy(false);
    }
  }, []);

  async function handleApply() {
    if (!csvText || !fileName) return;
    setBusy(true);
    setError(null);
    try {
      const result = await applyImportCsv(csvText, fileName);
      setApplied({ createdCount: result.createdCount });
      setValidation(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed.');
    } finally {
      setBusy(false);
    }
  }

  function downloadErrorReport() {
    if (!validation) return;
    const lines = [
      'line,errors',
      ...validation.invalid.map((r) => `${r.line},"${r.errors.join('; ')}"`),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'import-errors.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="border-[1.5px] border-line bg-white p-4">
        <p className="text-sm text-steel-grey">
          Required columns: <span className="font-data">{TEMPLATE_HEADER}</span>
        </p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        className={`flex flex-col items-center justify-center border-[1.5px] border-dashed p-10 text-center ${
          dragOver ? 'border-rust bg-rust/5' : 'border-line bg-white'
        }`}
      >
        <p className="text-sm text-charcoal/80">Drag and drop a .csv file here, or</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-2 rounded-sm border-[1.5px] border-charcoal px-4 py-2 text-sm font-medium hover:bg-charcoal hover:text-paper"
        >
          Choose file
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {fileName && <p className="mt-3 font-data text-sm text-steel-grey">{fileName}</p>}
      </div>

      {error && <p className="text-sm text-brick">{error}</p>}
      {applied && (
        <p className="border-[1.5px] border-steel-green/40 bg-steel-green/5 px-3 py-2 text-sm text-steel-green">
          Import complete — {applied.createdCount} products created.
        </p>
      )}

      {validation && (
        <div className="border-[1.5px] border-line bg-white p-4">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span><strong>{validation.totalRows}</strong> rows read</span>
            <span className="text-steel-green"><strong>{validation.valid.length}</strong> valid</span>
            <span className="text-brick"><strong>{validation.invalid.length}</strong> invalid</span>
          </div>

          {validation.invalid.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Rows that will be skipped</p>
                <button type="button" onClick={downloadErrorReport} className="text-sm text-rust hover:underline">
                  Download error report
                </button>
              </div>
              <div className="mt-2 max-h-56 overflow-y-auto border-[1.5px] border-line">
                <table className="w-full text-sm">
                  <thead className="bg-paper text-left text-xs uppercase text-steel-grey">
                    <tr><th className="px-2 py-1.5">Line</th><th className="px-2 py-1.5">Row</th><th className="px-2 py-1.5">Errors</th></tr>
                  </thead>
                  <tbody>
                    {validation.invalid.map((r) => (
                      <tr key={r.line} className="border-t border-line align-top">
                        <td className="px-2 py-1.5 font-data">{r.line}</td>
                        <td className="px-2 py-1.5 font-data text-steel-grey">{r.row.name || r.row.sku}</td>
                        <td className="px-2 py-1.5 text-brick">{r.errors.join('; ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => { setValidation(null); setFileName(null); setCsvText(null); }}
              className="rounded-sm border-[1.5px] border-line px-4 py-2 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={busy || validation.valid.length === 0}
              className="rounded-sm bg-rust px-4 py-2 text-sm font-medium text-paper hover:bg-rust-dark disabled:opacity-50"
            >
              {busy ? 'Importing…' : `Import ${validation.valid.length} valid rows`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
