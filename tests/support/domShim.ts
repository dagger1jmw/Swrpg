// A minimal DOM for rendering the UI's own functions in Node (opt-2 G3): enough of document.createElement for src/ui/dom.ts el()
// and the side panel's tabs, and a walk that collects what a player reads (text, titles, labels). No layout, no events.

export interface ShimNode {
  tagName: string;
  className: string;
  children: (ShimNode | string)[];
  attrs: Record<string, string>;
  textContent: string;
  [k: string]: unknown;
}

function makeElement(tag: string): ShimNode {
  let own = '';
  const node: ShimNode = {
    tagName: tag.toUpperCase(),
    className: '',
    children: [],
    attrs: {},
    style: {},
    dataset: {},
    classList: { add: () => undefined, remove: () => undefined, toggle: () => undefined, contains: () => false },
    get textContent(): string {
      return own + node.children.map((c) => (typeof c === 'string' ? c : c.textContent)).join('');
    },
    set textContent(v: string) {
      node.children = [];
      own = String(v ?? '');
    },
    setAttribute: (k: string, v: string) => {
      node.attrs[k] = String(v);
    },
    getAttribute: (k: string) => node.attrs[k] ?? null,
    removeAttribute: (k: string) => {
      delete node.attrs[k];
    },
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    append: (...c: (ShimNode | string)[]) => {
      node.children.push(...c);
    },
    appendChild: (c: ShimNode) => {
      node.children.push(c);
      return c;
    },
    replaceChildren: (...c: (ShimNode | string)[]) => {
      node.children = c;
    },
    removeChild: (c: ShimNode) => {
      node.children = node.children.filter((x) => x !== c);
      return c;
    },
    get ownText(): string {
      return own;
    },
    get firstChild() {
      return node.children[0] ?? null;
    },
    querySelector: () => null,
    querySelectorAll: () => [],
    focus: () => undefined,
  };
  return node;
}

/** Installs the shim as globalThis.document (once). */
export function installDomShim(): void {
  const g = globalThis as unknown as { document?: unknown };
  if (g.document) return;
  g.document = { createElement: makeElement, createTextNode: (t: string) => t };
}

/** Every piece of text a player reads in a rendered tree: own text, and the title and aria-label attributes. */
export function readable(node: ShimNode | string | ShimNode[], out: string[] = []): string[] {
  if (Array.isArray(node)) {
    for (const n of node) readable(n, out);
    return out;
  }
  if (typeof node === 'string') {
    if (node.trim()) out.push(node);
    return out;
  }
  for (const k of ['title', 'aria-label', 'placeholder']) if (node.attrs[k]) out.push(node.attrs[k]!);
  const ownText = String(node['ownText'] ?? '');
  if (ownText.trim()) out.push(ownText);
  for (const c of node.children) readable(c, out);
  return out;
}
