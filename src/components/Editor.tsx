// src/components/Editor.tsx
import React, { useEffect, useState } from 'react';
import type { ElementNode } from '../lib/types';
import { useLocale } from '../lib/i18n.tsx';

export default function Editor({ selected, onSave, onAddChild, onRequestAutoChild, onMarkdownToXml } : {
  selected: ElementNode | null;
  onSave: (tagName: string, content: string, codeBlock?: boolean, codeLanguage?: string | null, forceCDATA?: boolean) => void;
  onAddChild: () => void;
  onRequestAutoChild: () => void;
  onMarkdownToXml: (md: string) => void;
}) {
  const { t } = useLocale();
  const [tagName, setTagName] = useState('');
  const [content, setContent] = useState('');
  const [codeChecked, setCodeChecked] = useState(false);
  const [selectedLang, setSelectedLang] = useState<string | null>(null);
  const [forceCDATA, setForceCDATA] = useState(false);

  useEffect(() => {
    setTagName(selected?.tagName || '');
    setContent(selected?.content || '');
    setCodeChecked(Boolean(selected?.codeBlock));
    setSelectedLang(selected?.codeLanguage || null);
    setForceCDATA(Boolean(selected?.forceCDATA));
  }, [selected?.id]);

  useEffect(() => {
    if (!selected) return;
    const tId = setTimeout(() => onSave(tagName, content, codeChecked, selectedLang, forceCDATA), 450);
    return () => clearTimeout(tId);
  }, [tagName, content, codeChecked, selectedLang, forceCDATA]);

  return (
    <div className="mt-4 space-y-3 editor card">
      <label className="block">
        <span className="label">{t('tagName')}</span>
        <input value={tagName} onChange={(e) => setTagName(e.target.value)} className="input" />
      </label>

      <label className="block">
        <span className="label">{t('content')}</span>
        <textarea rows={8} value={content} onChange={(e) => setContent(e.target.value)} placeholder={t('pasteHint')} className="textarea" onBlur={() => { onSave(tagName, content, codeChecked, selectedLang, forceCDATA); onRequestAutoChild(); }} />
      </label>

      <div className="flex items-center gap-3">
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={codeChecked} onChange={(e) => setCodeChecked(e.target.checked)} />
          <span>{t('codeBlock')}</span>
        </label>

        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={forceCDATA} onChange={(e) => setForceCDATA(e.target.checked)} />
          <span>Force CDATA</span>
        </label>

        {codeChecked && (
          <select value={selectedLang || 'auto'} onChange={(e) => setSelectedLang(e.target.value || null)} className="px-2 py-1 border rounded text-sm">
            <option value="auto">auto</option>
            <option value="javascript">javascript</option>
            <option value="python">python</option>
            <option value="bash">bash</option>
            <option value="json">json</option>
          </select>
        )}
      </div>

      <div className="editor-actions">
        <button onClick={() => onSave(tagName, content, codeChecked, selectedLang, forceCDATA)} className="btn primary">{t('save')}</button>
        <button onClick={onAddChild} className="btn ghost">{t('addChild')}</button>
        <button onClick={() => onRequestAutoChild()} className="btn ghost" disabled={codeChecked}>{t('autoChild')}</button>
        <button onClick={() => onMarkdownToXml(content)} className="btn" style={{ marginLeft: 'auto', color: '#f97316' }}>MD→XML</button>
      </div>
    </div>
  );
}
