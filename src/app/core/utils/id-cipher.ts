const MASK = 0x5A3FB7C1;

export function encodeId(id: number): string {
  const v = (id ^ MASK) >>> 0;
  const b64 = btoa(String.fromCharCode(
    (v >>> 24) & 0xFF, (v >>> 16) & 0xFF,
    (v >>> 8)  & 0xFF,  v         & 0xFF
  ));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function decodeId(token: string): number | null {
  try {
    const padded = token.replace(/-/g, '+').replace(/_/g, '/');
    const b = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, '='));
    const v = (
      (b.charCodeAt(0) << 24) | (b.charCodeAt(1) << 16) |
      (b.charCodeAt(2) << 8)  |  b.charCodeAt(3)
    ) >>> 0;
    return (v ^ MASK) >>> 0;
  } catch { return null; }
}
