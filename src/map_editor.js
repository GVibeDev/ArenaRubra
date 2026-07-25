"use strict";

// F9Q3 - editor locale di geometria, terreni, ruoli e pericoli iniziali.

const mapEditorState = {
  draft: null,
  sourceId: "map1_starter",
  tool: "inspect",
  toolValue: "free",
  selectedKey: "",
  undo: [],
  redo: [],
  view: { x: 600, y: 400, scale: 1 },
  drag: null,
  operationWarnings: [],
  initialized: false,
  labMapId: null
};

function mapEditorEl(id) {
  return typeof document !== "undefined" ? document.getElementById(id) : null;
}

function mapEditorEscape(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
}

function mapEditorSnapshot() {
  return mapRuntimeClone(mapEditorState.draft);
}

function mapEditorPushUndo() {
  if (!mapEditorState.draft) return;
  mapEditorState.undo.push(mapEditorSnapshot());
  if (mapEditorState.undo.length > 80) mapEditorState.undo.shift();
  mapEditorState.redo = [];
}

function mapEditorApplySnapshot(snapshot) {
  if (!snapshot) return;
  mapEditorState.draft = mapRuntimeNormalizeDefinition(snapshot, { imported: true });
  mapEditorSyncForm();
  renderMapEditor();
}

function mapEditorUndo() {
  if (!mapEditorState.undo.length) return;
  mapEditorState.redo.push(mapEditorSnapshot());
  mapEditorApplySnapshot(mapEditorState.undo.pop());
}

function mapEditorRedo() {
  if (!mapEditorState.redo.length) return;
  mapEditorState.undo.push(mapEditorSnapshot());
  mapEditorApplySnapshot(mapEditorState.redo.pop());
}

function mapEditorTemplateDefinition(template) {
  const componentSets = {
    single: [{ id: "hex-a", radius: 6, origin: [0, 0, 0], rotation: 0 }],
    double: [
      { id: "hex-a", radius: 6, origin: [-4, 0, 4], rotation: 0 },
      { id: "hex-b", radius: 6, origin: [4, 0, -4], rotation: 0 }
    ],
    triple: [
      { id: "hex-a", radius: 6, origin: [-6, 3, 3], rotation: 0 },
      { id: "hex-b", radius: 6, origin: [0, 0, 0], rotation: 0 },
      { id: "hex-c", radius: 6, origin: [6, -3, -3], rotation: 0 }
    ],
    empty: []
  };
  const components = componentSets[template] || componentSets.single;
  const cells = mapDefinitionCompositeCells(components);
  const timestamp = Date.now().toString(36);
  return mapRuntimeNormalizeDefinition({
    schemaVersion: MAP_SCHEMA_VERSION,
    id: `custom_${template}_${timestamp}`,
    name: `Nuova mappa ${template}`,
    description: "Mappa custom creata nel Map & Terrain Lab.",
    official: false,
    editable: true,
    enabled: true,
    playerCount: 2,
    movementMultiplier: 1,
    turnOrder: [1, 2],
    geometry: {
      type: template === "single" ? "single_hex" : template === "double" ? "double_hex" : template === "triple" ? "triple_hex" : "explicit_cells",
      nominalRadius: 6,
      components,
      cells
    },
    playerSlots: [
      { slotId: 1, headquarters: [-6, 0, 6], deployment: { mode: "hq_network", radius: 1 } },
      { slotId: 2, headquarters: [6, 0, -6], deployment: { mode: "hq_network", radius: 1 } }
    ],
    strategicPoints: [{ id: "ps-center", coord: [0, 0, 0], incomeValue: 1, tags: ["central"] }],
    initialHazards: [],
    presentation: { skinKey: "red_dust", backgroundKey: null },
    metadata: { author: "Arena Rubra Map Editor", revision: 1, tags: ["custom"], symmetry: null, source: "F9Q3-editor" }
  }, { imported: true });
}

function mapEditorRefreshMapSelect(preferredId = "") {
  const select = mapEditorEl("mapEditorMapSelect");
  if (!select) return;
  const definitions = getAvailableMapDefinitions({ includeInvalid: true });
  select.innerHTML = definitions.map(definition => {
    const type = definition.official ? "integrata · sola lettura" : "custom";
    return `<option value="${mapEditorEscape(definition.id)}">${mapEditorEscape(definition.name)} · ${definition.playerCount}G · ${type}</option>`;
  }).join("");
  const wanted = preferredId || mapEditorState.sourceId;
  if (definitions.some(definition => definition.id === wanted)) select.value = wanted;
}

function mapEditorLoad(mapId, options = {}) {
  const definition = getMapDefinitionById(mapId || "map1_starter");
  if (!definition) return false;
  mapEditorState.sourceId = definition.id;
  mapEditorState.draft = definition.official && options.copy !== false
    ? duplicateMapDefinition(definition.id).definition
    : mapRuntimeNormalizeDefinition(definition, { imported: definition.official !== true });
  mapEditorState.undo = [];
  mapEditorState.redo = [];
  mapEditorState.selectedKey = "";
  mapEditorState.operationWarnings = [];
  mapEditorRefreshMapSelect(definition.id);
  mapEditorSyncForm();
  mapEditorFit();
  renderMapEditor();
  return true;
}

function mapEditorSelectedComponent() {
  const select = mapEditorEl("mapEditorComponentSelect");
  const components = mapEditorState.draft && mapEditorState.draft.geometry.components || [];
  return components.find(component => component.id === (select && select.value)) || components[0] || null;
}

function mapEditorSyncComponentControls() {
  const draft = mapEditorState.draft;
  const select = mapEditorEl("mapEditorComponentSelect");
  if (!draft || !select) return;
  const previous = select.value;
  select.innerHTML = (draft.geometry.components || []).map((component, index) =>
    `<option value="${mapEditorEscape(component.id)}">${mapEditorEscape(component.id)} · r${component.radius} · [${component.origin.join(",")}]</option>`
  ).join("");
  if ([...select.options].some(option => option.value === previous)) select.value = previous;
  const component = mapEditorSelectedComponent();
  const radius = mapEditorEl("mapEditorComponentRadius");
  const originX = mapEditorEl("mapEditorComponentOriginX");
  const originY = mapEditorEl("mapEditorComponentOriginY");
  const originZ = mapEditorEl("mapEditorComponentOriginZ");
  const rotation = mapEditorEl("mapEditorComponentRotation");
  const disabled = !component;
  [radius, originX, originY, originZ, rotation].forEach(control => { if (control) control.disabled = disabled; });
  if (!component) {
    [radius, originX, originY, originZ].forEach(control => { if (control) control.value = ""; });
    return;
  }
  if (radius) radius.value = String(component.radius);
  if (originX) originX.value = String(component.origin[0]);
  if (originY) originY.value = String(component.origin[1]);
  if (originZ) originZ.value = String(component.origin[2]);
  if (rotation) rotation.value = String(component.rotation || 0);
}

function mapEditorSyncInitialHazards() {
  const draft = mapEditorState.draft;
  if (!draft) return;
  draft.initialHazards = (draft.geometry.cells || [])
    .filter(cell => cell.initialHazard && ["trap", "mine"].includes(cell.initialHazard.type))
    .map((cell, index) => ({
      id: cell.initialHazard.sourceId || `editor-${cell.initialHazard.type}-${index + 1}`,
      type: cell.initialHazard.type,
      coord: [...cell.coord],
      sourceType: "map",
      sourceId: cell.initialHazard.sourceId || `editor-${cell.initialHazard.type}-${index + 1}`,
      ownerPlayerId: null,
      duration: Number.isFinite(cell.initialHazard.duration) ? cell.initialHazard.duration : null,
      payload: mapRuntimeClone(cell.initialHazard.payload || {})
    }));
}

function mapEditorRebuildGeometryFromComponents() {
  const draft = mapEditorState.draft;
  if (!draft) return;
  const oldByKey = new Map((draft.geometry.cells || []).map(cell => [mapRuntimeCellKey(cell.coord), cell]));
  const regenerated = mapDefinitionCompositeCells(draft.geometry.components || []);
  for (const cell of regenerated) {
    const old = oldByKey.get(mapRuntimeCellKey(cell.coord));
    if (!old) continue;
    cell.terrainType = old.terrainType || "free";
    cell.initialHazard = old.initialHazard ? mapRuntimeClone(old.initialHazard) : null;
  }
  draft.geometry.cells = regenerated;
  draft.geometry.type = draft.geometry.components.length === 1
    ? "single_hex"
    : draft.geometry.components.length === 2
      ? "double_hex"
      : draft.geometry.components.length === 3
        ? "triple_hex"
        : "explicit_cells";
  mapEditorRebuildCellRoles();
  mapEditorSyncInitialHazards();
  draft.metadata.revision = Math.max(1, Number(draft.metadata.revision) || 1) + 1;
  mapEditorState.operationWarnings = [];
  mapEditorSyncComponentControls();
  mapEditorFit();
}

function mapEditorSyncForm() {
  const draft = mapEditorState.draft;
  if (!draft) return;
  const nameInput = mapEditorEl("mapEditorNameInput");
  const playerCount = mapEditorEl("mapEditorPlayerCount");
  const movement = mapEditorEl("mapEditorMovementMultiplier");
  const description = mapEditorEl("mapEditorDescriptionInput");
  const tags = mapEditorEl("mapEditorTagsInput");
  if (nameInput) nameInput.value = draft.name || "";
  if (description) description.value = draft.description || "";
  if (tags) tags.value = (draft.metadata.tags || []).join(", ");
  if (playerCount) playerCount.value = String(draft.playerCount || 2);
  if (movement) movement.value = String(draft.movementMultiplier || 1);
  mapEditorSyncComponentControls();
}

function mapEditorEnsurePlayerSlots() {
  const draft = mapEditorState.draft;
  if (!draft) return;
  const cells = draft.geometry.cells || [];
  const fallbackCoords = cells.map(cell => cell.coord);
  while (draft.playerSlots.length < draft.playerCount) {
    const slotId = draft.playerSlots.length + 1;
    const fallback = fallbackCoords[Math.floor((fallbackCoords.length - 1) * ((slotId - 1) / Math.max(1, draft.playerCount - 1)))] || [0, 0, 0];
    draft.playerSlots.push({ slotId, headquarters: [...fallback], deployment: { mode: "hq_network", radius: 1 } });
  }
  draft.playerSlots = draft.playerSlots.slice(0, draft.playerCount).map((slot, index) => ({ ...slot, slotId: index + 1 }));
  draft.turnOrder = Array.from({ length: draft.playerCount }, (_, index) => index + 1);
  mapEditorRebuildCellRoles();
}

function mapEditorRebuildCellRoles() {
  const draft = mapEditorState.draft;
  if (!draft) return;
  for (const cell of draft.geometry.cells) {
    cell.cellRole = "normal";
    cell.ownerPlayerId = null;
  }
  const byKey = new Map(draft.geometry.cells.map(cell => [mapRuntimeCellKey(cell.coord), cell]));
  for (const slot of draft.playerSlots) {
    const cell = byKey.get(mapRuntimeCellKey(slot.headquarters));
    if (cell) {
      cell.cellRole = "headquarters";
      cell.ownerPlayerId = slot.slotId;
      cell.terrainType = "free";
    }
  }
  for (const ps of draft.strategicPoints) {
    const cell = byKey.get(mapRuntimeCellKey(ps.coord));
    if (cell && cell.cellRole === "normal") {
      cell.cellRole = "strategic_point";
      cell.terrainType = cell.terrainType === "obstacle" ? "free" : cell.terrainType;
    }
  }
}

function mapEditorCubeToPoint(coord) {
  const size = 25;
  const q = coord[0];
  const r = coord[2];
  return {
    x: size * Math.sqrt(3) * (q + r / 2),
    y: size * 1.5 * r
  };
}

function mapEditorPointToCube(x, y) {
  const size = 25;
  const q = (Math.sqrt(3) / 3 * x - 1 / 3 * y) / size;
  const r = (2 / 3 * y) / size;
  let cx = q;
  let cz = r;
  let cy = -cx - cz;
  let rx = Math.round(cx);
  let ry = Math.round(cy);
  let rz = Math.round(cz);
  const dx = Math.abs(rx - cx);
  const dy = Math.abs(ry - cy);
  const dz = Math.abs(rz - cz);
  if (dx > dy && dx > dz) rx = -ry - rz;
  else if (dy > dz) ry = -rx - rz;
  else rz = -rx - ry;
  return [rx, ry, rz];
}

function mapEditorHexPoints(point, size = 23) {
  return Array.from({ length: 6 }, (_, index) => {
    const angle = (Math.PI / 180) * (60 * index - 30);
    return `${point.x + size * Math.cos(angle)},${point.y + size * Math.sin(angle)}`;
  }).join(" ");
}

function mapEditorSymmetryCoords(coord) {
  const mode = mapEditorEl("mapEditorSymmetry") ? mapEditorEl("mapEditorSymmetry").value : "none";
  const rotate60 = value => [-value[2], -value[0], -value[1]];
  const rotate = (value, turns) => {
    let result = [...value];
    for (let index = 0; index < turns; index += 1) result = rotate60(result);
    return result;
  };
  const slots = mapEditorState.draft && mapEditorState.draft.playerSlots || [];
  const hqMode = mode === "hq"
    || (mode === "rotate3" && slots.length === 3)
    || (mode === "rotate4" && slots.length === 4);
  if (hqMode && slots.length > 1) {
    const source = [...slots].sort((a, b) => {
      const aDistance = Math.max(...a.headquarters.map((value, index) => Math.abs(value - coord[index])));
      const bDistance = Math.max(...b.headquarters.map((value, index) => Math.abs(value - coord[index])));
      return aDistance - bDistance || a.slotId - b.slotId;
    })[0];
    const offset = coord.map((value, index) => value - source.headquarters[index]);
    const coords = slots.map(slot => {
      let bestTurns = 0;
      let bestDistance = Infinity;
      for (let turns = 0; turns < 6; turns += 1) {
        const rotatedSource = rotate(source.headquarters, turns);
        const distance = Math.max(...rotatedSource.map((value, index) => Math.abs(value - slot.headquarters[index])));
        if (distance < bestDistance) {
          bestDistance = distance;
          bestTurns = turns;
        }
      }
      const rotatedOffset = rotate(offset, bestTurns);
      return slot.headquarters.map((value, index) => value + rotatedOffset[index]);
    });
    return [...new Map(coords.map(item => [mapRuntimeCellKey(item), item])).values()];
  }
  const coords = [[...coord]];
  const turns = mode === "rotate2"
    ? [3]
    : mode === "rotate3"
      ? [2, 4]
      : mode === "rotate60"
        ? [1]
        : [];
  for (const count of turns) {
    coords.push(rotate(coord, count));
  }
  if (mode === "mirror") coords.push([coord[1], coord[0], coord[2]]);
  const unique = new Map(coords.map(item => [mapRuntimeCellKey(item), item]));
  return [...unique.values()];
}

function mapEditorPreviewSymmetry(coord, active = true) {
  const svg = mapEditorEl("mapEditorCanvas");
  if (!svg) return;
  svg.querySelectorAll(".isSymmetryPreview").forEach(node => node.classList.remove("isSymmetryPreview"));
  if (!active || !coord) return;
  for (const target of mapEditorSymmetryCoords(coord)) {
    const node = svg.querySelector(`[data-map-cell="${mapRuntimeCellKey(target)}"]`);
    if (node) node.classList.add("isSymmetryPreview");
  }
}

function mapEditorSelectedCell() {
  const draft = mapEditorState.draft;
  return draft && draft.geometry.cells.find(cell => mapRuntimeCellKey(cell.coord) === mapEditorState.selectedKey) || null;
}

function mapEditorApplyTool(coord) {
  const draft = mapEditorState.draft;
  if (!draft) return;
  const targets = mapEditorSymmetryCoords(coord);
  const cellsByKey = new Map(draft.geometry.cells.map(cell => [mapRuntimeCellKey(cell.coord), cell]));
  mapEditorState.operationWarnings = [];
  mapEditorPushUndo();
  if (mapEditorState.tool === "inspect") {
    mapEditorState.undo.pop();
    mapEditorState.selectedKey = mapRuntimeCellKey(coord);
    renderMapEditor();
    return;
  }
  if (mapEditorState.tool === "cell") {
    for (const target of targets) {
      const key = mapRuntimeCellKey(target);
      const existing = cellsByKey.get(key);
      if (mapEditorState.toolValue === "remove" && existing) {
        draft.geometry.cells = draft.geometry.cells.filter(cell => mapRuntimeCellKey(cell.coord) !== key);
        draft.playerSlots = draft.playerSlots.filter(slot => mapRuntimeCellKey(slot.headquarters) !== key);
        draft.strategicPoints = draft.strategicPoints.filter(ps => mapRuntimeCellKey(ps.coord) !== key);
      } else if (!existing) {
        draft.geometry.cells.push({ coord: [...target], componentId: null, componentIds: [], terrainType: "free", cellRole: "normal", ownerPlayerId: null, initialHazard: null });
      }
    }
  } else if (mapEditorState.tool === "terrain") {
    for (const target of targets) {
      const cell = cellsByKey.get(mapRuntimeCellKey(target));
      if (!cell) {
        mapEditorState.operationWarnings.push(`Replica ignorata: ${mapRuntimeCellKey(target)} non esiste.`);
      } else if (cell.cellRole !== "normal") {
        mapEditorState.operationWarnings.push(`Replica protetta: ${mapRuntimeCellKey(target)} contiene ${cell.cellRole}.`);
      } else {
        cell.terrainType = mapEditorState.toolValue;
        if (cell.terrainType === "obstacle" && cell.initialHazard) {
          cell.initialHazard = null;
          mapEditorState.operationWarnings.push(`Pericolo rimosso da ${mapRuntimeCellKey(target)} perché ora è un ostacolo.`);
        }
      }
    }
  } else if (mapEditorState.tool === "role") {
    const cell = cellsByKey.get(mapRuntimeCellKey(coord));
    if (cell) {
      const value = mapEditorState.toolValue;
      if (value.startsWith("hq-")) {
        const playerId = Number(value.slice(3));
        const slot = draft.playerSlots.find(item => item.slotId === playerId);
        if (slot) slot.headquarters = [...coord];
      } else if (value === "ps") {
        const existing = draft.strategicPoints.find(ps => mapRuntimeCellKey(ps.coord) === mapRuntimeCellKey(coord));
        if (!existing) draft.strategicPoints.push({ id: `ps-${draft.strategicPoints.length + 1}`, coord: [...coord], incomeValue: 1, tags: ["custom"] });
      } else {
        draft.strategicPoints = draft.strategicPoints.filter(ps => mapRuntimeCellKey(ps.coord) !== mapRuntimeCellKey(coord));
      }
      mapEditorRebuildCellRoles();
    }
  } else if (mapEditorState.tool === "hazard") {
    for (const target of targets) {
      const cell = cellsByKey.get(mapRuntimeCellKey(target));
      if (!cell) {
        mapEditorState.operationWarnings.push(`Replica ignorata: ${mapRuntimeCellKey(target)} non esiste.`);
        continue;
      }
      if (cell.cellRole !== "normal" || cell.terrainType === "obstacle") {
        mapEditorState.operationWarnings.push(`Pericolo non applicato a ${mapRuntimeCellKey(target)}: ruolo o terreno protetto.`);
        continue;
      }
      cell.initialHazard = mapEditorState.toolValue === "none" ? null : {
        type: mapEditorState.toolValue,
        sourceType: "map",
        sourceId: "editor-initial",
        ownerPlayerId: null,
        duration: null,
        payload: {}
      };
    }
  }
  mapEditorSyncInitialHazards();
  draft.metadata.revision = Math.max(1, Number(draft.metadata.revision) || 1) + 1;
  mapEditorState.selectedKey = mapRuntimeCellKey(coord);
  renderMapEditor();
}

function mapEditorToolOptions() {
  const panel = mapEditorEl("mapEditorToolOptions");
  if (!panel || !mapEditorState.draft) return;
  let options = [];
  if (mapEditorState.tool === "cell") options = [["add", "Aggiungi"], ["remove", "Rimuovi"]];
  if (mapEditorState.tool === "terrain") options = terrainDefinitions().map(terrain => [terrain.id, `${terrain.icon} ${terrain.name}`]);
  if (mapEditorState.tool === "role") {
    options = [["normal", "Normale"], ["ps", "Punto Strategico"]];
    for (let id = 1; id <= mapEditorState.draft.playerCount; id += 1) options.push([`hq-${id}`, `QG Giocatore ${id}`]);
  }
  if (mapEditorState.tool === "hazard") options = [["none", "Nessuno"], ["trap", "Trappola"], ["mine", "Mina"]];
  if (!options.length) {
    panel.innerHTML = `<p class="help">Clicca una cella per leggerne dati, terreno, ruolo e pericolo.</p>`;
    return;
  }
  if (!options.some(([id]) => id === mapEditorState.toolValue)) mapEditorState.toolValue = options[0][0];
  panel.innerHTML = `<label for="mapEditorToolValue">Valore</label><select id="mapEditorToolValue">${options.map(([id, label]) => `<option value="${mapEditorEscape(id)}"${id === mapEditorState.toolValue ? " selected" : ""}>${mapEditorEscape(label)}</option>`).join("")}</select>`;
  const select = mapEditorEl("mapEditorToolValue");
  if (select) select.addEventListener("change", () => { mapEditorState.toolValue = select.value; });
}

function renderMapEditor() {
  const draft = mapEditorState.draft;
  const svg = mapEditorEl("mapEditorCanvas");
  if (!draft || !svg) return;
  mapEditorToolOptions();
  const cells = draft.geometry.cells || [];
  const transform = `translate(${mapEditorState.view.x} ${mapEditorState.view.y}) scale(${mapEditorState.view.scale})`;
  const polygons = cells.map(cell => {
    const point = mapEditorCubeToPoint(cell.coord);
    const terrain = terrainDefinition(cell.terrainType || "free") || terrainDefinition("free");
    const key = mapRuntimeCellKey(cell.coord);
    const classes = [
      "mapEditorHex",
      terrain.visualClass,
      cell.cellRole === "headquarters" ? "isHeadquarters" : "",
      cell.cellRole === "strategic_point" ? "isStrategicPoint" : "",
      cell.initialHazard ? `has-${cell.initialHazard.type}` : "",
      key === mapEditorState.selectedKey ? "isSelected" : ""
    ].filter(Boolean).join(" ");
    const roleLabel = cell.cellRole === "headquarters" ? `QG${cell.ownerPlayerId}` : cell.cellRole === "strategic_point" ? "PS" : "";
    const hazardLabel = cell.initialHazard ? (cell.initialHazard.type === "mine" ? "M" : "T") : "";
    return `<g class="${classes}" data-map-cell="${key}" tabindex="0" role="button" aria-label="${mapEditorEscape(`${key}, ${terrain.name}, ${roleLabel || "normale"}`)}">
      <polygon points="${mapEditorHexPoints(point)}"></polygon>
      <text x="${point.x}" y="${point.y + 4}" text-anchor="middle">${mapEditorEscape(roleLabel || terrain.icon)}</text>
      ${hazardLabel ? `<text class="mapEditorHazardLabel" x="${point.x + 13}" y="${point.y - 10}" text-anchor="middle">${hazardLabel}</text>` : ""}
    </g>`;
  }).join("");
  svg.innerHTML = `<g id="mapEditorWorld" transform="${transform}">${polygons}</g>`;
  svg.querySelectorAll("[data-map-cell]").forEach(node => {
    const coord = node.dataset.mapCell.split(",").map(Number);
    node.addEventListener("pointerenter", () => mapEditorPreviewSymmetry(coord, true));
    node.addEventListener("pointerleave", () => mapEditorPreviewSymmetry(null, false));
    node.addEventListener("click", event => {
      event.stopPropagation();
      mapEditorApplyTool(coord);
    });
    node.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") mapEditorApplyTool(coord);
    });
  });
  const validation = validateMapDefinition(draft, { imported: true });
  const summary = mapEditorEl("mapEditorValidationSummary");
  const list = mapEditorEl("mapEditorValidationList");
  if (summary) {
    summary.className = validation.valid ? "mapEditorValidationSummary isValid" : "mapEditorValidationSummary isInvalid";
    summary.textContent = validation.valid
      ? `Valida · ${validation.summary.cellCount} celle · ${validation.summary.strategicPointCount} PS`
      : `${validation.errors.length} errori · ${validation.warnings.length} avvisi`;
  }
  if (list) {
    const issues = [...validation.errors, ...validation.warnings];
    const validationHtml = issues.map(issue => `<li class="${validation.errors.includes(issue) ? "error" : "warning"}"><code>${mapEditorEscape(issue.code)}</code> ${mapEditorEscape(issue.message)}</li>`).join("");
    const operationHtml = mapEditorState.operationWarnings.map(message => `<li class="editorWarning"><code>W_EDITOR_REPLICA</code> ${mapEditorEscape(message)}</li>`).join("");
    list.innerHTML = validationHtml || operationHtml
      ? `${validationHtml}${operationHtml}`
      : "<li>Nessun problema rilevato.</li>";
  }
  const selected = mapEditorSelectedCell();
  const selection = mapEditorEl("mapEditorSelection");
  if (selection) {
    const selectedTerrain = selected ? terrainDefinition(selected.terrainType) : null;
    const selectedPs = selected ? draft.strategicPoints.find(ps => mapRuntimeCellKey(ps.coord) === mapEditorState.selectedKey) : null;
    const selectedSlot = selected ? draft.playerSlots.find(slot => mapRuntimeCellKey(slot.headquarters) === mapEditorState.selectedKey) : null;
    const selectedIssues = selected
      ? [...validation.errors, ...validation.warnings].filter(issue => issue.coord && mapRuntimeCellKey(issue.coord) === mapEditorState.selectedKey)
      : [];
    selection.innerHTML = selected
      ? `<strong>${mapEditorEscape(mapEditorState.selectedKey)}</strong>
         <span>Componente: ${mapEditorEscape((selected.componentIds && selected.componentIds.length ? selected.componentIds : [selected.componentId || "esplicita"]).join(", "))}</span>
         <span>Terreno: ${mapEditorEscape(selectedTerrain && selectedTerrain.name || selected.terrainType)} · costo movimento ${selectedTerrain && selectedTerrain.blocksMovement ? "bloccato" : selectedTerrain && selectedTerrain.movementCost} · DEF ${selectedTerrain && selectedTerrain.defenseModifier >= 0 ? "+" : ""}${selectedTerrain && selectedTerrain.defenseModifier || 0}</span>
         <span>Ruolo: ${mapEditorEscape(selected.cellRole)} · proprietario QG ${selected.ownerPlayerId || "—"} · PS ${selectedPs ? selectedPs.id : "—"}</span>
         <span>Deployment: ${selectedSlot ? `${selectedSlot.deployment.mode} r${selectedSlot.deployment.radius}` : "—"}</span>
         <span>Pericolo: ${mapEditorEscape(selected.initialHazard && selected.initialHazard.type || "nessuno")}</span>
         <span>Errori/warning cella: ${selectedIssues.length ? mapEditorEscape(selectedIssues.map(issue => issue.code).join(", ")) : "nessuno"}</span>`
      : "Nessuna cella selezionata.";
  }
  const undo = mapEditorEl("mapEditorUndoBtn");
  const redo = mapEditorEl("mapEditorRedoBtn");
  if (undo) undo.disabled = !mapEditorState.undo.length;
  if (redo) redo.disabled = !mapEditorState.redo.length;
  const deleteButton = mapEditorEl("mapEditorDeleteBtn");
  if (deleteButton) deleteButton.disabled = Boolean(BUILTIN_MAP_DEFINITIONS[mapEditorState.sourceId]);
  ["mapEditorSaveBtn", "mapEditorExportBtn", "mapEditorLabBtn"].forEach(id => {
    const button = mapEditorEl(id);
    if (button) button.disabled = !validation.valid;
  });
}

function mapEditorFit() {
  const cells = mapEditorState.draft && mapEditorState.draft.geometry.cells || [];
  if (!cells.length) {
    mapEditorState.view = { x: 600, y: 400, scale: 1 };
    renderMapEditor();
    return;
  }
  const points = cells.map(cell => mapEditorCubeToPoint(cell.coord));
  const minX = Math.min(...points.map(point => point.x)) - 30;
  const maxX = Math.max(...points.map(point => point.x)) + 30;
  const minY = Math.min(...points.map(point => point.y)) - 30;
  const maxY = Math.max(...points.map(point => point.y)) + 30;
  const scale = Math.min(3, Math.max(0.2, Math.min(1120 / Math.max(1, maxX - minX), 720 / Math.max(1, maxY - minY))));
  mapEditorState.view = {
    x: 600 - ((minX + maxX) / 2) * scale,
    y: 400 - ((minY + maxY) / 2) * scale,
    scale
  };
  renderMapEditor();
}

function mapEditorDownload(filename, text) {
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function mapEditorSave() {
  if (!mapEditorState.draft) return false;
  const draft = mapEditorSnapshot();
  if (BUILTIN_MAP_DEFINITIONS[draft.id]) {
    const duplicate = duplicateMapDefinition(draft.id);
    if (!duplicate.ok) return false;
    draft.id = duplicate.definition.id;
    draft.official = false;
    draft.editable = true;
    draft.metadata.sourceMapId = mapEditorState.sourceId;
  }
  const result = saveCustomMapDefinition(draft, { overwrite: !BUILTIN_MAP_DEFINITIONS[draft.id] && Boolean(getMapDefinitionById(draft.id)) });
  if (!result.ok) {
    if (typeof alert === "function") alert(`Mappa non salvata.\n${(result.issues || []).join("\n")}`);
    renderMapEditor();
    return false;
  }
  mapEditorState.sourceId = result.definition.id;
  mapEditorState.draft = result.definition;
  mapEditorRefreshMapSelect(result.definition.id);
  if (typeof refreshSetupMapSelector === "function") refreshSetupMapSelector(result.definition.id);
  renderMapEditor();
  return true;
}

function mapEditorOpenLab() {
  const validation = validateMapDefinition(mapEditorState.draft, { imported: true });
  if (!validation.valid) {
    if (typeof alert === "function") alert("Correggi gli errori di validazione prima di avviare il Match Lab.");
    return;
  }
  if (!mapEditorSave()) return;
  mapEditorState.labMapId = mapEditorState.draft.id;
  if (typeof openNewGameSetupScreen === "function") {
    openNewGameSetupScreen();
    if (typeof refreshSetupMapSelector === "function") refreshSetupMapSelector(mapEditorState.labMapId);
  }
}

function openMapEditorScreen(mapId = "map1_starter") {
  if (typeof setAppScreen === "function" && typeof ARENA_APP_SCREENS !== "undefined") setAppScreen(ARENA_APP_SCREENS.MAP_EDITOR);
  if (!mapEditorState.draft || (mapId && mapId !== mapEditorState.sourceId)) mapEditorLoad(mapId, { copy: true });
  else renderMapEditor();
}

function initializeMapEditorScreen() {
  if (mapEditorState.initialized || typeof document === "undefined") return;
  mapEditorState.initialized = true;
  const legend = mapEditorEl("mapEditorTerrainLegend");
  if (legend) legend.innerHTML = terrainDefinitions().map(terrain => `<div class="${mapEditorEscape(terrain.visualClass)}"><span>${mapEditorEscape(terrain.icon)}</span><strong>${mapEditorEscape(terrain.name)}</strong><small>${mapEditorEscape(terrain.description)}</small></div>`).join("");
  mapEditorRefreshMapSelect("map1_starter");
  const mapSelect = mapEditorEl("mapEditorMapSelect");
  if (mapSelect) mapSelect.addEventListener("change", () => mapEditorLoad(mapSelect.value, { copy: true }));
  const newButton = mapEditorEl("mapEditorNewBtn");
  if (newButton) newButton.addEventListener("click", () => {
    const template = mapEditorEl("mapEditorTemplateSelect");
    mapEditorState.sourceId = "";
    mapEditorState.draft = mapEditorTemplateDefinition(template ? template.value : "single");
    mapEditorState.undo = [];
    mapEditorState.redo = [];
    mapEditorState.operationWarnings = [];
    mapEditorSyncForm();
    mapEditorFit();
  });
  const nameInput = mapEditorEl("mapEditorNameInput");
  if (nameInput) nameInput.addEventListener("input", () => {
    if (!mapEditorState.draft) return;
    mapEditorState.draft.name = mapRuntimeSafeText(nameInput.value || "Mappa custom", 80);
    renderMapEditor();
  });
  const descriptionInput = mapEditorEl("mapEditorDescriptionInput");
  if (descriptionInput) descriptionInput.addEventListener("input", () => {
    if (!mapEditorState.draft) return;
    mapEditorState.draft.description = mapRuntimeSafeText(descriptionInput.value, 500);
  });
  const tagsInput = mapEditorEl("mapEditorTagsInput");
  if (tagsInput) tagsInput.addEventListener("input", () => {
    if (!mapEditorState.draft) return;
    mapEditorState.draft.metadata.tags = tagsInput.value
      .split(",")
      .map(tag => mapRuntimeSafeText(tag, 32))
      .filter(Boolean)
      .slice(0, 20);
  });
  const playerCount = mapEditorEl("mapEditorPlayerCount");
  if (playerCount) playerCount.addEventListener("change", () => {
    mapEditorPushUndo();
    mapEditorState.draft.playerCount = Number(playerCount.value);
    mapEditorEnsurePlayerSlots();
    renderMapEditor();
  });
  const movement = mapEditorEl("mapEditorMovementMultiplier");
  if (movement) movement.addEventListener("change", () => {
    mapEditorPushUndo();
    mapEditorState.draft.movementMultiplier = Number(movement.value);
    renderMapEditor();
  });
  const componentSelect = mapEditorEl("mapEditorComponentSelect");
  if (componentSelect) componentSelect.addEventListener("change", mapEditorSyncComponentControls);
  const updateSelectedComponent = () => {
    const component = mapEditorSelectedComponent();
    if (!component) return;
    const radius = mapEditorEl("mapEditorComponentRadius");
    const originX = mapEditorEl("mapEditorComponentOriginX");
    const originY = mapEditorEl("mapEditorComponentOriginY");
    const rotation = mapEditorEl("mapEditorComponentRotation");
    mapEditorPushUndo();
    component.radius = Math.max(1, Math.min(12, Math.trunc(Number(radius && radius.value) || component.radius || 6)));
    const x = Math.max(-30, Math.min(30, Math.trunc(Number(originX && originX.value) || 0)));
    const y = Math.max(-30, Math.min(30, Math.trunc(Number(originY && originY.value) || 0)));
    component.origin = [x, y, -x - y];
    component.rotation = [0, 60, 120, 180, 240, 300].includes(Number(rotation && rotation.value)) ? Number(rotation.value) : 0;
    mapEditorRebuildGeometryFromComponents();
  };
  ["mapEditorComponentRadius", "mapEditorComponentOriginX", "mapEditorComponentOriginY", "mapEditorComponentRotation"].forEach(id => {
    const control = mapEditorEl(id);
    if (control) control.addEventListener("change", updateSelectedComponent);
  });
  const toolGrid = mapEditorEl("mapEditorToolGrid");
  if (toolGrid) toolGrid.addEventListener("click", event => {
    const button = event.target.closest("[data-map-tool]");
    if (!button) return;
    mapEditorState.tool = button.dataset.mapTool;
    toolGrid.querySelectorAll("[data-map-tool]").forEach(node => node.classList.toggle("isActive", node === button));
    mapEditorToolOptions();
  });
  const svg = mapEditorEl("mapEditorCanvas");
  if (svg) {
    svg.addEventListener("wheel", event => {
      event.preventDefault();
      mapEditorState.view.scale = Math.max(0.15, Math.min(4, mapEditorState.view.scale * (event.deltaY > 0 ? 0.9 : 1.1)));
      renderMapEditor();
    }, { passive: false });
    svg.addEventListener("pointerdown", event => {
      if (event.target.closest("[data-map-cell]")) return;
      svg.setPointerCapture(event.pointerId);
      mapEditorState.drag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, viewX: mapEditorState.view.x, viewY: mapEditorState.view.y };
    });
    svg.addEventListener("pointermove", event => {
      const drag = mapEditorState.drag;
      if (!drag || drag.pointerId !== event.pointerId) return;
      mapEditorState.view.x = drag.viewX + event.clientX - drag.x;
      mapEditorState.view.y = drag.viewY + event.clientY - drag.y;
      renderMapEditor();
    });
    svg.addEventListener("pointerup", () => { mapEditorState.drag = null; });
    svg.addEventListener("dblclick", event => {
      if (event.target.closest("[data-map-cell]")) return;
      const rect = svg.getBoundingClientRect();
      const localX = ((event.clientX - rect.left) / rect.width) * 1200;
      const localY = ((event.clientY - rect.top) / rect.height) * 800;
      const worldX = (localX - mapEditorState.view.x) / mapEditorState.view.scale;
      const worldY = (localY - mapEditorState.view.y) / mapEditorState.view.scale;
      const previousTool = mapEditorState.tool;
      const previousValue = mapEditorState.toolValue;
      mapEditorState.tool = "cell";
      mapEditorState.toolValue = "add";
      mapEditorApplyTool(mapEditorPointToCube(worldX, worldY));
      mapEditorState.tool = previousTool;
      mapEditorState.toolValue = previousValue;
    });
  }
  const bind = (id, handler) => {
    const element = mapEditorEl(id);
    if (element) element.addEventListener("click", handler);
  };
  bind("mapEditorUndoBtn", mapEditorUndo);
  bind("mapEditorRedoBtn", mapEditorRedo);
  bind("mapEditorFitBtn", mapEditorFit);
  bind("mapEditorNormalizeComponentsBtn", () => {
    mapEditorPushUndo();
    mapEditorRebuildGeometryFromComponents();
  });
  bind("mapEditorSaveBtn", mapEditorSave);
  bind("mapEditorLabBtn", mapEditorOpenLab);
  bind("mapEditorExportBtn", () => {
    const result = exportMapDefinitionJson(mapEditorState.draft);
    if (!result.ok) {
      if (typeof alert === "function") alert("La mappa deve essere valida prima dell'esportazione.");
      return;
    }
    mapEditorDownload(`${mapRuntimeSafeId(mapEditorState.draft.id)}.json`, result.json);
  });
  const importFile = mapEditorEl("mapEditorImportFile");
  bind("mapEditorImportBtn", () => { if (importFile) importFile.click(); });
  if (importFile) importFile.addEventListener("change", async () => {
    const file = importFile.files && importFile.files[0];
    if (!file) return;
    const result = importMapDefinitionJson(await file.text(), { save: false });
    importFile.value = "";
    if (!result.ok) {
      if (typeof alert === "function") alert(`Import fallito.\n${(result.issues || []).join("\n")}`);
      return;
    }
    mapEditorState.sourceId = "";
    mapEditorState.draft = result.definition;
    mapEditorState.undo = [];
    mapEditorState.redo = [];
    mapEditorSyncForm();
    mapEditorFit();
  });
  bind("mapEditorDeleteBtn", () => {
    if (!mapEditorState.sourceId || BUILTIN_MAP_DEFINITIONS[mapEditorState.sourceId]) return;
    if (typeof confirm === "function" && !confirm(`Eliminare la mappa custom "${mapEditorState.draft.name}"?`)) return;
    const result = deleteCustomMapDefinition(mapEditorState.sourceId);
    if (result.ok) mapEditorLoad("map1_starter", { copy: true });
  });
  mapEditorLoad("map1_starter", { copy: true });
}
