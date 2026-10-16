import { useEffect, useState } from 'react';
import api from '../services/api';

export default function ReportPdfPreview({ reportId, onClose }) {
  const [document, setDocument] = useState(null);
  useEffect(() => {
    let active = true;
    let objectUrl;
    api.get(`/api/documents/reports/${reportId}/pdf`, { responseType: 'blob' }).then(response => {
      if (!active) return;
      objectUrl = URL.createObjectURL(response.data);
      const filename = response.headers['content-disposition']?.match(/filename="([^"]+)"/)?.[1] || 'report.pdf';
      setDocument({ reportId, url: objectUrl, filename });
    }).catch(() => { if (active) setDocument({ reportId, error: 'Unable to open this report. Check that it is submitted and you have access.' }); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [reportId]);
  const current = document?.reportId === reportId ? document : null;
  return <div role="dialog" aria-modal="true" aria-label="Report PDF preview" className="fixed inset-0 z-[110] flex flex-col bg-slate-950/90 p-3 sm:p-5">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white px-4 py-3">
      <div><p className="font-bold text-emerald-950">Report PDF</p><p className="text-xs text-slate-600">Use the PDF toolbar to print. The preview and download use the same format.</p></div>
      <div className="flex gap-3">{current?.url && <a href={current.url} download={current.filename} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white">Download PDF</a>}<button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold">Close</button></div>
    </div>
    {current?.url ? <iframe title="Diagnostic report PDF" src={current.url} className="min-h-0 w-full flex-1 rounded-lg border-0 bg-white" /> : <div role="status" className="rounded-xl bg-white p-6 text-slate-800">{current?.error || 'Loading report PDF...'}</div>}
  </div>;
}
