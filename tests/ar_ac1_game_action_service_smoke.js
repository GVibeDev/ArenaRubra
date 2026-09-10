"use strict";

const assert=require("assert");
const fs=require("fs");
const path=require("path");
const vm=require("vm");
const root=path.resolve(__dirname,"..");
const source=fs.readFileSync(path.join(root,"src/core/action_service.js"),"utf8");
const calls=[];
const context={};vm.createContext(context);vm.runInContext(source,context);
const service=context.createGameActionService({handlers:{
  move:{validate(payload){calls.push("validate:move");return payload.legal?true:"illegal_move";},apply(payload){calls.push("apply:move");return payload.result;}},
  attack:{apply(){calls.push("apply:attack");return undefined;}}
}});
assert(Object.isFrozen(service));
assert.deepStrictEqual(Array.from(service.knownTypes),["attack","move"]);
assert.strictEqual(service.normalizeAction(null).reason,"action_object_required");
assert.strictEqual(service.normalizeAction({}).reason,"action_type_required");
assert.strictEqual(service.validate({type:"unknown"}).reason,"unknown_action_type");
assert.strictEqual(service.validate({type:"MOVE",payload:{legal:false}}).reason,"illegal_move");
assert.deepStrictEqual(calls,["validate:move"]);
const accepted=service.apply({type:" MOVE ",payload:{legal:true,result:"moved"}});
assert.strictEqual(accepted.applied,true);
assert.strictEqual(accepted.result,"moved");
assert.deepStrictEqual(calls,["validate:move","validate:move","apply:move"]);
const rejected=service.apply({type:"move",payload:{legal:false}});
assert.strictEqual(rejected.applied,false);
assert.strictEqual(rejected.result,null);
assert.deepStrictEqual(calls,["validate:move","validate:move","apply:move","validate:move"]);
const undefinedResult=service.apply({type:"attack"});
assert.strictEqual(undefinedResult.applied,true);
assert.strictEqual(undefinedResult.result,null);
assert(!/document|window\.|localStorage|sessionStorage|indexedDB|state\.|render\(/.test(source));
console.log("AR-AC1 Game Action service smoke: 15/15 OK");
