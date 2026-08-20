import { el, clearNode } from "../shared/dom";
import { homeHash, navigate, parseHash } from "../shared/router";
import type { DemoDefinition } from "../shared/types";
import { createDemoHost } from "./host";
import { renderHome } from "./home";
import { DEMOS, getDemo } from "./registry";
import "./styles.css";

function shell(): {
  root: HTMLElement;
  stage: HTMLElement;
  title: HTMLElement;
  status: HTMLElement;
  live: HTMLElement;
  back: HTMLAnchorElement;
} {
  const skip = el("a", {
    className: "skip-link",
    text: "Skip to content",
    attrs: { href: "#main" }
  });

  const title = el("p", { className: "chrome-title", text: "Demo Launcher" });
  const status = el("p", {
    className: "chrome-status",
    attrs: { id: "launcher-status" },
    text: "Idle"
  });
  const back = el("a", {
    className: "return-link",
    text: "Return to Launcher",
    attrs: { href: homeHash() }
  });
  back.hidden = true;

  const live = el("div", {
    className: "visually-hidden",
    attrs: {
      id: "launcher-live",
      role: "status",
      "aria-live": "polite"
    }
  });

  const stage = el("div", {
    className: "stage",
    attrs: { id: "demo-stage" }
  });

  const header = el("header", {
    className: "chrome",
    children: [
      el("div", {
        className: "chrome-brand",
        children: [
          el("a", {
            className: "brand-link",
            text: "3D Toolkit",
            attrs: { href: homeHash() }
          }),
          title
        ]
      }),
      el("div", {
        className: "chrome-meta",
        children: [status, back]
      })
    ]
  });

  const main = el("main", {
    className: "main",
    attrs: { id: "main", tabindex: "-1" },
    children: [stage]
  });

  const root = el("div", {
    className: "app",
    children: [skip, header, live, main]
  });

  return { root, stage, title, status, live, back };
}

function bindKeyboard(demos: readonly DemoDefinition[]): () => void {
  const onKey = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      const route = parseHash(window.location.hash);
      if (route.kind === "demo") {
        event.preventDefault();
        navigate(homeHash());
      }
      return;
    }

    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const card = target.closest<HTMLElement>(".demo-card");
    if (!card) return;
    const id = card.dataset.demoId;
    if (!id) return;
    const index = demos.findIndex((demo) => demo.id === id);
    if (index < 0) return;
    const delta = event.key === "ArrowRight" ? 1 : -1;
    const next = demos[(index + delta + demos.length) % demos.length];
    if (!next) return;
    event.preventDefault();
    const nextLaunch = document.querySelector<HTMLAnchorElement>(
      `[data-demo-id="${next.id}"] .launch`
    );
    nextLaunch?.focus();
  };

  document.addEventListener("keydown", onKey);
  return () => document.removeEventListener("keydown", onKey);
}

export function startLauncher(root: HTMLElement): void {
  const ui = shell();
  const host = createDemoHost();
  root.replaceChildren(ui.root);

  const unbind = bindKeyboard(DEMOS);

  const render = async (): Promise<void> => {
    const route = parseHash(window.location.hash || "#/");
    if (route.kind === "home") {
      await host.dispose();
      ui.back.hidden = true;
      ui.title.textContent = "Demo Launcher";
      ui.status.textContent = "Catalog";
      clearNode(ui.stage);
      ui.stage.append(renderHome(DEMOS));
      ui.live.textContent = "Launcher catalog.";
      return;
    }

    if (route.kind === "demo") {
      const demo = getDemo(route.id);
      if (!demo) {
        await host.dispose();
        ui.back.hidden = false;
        ui.title.textContent = "Unknown demonstration";
        ui.status.textContent = "Error";
        clearNode(ui.stage);
        ui.stage.append(
          el("section", {
            className: "demo-error",
            attrs: { role: "alert" },
            children: [
              el("h2", { text: "Route not found" }),
              el("p", { text: `No demonstration is registered as ${route.id}.` }),
              el("a", { className: "launch", text: "Return to Launcher", attrs: { href: homeHash() } })
            ]
          })
        );
        return;
      }

      ui.back.hidden = false;
      ui.back.setAttribute("href", homeHash());
      ui.title.textContent = `${demo.number} · ${demo.title}`;
      ui.status.textContent = "Loading";
      clearNode(ui.stage);
      const frame = el("section", {
        className: "demo-frame",
        attrs: { "aria-label": demo.title }
      });
      const surface = el("div", { className: "demo-surface" });
      frame.append(surface);
      ui.stage.append(frame);
      await host.mount(demo, surface);
      const state = window.__DEMO_STATUS__?.state ?? "ready";
      ui.status.textContent = state;
      return;
    }

    await host.dispose();
    ui.back.hidden = false;
    ui.title.textContent = "Unknown route";
    ui.status.textContent = "Error";
    clearNode(ui.stage);
    ui.stage.append(
      el("section", {
        className: "demo-error",
        children: [
          el("h2", { text: "Unrecognized hash route" }),
          el("p", { text: `The launcher did not understand ${route.hash}.` }),
          el("a", { className: "launch", text: "Return to Launcher", attrs: { href: homeHash() } })
        ]
      })
    );
  };

  window.addEventListener("hashchange", () => {
    void render();
  });

  window.addEventListener("beforeunload", () => {
    unbind();
    void host.dispose();
  });

  if (!window.location.hash) {
    navigate(homeHash());
  } else {
    void render();
  }
}
