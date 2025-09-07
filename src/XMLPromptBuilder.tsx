// src/XMLPromptBuilder.tsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import type { ElementNode, ToastItem } from './lib/types';
import { uid, estimateTokens, clone } from './lib/utils';
import { parseMarkdownToElements } from './lib/markdownParser';
import { generateXML, highlightXML } from './lib/xmlGenerator';
import { removeById, insertAsChild, findById, moveUpById, moveDownById, clearAll } from './lib/treeUtils';

import Toast from './components/Toast';
import Editor from './components/Editor';
import Tree from './components/Tree';
import ConfirmModal from './components/ConfirmModal';
import { LocaleProvider, useLocale } from './lib/i18n';

import './styles.css';

function defaultElements() {
  return [
    { id: uid(), tagName: 'instructions_setup', content: 'You are a helpful AI assistant.', children: [] },
    { id: uid(), tagName: 'examples_list', content: '1) First example\n2) Second example', children: [] }
  ] as ElementNode[];
}

function loadInitial() {
  try {
    const raw = localStorage.getItem('xmlpb_elements');
    if (raw) return JSON.parse(raw) as ElementNode[];
  } catch (e) {}
  return defaultElements();
}

const TEMPLATES = [
  { id: 'tmpl_prompt', label: 'Prompt Engineering', desc: 'role / context / instructions / examples', node: { tagName: 'prompt', content: '', children: [{ id: uid(), tagName: 'role', content: 'system', children: [] }, { id: uid(), tagName: 'context', content: '', children: [] }, { id: uid(), tagName: 'instructions', content: '', children: [] }] } },
  { id: 'tmpl_code', label: 'Coding Assistant', desc: 'requirements / constraints / code', node: { tagName: 'assistant_code', content: '', children: [{ id: uid(), tagName: 'requirements', content: '', children: [] }, { id: uid(), tagName: 'constraints', content: '', children: [] }, { id: uid(), tagName: 'example_code', content: '', children: [] }] } },
  { id: 'tmpl_cot', label: 'Chain of Thought', desc: 'problem / thinking / reasoning / conclusion', node: { tagName: 'chain_of_thought', content: '', children: [{ id: uid(), tagName: 'problem', content: '', children: [] }, { id: uid(), tagName: 'thinking', content: '', children: [] }, { id: uid(), tagName: 'conclusion', content: '', children: [] }] } }
];

function usePersistentState<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as T;
    } catch (e) {}
    return initial;
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(state)); } catch (e) {} }, [key, state]);
  return [state, setState] as const;
}

function autoChildrenFromContent(content: string) {
  // Parse many list patterns into array of strings
  if (!content || !content.trim()) return [];
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  const items: string[] = [];

  // pattern 1: numbered "1. text" or "1) text"
  const numRx = /^\d+[\.\)]\s+(.*)$/;
  const letterRx = /^[a-zA-Z][\.\)]\s+(.*)$/;
  const bulletRx = /^[-\*\+]\s+(.*)$/;
  const hashNumRx = /^#\d+\s+(.*)$/;

  for (const l of lines) {
    let m;
    if ((m = l.match(numRx))) items.push(m[1]);
    else if ((m = l.match(letterRx))) items.push(m[1]);
    else if ((m = l.match(bulletRx))) items.push(m[1]);
    else if ((m = l.match(hashNumRx))) items.push(m[1]);
    else items.push(l);
  }

  return items;
}

function AppInner() {
  const { t, lang, setLang } = useLocale();

  const [elements, setElements] = usePersistentState<ElementNode[]>('xmlpb_elements', loadInitial());
  const [selectedId, setSelectedId] = useState<string | null>(elements[0]?.id ?? null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [xmlExpanded, setXmlExpanded] = useState(false);
  const [validation, setValidation] = useState<{ ok: boolean; message: string | null }>({ ok: true, message: null });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMeta, setConfirmMeta] = useState<{ id?: string | null; title?: string; body?: string; okLabel?: string } | null>(null);

  useEffect(() => { localStorage.setItem('xmlpb_elements', JSON.stringify(elements)); }, [elements]);

  const xml = useMemo(() => generateXML(elements), [elements]);
  const tokens = useMemo(() => estimateTokens(xml), [xml]);

  useEffect(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<root>${xml}</root>`, 'application/xml');
    const err = doc.querySelector('parsererror');
    if (err) setValidation({ ok: false, message: err.textContent || 'XML parse error' });
    else setValidation({ ok: true, message: null });
  }, [xml]);

  function showToast(text: string, type: ToastItem['type'] = 'info') {
    const toast: ToastItem = { id: uid(), text, type };
    setToasts(prev => [...prev, toast]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toast.id)), 4200);
  }

  function addElement(parentId: string | null = null, template?: Partial<ElementNode>) {
    const newEl: ElementNode = { id: uid(), tagName: template?.tagName || 'new_tag', content: template?.content || '', children: template?.children ? template.children.map(c => ({ ...c, id: uid() })) : [], codeBlock: template?.codeBlock, codeLanguage: template?.codeLanguage || null, attributes: template?.attributes || undefined, forceCDATA: template?.forceCDATA || false };
    setElements(prev => parentId ? insertAsChild(prev, parentId, newEl) : [...prev, newEl]);
    setSelectedId(newEl.id);
    showToast(t('elementAdded'), 'success');
  }

  function deleteElementConfirmed(id: string) {
    const { list } = removeById(elements, id);
    setElements(list);
    if (selectedId === id) setSelectedId(null);
    showToast(t('elementDeleted'), 'info');
  }

  function requestDelete(id: string) {
    setConfirmMeta({ id, title: t('confirmDeleteTitle'), body: t('confirmDeleteBody'), okLabel: 'Delete' });
    setConfirmOpen(true);
  }

  function handleConfirmOk() {
    if (confirmMeta?.id) deleteElementConfirmed(confirmMeta.id);
    else {
      // clear all
      setElements([]);
      setSelectedId(null);
      showToast(t('elementDeleted'), 'info');
    }
    setConfirmOpen(false);
    setConfirmMeta(null);
  }
  function handleConfirmCancel() {
    setConfirmOpen(false);
    setConfirmMeta(null);
  }

  function saveSelected(tagName: string, content: string, codeBlock?: boolean, codeLanguage?: string | null, forceCDATA?: boolean) {
    if (!selectedId) { showToast('Select an element first', 'info'); return; }
    setElements(prev => {
      const cloned = clone(prev);
      function update(list: ElementNode[]): boolean {
        for (const el of list) {
          if (el.id === selectedId) {
            el.tagName = tagName.trim() || el.tagName;
            el.content = content;
            el.codeBlock = Boolean(codeBlock);
            el.codeLanguage = codeLanguage || null;
            el.forceCDATA = Boolean(forceCDATA);
            return true;
          }
          if (el.children && update(el.children)) return true;
        }
        return false;
      }
      update(cloned);
      return cloned;
    });
  }

  async function copyXML() {
    try { await navigator.clipboard.writeText(xml); showToast(t('copied'), 'success'); } catch (e) { showToast('Copy failed', 'error'); }
  }

  function applyMarkdownToSelected(mdContent: string) {
    if (!selectedId) { showToast('Select an element first', 'info'); return; }
    const parsed = parseMarkdownToElements(mdContent || '');
    if (!parsed || parsed.length === 0) { showToast(t('noParsedContent'), 'info'); return; }

    setElements(prev => {
      const cloned = clone(prev);
      function replace(list: ElementNode[]): boolean {
        for (let i = 0; i < list.length; i++) {
          if (list[i].id === selectedId) {
            const target = list[i];
            const first = parsed[0];
            const nonGeneric = first && first.tagName && !['p', 'list', 'hr', 'imported', 'pre'].includes(first.tagName);

            if (nonGeneric && first.tagName.startsWith('h')) {
              target.tagName = first.tagName;
              target.content = first.content || '';
              target.children = parsed.slice(1).map(p => ({ ...p, id: uid() }));
            } else {
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

    showToast(t('importedNodes').replace('{{n}}', String(parsed.length)), 'success');
  }

  // ---------- move handlers ----------
  function handleMoveUp(id: string) { setElements(prev => moveUpById(prev, id)); }
  function handleMoveDown(id: string) { setElements(prev => moveDownById(prev, id)); }

  // ---------- auto child ----------
  function handleRequestAutoChild() {
    if (!selectedId) return;
    const el = findById(selectedId, elements);
    if (!el) return;
    const items = autoChildrenFromContent(el.content || '');
    if (!items.length) { showToast(t('noParsedContent'), 'info'); return; }
    setElements(prev => {
      const cloned = clone(prev);
      function recurse(list: ElementNode[]) {
        for (const n of list) {
          if (n.id === selectedId) {
            n.children = (n.children || []).concat(items.map(it => ({ id: uid(), tagName: 'item', content: it, children: [] })));
            n.content = ''; // clear content as requested
            return true;
          }
          if (n.children && recurse(n.children)) return true;
        }
        return false;
      }
      recurse(cloned);
      return cloned;
    });
    showToast(`Created ${items.length} child elements`, 'success');
  }

  function handleClearAll() {
    setConfirmMeta({ id: null, title: t('confirmClearTitle'), body: t('confirmClearBody'), okLabel: t('clearAll') });
    setConfirmOpen(true);
  }

  const selectedElement = findById(selectedId, elements);

  // templates
  const handleAddTemplate = (tmplId: string) => {
    const tmpl = TEMPLATES.find(t => t.id === tmplId);
    if (!tmpl) return;
    addElement(null, { tagName: tmpl.node.tagName, content: tmpl.node.content, children: tmpl.node.children });
  };

  // theme
  const [theme, setTheme] = usePersistentState<'system' | 'dark' | 'light'>('xmlpb_theme', 'system');
  useEffect(() => {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const apply = (t: string) => {
      const root = document.documentElement;
      if (t === 'system') { root.classList.toggle('dark', prefersDark); } else { root.classList.toggle('dark', t === 'dark'); }
    };
    apply(theme);
  }, [theme]);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-sm text-gray-500">modern UI · templates · MD→XML · dark mode</p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2">
            <select value={lang} onChange={(e) => setLang(e.target.value as 'en'|'it')} className="px-2 py-1 border rounded">
              <option value="en">English</option>
              <option value="it">Italiano</option>
            </select>
          </label>

          <label className="flex items-center gap-2">
            <select value={theme} onChange={(e) => setTheme(e.target.value as 'system'|'dark'|'light')} className="px-2 py-1 border rounded">
              <option value="system">{t('themeSystem')}</option>
              <option value="dark">{t('themeDark')}</option>
              <option value="light">{t('themeLight')}</option>
            </select>
          </label>

          <label className="flex items-center gap-2">
            <span className="text-sm muted">{t('templatesLabel')}:</span>
            <select onChange={(e) => { if (e.target.value) handleAddTemplate(e.target.value); e.target.value=''; }} className="px-2 py-1 border rounded">
              <option value="">—</option>
              {TEMPLATES.map(tpl => <option value={tpl.id} key={tpl.id}>{tpl.label}</option>)}
            </select>
          </label>

          <button onClick={handleClearAll} className="btn danger">{t('clearAll')}</button>
        </div>
      </header>

      <main className="grid lg:grid-cols-3 gap-4">
        <aside className="col-span-1">
          <Tree
            elements={elements}
            selectedId={selectedId}
            onSelect={(id) => setSelectedId(id)}
            onAddChild={(parentId) => addElement(parentId ?? null)}
            onDelete={(id) => requestDelete(id)}
            onToggleCollapse={(id) => setElements(prev => { const c = clone(prev); function recurse(list:any[]): boolean { for (const el of list) { if (el.id === id) { el.collapsed = !el.collapsed; return true } if (el.children && recurse(el.children)) return true } return false } recurse(c); return c; })}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
          />
        </aside>

        <section className="col-span-2 space-y-4">
          <Editor
            selected={selectedElement}
            onSave={saveSelected}
            onAddChild={() => addElement(selectedId || null)}
            onRequestAutoChild={() => handleRequestAutoChild()}
            onMarkdownToXml={(md) => applyMarkdownToSelected(md)}
          />

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Generated XML</h3>
              <div className="flex gap-2">
                <button onClick={() => copyXML()} className="px-3 py-1 border rounded">{t('copy')}</button>
                <button onClick={() => setXmlExpanded(!xmlExpanded)} className="px-3 py-1 border rounded">{xmlExpanded ? t('collapse') : t('expand')}</button>
              </div>
            </div>

            <pre className={`xml-output ${xmlExpanded ? 'expanded' : ''}`} dangerouslySetInnerHTML={{ __html: highlightXML(xml) }} />

            <div className={`px-3 py-2 rounded-b-lg border-t ${validation.ok ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
              {validation.ok ? t('xmlValid', { count: tokens }) : t('xmlError', { msg: validation.message })}
            </div>
          </div>
        </section>
      </main>

      <Toast items={toasts} />

      <ConfirmModal open={confirmOpen} title={confirmMeta?.title || ''} body={confirmMeta?.body || ''} onConfirm={handleConfirmOk} onCancel={handleConfirmCancel} confirmLabel={confirmMeta?.okLabel} />
    </div>
  );
}

export default function XMLPromptBuilderRootWrapper() {
  return (
    <LocaleProvider>
      <AppInner />
    </LocaleProvider>
  );
}
;