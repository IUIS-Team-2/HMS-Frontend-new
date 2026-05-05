import { useMemo, useState } from "react";
import { apiService } from "../../services/apiService";

const cardStyle = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  boxShadow: "0 16px 40px rgba(15,23,42,.06)",
};

function formatExpiry(value) {
  if (!value) return "--";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return String(value);
  return dt.toLocaleDateString("en-IN");
}

export default function UpdateRecordsPanel({ roleLabel = "Admin" }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const sampleRows = useMemo(() => result?.sample || [], [result]);

  const handleUpload = async () => {
    if (!file || uploading) return;
    setUploading(true);
    setError("");
    try {
      const response = await apiService.importMedicineMasterExcel(file);
      setResult(response);
    } catch (err) {
      const nextError =
        err?.response?.data?.file?.[0] ||
        err?.response?.data?.file ||
        err?.response?.data?.detail ||
        "Failed to import the medicine master file.";
      setError(String(nextError));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div style={{ ...cardStyle, padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".12em", fontWeight: 800, color: "#64748b", marginBottom: 8 }}>
              Update Records
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>
              Central Record Updates
            </div>
            <div style={{ fontSize: 14, color: "#64748b", maxWidth: 720, lineHeight: 1.6 }}>
              {roleLabel} can upload medicine stock sheets to replace the live medicine master. Billing and backend task screens will then use the updated rate, batch number, expiry, and available quantity from this record set.
            </div>
          </div>
          <div style={{ minWidth: 220, alignSelf: "start", padding: "14px 16px", borderRadius: 14, background: "#eff6ff", border: "1px solid #bfdbfe" }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "#1d4ed8", marginBottom: 6 }}>
              Active Import
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#1e3a8a", marginBottom: 4 }}>
              Medicine Master
            </div>
            <div style={{ fontSize: 12, color: "#475569" }}>
              Accepts `.xlsx` / `.xls` with columns like `Description`, `Batch No.`, `Exp.`, `Rate`, `Qty.`
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: 18 }}>
          <div style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 18, background: "#f8fafc" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>
              Upload Medicine Excel
            </div>
            <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, marginBottom: 14 }}>
              The uploaded file fully refreshes the medicine master so the latest quantity, rate, batch number, and expiry data stay in sync for prescribing and billing.
            </div>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(event) => {
                setFile(event.target.files?.[0] || null);
                setError("");
              }}
              style={{ width: "100%", marginBottom: 14 }}
            />
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                style={{
                  border: "none",
                  borderRadius: 10,
                  padding: "11px 18px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: !file || uploading ? "not-allowed" : "pointer",
                  background: !file || uploading ? "#cbd5e1" : "linear-gradient(135deg,#2563eb,#1d4ed8)",
                  color: "#fff",
                }}
              >
                {uploading ? "Uploading..." : "Upload Medicine Sheet"}
              </button>
              {file && <span style={{ fontSize: 12, color: "#334155" }}>{file.name}</span>}
            </div>
            {error && (
              <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: 12, fontWeight: 600 }}>
                {error}
              </div>
            )}
            {result && (
              <div style={{ marginTop: 12, padding: "12px 14px", borderRadius: 10, background: "#f0fdf4", border: "1px solid #86efac", color: "#166534" }}>
                <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>{result.message || "Medicine master updated."}</div>
                <div style={{ fontSize: 12 }}>
                  Imported <strong>{result.imported || 0}</strong> medicine rows.
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ border: "1px solid #bfdbfe", borderRadius: 14, padding: 16, background: "#eff6ff" }}>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "#1d4ed8", marginBottom: 6 }}>
                Enabled Now
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>Medicine Updates</div>
              <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
                Upload medicine sheets and use the imported pricing and stock metadata in billing.
              </div>
            </div>
            <div style={{ border: "1px dashed #cbd5e1", borderRadius: 14, padding: 16, background: "#f8fafc" }}>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 6 }}>
                Planned Next
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#334155", marginBottom: 6 }}>Lab Report Formats</div>
              <div style={{ fontSize: 13, color: "#64748b" }}>
                Placeholder only. Excel and document-based report format imports stay disabled in this pass.
              </div>
            </div>
            <div style={{ border: "1px dashed #cbd5e1", borderRadius: 14, padding: 16, background: "#f8fafc" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#334155", marginBottom: 6 }}>Other Record Formats</div>
              <div style={{ fontSize: 13, color: "#64748b" }}>
                Placeholder only. Additional backend format imports can be added later, but no upload action is enabled now.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ ...cardStyle, padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>Imported Sample Preview</div>
            <div style={{ fontSize: 13, color: "#64748b" }}>
              Shows the first few rows returned by the backend after import.
            </div>
          </div>
          {result && (
            <div style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8", background: "#eff6ff", border: "1px solid #bfdbfe", padding: "6px 10px", borderRadius: 999 }}>
              {result.imported || 0} rows imported
            </div>
          )}
        </div>
        {sampleRows.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Medicine", "Batch", "Expiry", "Rate", "Qty"].map((head) => (
                    <th key={head} style={{ textAlign: "left", padding: "12px 10px", borderBottom: "1px solid #e2e8f0", color: "#64748b", textTransform: "uppercase", letterSpacing: ".08em", fontSize: 11 }}>
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sampleRows.map((row, index) => (
                  <tr key={`${row.name}-${index}`}>
                    <td style={{ padding: "12px 10px", borderBottom: "1px solid #f1f5f9", color: "#0f172a", fontWeight: 600 }}>{row.name || "--"}</td>
                    <td style={{ padding: "12px 10px", borderBottom: "1px solid #f1f5f9", color: "#334155" }}>{row.batch_no || "--"}</td>
                    <td style={{ padding: "12px 10px", borderBottom: "1px solid #f1f5f9", color: "#334155" }}>{formatExpiry(row.expiry_date)}</td>
                    <td style={{ padding: "12px 10px", borderBottom: "1px solid #f1f5f9", color: "#334155" }}>Rs.{Number(row.rate || 0).toFixed(2)}</td>
                    <td style={{ padding: "12px 10px", borderBottom: "1px solid #f1f5f9", color: "#334155" }}>{row.quantity ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: "24px 10px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
            Upload a medicine Excel file to preview the imported master rows here.
          </div>
        )}
      </div>
    </div>
  );
}
