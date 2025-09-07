// src/lib/treeUtils.ts
import type { ElementNode } from './types';
import { clone } from './utils';

/** removeById and insertAsChild (keep existing behavior) */
export function removeById(list: ElementNode[], id: string): { removed: ElementNode | null; list: ElementNode[] } {
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

export function insertAsChild(list: ElementNode[], parentId: string | null, node: ElementNode) {
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

export function findById(id: string | null, list: ElementNode[]): ElementNode | null {
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

/**
 * Pure helper: move an element up among its siblings. Returns new list.
 * If item is already first among siblings, returns original clone.
 */
export function moveUpById(list: ElementNode[], id: string): ElementNode[] {
  const cloned = clone(list);

  function recurse(arr: ElementNode[]): boolean {
    for (let i = 0; i < arr.length; i++) {
      const el = arr[i];
      if (el.id === id) {
        if (i === 0) return false;
        const tmp = arr[i - 1];
        arr[i - 1] = el;
        arr[i] = tmp;
        return true;
      }
      if (el.children && recurse(el.children)) return true;
    }
    return false;
  }

  recurse(cloned);
  return cloned;
}

/**
 * Pure helper: move an element down among siblings. Returns new list.
 */
export function moveDownById(list: ElementNode[], id: string): ElementNode[] {
  const cloned = clone(list);

  function recurse(arr: ElementNode[]): boolean {
    for (let i = 0; i < arr.length; i++) {
      const el = arr[i];
      if (el.id === id) {
        if (i >= arr.length - 1) return false;
        const tmp = arr[i + 1];
        arr[i + 1] = el;
        arr[i] = tmp;
        return true;
      }
      if (el.children && recurse(el.children)) return true;
    }
    return false;
  }

  recurse(cloned);
  return cloned;
}

/** Clear all elements (returns empty array) */
export function clearAll(list: ElementNode[]): ElementNode[] {
  return [];
}
