#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui.js'), 'utf8');

function parseBlock(key, anchor) {
  const re = new RegExp(anchor + key + ':Object\\.freeze\\(\\{([\\s\\S]*?)\\n  \\}\\),');
  const m = src.match(re);
  if (!m) throw new Error('Block not found: ' + key);
  return m[1];
}
function pick(block, key) {
  const re = new RegExp(key + ':\"(#(?:[0-9a-fA-F]{6}))\"');
  const m = block.match(re);
  if (!m) throw new Error('Token not found: ' + key);
  return m[1].toLowerCase();
}
function luminance(hex) {
  const rgb = hex.replace('#','').match(/../g).map(v => parseInt(v,16) / 255).map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}
function contrast(a, b) {
  const l1 = luminance(a), l2 = luminance(b);
  const hi = Math.max(l1, l2), lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}
const menuBlock = parseBlock('agathoi_kleos', 'const ARENA_MENU_THEMES_F9W2B = Object\\.freeze\\(\\{[\\s\\S]*?');
const slotBlock = parseBlock('agathoi_kleos', 'const ARENA_UI_THEME_SKIN_ASSETS_F9W2D = Object\\.freeze\\(\\{[\\s\\S]*?');
const surface = pick(menuBlock, 'surface');
const surface2 = pick(menuBlock, 'surface2');
const accent = pick(menuBlock, 'accent');
const textPrimary = pick(slotBlock, 'textPrimary');
const textSecondary = pick(slotBlock, 'textSecondary');
const textHeading = pick(slotBlock, 'textHeading');
const textOnAccent = pick(slotBlock, 'textOnAccent');
const tableText = pick(slotBlock, 'tableText');

if (!/materialBlendMode:"multiply"/.test(slotBlock)) throw new Error('Agathoi materialBlendMode must be multiply');
if (contrast(surface, textPrimary) < 10) throw new Error('Primary text contrast too low');
if (contrast(surface, textSecondary) < 7) throw new Error('Secondary text contrast too low');
if (contrast(surface2, textHeading) < 11) throw new Error('Heading contrast too low');
if (contrast(surface2, tableText) < 10) throw new Error('Table text contrast too low');
if (contrast(accent, textOnAccent) < 7) throw new Error('Accent button contrast too low');
if (!/agathoiPaletteReadable:true/.test(src)) throw new Error('Snapshot marker missing: agathoiPaletteReadable');
if (!/agathoiTextContrastBoosted:true/.test(src)) throw new Error('Snapshot marker missing: agathoiTextContrastBoosted');
console.log('PASS f9w2d3_agathoi_palette_readability_smoke.js');
