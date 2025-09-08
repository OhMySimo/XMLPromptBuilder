// xmlpromptbuilder.tsx — versione completa con markdown-it + UI integrata
import React, { useEffect, useMemo, useState } from 'react';
import i18next from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';

// markdown-it + plugin
import MarkdownIt from 'markdown-it';
import mdFootnote from 'markdown-it-footnote';
import mdDeflist from 'markdown-it-deflist';
import mdSub from 'markdown-it-sub';
import mdSup from 'markdown-it-sup';
import mdMark from 'markdown-it-mark';
import mdAbbr from 'markdown-it-abbr';
import mdContainer from 'markdown-it-container';
import { full as mdEmoji } from 'markdown-it-emoji';
import mdTaskLists from 'markdown-it-task-lists';

// Import locale files (created alongside this file)
import en from './locales/en.json';
import it from './locales/it.json';

// Initialize i18next
i18next.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    it: { translation: it },
  },
  lng: (typeof navigator !== 'undefined' && navigator.language?.startsWith('it')) ? 'it' : (localStorage.getItem('xmlpb_locale') || 'en'),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});
i18next.on('languageChanged', (lng) => {
  try { localStorage.setItem('xmlpb_locale', lng); } catch (e) {}
});

// ================= Types & Utilities =================
interface ElementNode {
  id: string;
  tagName: string;
  content: string;
  children: ElementNode[];
  collapsed?: boolean;
  codeBlock?: boolean;
  codeLanguage?: string | null;
  attributes?: Record<string, string>;
}

interface ToastItem { id: string; text: string; type: 'info' | 'success' | 'error'; }

const uid = (prefix = 'id_') => prefix + Math.random().toString(36).slice(2, 9);
function estimateTokens(text: string) { return Math.max(0, Math.round(text.length / 4)); }

// sanitize helpers
function escapeHtml(s: string) { if (!s) return ''; return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function sanitizeTagForXml(tag: string) {
  if (!tag) return 'node';
  tag = tag.replace(/^[^a-z]+/i, '');
  tag = tag.replace(/[^a-z0-9_\-:\.]/gi, '_');
  if (!/^[a-z]/i.test(tag)) tag = 't_' + tag;
  return tag;
}
function attrString(attrs?: Record<string,string>) {
  if (!attrs) return '';
  return Object.entries(attrs).map(([k,v]) => ` ${k}="${escapeHtml(v)}"`).join('');
}

// ================= markdown-it setup =================
const md = new MarkdownIt({ html: false, linkify: true, typographer: true })
  .use(mdFootnote)
  .use(mdDeflist)
  .use(mdSub)
  .use(mdSup)
  .use(mdMark)
  .use(mdAbbr)
  .use(mdContainer, 'warning') // example custom container; you can register others
  .use(mdEmoji)
  .use(mdTaskLists, { enabled: true });

// ================= markdown-it tokens -> ElementNode conversion =================
// renderInlineTokens: convert inline tokens into HTML-ish string that will be stored in ElementNode.content
function renderInlineTokens(tokens: any[], idxStart = 0, idxEnd?: number) {
  const outParts: string[] = [];
  const end = typeof idxEnd === 'number' ? idxEnd : tokens.length;

  const stack: string[] = [];

  for (let i = idxStart; i < end; i++) {
    const t = tokens[i];
    const tp = t.type;

    switch (tp) {
      case 'text':
        outParts.push(escapeHtml(t.content));
        break;
      case 'softbreak':
        outParts.push('\n');
        break;
      case 'hardbreak':
        outParts.push('\n');
        break;
      case 'code_inline':
        outParts.push(`<code>${escapeHtml(t.content)}</code>`);
        break;
      case 'strong_open':
        outParts.push('<strong>');
        break;
      case 'strong_close':
        outParts.push('</strong>');
        break;
      case 'em_open':
        outParts.push('<em>');
        break;
      case 'em_close':
        outParts.push('</em>');
        break;
      case 's_open':
        outParts.push('<del>');
        break;
      case 's_close':
        outParts.push('</del>');
        break;
      case 'link_open': {
        const href = t.attrs?.find((a: any) => a[0] === 'href')?.[1] || '';
        const title = t.attrs?.find((a: any) => a[0] === 'title')?.[1];
        outParts.push(`<a href="${escapeHtml(href)}"${title ? ` title="${escapeHtml(title)}"` : ''}>`);
        break;
      }
      case 'link_close':
        outParts.push('</a>');
        break;
      case 'image': {
        const src = t.attrs?.find((a: any) => a[0] === 'src')?.[1] || t.attrGet && t.attrGet('src') || '';
        const alt = t.content || (t.attrs?.find((a: any) => a[0] === 'alt')?.[1] || '');
        const title = t.attrs?.find((a: any) => a[0] === 'title')?.[1];
        outParts.push(`<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}"${title ? ` title="${escapeHtml(title)}"` : ''} />`);
        break;
      }
      case 'html_inline':
        // markdown-it may emit raw HTML (we disabled html:true in parser, but some plugins output html_inline)
        outParts.push(escapeHtml(t.content));
        break;
      case 'emoji':
        outParts.push(escapeHtml(t.content)); // content is actual emoji char (e.g. 😄)
        break;
      default:
        // unknown inline token - fallback to content if present
        if (t.content) outParts.push(escapeHtml(t.content));
        break;
    }
  }

  return outParts.join('');
}

// Helper: convert a single fence/code_block token to nodes
function codeTokenToNode(t: any) {
  const lang = t.info ? t.info.trim().split(/\s+/)[0] : null;
  const pre: ElementNode = { id: uid(), tagName: 'pre', content: '', children: [] };
  const code: ElementNode = { id: uid(), tagName: 'code', content: t.content || '', children: [], codeBlock: true, codeLanguage: lang || null };
  pre.children.push(code);
  return pre;
}

// Main token walker: converts block tokens to ElementNodes
function tokensToElements(tokens: any[]): ElementNode[] {
  const out: ElementNode[] = [];
  const stack: Array<{ node: ElementNode; listType?: 'ul'|'ol'; idx?: number }> = [];

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    // console.log('token', t.type, t.tag, t);
    switch (t.type) {
      case 'heading_open': {
        const level = parseInt(t.tag.replace('h', ''), 10) || 1;
        // next token is inline with content
        const inline = tokens[i + 1];
        const content = inline && inline.children ? renderInlineTokens(inline.children) : '';
        const node: ElementNode = { id: uid(), tagName: `h${level}`, content, children: [] };
        out.push(node);
        i++; // skip inline
        // skip heading_close handled by heading_close token but we already consumed content
        break;
      }

      case 'paragraph_open': {
        const inline = tokens[i + 1];
        const content = inline && inline.children ? renderInlineTokens(inline.children) : '';
        const node: ElementNode = { id: uid(), tagName: 'p', content, children: [] };
        out.push(node);
        i++; // skip inline
        break;
      }

      case 'fence':
      case 'code_block': {
        const node = codeTokenToNode(t);
        out.push(node);
        break;
      }

      case 'bullet_list_open': {
        const listNode: ElementNode = { id: uid(), tagName: 'ul', content: '', children: [] };
        // find list items until bullet_list_close
        let j = i + 1;
        while (j < tokens.length && tokens[j].type !== 'bullet_list_close') {
          if (tokens[j].type === 'list_item_open') {
            // find inner inline(s) for this list item
            // consume until list_item_close; inside may be paragraph_open/inlines etc.
            let k = j + 1;
            const liChildren: ElementNode[] = [];
            let liText = '';
            while (k < tokens.length && tokens[k].type !== 'list_item_close') {
              if (tokens[k].type === 'paragraph_open') {
                const inline = tokens[k + 1];
                if (inline && inline.children) liText += renderInlineTokens(inline.children);
                k += 2; // skip paragraph_open + inline
                continue;
              } else if (tokens[k].type === 'inline') {
                liText += renderInlineTokens(tokens[k].children);
                k++;
                continue;
              } else if (tokens[k].type === 'bullet_list_open' || tokens[k].type === 'ordered_list_open') {
                // nested list -> recursively convert the nested slice
                const nestedStart = k;
                // find matching close
                let depth = 0;
                while (k < tokens.length) {
                  if (tokens[k].type === 'bullet_list_open' || tokens[k].type === 'ordered_list_open') depth++;
                  else if (tokens[k].type === 'bullet_list_close' || tokens[k].type === 'ordered_list_close') {
                    depth--;
                    if (depth === 0) { k++; break; }
                  }
                  k++;
                }
                const nestedTokens = tokens.slice(nestedStart, k);
                const nestedNodes = tokensToElements(nestedTokens);
                // attach nested nodes to liChildren
                nestedNodes.forEach(n => liChildren.push(n));
                continue;
              } else {
                k++;
              }
            }
            const liNode: ElementNode = { id: uid(), tagName: 'li', content: liText.trim(), children: liChildren };
            listNode.children.push(liNode);
            j = k + 1; // continue after list_item_close
            continue;
          }
          j++;
        }
        out.push(listNode);
        // advance i to after bullet_list_close
        while (i < tokens.length && tokens[i].type !== 'bullet_list_close') i++;
        break;
      }

      case 'ordered_list_open': {
        // similar to bullet_list_open, but capture start attribute if present
        const listNode: ElementNode = { id: uid(), tagName: 'ol', content: '', children: [], attributes: {} };
        if (t.attrGet && t.attrGet('start')) listNode.attributes = { start: String(t.attrGet('start')) };
        let j = i + 1;
        while (j < tokens.length && tokens[j].type !== 'ordered_list_close') {
          if (tokens[j].type === 'list_item_open') {
            let k = j + 1;
            const liChildren: ElementNode[] = [];
            let liText = '';
            while (k < tokens.length && tokens[k].type !== 'list_item_close') {
              if (tokens[k].type === 'paragraph_open') {
                const inline = tokens[k + 1];
                if (inline && inline.children) liText += renderInlineTokens(inline.children);
                k += 2; continue;
              } else if (tokens[k].type === 'inline') {
                liText += renderInlineTokens(tokens[k].children);
                k++; continue;
              } else if (tokens[k].type === 'ordered_list_open' || tokens[k].type === 'bullet_list_open') {
                const nestedStart = k;
                let depth = 0;
                while (k < tokens.length) {
                  if (tokens[k].type === 'ordered_list_open' || tokens[k].type === 'bullet_list_open') depth++;
                  else if (tokens[k].type === 'ordered_list_close' || tokens[k].type === 'bullet_list_close') {
                    depth--;
                    if (depth === 0) { k++; break; }
                  }
                  k++;
                }
                const nestedNodes = tokensToElements(tokens.slice(nestedStart, k));
                nestedNodes.forEach(n => liChildren.push(n));
                continue;
              } else {
                k++;
              }
            }
            const liNode: ElementNode = { id: uid(), tagName: 'li', content: liText.trim(), children: liChildren };
            listNode.children.push(liNode);
            j = k + 1;
            continue;
          }
          j++;
        }
        out.push(listNode);
        while (i < tokens.length && tokens[i].type !== 'ordered_list_close') i++;
        break;
      }

      case 'blockquote_open': {
        // collect until blockquote_close, recursively convert inner slice
        const start = i;
        let depth = 0;
        let j = i;
        while (j < tokens.length) {
          if (tokens[j].type === 'blockquote_open') depth++;
          else if (tokens[j].type === 'blockquote_close') {
            depth--;
            if (depth === 0) { j++; break; }
          }
          j++;
        }
        const inner = tokens.slice(start + 1, j - 1);
        const innerNodes = tokensToElements(inner);
        const bqNode: ElementNode = { id: uid(), tagName: 'blockquote', content: '', children: innerNodes };
        out.push(bqNode);
        i = j - 1;
        break;
      }

      case 'hr':
      case 'thematic_break':
        out.push({ id: uid(), tagName: 'hr', content: '', children: [] });
        break;

      case 'table_open': {
        // use markdown-it token sequence for tables
        // basic approach: find header row tokens, then tbody rows
        // We'll build table node by walking until table_close
        const tableNode: ElementNode = { id: uid(), tagName: 'table', content: '', children: [] };
        // parse header
        let j = i + 1;
        // find thead and tbody tokens produced by markdown-it
        const slice: any[] = [];
        let depth = 0;
        while (j < tokens.length) {
          if (tokens[j].type === 'table_close') break;
          slice.push(tokens[j]);
          j++;
        }
        // find header row tokens between thead_open..thead_close
        const theadNode: ElementNode = { id: uid(), tagName: 'thead', content: '', children: [] };
        const tbodyNode: ElementNode = { id: uid(), tagName: 'tbody', content: '', children: [] };

        let k = 0;
        while (k < slice.length) {
          if (slice[k].type === 'thead_open') {
            // process header row(s)
            k++;
            while (k < slice.length && slice[k].type !== 'thead_close') {
              if (slice[k].type === 'tr_open') {
                const tr: ElementNode = { id: uid(), tagName: 'tr', content: '', children: [] };
                k++;
                while (k < slice.length && slice[k].type !== 'tr_close') {
                  if (slice[k].type === 'th_open') {
                    // next token is inline
                    const inline = slice[k + 1];
                    const content = inline && inline.children ? renderInlineTokens(inline.children) : '';
                    const th: ElementNode = { id: uid(), tagName: 'th', content, children: [] };
                    tr.children.push(th);
                    // advance to th_close
                    while (k < slice.length && slice[k].type !== 'th_close') k++;
                  }
                  k++;
                }
                theadNode.children.push(tr);
              } else {
                k++;
              }
            }
          } else if (slice[k].type === 'tbody_open' || slice[k].type === 'tr_open') {
            // rows
            if (slice[k].type === 'tbody_open') { k++; continue; }
            if (slice[k].type === 'tr_open') {
              const tr: ElementNode = { id: uid(), tagName: 'tr', content: '', children: [] };
              k++;
              while (k < slice.length && slice[k].type !== 'tr_close') {
                if (slice[k].type === 'td_open') {
                  const inline = slice[k + 1];
                  const content = inline && inline.children ? renderInlineTokens(inline.children) : '';
                  const td: ElementNode = { id: uid(), tagName: 'td', content, children: [] };
                  tr.children.push(td);
                  while (k < slice.length && slice[k].type !== 'td_close') k++;
                }
                k++;
              }
              tbodyNode.children.push(tr);
            } else {
              k++;
            }
          } else k++;
        }
        if (theadNode.children.length) tableNode.children.push(theadNode);
        if (tbodyNode.children.length) tableNode.children.push(tbodyNode);
        out.push(tableNode);
        // move i to after table_close
        i = j;
        break;
      }

      case 'footnote_block_open': {
        // collect until footnote_block_close and build a footnotes container
        const footnoteDiv: ElementNode = { id: uid(), tagName: 'footnotes', content: '', children: [] };
        let j = i + 1;
        while (j < tokens.length && tokens[j].type !== 'footnote_block_close') {
          // tokens inside are usually footnote_open / footnote_reference / etc.
          if (tokens[j].type === 'footnote_open') {
            // footnote list: typically next tokens include paragraph etc.
            let k = j + 1;
            const fnNode: ElementNode = { id: uid(), tagName: 'footnote', content: '', children: [] };
            while (k < tokens.length && tokens[k].type !== 'footnote_close') {
              if (tokens[k].type === 'paragraph_open') {
                const inline = tokens[k + 1];
                if (inline && inline.children) fnNode.content += renderInlineTokens(inline.children);
                k += 2; continue;
              } else k++;
            }
            footnoteDiv.children.push(fnNode);
            j = k + 1;
            continue;
          }
          j++;
        }
        out.push(footnoteDiv);
        // advance i
        while (i < tokens.length && tokens[i].type !== 'footnote_block_close') i++;
        break;
      }

      case 'container_warning_open':
      case /^container_/.test(t.type) ? t.type : null:
        // custom containers are emitted as container_<name>_open tokens if registered
        // we already registered 'warning' above — but markdown-it's plugin emits container_warning_open etc.
        if (t.type.startsWith('container_') && t.type.endsWith('_open')) {
          const name = t.type.replace(/^container_/, '').replace(/_open$/, '');
          const opentype = t.type;
          // gather until corresponding close token
          let j = i + 1;
          const innerTokens: any[] = [];
          while (j < tokens.length && tokens[j].type !== `container_${name}_close`) {
            innerTokens.push(tokens[j]);
            j++;
          }
          const innerNodes = tokensToElements(innerTokens);
          const divNode: ElementNode = { id: uid(), tagName: 'div', content: '', children: innerNodes, attributes: { class: name } };
          out.push(divNode);
          i = j;
          break;
        }
        break;

      case 'inline':
        // top-level inline (rare, but treat as paragraph)
        if (t.children && t.children.length) {
          const content = renderInlineTokens(t.children);
          out.push({ id: uid(), tagName: 'p', content, children: [] });
        }
        break;

      // fallthrough default: ignore or handle simple tokens
      default:
        // console.debug('unhandled token', t.type);
        break;
    }
  }

  return out;
}

// Public function exposed to UI: parse using markdown-it (robust)
function parseMarkdownToElements(mdSource: string): ElementNode[] {
  if (!mdSource || !mdSource.trim()) return [];
  const tokens = md.parse(mdSource, {});
  const nodes = tokensToElements(tokens);
  // ensure unique IDs
  return nodes.map(n => ({ ...n, id: uid() }));
}

// ================= XML generation (unchanged but with attributes support) =================
function generateXML(elems: ElementNode[], indent = 0): string {
  const pad = '  '.repeat(indent);
  let xml = '';

  elems.forEach(el => {
    const tag = sanitizeTagForXml(el.tagName || 'node');
    const attrs = attrString(el.attributes);
    const hasChildren = el.children && el.children.length > 0;
    const content = el.content || '';
    const isEmptyContent = !content.trim();

    // decide CDATA for code blocks or when content contains raw markup
    const needsCDATA = el.codeBlock || /[<>&]/.test(content) || /(^\s*<[^>]+>)/m.test(content);
    if (needsCDATA) {
      if (!hasChildren && isEmptyContent) {
        xml += `${pad}<${tag}${attrs}><![CDATA[${content}]]></${tag}>\n`;
      } else {
        xml += `${pad}<${tag}${attrs}>\n`;
        if (!isEmptyContent) xml += `${pad}  <![CDATA[${content}]]>\n`;
        if (hasChildren) xml += generateXML(el.children, indent + 1);
        xml += `${pad}</${tag}>\n`;
      }
      return;
    }

    // Safe content (no CDATA)
    const escContent = escapeHtml(content);

    if (!hasChildren && isEmptyContent) {
      // self-closing but include attrs if present
      xml += `${pad}<${tag}${attrs} />\n`;
    } else if (!hasChildren) {
      // single-line or multi-line content
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

// ================= UI Components (Tree, TreeNode, Editor, Toast) =================
// Most UI code is adapted from your original file — only small adjustments to type/attributes handling.
// For brevity I'll keep them functional and consistent with earlier implementation.

function Toast({ items }: { items: ToastItem[] }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {items.map(toast => (
        <div key={toast.id} className={`px-3 py-2 rounded-lg text-white shadow-lg transition-all duration-300 ${toast.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-cyan-500' : toast.type === 'error' ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-blue-600'}`}>
          {toast.text}
        </div>
      ))}
    </div>
  );
}

const levelClasses = [
  'bg-emerald-50 border-emerald-200',
  'bg-yellow-50 border-yellow-200',
  'bg-orange-50 border-orange-200',
  'bg-red-50 border-red-200',
  'bg-violet-50 border-violet-200',
  'bg-sky-50 border-sky-200',
];

function TreeNode({ node, depth, onSelect, selectedId, onAddChild, onDelete, onToggleCollapse, onDropNode }: {
  node: ElementNode; depth: number; onSelect: (id: string) => void; selectedId: string | null; onAddChild: (parentId: string) => void; onDelete: (id: string) => void; onToggleCollapse: (id: string) => void; onDropNode: (draggedId: string, targetId: string | null) => void;
}) {
  const isSelected = selectedId === node.id;
  const [dragOver, setDragOver] = useState(false);
  const color = levelClasses[(depth % levelClasses.length)];

  return (
    <li className="mb-1">
      <div
        draggable
        onClick={() => onSelect(node.id)}
        onDragStart={(e) => { e.dataTransfer.setData('text/plain', node.id); e.dataTransfer.effectAllowed = 'move'; }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); const draggedId = e.dataTransfer.getData('text/plain'); if (draggedId && draggedId !== node.id) onDropNode(draggedId, node.id); }}
        className={`flex items-center justify-between p-2 rounded-md hover:bg-gray-50 border ${color} ${isSelected ? 'ring-2 ring-emerald-200' : ''} ${dragOver ? 'ring-2 ring-emerald-300 bg-emerald-25' : ''}`}
        style={{ paddingLeft: depth * 16 + 8 }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div>
            <div className="text-sm font-mono text-gray-700">
              &lt;{node.tagName}{(!node.content && (!node.children || node.children.length === 0)) ? ' /' : ''}&gt;{node.codeBlock ? ' (code)' : ''}
            </div>
            {node.content && (
              <div className="text-xs text-gray-500 truncate max-w-xs">{node.content.length > 60 ? node.content.slice(0, 60) + '…' : node.content}</div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 ml-2">
          <button onClick={(e) => { e.stopPropagation(); onToggleCollapse(node.id); }} className="px-2 py-1 text-xs border rounded hover:bg-gray-100">{node.collapsed ? '▶' : '▼'}</button>

          <button onClick={(e) => { e.stopPropagation(); onAddChild(node.id); }} className="px-2 py-1 text-xs border rounded hover:bg-gray-100" title="Add child">+</button>

          <button onClick={(e) => { e.stopPropagation(); onDelete(node.id); }} className="px-2 py-1 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50" title="Delete">🗑</button>
        </div>
      </div>

      {!node.collapsed && node.children && node.children.length > 0 && (
        <ul className="list-none">
          {node.children.map(child => (
            <TreeNode key={child.id} node={child} depth={depth + 1} onSelect={onSelect} selectedId={selectedId} onAddChild={onAddChild} onDelete={onDelete} onToggleCollapse={onToggleCollapse} onDropNode={onDropNode} />
          ))}
        </ul>
      )}
    </li>
  );
}

function Tree({ elements, onSelect, selectedId, onAddChild, onDelete, onToggleCollapse, onDropNode }: {
  elements: ElementNode[]; onSelect: (id: string) => void; selectedId: string | null; onAddChild: (parentId: string) => void; onDelete: (id: string) => void; onToggleCollapse: (id: string) => void; onDropNode: (draggedId: string, targetId: string | null) => void;
}) {
  return (
    <div className="h-96 overflow-auto border border-dashed border-gray-200 rounded-lg p-3 bg-gradient-to-b from-white/60 to-white/40" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const draggedId = e.dataTransfer.getData('text/plain'); if (draggedId) onDropNode(draggedId, null); }}>
      <ul className="list-none m-0 p-0">
        {elements.map(el => (
          <TreeNode key={el.id} node={el} depth={0} onSelect={onSelect} selectedId={selectedId} onAddChild={(parentId) => onAddChild(parentId)} onDelete={onDelete} onToggleCollapse={onToggleCollapse} onDropNode={onDropNode} />
        ))}
      </ul>
    </div>
  );
}

// Editor: manual language dropdown (no heuristic auto-detection)
function Editor({ selected, onSave, onAddChild, onRequestAutoChild, onMarkdownToXml }: { selected: ElementNode | null; onSave: (tagName: string, content: string, codeBlock?: boolean, codeLanguage?: string | null) => void; onAddChild: () => void; onRequestAutoChild: () => void; onMarkdownToXml: (md: string) => void; }) {
  const { t } = useTranslation();
  const [tagName, setTagName] = useState('');
  const [content, setContent] = useState('');
  const [codeChecked, setCodeChecked] = useState(false);
  const [selectedLang, setSelectedLang] = useState<string | null>(null);

  useEffect(() => { setTagName(selected?.tagName || ''); setContent(selected?.content || ''); setCodeChecked(Boolean(selected?.codeBlock)); setSelectedLang(selected?.codeLanguage || null); }, [selected?.id]);

  useEffect(() => {
    if (!selected) return;
    const tId = setTimeout(() => onSave(tagName, content, codeChecked, selectedLang), 350);
    return () => clearTimeout(tId);
  }, [tagName, content, codeChecked, selectedLang]);

  return (
    <div className="mt-4 space-y-3">
      <label className="block">
        <span className="text-sm text-gray-600 mb-1 block">{t('tagName')}</span>
        <input type="text" value={tagName} onChange={(e) => setTagName(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
      </label>

      <label className="block">
        <span className="text-sm text-gray-600 mb-1 block">{t('content')}</span>
        <textarea rows={6} value={content} onChange={(e) => setContent(e.target.value)} placeholder={t('pasteHint')} className="w-full px-3 py-2 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500" onBlur={() => { onSave(tagName, content, codeChecked, selectedLang); onRequestAutoChild(); }} />
      </label>

      <div className="flex items-center gap-3">
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={codeChecked} onChange={(e) => setCodeChecked(e.target.checked)} />
          <span>{t('codeBlock')}</span>
        </label>

        {codeChecked && (
          <select value={selectedLang || 'auto'} onChange={(e) => setSelectedLang(e.target.value || null)} className="px-2 py-1 border rounded text-sm">
            <option value="auto">auto</option>
            <option value="javascript">javascript</option>
            <option value="python">python</option>
            <option value="bash">bash</option>
            <option value="json">json</option>
            {/* add more languages as desired */}
          </select>
        )}
      </div>

      {codeChecked && (
        <div className="text-xs text-yellow-700 bg-yellow-50 p-2 rounded">Attivando "<strong>Forza come codice (CDATA)</strong>" il contenuto verrà racchiuso in una sezione CDATA e <strong>verrà disabilitato l'annidamento automatico</strong> per questo tag.</div>
      )}

      <div className="flex gap-2">
        <button onClick={() => onSave(tagName, content, codeChecked, selectedLang)} className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg hover:shadow-lg transition-shadow">{t('save')}</button>
        <button onClick={onAddChild} className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">{t('addChild')}</button>
        <button onClick={() => onRequestAutoChild()} className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50" disabled={codeChecked}>{t('autoChild')}</button>

        <button onClick={() => onMarkdownToXml(content)} className="ml-auto px-4 py-2 border border-orange-200 text-orange-600 rounded-lg hover:bg-orange-50">MD → XML</button>
      </div>
    </div>
  );
}

// ================= main component UI =================
export default function XMLPromptBuilder() {
  const { t, i18n } = useTranslation();
  const [elements, setElements] = useState<ElementNode[]>(() => {
    try {
      const raw = localStorage.getItem('xmlpb_elements');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [
      { id: uid(), tagName: 'instructions_setup', content: 'You are a helpful AI assistant.', children: [] },
      { id: uid(), tagName: 'examples_list', content: '1) First example\n2) Second example', children: [] }
    ];
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [xmlExpanded, setXmlExpanded] = useState(false);
  const [validation, setValidation] = useState<{ ok: boolean; message: string | null }>({ ok: true, message: null });

  useEffect(() => { localStorage.setItem('xmlpb_elements', JSON.stringify(elements)); }, [elements]);

  const xml = useMemo(() => generateXML(elements), [elements]);
  const tokens = estimateTokens(xml);

  useEffect(() => {
    // validate XML whenever it changes
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<root>${xml}</root>`, 'application/xml');
    const err = doc.querySelector('parsererror');
    if (err) {
      setValidation({ ok: false, message: err.textContent || 'XML parse error' });
    } else {
      setValidation({ ok: true, message: null });
    }
  }, [xml]);

  function showToast(text: string, type: ToastItem['type'] = 'info') {
    const toast: ToastItem = { id: uid(), text, type };
    setToasts(prev => [...prev, toast]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toast.id)), 3500);
  }

  function findById(id: string | null, list: ElementNode[] = elements): ElementNode | null {
    if (!id) return null;
    for (const el of list) {
      if (el.id === id) return el;
      if (el.children) {
        const found = findById(id, el.children);
        if (found) return found;
      }
    }
    return null;
  }

  function addElement(parentId: string | null = null, template?: Partial<ElementNode>) {
    const newEl: ElementNode = { id: uid(), tagName: template?.tagName || 'nuovo_tag', content: template?.content || '', children: [], codeBlock: template?.codeBlock, codeLanguage: template?.codeLanguage || null, attributes: template?.attributes || undefined };
    if (!parentId) setElements(prev => [...prev, newEl]); else setElements(prev => insertAsChild(prev, parentId, newEl));
    setSelectedId(newEl.id);
    showToast(t('elementAdded'), 'success');
  }

  function deleteElement(id: string) {
    const { list } = removeById(elements, id);
    setElements(list);
    if (selectedId === id) setSelectedId(null);
    showToast(t('elementDeleted'), 'info');
  }

  function saveSelected(tagName: string, content: string, codeBlock?: boolean, codeLanguage?: string | null) {
    if (!selectedId) { showToast(t('selectAnElementFirst'), 'info'); return; }
    setElements(prev => {
      const cloned = clone(prev);
      function update(list: ElementNode[]): boolean {
        for (const el of list) {
          if (el.id === selectedId) { el.tagName = tagName.trim() || el.tagName; el.content = content; el.codeBlock = Boolean(codeBlock); el.codeLanguage = codeLanguage || null; return true; }
          if (el.children && update(el.children)) return true;
        }
        return false;
      }
      update(cloned);
      return cloned;
    });
  }

  function autoChildForSelected() {
    if (!selectedId) { showToast(t('selectAnElementFirst'), 'info'); return; }
    const node = findById(selectedId);
    if (!node) return;
    // respect explicit codeBlock flag
    if (node.codeBlock) { showToast(t('noListPatterns'), 'info'); return; }
    // simple heuristic: split content by lines → children items
    const lines = (node.content || '').split('\n').map(s => s.trim()).filter(Boolean);
    if (!lines.length) { showToast(t('noListPatterns'), 'info'); return; }
    const children = lines.map((ln, i) => ({ id: uid(), tagName: `p_${i+1}`, content: ln, children: [] }));
    setElements(prev => {
      const cloned = clone(prev);
      function replace(list: ElementNode[]): boolean {
        for (let i = 0; i < list.length; i++) {
          if (list[i].id === selectedId) { list[i].content = ''; list[i].children = children; return true; }
          if (list[i].children && replace(list[i].children)) return true;
        }
        return false;
      }
      replace(cloned);
      return cloned;
    });
    showToast(`${children.length} ${t('addChild')}`, 'success');
  }

  // importText: uses prompt (kept for parity with earlier UI)
  function importText() {
    const text = prompt(t('pasteImportPrompt')) || '';
    if (!text) return;

    const NL = String.fromCharCode(10);
    const looksLikeMd = text.trimStart().startsWith('#')
      || text.indexOf('```') !== -1
      || text.indexOf(NL + '- ') !== -1
      || text.indexOf(NL + '* ') !== -1
      || text.indexOf(NL + '1. ') !== -1;

    if (looksLikeMd) {
      const parsed = parseMarkdownToElements(text);
      if (parsed.length) {
        setElements(prev => [...prev, ...parsed]);
        showToast(t('importedN', { n: parsed.length }), 'success');
        return;
      }
    }

    const parsed = parseXmlStringToNodes(text);
    if (parsed.length) {
      setElements(prev => [...prev, ...parsed]);
      showToast(t('importedN', { n: parsed.length }), 'success');
      return;
    }

    const loose = text.split(String.fromCharCode(10)).map(s => s.trim()).filter(Boolean);
    if (loose.length) {
      setElements(prev => [...prev, { id: uid(), tagName: 'imported', content: loose.join(String.fromCharCode(10)), children: [] }]);
      showToast(t('importedN', { n: 1 }), 'success');
      return;
    }

    showToast(t('noListPatterns'), 'error');
  }

  async function copyXML() {
    try { await navigator.clipboard.writeText(xml); showToast(t('xmlCopied'), 'success'); } catch (e) { showToast(t('copyFailed'), 'error'); }
  }

  function toggleCollapse(id: string) {
    setElements(prev => {
      const cloned = clone(prev);
      function toggle(list: ElementNode[]): boolean {
        for (const el of list) { if (el.id === id) { el.collapsed = !el.collapsed; return true; } if (el.children && toggle(el.children)) return true; }
        return false;
      }
      toggle(cloned);
      return cloned;
    });
  }

  function countElements(list: ElementNode[]): number { let c = 0; list.forEach(el => { c++; if (el.children) c += countElements(el.children); }); return c; }

  function moveNode(draggedId: string, targetId: string | null) {
    if (draggedId === targetId) return;
    const { removed, list: without } = removeById(elements, draggedId);
    if (!removed) return;
    setElements(insertAsChild(without, targetId, removed));
    showToast(t('movedElement'), 'success');
  }

  function clearStructure() {
    if (!confirm(t('confirmClear'))) return;
    setElements([]);
    setSelectedId(null);
    showToast(t('structureCleared'), 'info');
  }

  const selectedElement = findById(selectedId);

  // Apply Markdown content to the selected element (uses markdown-it parser)
  function applyMarkdownToSelected(mdContent: string) {
    if (!selectedId) { showToast(t('selectAnElementFirst'), 'info'); return; }
    const parsed = parseMarkdownToElements(mdContent || '');
    if (!parsed || parsed.length === 0) { showToast(t('noListPatterns'), 'info'); return; }

    setElements(prev => {
      const cloned = clone(prev);
      function replace(list: ElementNode[]): boolean {
        for (let i = 0; i < list.length; i++) {
          if (list[i].id === selectedId) {
            const target = list[i];
            const first = parsed[0];
            const nonGeneric = first && first.tagName && !['p', 'list', 'hr', 'imported', 'pre'].includes(first.tagName);

            if (nonGeneric && first.tagName.startsWith('h')) {
              // apply heading-derived tag
              target.tagName = first.tagName;
              target.content = first.content || '';
              target.children = parsed.slice(1).map(p => ({ ...p, id: uid() }));
            } else {
              // replace content/children with parsed
              target.content = '';
              target.children = parsed.map(p => ({ ...p, id: uid() }));
            }

            return true;
          }
          if (list[i].children && replace(list[i].children)) return true;
        }
        return false;
      }
      replace(cloned);
      return cloned;
    });

    showToast(t('importedN', { n: parsed.length }), 'success');
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-cyan-50 min-h-screen">
      <header className="text-center mb-6">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="text-xl">✨</div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <div className="text-xl">✨</div>
        </div>
        <p className="text-gray-600">{t('subtitle')}</p>

        <div className="mt-3 flex items-center justify-center gap-2">
          <label className="text-sm text-gray-600 mr-2">{t('language')}:</label>
          <select value={i18n.language} onChange={(e) => i18n.changeLanguage(e.target.value)} className="px-2 py-1 border rounded">
            <option value="en">English</option>
            <option value="it">Italiano</option>
          </select>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left panel: tree */}
        <section className="bg-white/90 rounded-xl shadow-lg border border-white/20 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{t('xmlStructure')}</h2>
            <div className="flex gap-2">
              <button onClick={() => addElement()} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">{t('addElement')}</button>
              <button onClick={importText} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">{t('import')}</button>
              <button onClick={copyXML} className="px-3 py-1.5 text-sm bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg hover:shadow-lg">{t('copyXML')}</button>
              <button onClick={clearStructure} className="px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50">{t('clear')}</button>
            </div>
          </div>

          <Tree elements={elements} onSelect={setSelectedId} selectedId={selectedId} onAddChild={(parentId) => addElement(parentId)} onDelete={deleteElement} onToggleCollapse={toggleCollapse} onDropNode={moveNode} />

          <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
            <span>{t('tokens')}: {tokens}</span>
            <span>{t('elements')}: {countElements(elements)}</span>
          </div>
        </section>

        {/* Right panel: editor & output */}
        <section className="bg-white/90 rounded-xl shadow-lg border border-white/20 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{t('editor')}</h2>
            <div className="flex gap-2">
              <button onClick={() => autoChildForSelected()} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">{t('autoChild')}</button>
              <button onClick={() => { if (!selectedId) { showToast(t('selectAnElementFirst'), 'info'); return; } deleteElement(selectedId); }} className="px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50">{t('delete')}</button>
            </div>
          </div>

          <Editor selected={selectedElement} onSave={saveSelected} onAddChild={() => { if (!selectedId) { showToast(t('selectAnElementFirst'), 'info'); return; } addElement(selectedId); }} onRequestAutoChild={autoChildForSelected} onMarkdownToXml={(md) => applyMarkdownToSelected(md)} />

          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{t('generatedXML')}</h3>
              <button onClick={() => setXmlExpanded(!xmlExpanded)} className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50">{xmlExpanded ? t('collapse') : t('expand')}</button>
            </div>

            <div className={`p-0 rounded-lg overflow-auto font-mono text-sm transition-all ${xmlExpanded ? 'max-h-96' : 'max-h-64'}`}>
              <pre className="bg-slate-900 text-slate-100 p-3 m-0 rounded-t-lg" style={{ whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: highlightXML(xml) }} tabIndex={0}></pre>

              <div className={`px-3 py-2 rounded-b-lg border-t ${validation.ok ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                {validation.ok ? t('validationOk') : `${t('validationError')}: ${validation.message}`}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="text-center mt-6 text-sm text-gray-600"><i>Generatore di Prompt strutturati in formato XML</i><br></br><br></br><strong>React + Vite + TypeScript</strong> — parser basato su markdown-it, con autorilevamento di headers,<br></br> note a piè di pagina, contenitori personalizzati, tabelle, elenchi, formattazione in linea e output XML.</footer>

      <Toast items={toasts} />

    </div>
  );
}

// ================= Helper functions used by UI (clone, remove, insert) =================
function clone<T>(v: T): T { return JSON.parse(JSON.stringify(v)); }

function removeById(list: ElementNode[], id: string): { removed: ElementNode | null; list: ElementNode[] } {
  let removed: ElementNode | null = null;
  function recurse(arr: ElementNode[]): ElementNode[] {
    return arr.filter(el => {
      if (el.id === id) { removed = el; return false; }
      el.children = recurse(el.children || []);
      return true;
    });
  }
  const newList = recurse(clone(list));
  return { removed, list: newList };
}

function insertAsChild(list: ElementNode[], parentId: string | null, node: ElementNode) {
  const cloned = clone(list);
  if (!parentId) { cloned.push(node); return cloned; }

  function recurse(arr: ElementNode[]): boolean {
    for (const el of arr) {
      if (el.id === parentId) { el.children = el.children || []; el.children.push(node); return true; }
      if (el.children && recurse(el.children)) return true;
    }
    return false;
  }
  recurse(cloned);
  return cloned;
}

// ================= XML highlighter for preview =================
function highlightXML(xml: string) {
  let html = escapeHtml(xml);
  html = html.replace(/&lt;(\/)?([a-zA-Z0-9\-_:]+)([\s\S]*?)(&gt;)/g, (m, closing, tag, rest, end) => {
    const attrs = (rest || '').replace(/([a-zA-Z0-9_:\-\.]+)="([^"]*)"/g, (m2, name, val) => {
      return `<span class="xml-attr-name">${name}</span>=<span class="xml-attr-value">"${escapeHtml(val)}"</span>`;
    });
    return `<span class="xml-angle">&lt;${closing || ''}</span><span class="xml-tag">${tag}</span><span class="xml-attrs">${attrs}</span><span class="xml-angle">&gt;</span>`;
  });
  return html;
}

// ================= XML string -> nodes (used when importing XML text) =================
function parseXmlStringToNodes(text: string): ElementNode[] {
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

        el.childNodes.forEach(c => {
          if (c.nodeType === Node.ELEMENT_NODE) {
            const childEl = nodeToElement(c);
            if (childEl) children.push(childEl);
          } else if (c.nodeType === Node.CDATA_SECTION_NODE) {
            const txt = c.textContent || '';
            if (txt) contentParts.push(txt);
          } else if (c.nodeType === Node.TEXT_NODE) {
            const txt = (c.textContent || '').trim();
            if (txt) contentParts.push(txt);
          }
        });

        const attrs: Record<string,string> = {};
        if (el.attributes) {
          for (let i = 0; i < el.attributes.length; i++) {
            const a = el.attributes.item(i);
            if (a) attrs[a.name] = a.value;
          }
        }

        return { id: uid(), tagName: sanitizeTagForXml(el.nodeName), content: contentParts.join('\n'), children, codeBlock: el.nodeName.toLowerCase() === 'code' || !!el.querySelector('code'), codeLanguage: el.getAttribute && el.getAttribute('language') ? el.getAttribute('language') : null, attributes: Object.keys(attrs).length ? attrs : undefined };
      }
      return null;
    }

    const out: ElementNode[] = [];
    doc.documentElement.childNodes.forEach(node => {
      const converted = nodeToElement(node);
      if (converted) out.push(converted);
    });
    return out;
  } catch (e) {
    const lines = text.split(/\n/).map(s => s.trim()).filter(Boolean);
    if (lines.length) {
      return [{ id: uid(), tagName: 'imported', content: lines.join('\n'), children: [] }];
    }
  }
  return [];
}
