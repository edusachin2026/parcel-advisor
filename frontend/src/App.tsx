import { useMemo, useRef, useState } from "react";
import { exportResponse, parseExport, type ReviewLine, type ShipmentReview } from "./api";

const threshold = 0.7;

function percent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export default function App() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [shipments, setShipments] = useState<ShipmentReview[]>([]);
  const [selectedReference, setSelectedReference] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const selected = shipments.find((shipment) => shipment.consignment_reference === selectedReference);
  const allLines = useMemo(() => shipments.flatMap((shipment) => shipment.lines), [shipments]);
  const pendingCount = allLines.filter((line) => line.status === "pending_review").length;

  async function handleFile(file?: File) {
    if (!file) return;
    setBusy(true);
    setMessage(null);
    try {
      const result = await parseExport(file);
      setShipments(result.shipments);
      setWarnings(result.warnings);
      setSelectedReference(result.shipments[0]?.consignment_reference ?? "");
      setMessage(`${result.shipments.reduce((count, shipment) => count + shipment.lines.length, 0)} lines loaded`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to parse file");
    } finally {
      setBusy(false);
    }
  }

  function updateLine(lineId: string, field: "category" | "duty_rate" | "vat_rate", value: string) {
    setShipments((current) => current.map((shipment) => ({
      ...shipment,
      lines: shipment.lines.map((line) => {
        if (line.line_id !== lineId || shipment.consignment_reference !== selectedReference) return line;
        const next = field === "category" ? value : Number(value) / 100;
        return { ...line, [field]: next, status: "auto_resolved" as const };
      }),
    })));
  }

  async function downloadExport() {
    setBusy(true);
    setMessage(null);
    try {
      const blob = await exportResponse(allLines);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "parcel-advisor-response.csv";
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage("Response export downloaded");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to export response");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">OPERATIONS / IMPORT REVIEW</p>
          <h1>Parcel Rate Advisor</h1>
          <p className="subtitle">Review mock determinations before returning the depot response.</p>
        </div>
        <div className="top-actions">
          <input ref={inputRef} type="file" hidden onChange={(event) => handleFile(event.target.files?.[0])} />
          <button className="button secondary" onClick={() => inputRef.current?.click()} disabled={busy}>Upload export</button>
          <button className="button primary" onClick={downloadExport} disabled={busy || allLines.length === 0}>Download CSV</button>
        </div>
      </header>

      <section className="status-grid" aria-label="Review summary">
        <div className="stat"><span>Shipments</span><strong>{shipments.length}</strong></div>
        <div className="stat"><span>Lines loaded</span><strong>{allLines.length}</strong></div>
        <div className={`stat ${pendingCount ? "attention" : "ready"}`}><span>Pending review</span><strong>{pendingCount}</strong></div>
        <div className="stat"><span>Threshold</span><strong>{percent(threshold)}</strong></div>
      </section>

      {message && <div className="notice">{message}</div>}
      {warnings.length > 0 && <div className="warning"><strong>Parser warnings</strong>{warnings.map((warning) => <div key={warning}>{warning}</div>)}</div>}

      <section className="workspace">
        <aside className="shipments">
          <div className="section-heading"><span>Consignments</span><span>{shipments.length}</span></div>
          {shipments.length === 0 && <p className="empty">Upload a GEODATA export to begin.</p>}
          {shipments.map((shipment) => {
            const pending = shipment.lines.filter((line) => line.status === "pending_review").length;
            return <button key={shipment.consignment_reference} className={`shipment ${selectedReference === shipment.consignment_reference ? "selected" : ""}`} onClick={() => setSelectedReference(shipment.consignment_reference)}>
              <span><b>{shipment.consignment_reference}</b><small>{shipment.lines.length} line{shipment.lines.length === 1 ? "" : "s"}</small></span>
              {pending > 0 ? <em>{pending} pending</em> : <em className="complete">Ready</em>}
            </button>;
          })}
        </aside>

        <div className="review-panel">
          {!selected && <div className="empty-state"><span className="empty-mark">01</span><h2>Ready for a consignment</h2><p>Upload one of the supplied GEODATA samples. Each shipment is separated automatically and every invoice line is sent through the determination stub.</p></div>}
          {selected && <>
            <div className="panel-heading"><div><p className="eyebrow">ACTIVE CONSIGNMENT</p><h2>{selected.consignment_reference}</h2></div><span className="pill">{selected.lines.length} lines</span></div>
            <div className="table-wrap"><table><thead><tr><th>Line</th><th>Description</th><th>Origin</th><th>Commodity</th><th>Category</th><th>Duty %</th><th>VAT %</th><th>Confidence</th><th>Status</th></tr></thead><tbody>
              {selected.lines.map((line: ReviewLine) => <tr key={line.line_id} className={line.status === "pending_review" ? "needs-review" : ""}>
                <td className="line-number">{line.line_id}</td><td><strong>{line.description}</strong></td><td>{line.origin || "-"}</td><td className="mono">{line.commodity_code || "-"}</td>
                <td><input aria-label={`Category for line ${line.line_id}`} placeholder={line.status === "pending_review" ? "Pending" : undefined} value={line.status === "pending_review" ? "" : line.category} onChange={(event) => updateLine(line.line_id, "category", event.target.value)} /></td>
                <td><input aria-label={`Duty rate for line ${line.line_id}`} type="number" step="0.1" placeholder={line.status === "pending_review" ? "Pending" : undefined} value={line.status === "pending_review" ? "" : (line.duty_rate * 100).toFixed(1)} onChange={(event) => updateLine(line.line_id, "duty_rate", event.target.value)} /></td>
                <td><input aria-label={`VAT rate for line ${line.line_id}`} type="number" step="0.1" placeholder={line.status === "pending_review" ? "Pending" : undefined} value={line.status === "pending_review" ? "" : (line.vat_rate * 100).toFixed(1)} onChange={(event) => updateLine(line.line_id, "vat_rate", event.target.value)} /></td>
                <td><span className={`confidence ${line.confidence < threshold ? "low" : ""}`}>{percent(line.confidence)}</span></td>
                <td><span className={`status ${line.status}`}>{line.status === "pending_review" ? "Review" : "Resolved"}</span></td>
              </tr>)}
            </tbody></table></div>
          </>}
        </div>
      </section>
    </main>
  );
}
