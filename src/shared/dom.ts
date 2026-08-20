export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options?: {
    className?: string;
    text?: string;
    attrs?: Record<string, string>;
    children?: Array<Node | string>;
  }
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (options?.className) node.className = options.className;
  if (options?.text) node.textContent = options.text;
  if (options?.attrs) {
    for (const [key, value] of Object.entries(options.attrs)) {
      node.setAttribute(key, value);
    }
  }
  if (options?.children) {
    for (const child of options.children) {
      node.append(child);
    }
  }
  return node;
}

export function clearNode(node: HTMLElement): void {
  node.replaceChildren();
}
