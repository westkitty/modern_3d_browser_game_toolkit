export interface PuzzleRoom {
  id: string;
  title: string;
  instruction: string;
  hint: string;
  options: string[];
  answer: string;
}

export const ROOMS: PuzzleRoom[] = [
  {
    id: "room-color",
    title: "Hall of Sequence",
    instruction: "Select the next color in the sequence: cyan, indigo, cyan, indigo, …",
    hint: "It alternates. Required information is also in this text, not only on the 3D walls.",
    options: ["cyan", "gold", "indigo"],
    answer: "cyan"
  },
  {
    id: "room-count",
    title: "Chamber of Counts",
    instruction: "How many pedestals stand in this chamber? The accessible answer is three.",
    hint: "Count the listed pedestals in the status region.",
    options: ["2", "3", "5"],
    answer: "3"
  },
  {
    id: "room-glyph",
    title: "Archive of Glyphs",
    instruction: "Which glyph is safe to press? The live region says: circle.",
    hint: "Square is decorative. Circle is the required control.",
    options: ["square", "circle", "triangle"],
    answer: "circle"
  }
];

export const STORAGE_KEY = "toolkit.demo06.museum.v1";

export interface MuseumSave {
  schemaVersion: 1;
  completed: string[];
  reducedMotion: boolean;
}

export function loadMuseum(raw: string | null): MuseumSave {
  try {
    if (!raw) throw new Error("empty");
    const parsed = JSON.parse(raw) as MuseumSave;
    if (parsed.schemaVersion !== 1) throw new Error("schema");
    return {
      schemaVersion: 1,
      completed: Array.isArray(parsed.completed) ? parsed.completed : [],
      reducedMotion: Boolean(parsed.reducedMotion)
    };
  } catch {
    return { schemaVersion: 1, completed: [], reducedMotion: false };
  }
}
