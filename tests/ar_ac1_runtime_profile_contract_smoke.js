"use strict";

const assert=require("assert");
const fs=require("fs");
const path=require("path");
const vm=require("vm");
const root=path.resolve(__dirname,"..");
const source=fs.readFileSync(path.join(root,"src/runtime_profile.js"),"utf8");
const index=fs.readFileSync(path.join(root,"index.html"),"utf8");
const buildProfile=fs.readFileSync(path.join(root,"data/runtime_profile_build.js"),"utf8");

function boot(profile,query="") {
  const writes=[];
  const context={console,URLSearchParams,location:{search:query},document:{write:value=>writes.push(value)},ARENA_RUNTIME_BUILD_PROFILE:profile,arenaStorageReadSettings:()=>({})};
  context.globalThis=context;vm.createContext(context);vm.runInContext(source,context);
  const result=vm.runInContext(`(() => { for (const path of ArenaRuntimeProfile.MANIFEST.devOnly) ArenaRuntimeProfile.loadScript(path,"dev"); return ArenaRuntimeProfile.diagnostics(); })()`,context);
  return {result:JSON.parse(JSON.stringify(result)),writes};
}

const dev=boot("dev");
assert.strictEqual(dev.result.profile,"dev");
assert.strictEqual(dev.result.loaded.length,12);
assert.strictEqual(dev.writes.length,12);
assert(dev.writes.every(value=>/^<script src="src\/.+"><\/script>$/.test(value)),dev.writes[0]);
const distribution=boot("distribution");
assert.strictEqual(distribution.result.profile,"distribution");
assert.strictEqual(distribution.result.requested.length,12);
assert.strictEqual(distribution.result.loaded.length,0);
assert.strictEqual(distribution.writes.length,0);
const query=boot("dev","?profile=distribution");
assert.strictEqual(query.result.profile,"distribution");
assert.strictEqual(query.writes.length,0);
assert(buildProfile.includes('ARENA_RUNTIME_BUILD_PROFILE = "dev"'));
for(const modulePath of dev.result.loaded) {
  assert(index.includes(`ArenaRuntimeProfile.loadScript("${modulePath}","dev")`),modulePath);
  const executableIndex=index.replace(/<!--[^]*?-->/g,"");
  assert(!executableIndex.includes(`<script src="${modulePath}"></script>`),`unconditional DEV module: ${modulePath}`);
}
assert(!/eval\(|new Function/.test(source));
console.log("AR-AC1 runtime profile contract smoke: 24/24 OK");
