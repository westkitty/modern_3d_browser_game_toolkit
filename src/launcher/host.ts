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
  // A demo can allocate input/GPU resources before its async mount returns.
  // Serialize full transitions; token checks alone cannot prevent overlapping ownership.
  let transition: Promise<void> = Promise.resolve();

  const disposeCurrent = async (): Promise<void> => {
    const previous = handle;
    handle = null;
    activeId = null;
    try {
      await previous?.dispose();
    } finally {
      publishDemoStatus(null, "idle");
      publishDiagnostics(null);
    }
  };

  const queue = (operation: () => Promise<void>): Promise<void> => {
    const next = transition.catch(() => undefined).then(operation);
    transition = next;
    return next;
  };

  return {
    get activeId() {
      return activeId;
    },
    mount(definition, surface) {
      const token = ++generation;
      return queue(async () => {
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
            if (token === generation) publishDemoStatus(definition.id, status.state, status.detail);
          };

          const mounted = await module.mount(surface, {
            demoId: definition.id,
            reducedMotion: prefersReducedMotion(),
            announce: (message) => {
              if (token !== generation) return;
              const live = document.getElementById("launcher-live");
              if (live) live.textContent = message;
            },
            setStatus
          });

          // Never put a superseded mount into the current handle slot.
          if (token !== generation) {
            await mounted.dispose();
            return;
          }
          handle = mounted;
          if (!window.__DEMO_STATUS__ || window.__DEMO_STATUS__.state === "loading") {
            publishDemoStatus(definition.id, "ready");
          }
          publishDiagnostics(definition.id);
        } catch (error) {
          if (token !== generation) return;
          const detail = error instanceof Error ? error.message : String(error);
          activeId = null;
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
          publishDiagnostics(null);
        }
      });
    },
    dispose() {
      ++generation;
      return queue(async () => {
        await disposeCurrent();
        if (getActiveLoopOwners() !== 0) {
          console.warn(`Demo host disposed with ${getActiveLoopOwners()} remaining loop owner(s).`);
        }
      });
    }
  };
}
