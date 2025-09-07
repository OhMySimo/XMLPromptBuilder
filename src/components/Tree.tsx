// src/components/Tree.tsx
import React, { useCallback, useMemo } from 'react';
import type { ElementNode } from '../lib/types';
import {
  ChevronDown,
  ChevronRight,
  PlusCircle,
  Trash2,
  FileText,
  Code,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

type Props = {
  elements: ElementNode[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  onAddChild: (parentId: string | null) => void;
  onDelete: (id: string) => void;
  onToggleCollapse: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  className?: string;
};

export default function Tree({
  elements,
  selectedId,
  onSelect,
  onAddChild,
  onDelete,
  onToggleCollapse,
  onMoveUp,
  onMoveDown,
  className = '',
}: Props) {
  const hasElements = elements && elements.length > 0;

  return (
    <div className={`tree ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold">Structure</h4>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAddChild(null)}
            title="Add root element"
            className="btn small ghost"
            aria-label="Add root element"
          >
            <PlusCircle size={14} /> <span>Add root</span>
          </button>
        </div>
      </div>

      {!hasElements ? (
        <div className="text-sm text-gray-500">No elements yet — add one to get started.</div>
      ) : (
        <ul className="space-y-1" role="tree" aria-label="Structure tree">
          {elements.map(el => (
            <TreeNode
              key={el.id}
              node={el}
              depth={0}
              selectedId={selectedId}
              onSelect={onSelect}
              onAddChild={onAddChild}
              onDelete={onDelete}
              onToggleCollapse={onToggleCollapse}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function NodeLabel({ node }: { node: ElementNode }) {
  const isCode = node.codeBlock;
  const contentSnippet = useMemo(() => {
    const txt = (node.content || '').replace(/\n+/g, ' ').trim();
    return txt.length > 60 ? txt.slice(0, 60) + '…' : txt;
  }, [node.content]);

  return (
    <div className="flex items-center gap-2 truncate">
      {isCode ? <Code size={14} className="text-slate-500" /> : <FileText size={14} className="text-slate-500" />}
      <div className="flex flex-col min-w-0">
        <div className="text-sm font-medium truncate">
          <span className="tag-badge">{node.tagName || 'unnamed'}</span>
        </div>
        {contentSnippet ? <div className="text-xs text-slate-400 truncate">{contentSnippet}</div> : null}
      </div>
    </div>
  );
}

function TreeNode({
  node,
  depth,
  selectedId,
  onSelect,
  onAddChild,
  onDelete,
  onToggleCollapse,
  onMoveUp,
  onMoveDown,
}: {
  node: ElementNode;
  depth: number;
  selectedId?: string | null;
  onSelect: (id: string) => void;
  onAddChild: (parentId: string | null) => void;
  onDelete: (id: string) => void;
  onToggleCollapse: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
}) {
  const collapsed = !!node.collapsed;
  const isSelected = selectedId === node.id;

  // CSS expects data-level 1..5 (we clamp at 6 to allow deeper trees)
  const dataLevel = Math.min(6, depth + 1);

  const handleSelect = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect(node.id);
    },
    [node.id, onSelect]
  );

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleCollapse(node.id);
    },
    [node.id, onToggleCollapse]
  );

  const handleAddChild = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onAddChild(node.id);
    },
    [node.id, onAddChild]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete(node.id);
    },
    [node.id, onDelete]
  );

  const handleMoveUp = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onMoveUp(node.id);
    },
    [node.id, onMoveUp]
  );
  const handleMoveDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onMoveDown(node.id);
    },
    [node.id, onMoveDown]
  );

  // keyboard accessibility: Enter/Space selects; arrows expand/collapse
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(node.id);
    } else if (e.key === 'ArrowRight') {
      if (collapsed && node.children && node.children.length > 0) {
        onToggleCollapse(node.id);
      }
    } else if (e.key === 'ArrowLeft') {
      if (!collapsed && node.children && node.children.length > 0) {
        onToggleCollapse(node.id);
      }
    }
  };

  return (
    <li role="none">
      <div
        role="treeitem"
        aria-level={dataLevel}
        aria-expanded={node.children && node.children.length > 0 ? !collapsed : undefined}
        className={`node ${isSelected ? 'selected' : ''}`}
        data-level={dataLevel}
        onClick={handleSelect}
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        {/* expand/collapse control */}
        <div onClick={(e) => { e.stopPropagation(); handleToggle(e as any); }} className="node-action-btn" aria-hidden>
          {node.children && node.children.length > 0 ? (
            collapsed ? (
              <ChevronRight size={16} className="text-slate-400" />
            ) : (
              <ChevronDown size={16} className="text-slate-400" />
            )
          ) : (
            // spacer to align with chevron
            <div style={{ width: 16, height: 16 }} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <NodeLabel node={node} />
        </div>

        <div className="flex items-center gap-1">
          <button title="Move up" onClick={handleMoveUp} className="node-action-btn" aria-label="Move up">
            <ArrowUp size={14} />
          </button>
          <button title="Move down" onClick={handleMoveDown} className="node-action-btn" aria-label="Move down">
            <ArrowDown size={14} />
          </button>
          <button title="Add child" onClick={handleAddChild} className="node-action-btn" aria-label="Add child">
            <PlusCircle size={14} />
          </button>
          <button title="Delete" onClick={handleDelete} className="node-action-btn" aria-label="Delete">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* children */}
      {!collapsed && node.children && node.children.length > 0 ? (
        <ul role="group" className="mt-1">
          {node.children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onAddChild={onAddChild}
              onDelete={onDelete}
              onToggleCollapse={onToggleCollapse}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
