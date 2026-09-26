"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = process.cwd();

const manifestPath = path.join(
  root,
  "data",
  "required_assets.json"
);

const checkerPath = path.join(
  root,
  "tools",
  "check_required_assets.js"
);

if (!fs.existsSync(manifestPath)) {
  console.error("ERROR: data/required_assets.json non trovato.");
  console.error("Esegui questo script dalla root del repo ArenaRubra.");
  process.exit(2);
}

if (!fs.existsSync(checkerPath)) {
  console.error("ERROR: tools/check_required_assets.js non trovato.");
  console.error("Esegui questo script dalla root del repo ArenaRubra.");
  process.exit(2);
}

const manifest = JSON.parse(
  fs.readFileSync(manifestPath, "utf8")
);

const groups = [
  "required",
  "optional",
  "devOnly",
  "legacy",
  "unused"
];

const factionPrefix =
  "assets/ui/faction_skins/";

function sha256File(filePath) {
  return crypto
    .createHash("sha256")
    .update(fs.readFileSync(filePath))
    .digest("hex");
}

function normalize(p) {
  return String(p).replaceAll("\\", "/");
}

function findEntry(assetPath) {
  const matches = [];

  for (const group of groups) {
    const items = Array.isArray(manifest[group])
      ? manifest[group]
      : [];

    for (let i = 0; i < items.length; i++) {
      if (items[i].path === assetPath) {
        matches.push({
          group,
          index: i
        });
      }
    }
  }

  return matches;
}

function addOptionalIfMissing(assetPath) {
  const matches = findEntry(assetPath);

  if (matches.length > 1) {
    throw new Error(
      `Asset classificato più volte: ${assetPath}`
    );
  }

  if (matches.length === 1) {
    return false;
  }

  const absolute = path.join(
    root,
    assetPath
  );

  if (!fs.existsSync(absolute)) {
    throw new Error(
      `Asset non trovato: ${assetPath}`
    );
  }

  if (!Array.isArray(manifest.optional)) {
    manifest.optional = [];
  }

  manifest.optional.push({
    path: assetPath,
    bytes: fs.statSync(absolute).size,
    sha256: sha256File(absolute),
    owner: "ui-skin",
    reason:
      "runtime enhancement with procedural, CSS, text, or silent fallback"
  });

  return true;
}

const added = [];

for (const assetPath of [
  "assets/ui/faction_skins/fabeot_vesper/crest.webp",
  "assets/ui/faction_skins/nexus_basalt/crest.webp"
]) {
  if (addOptionalIfMissing(assetPath)) {
    added.push(assetPath);
  }
}

const updated = [];

for (const group of groups) {
  const items = Array.isArray(manifest[group])
    ? manifest[group]
    : [];

  for (const item of items) {
    if (
      !item ||
      typeof item.path !== "string"
    ) {
      continue;
    }

    const rel = normalize(item.path);

    if (!rel.startsWith(factionPrefix)) {
      continue;
    }

    const absolute = path.join(
      root,
      rel
    );

    if (!fs.existsSync(absolute)) {
      throw new Error(
        `Asset classificato ma assente: ${rel}`
      );
    }

    const realBytes =
      fs.statSync(absolute).size;

    const realSha256 =
      sha256File(absolute);

    if (
      item.bytes !== realBytes ||
      item.sha256 !== realSha256
    ) {
      updated.push({
        group,
        path: rel,
        oldBytes: item.bytes,
        newBytes: realBytes,
        oldSha256: item.sha256,
        newSha256: realSha256
      });

      item.bytes = realBytes;
      item.sha256 = realSha256;
    }
  }
}

if (
  !manifest.summary ||
  typeof manifest.summary !== "object"
) {
  manifest.summary = {};
}

for (const group of groups) {
  const items = Array.isArray(manifest[group])
    ? manifest[group]
    : [];

  manifest.summary[group] = {
    files: items.length,
    bytes: items.reduce(
      (sum, item) =>
        sum + Number(item.bytes || 0),
      0
    )
  };
}

fs.writeFileSync(
  manifestPath,
  JSON.stringify(
    manifest,
    null,
    2
  ) + "\n",
  "utf8"
);

console.log("");
console.log(
  "Arena Rubra - asset manifest correction"
);
console.log(
  "---------------------------------------"
);

console.log(
  `Metadata aggiornati: ${updated.length}`
);

console.log(
  `Nuovi asset classificati: ${added.length}`
);

for (const item of added) {
  console.log(
    `+ optional: ${item}`
  );
}

for (const item of updated) {
  console.log("");
  console.log(
    `~ ${item.path}`
  );

  console.log(
    `  bytes: ${item.oldBytes} -> ${item.newBytes}`
  );

  console.log(
    `  sha256: ${item.oldSha256} -> ${item.newSha256}`
  );
}

console.log("");
console.log("Summary:");

for (const group of groups) {
  const s = manifest.summary[group];

  console.log(
    `${group}: ${s.files} files / ${s.bytes} bytes`
  );
}

console.log("");
console.log(
  "Eseguo S2-C6..."
);

const gate = spawnSync(
  process.execPath,
  [
    checkerPath,
    "--root",
    root
  ],
  {
    cwd: root,
    encoding: "utf8"
  }
);

if (gate.stdout) {
  process.stdout.write(
    gate.stdout
  );
}

if (gate.stderr) {
  process.stderr.write(
    gate.stderr
  );
}

if (gate.status !== 0) {
  console.error("");
  console.error(
    "PATCH APPLICATA, MA IL GATE FALLISCE ANCORA."
  );

  console.error(
    "Non fare commit: mandami l'output restante."
  );

  process.exit(
    gate.status || 1
  );
}

console.log("");
console.log(
  "PATCH OK - S2-C6 gate passes."
);

console.log(
  "Puoi committare data/required_assets.json."
);