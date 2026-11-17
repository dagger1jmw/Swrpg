// Tiny DOM helpers. All text goes through textContent; AI text is never parsed as HTML.

type Child = Node | string | null | undefined | false;

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<{ class: string; text: string; attrs: Record<string, string>; on: Partial<Record<keyof HTMLElementEventMap, (e: Event) => void>> }> = {},
  children: Child[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (props.class) node.className = props.class;
  if (props.text !== undefined) node.textContent = props.text;
  for (const [k, v] of Object.entries(props.attrs ?? {})) node.setAttribute(k, v);
  for (const [evt, fn] of Object.entries(props.on ?? {})) if (fn) node.addEventListener(evt, fn as EventListener);
  for (const c of children) if (c !== null && c !== undefined && c !== false) node.append(c);
  return node;
}

export function clear(node: Element): void {
  while (node.firstChild) node.removeChild(node.firstChild);
}

/** Splits prose on blank lines into <p> elements (text only). */
export function paragraphs(text: string): HTMLElement[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => el('p', { text: p }));
}

export function input(attrs: Record<string, string>): HTMLInputElement {
  return el('input', { attrs });
}
