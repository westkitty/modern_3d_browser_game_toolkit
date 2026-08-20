import { prefersReducedMotion, publishDemoStatus, publishDiagnostics } from "../shared/diagnostics";
import { getActiveLoopOwners } from "../shared/loop";
import type { DemoDefinition, DemoHandle, DemoStatus } from "../shared/types";

export interface DemoHost {
  mount(definition: DemoDefinition, surface: HTMLElement): Promise<void>;
  dispose(): Promise<void>;
  readonly activeId: string | null;
}

export function createDemoHost(): DemoHost {
  let generation = 0;
  let activeId: string | null = null;
  let handle: DemoHandle | null = null;

  const disposeCurrent = async (): Promise<void> => {
    const current = handle;
    handle = null;
    activeId = null;
    if (current) {
      await current.dispose();
    }
    publishDemoStatus(null, "idle");
    publishDiagnostics(null);
  };

  return {
    get activeId() {
      return activeId;
    },
    async mount(definition, surface) {
      const token = ++generation;
      await disposeCurrent();
      if (token !== generation) return;

      activeId = definition.id;
      surface.replaceChildren();
      publishDemoStatus(definition.id, "loading", "Loading demonstration module.");
      publishDiagnostics(definition.id);

      try {
        const module = await definition.load();
        if (token !== generation) return;

        const setStatus = (status: DemoStatus): void => {
          if (token !== generation) return;
          publishDemoStatus(definition.id, status.state, status.detail);
        };

        handle = await module.mount(surface, {
          demoId: definition.id,
          reducedMotion: prefersReducedMotion(),
          announce: (message) => {
            const live = document.getElementById("launcher-live");
            if (live) live.textContent = message;
          },
          setStatus
        });

        if (token !== generation) {
          await handle.dispose();
          handle = null;
          return;
        }

        if (!window.__DEMO_STATUS__ || window.__DEMO_STATUS__.state === "loading") {
          publishDemoStatus(definition.id, "ready");
        }
        publishDiagnostics(definition.id);
      } catch (error) {
        if (token !== generation) return;
        const detail = error instanceof Error ? error.message : String(error);
        surface.replaceChildren();
        const section = document.createElement("section");
        section.className = "demo-error";
        section.setAttribute("role", "alert");
        const heading = document.createElement("h2");
        heading.textContent = "Demonstration failed to start";
        const body = document.createElement("p");
        body.textContent = detail;
        section.append(heading, body);
        surface.append(section);
        publishDemoStatus(definition.id, "error", detail);
        publishDiagnostics(definition.id);
      }
    },
    async dispose() {
      generation += 1;
      await disposeCurrent();
      if (getActiveLoopOwners() !== 0) {
        console.warn(
          `Demo host disposed with ${getActiveLoopOwners()} remaining loop owner(s).`
        );
      }
    }
  };
}
