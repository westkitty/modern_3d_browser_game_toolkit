import { el } from "../shared/dom";
import type { DemoDefinition } from "../shared/types";

function card(demo: DemoDefinition): HTMLLIElement {
  const launch = el("a", {
    className: "launch",
    text: demo.status === "ready" ? "Launch" : "Open (not built)",
    attrs: {
      href: demo.route,
      "aria-describedby": `demo-${demo.id}-desc`
    }
  });

  const article = el("article", {
    className: `demo-card status-${demo.status}`,
    attrs: {
      "data-demo-id": demo.id,
      "aria-labelledby": `demo-${demo.id}-title`
    },
    children: [
      el("header", {
        className: "card-head",
        children: [
          el("p", { className: "demo-number", text: demo.number }),
          el("h2", {
            attrs: { id: `demo-${demo.id}-title` },
            text: demo.title
          })
        ]
      }),
      el("dl", {
        className: "contract",
        children: [
          el("div", {
            children: [el("dt", { text: "Renderer" }), el("dd", { text: demo.renderPath })]
          }),
          el("div", {
            children: [el("dt", { text: "Timing" }), el("dd", { text: demo.timingModel })]
          }),
          el("div", {
            children: [
              el("dt", { text: "Activated capability" }),
              el("dd", { text: demo.capability })
            ]
          })
        ]
      }),
      el("p", {
        className: "question",
        attrs: { id: `demo-${demo.id}-desc` },
        text: demo.question
      }),
      el("p", {
        className: "build-status",
        text: demo.status === "ready" ? "Built" : "Not built"
      }),
      launch
    ]
  });

  const item = el("li", { children: [article] });
  return item;
}

export function renderHome(demos: readonly DemoDefinition[]): HTMLElement {
  return el("div", {
    className: "home",
    children: [
      el("header", {
        className: "home-hero",
        children: [
          el("p", { className: "eyebrow", text: "Architecture Toolkit v1.1" }),
          el("h1", { text: "Modern 3D Browser Game Demo Launcher" }),
          el("p", {
            className: "lede",
            text: "Ten independently runnable demonstrations. The game’s requirements determine the renderer. Three.js, Canvas 2D, raw WebGL2, and raw WebGPU are not interchangeable prestige layers."
          })
        ]
      }),
      el("ol", {
        className: "demo-grid",
        children: demos.map(card)
      })
    ]
  });
}
