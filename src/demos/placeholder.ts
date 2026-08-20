import { el } from "../shared/dom";
import type { DemoHandle, DemoModule } from "../shared/types";

export function createUnbuiltDemo(id: string, title: string): DemoModule {
  return {
    mount(host, context): DemoHandle {
      const article = el("article", {
        className: "unbuilt-demo",
        attrs: { "aria-labelledby": `unbuilt-${id}` },
        children: [
          el("h2", { attrs: { id: `unbuilt-${id}` }, text: title }),
          el("p", {
            text: "This demonstration is registered in the launcher but is not implemented yet. The architecture contract is already declared beside the module."
          }),
          el("p", {
            className: "unbuilt-contract",
            children: [
              "Contract file: ",
              el("code", { text: `src/demos/${id}/architecture.project.json` })
            ]
          })
        ]
      });
      host.replaceChildren(article);
      context.setStatus({ state: "ready", detail: "Placeholder: not built" });
      context.announce(`${title} is not built yet.`);
      return {
        dispose() {
          host.replaceChildren();
        }
      };
    }
  };
}
