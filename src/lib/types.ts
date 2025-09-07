/**
 * Shared types used across the app.
 */
export interface ElementNode {
  id: string;
  tagName: string;
  content: string;
  children: ElementNode[];
  collapsed?: boolean;
  codeBlock?: boolean;
  codeLanguage?: string | null;
  attributes?: Record<string, string>;
  // manual override to force CDATA wrapping for this element
  forceCDATA?: boolean;
}

export interface ToastItem {
  id: string;
  text: string;
  type: 'info' | 'success' | 'error';
}
