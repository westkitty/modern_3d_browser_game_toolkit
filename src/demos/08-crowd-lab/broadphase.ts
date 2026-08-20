export interface Agent {
  id: number;
  x: number;
  z: number;
  vx: number;
  vz: number;
}

export function naivePairs(agents: Agent[]): number {
  let count = 0;
  for (let i = 0; i < agents.length; i += 1) {
    for (let j = i + 1; j < agents.length; j += 1) count += 1;
  }
  return count;
}

export function hashPairs(agents: Agent[], cell: number): { candidates: number; cells: number } {
  const buckets = new Map<string, Agent[]>();
  for (const agent of agents) {
    const key = `${Math.floor(agent.x / cell)},${Math.floor(agent.z / cell)}`;
    const list = buckets.get(key);
    if (list) list.push(agent);
    else buckets.set(key, [agent]);
  }
  let candidates = 0;
  for (const list of buckets.values()) {
    for (let i = 0; i < list.length; i += 1) {
      for (let j = i + 1; j < list.length; j += 1) candidates += 1;
    }
  }
  return { candidates, cells: buckets.size };
}

export function spawnAgents(count: number, mode: "uniform" | "clustered"): Agent[] {
  const agents: Agent[] = [];
  for (let i = 0; i < count; i += 1) {
    if (mode === "uniform") {
      agents.push({
        id: i,
        x: (Math.random() - 0.5) * 20,
        z: (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 2,
        vz: (Math.random() - 0.5) * 2
      });
    } else {
      const cluster = i % 4;
      const cx = (cluster % 2 === 0 ? -4 : 4) + (Math.random() - 0.5) * 1.5;
      const cz = (cluster < 2 ? -4 : 4) + (Math.random() - 0.5) * 1.5;
      agents.push({ id: i, x: cx, z: cz, vx: (Math.random() - 0.5) * 2, vz: (Math.random() - 0.5) * 2 });
    }
  }
  return agents;
}
