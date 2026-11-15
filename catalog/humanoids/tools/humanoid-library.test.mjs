import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SKELETON_FAMILIES,
  createHumanoidCatalog,
  sanitizeBoneName,
  disposeHumanoidAsset,
} from '../lib/humanoid-library.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CAT_DIR = path.resolve(__dirname, '..');

function loadJson(name) {
  return JSON.parse(fs.readFileSync(path.join(CAT_DIR, name), 'utf8'));
}

const catalog = loadJson('catalog.json');
const sources = loadJson('sources.json');
const compatibility = loadJson('compatibility-matrix.json');
const extended = loadJson('characters-extended.json');
const rocketbox = loadJson('rocketbox-characters.json');

const api = createHumanoidCatalog({ catalog, sources, compatibility, extended, rocketbox });

test('preserves all 115 Rocketbox avatars and totals 296 unique catalog assets', () => {
  assert.equal(rocketbox.records.length, 115);
  assert.equal(extended.records.length, 181);
  assert.equal(catalog.records.length, 296);

  const ids = catalog.records.map((r) => r.asset_id);
  assert.equal(new Set(ids).size, 296, 'All asset_ids must be unique');

  const rbIds = new Set(rocketbox.records.map((r) => r.asset_id));
  for (const id of rbIds) {
    assert.ok(api.getById(id), `Missing preserved Rocketbox asset_id: ${id}`);
  }
});

test('all 9 free/Standard packs + 4 legacy/generator entries exist without duplication in sources.json', () => {
  const sourceIds = sources.sources.map((s) => s.id);
  assert.equal(new Set(sourceIds).size, sourceIds.length, 'Duplicate source ids');
  for (const expectedId of [
    'microsoft-rocketbox',
    'quaternius-universal-base-characters-standard',
    'quaternius-ual1-standard',
    'quaternius-ual2-standard',
    'kaykit-adventurers',
    'kaykit-skeletons',
    'kaykit-character-animations',
    'quaternius-modular-character-outfits-fantasy-standard',
    'quaternius-ultimate-modular-women',
    'quaternius-rpg-characters',
    'makehuman',
    'vroid-studio',
    'adobe-mixamo',
  ]) {
    assert.ok(api.getSource(expectedId), `Missing expected source: ${expectedId}`);
  }
  // Ensure every catalog record links to a declared source
  for (const rec of catalog.records) {
    assert.ok(api.getSource(rec.source_id), `Orphan source_id on ${rec.asset_id}: ${rec.source_id}`);
  }
});

test('compatibility API separates exact, retarget-with-offsets, UMW IK-incompatible, and incompatible pairs', () => {
  const knight = api.getById('kaykit-adventurers/character/knight');
  assert.equal(knight.skeleton_family, SKELETON_FAMILIES.KAYKIT_RIG_MEDIUM);

  const kkCombat = api.getById('kaykit-character-animations/rig_medium/rig_medium_combatmelee');
  assert.equal(api.getCompatibility(kkCombat, knight).compatible, true);
  assert.equal(api.getCompatibility(kkCombat, knight).status, 'direct-compatible');

  const ual1 = api.getById('quaternius-ual1-standard/animation_pack/ual1_standard');
  const ubcFemale = api.getById('quaternius-universal-base-characters-standard/character/superhero_female_fullbody');
  assert.equal(api.getCompatibility(ual1, ubcFemale).status, 'direct-compatible');

  const ualToKnight = api.getCompatibility(ual1, knight);
  assert.equal(ualToKnight.compatible, true);
  assert.equal(ualToKnight.status, 'supported_rotation_retarget_with_rest_offsets');

  const umwWitch = api.getById('quaternius-ultimate-modular-women/character/witch');
  const ualToUmw = api.getCompatibility(ual1, umwWitch);
  assert.equal(ualToUmw.compatible, false);
  assert.equal(ualToUmw.status, 'incompatible_lower_body_ik_rotation_only');

  const rpgWiz = api.getById('quaternius-rpg-characters/character/wizard');
  assert.equal(api.getCompatibility(ual1, rpgWiz).compatible, false);
});

test('modular outfit groups and specialized skeletons are preserved accurately', () => {
  const skel = api.getById('kaykit-skeletons/specialized_skeletal_humanoid/skeleton_warrior');
  assert.equal(skel.asset_type, 'specialized_skeletal_humanoid');
  const modGroups = api.getModularGroups();
  assert.equal(modGroups.quaternius_fantasy_outfits_standard.length, 4);
  assert.equal(modGroups.quaternius_ultimate_modular_women_designs.length, 10);
});

test('runtime helpers handle bone name sanitization and SkinnedMesh skeleton disposal cleanly', () => {
  assert.equal(sanitizeBoneName(null, 'handslot.r'), 'handslot_r');
  let skelDisposed = false;
  let geoDisposed = false;
  let matDisposed = false;
  let texDisposed = false;
  const mockRoot = {
    traverse(fn) {
      fn({
        isSkinnedMesh: true,
        skeleton: { dispose() { skelDisposed = true; } },
        geometry: { dispose() { geoDisposed = true; } },
        material: {
          map: { isTexture: true, dispose() { texDisposed = true; } },
          dispose() { matDisposed = true; },
        },
      });
    },
  };
  disposeHumanoidAsset(mockRoot);
  assert.ok(skelDisposed && geoDisposed && matDisposed && texDisposed);
});

test('public catalog artifacts leak zero private Google Drive IDs or credentials', () => {
  for (const r of [...extended.records, ...rocketbox.records]) {
    assert.equal(r.archive_drive_file_id, null);
  }
  const filesToScan = [
    'catalog.json',
    'sources.json',
    'characters-extended.json',
    'compatibility-matrix.json',
    'README.md',
    'OPERATIONAL_STATE.md',
    'ACQUISITION_AND_USE.md',
    'inspector.html',
    'inspector.js',
  ];
  for (const fname of filesToScan) {
    const p = path.join(CAT_DIR, fname);
    if (!fs.existsSync(p)) continue;
    const raw = fs.readFileSync(p, 'utf8');
    const driveUrlRx = new RegExp('drive\\.google\\.com/(drive/folders|file/d)/[A-Za-z0-9_-]{15,}');
    const tokenRx = new RegExp(['AK' + 'IA[0-9A-Z]{16}', 'ya' + '29\\.', 'AI' + 'zaSy[0-9A-Za-z_-]{20,}'].join('|'));
    assert.equal(driveUrlRx.test(raw), false, `Drive folder/file URL leaked in ${fname}`);
    assert.equal(tokenRx.test(raw), false, `Credential pattern leaked in ${fname}`);
  }
});
