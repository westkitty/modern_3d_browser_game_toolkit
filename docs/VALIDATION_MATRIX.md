# Validation matrix

Evidence labels follow the handbook: SOURCE-VERIFIED, SYNTAX-VERIFIED, TEST-EXECUTED, BROWSER-EXECUTED, VISUALLY-VERIFIED, INTERACTION-VERIFIED, PERFORMANCE-MEASURED, IMPLEMENTED-UNVERIFIED.

Never upgrade a row because files exist.

## Launcher (Phase 0)

| Check | Status | Evidence |
| --- | --- | --- |
| Source implemented | yes | `src/launcher`, `src/shared`, hash routing, host |
| Type/build tested | yes | `npm run typecheck`, `npm run build` |
| Unit tests | yes | 12 Vitest tests |
| Browser executed | yes | Chrome headless `http://127.0.0.1:5173/#/` and `#/demo/01-tactics-table` |
| Visual verification | yes, catalog + placeholder | screenshots inspected; cards list renderer/timing/capability; demo 01 placeholder and Return control visible |
| Interaction verified | partial | hash routing visually confirmed; native links present; arrow-key card focus not exercised in-browser |
| Performance measurement | not applicable | launcher has no gameplay loop |
| Unsupported/unverified | demos 01–10 gameplay | placeholders only |

## Per-demo rows

| Demo | Source | Type/build | Browser | Interaction | Visual | Performance | Unsupported / unverified |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 01 Tactics table | yes | typecheck/test/build passed | Chrome headless (GPU-less + SwiftShader) | unit-tested keyboard-equivalent turn; DOM controls visually present | SwiftShader: table + units visible; GPU-less: explicit unsupported | not measured (event-driven) | headed GPU pointer picking unverified; DevTools leak session unverified |
| 02 Raycast labyrinth | yes | typecheck/test/build; no Three.js import | Chrome headless | unit-tested occlusion/collision; DOM/touch buttons visible | corridor, shading, billboard inspected | not measured | physical touch device and named frame-budget profile unverified |
| 03 Character course | yes | typecheck/test | Chrome SwiftShader | deadzone/gamepad disconnect/catch-up unit-tested | capsule/platforms/hazard visible | catch-up cap unit-tested only | physical gamepad and high-refresh playtest unverified |
| 04 Verified GLB | yes | typecheck/test; generator executed | not visually captured | missing-asset and hash tests executed | unverified | n/a | in-browser GLB appearance unverified |
| 05 WebGL2 arena | yes | typecheck/test; no Three.js | unverified | shader sources present | unverified | n/a | GPU screenshot and context-loss hardware path unverified |
| 06 Puzzle museum | yes | typecheck/test | unverified | rooms solvable from DOM data | unverified | n/a | 3D gallery visual unverified |
| 07 IK telemetry | yes | typecheck/test | unverified | IK poses unit-tested | unverified | texture upload gated by content change (unit) | in-browser creature visual unverified |
| 08 Crowd lab | placeholder | n/a | n/a | n/a | n/a | n/a | gameplay not built |
| 09 Strategy globe | placeholder | n/a | n/a | n/a | n/a | n/a | gameplay not built |
| 10 GPU field | placeholder | n/a | n/a | n/a | n/a | n/a | gameplay not built |

Browser Playwright smoke is not claimed in Phase 0.
