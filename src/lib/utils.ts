// src/lib/utils.ts
import type { ElementNode } from './types';

/** Very small uid generator for client-side use (no crypto required). */
export const uid = (prefix = 'id_') => prefix + Math.random().toString(36).slice(2, 9);

/** Estimate tokens for a string (approx heuristic used in original code). */
export function estimateTokens(text: string) { return Math.max(0, Math.round((text || '').length / 4)); }

/** Escape basic HTML entities (used for safe preview + XML escaping path). */
export function escapeHtml(s?: string) {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Sanitize a tag name into a valid-ish xml tag (keeps letters/numbers/_-:.). */
export function sanitizeTagForXml(tag: string) {
  if (!tag) return 'node';
  tag = tag.replace(/^[^a-z]+/i, '');
  tag = tag.replace(/[^a-z0-9_\-:\.]/gi, '_');
  if (!/^[a-z]/i.test(tag)) tag = 't_' + tag;
  return tag;
}

/** Convert attribute object into inline string for XML generation. */
export function attrString(attrs?: Record<string,string>) {
  if (!attrs) return '';
  return Object.entries(attrs).map(([k,v]) => ` ${k}="${escapeHtml(v)}"`).join('');
}

/** Small deep clone used by UI helpers (JSON clone is fine for this data shape). */
export function clone<T>(v: T): T { return JSON.parse(JSON.stringify(v)); }

/** Count elements recursively (small helper). */
export function countElements(list: ElementNode[]): number {
  let c = 0;
  list.forEach(el => { c++; if (el.children) c += countElements(el.children); });
  return c;
}
