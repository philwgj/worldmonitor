export interface Quote {
  symbol: string;
  price: number | null;
  change?: number | null;
  volume?: number | null;
  timestamp?: number | null;
}

export interface IVDatum {
  symbol: string;
  iv: number | null;
  tenor?: string;
  timestamp?: number | null;
}

export interface Position {
  account?: string;
  symbol: string;
  side: 'long' | 'short' | 'net';
  quantity: number;
  notional?: number;
  timestamp?: number | null;
}

async function proxyGet(path: string): Promise<any> {
  const resp = await fetch(`/api/dolphindb/${path}`);
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`DolphinDB proxy error ${resp.status}: ${text}`);
  }
  return resp.json();
}

export async function fetchQuotes(symbols?: string[]): Promise<Quote[]> {
  const qs = symbols && symbols.length ? `?symbols=${encodeURIComponent(symbols.join(','))}` : '';
  return proxyGet(`quotes${qs}`);
}

export async function fetchIV(symbols?: string[]): Promise<IVDatum[]> {
  const qs = symbols && symbols.length ? `?symbols=${encodeURIComponent(symbols.join(','))}` : '';
  return proxyGet(`iv${qs}`);
}

export async function fetchPositions(account?: string): Promise<Position[]> {
  const qs = account ? `?account=${encodeURIComponent(account)}` : '';
  return proxyGet(`positions${qs}`);
}

export default {
  fetchQuotes,
  fetchIV,
  fetchPositions,
};
