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
