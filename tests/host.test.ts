import { afterEach, describe, expect, it } from "vitest";
import { createDemoHost } from "../src/launcher/host";
import { getActiveLoopOwners, createFrameLoop } from "../src/shared/loop";
import type { DemoDefinition, DemoHandle } from "../src/shared/types";

function definition(
  id: string,
  mount: (host: HTMLElement) => DemoHandle | Promise<DemoHandle>
): DemoDefinition {
  return {
    id,
    number: "00",
    title: id,
    route: `#/demo/${id}`,
    renderPath: "threejs-webgl2",
    timingModel: "event",
    capability: "test",
    question: "test",
    status: "ready",
    load: async () => ({ mount: (host) => mount(host) })
  };
}

describe("demo host lifecycle", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it("disposes the previous demo before mounting the next", async () => {
    const order: string[] = [];
    const host = createDemoHost();
    const surface = document.createElement("div");

    await host.mount(
      definition("a", () => {
        order.push("mount-a");
        return {
          dispose() {
            order.push("dispose-a");
          }
        };
      }),
      surface
    );

    await host.mount(
      definition("b", () => {
        order.push("mount-b");
        return {
          dispose() {
            order.push("dispose-b");
          }
        };
      }),
      surface
    );

    expect(order).toEqual(["mount-a", "dispose-a", "mount-b"]);
    expect(host.activeId).toBe("b");
    await host.dispose();
    expect(order).toContain("dispose-b");
    expect(host.activeId).toBeNull();
  });

  it("stops a demo-owned frame loop on dispose", async () => {
    const host = createDemoHost();
    const surface = document.createElement("div");
    let loop = createFrameLoop(() => undefined);

    await host.mount(
      definition("loop", () => {
        loop = createFrameLoop(() => undefined);
        loop.start();
        return {
          dispose() {
            loop.stop();
          }
        };
      }),
      surface
    );

    expect(getActiveLoopOwners()).toBe(1);
    await host.dispose();
    expect(getActiveLoopOwners()).toBe(0);
    expect(loop.running).toBe(false);
  });

  it("surfaces mount failures without leaving an active demo", async () => {
    const host = createDemoHost();
    const surface = document.createElement("div");
    document.body.append(surface);

    await host.mount(
      definition("boom", () => {
        throw new Error("shader compile failed");
      }),
      surface
    );

    expect(surface.textContent).toContain("shader compile failed");
    expect(window.__DEMO_STATUS__?.state).toBe("error");
    await host.dispose();
  });
});
