import { useState, type CSSProperties } from "react";
import { fetchDeterminations, type Determination, type LineInput } from "./api";

// Hardcoded sample lines to prove the mocked backend call works end to end. Candidates:
// replace this with your own consignment data parsed from the sample export files.
const SAMPLE_LINES: LineInput[] = [
  { item_ref: "1", description: "Plastic frames", origin: "CN", commodity_code: "9003110000" },
  {
    item_ref: "2",
    description: "Sample tall training top (oxblood)",
    origin: "CN",
    commodity_code: "6109902000",
  },
  { item_ref: "3", description: "Sample ceramic mug", origin: "CN", commodity_code: "6912000000" },
];

const cellStyle: CSSProperties = { padding: "0.25rem 0.5rem", borderBottom: "1px solid #eee" };
const headerStyle: CSSProperties = { ...cellStyle, textAlign: "left", borderBottom: "1px solid #ccc" };

export default function App() {
  const [determinations, setDeterminations] = useState<Determination[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRun() {
    setLoading(true);
    setError(null);
    try {
      setDeterminations(await fetchDeterminations(SAMPLE_LINES));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ fontFamily: "inherit", padding: "2rem", maxWidth: 900, margin: "0 auto" }}>
      <h1>Parcel Rate Advisor</h1>
      <p>
        Assessment starter app. This page calls the backend&apos;s mocked <code>determine()</code>{" "}
        stub over a few hardcoded sample lines — wiring up your own parsed consignment data,
        the manual assignment screen, and everything else is Use Case A&apos;s task.
      </p>
      <button onClick={handleRun} disabled={loading}>
        {loading ? "Running..." : "Run mock determinations"}
      </button>
      {error && <p style={{ color: "crimson" }}>Error: {error}</p>}
      {determinations.length > 0 && (
        <table style={{ marginTop: "1.5rem", borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              {[
                "Item ref",
                "Description",
                "Origin",
                "Commodity code",
                "Category",
                "Duty rate",
                "VAT rate",
                "Confidence",
              ].map((heading) => (
                <th key={heading} style={headerStyle}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {determinations.map((determination) => (
              <tr key={determination.item_ref}>
                <td style={cellStyle}>{determination.item_ref}</td>
                <td style={cellStyle}>{determination.description}</td>
                <td style={cellStyle}>{determination.origin}</td>
                <td style={cellStyle}>{determination.commodity_code}</td>
                <td style={cellStyle}>{determination.category}</td>
                <td style={cellStyle}>{(determination.duty_rate * 100).toFixed(1)}%</td>
                <td style={cellStyle}>{(determination.vat_rate * 100).toFixed(1)}%</td>
                <td style={cellStyle}>{determination.confidence.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
