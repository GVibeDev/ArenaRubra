"use strict";
const fs=require("fs");
const vm=require("vm");
const path=require("path");
const assert=require("assert");
const root=path.resolve(__dirname,"..");
const fields={
  cardEditorKind:"tactic", cardEditorFaction:"Nexus", cardEditorName:"Impulso custom",
  cardEditorSourceId:"CUS_NX_TAC_IMPULSO", cardEditorCost:"2", cardEditorDescription:"Infligge danno.",
  cardEditorTacticCategory:"Operazione", cardEditorTacticTarget:"enemy",
  cardEditorActiveKind:"damage", cardEditorActiveValue:"3", cardEditorActiveRange:"2",
  cardEditorActiveCost:"0", cardEditorActiveCooldown:"1", cardEditorActiveTarget:"enemy",
  cardEditorActiveFilter:"infantry", cardEditorActiveStatusKind:"inhibit_attack", cardEditorActiveStatusTurns:"1",
  cardEditorActiveDescription:"", cardEditorPassiveKind:"none", cardEditorPassiveValue:"1",
  cardEditorPassiveRange:"1", cardEditorPassiveDescription:"", cardEditorArtZoom:"1",
  cardEditorArtOffsetX:"0", cardEditorArtOffsetY:"0", cardEditorArtPreset:"recommended"
};
const elements={};
for(const [id,value] of Object.entries(fields)) elements[id]={id,value,type:"text"};
const local={};
const context={
  console,Math,Object,Array,Set,Map,Date,JSON,Number,String,Boolean,Infinity,
  STATUS_DEFINITIONS:{inhibit_action:{},inhibit_attack:{},inhibit_move:{},bleed:{},thorns:{}},
  document:{getElementById(id){return elements[id]||null;}},
  localStorage:{setItem(k,v){local[k]=String(v);},getItem(k){return Object.prototype.hasOwnProperty.call(local,k)?local[k]:null;},removeItem(k){delete local[k];}},
  buildCardCatalog(){return[];}
};
context.globalThis=context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,"src/custom_tactics.js"),"utf8"),context);
vm.runInContext(fs.readFileSync(path.join(root,"src/card_editor.js"),"utf8"),context);
let card=context.cardEditorBuildPreviewCard();
assert.equal(card.implementationStatus,"custom_playable_f9n1");
assert.equal(card.targetDomain,"board_unit");
assert.equal(card.targetSide,"enemy");
assert.equal(card.durationMode,"immediate");
assert.equal(card.customTacticRuntimeVersion,"F9N1");
assert.equal(context.cardEditorValidateCard(card).customTacticRuntimeCheck.playable,true);

elements.cardEditorActiveKind.value="cell_blast";
elements.cardEditorActiveValue.value="2";
elements.cardEditorActiveRange.value="3";
card=context.cardEditorBuildPreviewCard();
assert.equal(card.targetDomain,"board_cell");
assert.equal(card.targetSide,"both");
assert.equal(card.implementationStatus,"custom_playable_f9n1");

elements.cardEditorActiveKind.value="custom_text_only";
card=context.cardEditorBuildPreviewCard();
assert.equal(card.implementationStatus,"custom_data_only");
assert.equal(context.cardEditorValidateCard(card).customTacticRuntimeCheck.playable,false);
console.log(JSON.stringify({ok:true,tests:11},null,2));
