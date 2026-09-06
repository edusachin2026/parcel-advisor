export interface LineInput {
  item_ref: string;
  description: string;
  origin?: string | null;
  commodity_code?: string | null;
}

export interface Determination extends LineInput {
  category: string;
  duty_rate: number;
  vat_rate: number;
  confidence: number;
}

export interface ReviewLine extends Determination {
  consignment_reference: string;
  line_id: string;
  status: "auto_resolved" | "pending_review";
}

export interface ShipmentReview {
  consignment_reference: string;
  lines: ReviewLine[];
}

const API_BASE = (import.meta.env.VITE_API_BASE ?? "http://localhost:8000").replace(/\/$/, "");

export async function fetchDeterminations(lines: LineInput[]): Promise<Determination[]> {
  const response = await fetch(`${API_BASE}/api/determinations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(lines),
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<Determination[]>;
}

export async function parseExport(file: File): Promise<{ shipments: ShipmentReview[]; warnings: string[] }> {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch(`${API_BASE}/api/parse`, { method: "POST", body });
  if (!response.ok) throw new Error(`Parse failed: ${response.status} ${response.statusText}`);
  return response.json() as Promise<{ shipments: ShipmentReview[]; warnings: string[] }>;
}

export async function exportResponse(lines: ReviewLine[]): Promise<Blob> {
  const response = await fetch(`${API_BASE}/api/export`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(lines),
  });
  if (!response.ok) throw new Error(`Export failed: ${response.status} ${response.statusText}`);
  return response.blob();
}
