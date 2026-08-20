import type { Route } from "./types";

export function parseHash(hash: string): Route {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  const path = raw.split("?")[0] ?? "";
  const normalized = path.replace(/\/+$/, "") || "/";

  if (normalized === "/" || normalized === "") {
    return { kind: "home" };
  }

  const demoMatch = /^\/demo\/([a-z0-9-]+)$/.exec(normalized);
  if (demoMatch?.[1]) {
    return { kind: "demo", id: demoMatch[1] };
  }

  return { kind: "unknown", hash };
}

export function homeHash(): string {
  return "#/";
}

export function demoHash(id: string): string {
  return `#/demo/${id}`;
}

export function navigate(hash: string): void {
  if (window.location.hash === hash) {
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    return;
  }
  window.location.hash = hash;
}
