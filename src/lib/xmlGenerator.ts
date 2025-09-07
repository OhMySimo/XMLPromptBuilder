// src/lib/xmlGenerator.ts
import type { ElementNode } from './types';
import { sanitizeTagForXml, attrString, escapeHtml, uid } from './utils';

/**
 * Generate XML while respecting:
 * - el.forceCDATA (manual)
 * - automatic CDATA only if el.codeBlock === true
 * - otherwise escape content as normal
 */
export function generateXML(elems: ElementNode[], indent = 0): string {
  const pad = '  '.repeat(indent);
  let xml = '';

  elems.forEach(el => {
    const tag = sanitizeTagForXml(el.tagName || 'node');
    const attrs = attrString(el.attributes);
    const hasChildren = el.children && el.children.length > 0;
    const content = el.content || '';
    const isEmptyContent = !content.trim();

    // Decide CDATA: manual override OR explicit codeBlock (fenced code)
    const shouldUseCDATA = !!el.forceCDATA || !!el.codeBlock;

    if (shouldUseCDATA) {
      xml += `${pad}<${tag}${attrs}>\n`;
      if (!isEmptyContent) xml += `${pad}  <![CDATA[${content}]]>\n`;
      if (hasChildren) xml += generateXML(el.children, indent + 1);
      xml += `${pad}</${tag}>\n`;
      return;
    }

    const escContent = escapeHtml(content);

    if (!hasChildren && isEmptyContent) {
      xml += `${pad}<${tag}${attrs} />\n`;
    } else if (!hasChildren) {
      const contentLines = escContent.split('\n');
      if (contentLines.length === 1) {
        xml += `${pad}<${tag}${attrs}>${contentLines[0]}</${tag}>\n`;
      } else {
        xml += `${pad}<${tag}${attrs}>\n`;
        contentLines.forEach(l => xml += `${pad}  ${l}\n`);
        xml += `${pad}</${tag}>\n`;
      }
    } else {
      xml += `${pad}<${tag}${attrs}>\n`;
      if (escContent.trim()) {
        escContent.split('\n').forEach(l => xml += `${pad}  ${l}\n`);
      }
      xml += generateXML(el.children, indent + 1);
      xml += `${pad}</${tag}>\n`;
    }
  });

  return xml;
}

/** XML preview highlighter for the UI (keeps logic from original). */
export function highlightXML(xml: string) {
  let html = escapeHtml(xml);
  html = html.replace(/&lt;(\/)?([a-zA-Z0-9\-_:]+)([\s\S]*?)(&gt;)/g, (m, closing, tag, rest, end) => {
    const attrs = (rest || '').replace(/([a-zA-Z0-9_:\-\.]+)="([^"]*)"/g, (m2, name, val) => {
      return `<span class="xml-attr-name">${name}</span>=<span class="xml-attr-value">"${escapeHtml(val)}"</span>`;
    });
    return `<span class="xml-angle">&lt;${closing || ''}</span><span class="xml-tag">${tag}</span><span class="xml-attrs">${attrs}</span><span class="xml-angle">&gt;</span>`;
  });
  return html;
}

/** parseXmlStringToNodes unchanged (kept as before) */
export function parseXmlStringToNodes(text: string): ElementNode[] {
  const parser = new DOMParser();
  try {
    const doc = parser.parseFromString(`<root>${text}</root>`, 'application/xml');
    const parseError = doc.querySelector('parsererror');
    if (parseError) throw new Error('parse error');

    function nodeToElement(node: ChildNode): ElementNode | null {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        const children: ElementNode[] = [];
        let contentParts: string[] = [];

        for (const n of Array.from(el.childNodes)) {
          if (n.nodeType === Node.ELEMENT_NODE) {
            const child = nodeToElement(n);
            if (child) children.push(child);
          } else if (n.nodeType === Node.TEXT_NODE || n.nodeType === Node.CDATA_SECTION_NODE) {
            contentParts.push((n as CharacterData).textContent || '');
          }
        }

        const attributes: Record<string,string> = {};
        for (const attr of Array.from(el.attributes || [])) { attributes[attr.name] = attr.value; }

        return {
          id: uid(),
          tagName: el.tagName,
          content: contentParts.join('').trim(),
          children,
          attributes: Object.keys(attributes).length ? attributes : undefined
        };
      }
      return null;
    }

    const result: ElementNode[] = [];
    for (const n of Array.from((doc.documentElement as Element).childNodes)) {
      const el = nodeToElement(n);
      if (el) result.push(el);
    }
    return result;
  } catch (e) {
    return [];
  }
}
