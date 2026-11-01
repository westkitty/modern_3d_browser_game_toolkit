import { describe, expect, it } from "vitest";
import { createDemoHost } from "../src/launcher/host";
import { createResourceScope, resourceSnapshot } from "../src/shared/resources";
import type { DemoDefinition } from "../src/shared/types";

describe("explicit resource ownership", () => {
  it("returns counts to baseline after repeated mount/unmount ownership cycles", () => {
    const before = resourceSnapshot();
    for (let cycle = 0; cycle < 20; cycle += 1) {
      const scope = createResourceScope();
      scope.own("runtime");
      scope.own("scene");
      scope.own("geometry");
      scope.own("material");
      scope.own("streamedZone");
      const target = new EventTarget();
      scope.listen(target, "tick", () => undefined);
      scope.dispose();
    }
    expect(resourceSnapshot()).toEqual(before);
  });


  it("immediately disposes late acquisitions without registering new ownership", () => {
    const before = resourceSnapshot();
    const scope = createResourceScope();
    scope.dispose();
    let called = 0;
    scope.own("runtime", () => { called += 1; });
    const target = new EventTarget();
    let observed = 0;
    scope.listen(target, "event", () => { observed += 1; });
    target.dispatchEvent(new Event("event"));
    scope.dispose();
    expect(called).toBe(1);
    expect(observed).toBe(0);
    expect(resourceSnapshot()).toEqual(before);
  });

  it("disposes owned resources exactly once", () => {
    const scope = createResourceScope();
    let disposed = 0;
    scope.own("geometry", () => { disposed += 1; });
    scope.dispose();
    scope.dispose();
    expect(disposed).toBe(1);
  });

  it("returns ownership to baseline across repeated host mount/unmount cycles", async () => {
    const before = resourceSnapshot();
    const host = createDemoHost();
    const surface = document.createElement("div");
    const definition: DemoDefinition = {
      id: "resource-cycle",
      number: "00",
      title: "resource-cycle",
      route: "#/demo/resource-cycle",
      renderPath: "threejs-webgl2",
      timingModel: "event",
      capability: "test",
      question: "test",
      status: "ready",
      load: async () => ({
        mount: () => {
          const scope = createResourceScope();
          scope.own("runtime");
          scope.own("scene");
          scope.own("geometry");
          scope.own("material");
          scope.listen(window, "blur", () => undefined);
          return { dispose: () => scope.dispose() };
        }
      })
    };

    for (let i = 0; i < 12; i += 1) {
      await host.mount(definition, surface);
      await host.dispose();
      expect(resourceSnapshot()).toEqual(before);
    }
  });
});
