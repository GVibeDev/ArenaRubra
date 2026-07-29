from pathlib import Path
from playwright.sync_api import sync_playwright
import json, re

ROOT=Path(__file__).resolve().parents[1]
errors=[]; console_errors=[]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--allow-file-access-from-files'])
    page=browser.new_page(viewport={"width":1280,"height":820})
    page.on('pageerror',lambda exc: errors.append(str(exc)))
    page.on('console',lambda msg: console_errors.append(msg.text) if msg.type=='error' else None)
    index=(ROOT/'index.html').read_text(encoding='utf-8')
    scripts=re.findall(r'<script\s+src="([^"]+)"\s*></script>',index)
    html=re.sub(r'<script\s+src="[^"]+"\s*></script>','',index)
    html=re.sub(r'<link\s+rel="stylesheet"\s+href="[^"]+"\s*/?>','',html)
    page.set_content(html,wait_until='load')
    page.add_style_tag(path=str(ROOT/'css/style.css'))
    for rel in scripts: page.add_script_tag(path=str(ROOT/rel))
    page.wait_for_function("typeof BUILD_INFO !== 'undefined' && typeof f9s1bAbilityHandler === 'function' && typeof buildCardCatalog === 'function'")
    result=page.evaluate("""() => {
      const factions=['Nexus','Exordium','Liberti','Agathoi','Fabeot'];
      const cards=buildCardCatalog();
      const byFaction=Object.fromEntries(factions.map(f=>[f,{
        units:BLUEPRINTS.filter(x=>x.faction===f).length,
        tactics:DECK_TACTICS.filter(x=>x.faction===f).length,
        missions:MISSION_DEFINITIONS.filter(x=>x.faction===f).length,
        total:cards.filter(x=>x.faction===f).length,
        pivots:BLUEPRINTS.filter(x=>x.faction===f&&x.weight==='Pivot').map(x=>x.id)
      }]));
      const ids=['NXPIV02','EXPIV02','LXPIV02','AGPIV02','FBPIV02'];
      const pivots=Object.fromEntries(ids.map(id=>{const x=BLUEPRINTS.find(b=>b.id===id);return [id,{cost:x.cost,hp:x.hp,def:x.def,att:x.att,kind:x.ability.kind}]}));
      const catalogIds=cards.map(x=>x.id);
      const duplicates=catalogIds.filter((id,i)=>catalogIds.indexOf(id)!==i);
      const pre=runPrecheck({quiet:true,source:'f9s1b-browser'});
      return {build:BUILD_INFO.version,baseline:BUILD_INFO.logicBaseline,mode:CARD_CATALOG_CONFIG.mode,byFaction,pivots,duplicates,pre:{ok:pre.ok,problems:pre.problems,warnings:pre.warnings},runtime:typeof f9s1bAdjustIncomingDamage};
    }""")
    browser.close()

assert result['build'].startswith('C2-STABLE-1-F9'),result
assert result['baseline'].startswith('C2-STABLE-1-F9'),result
assert result['mode']=='alternative_pivots_complete_40_card_pools',result
for f,data in result['byFaction'].items():
    assert data['units']==23,(f,data)
    assert data['tactics']==14,(f,data)
    assert data['missions']==3,(f,data)
    assert data['total']==40,(f,data)
    assert len(data['pivots'])==2,(f,data)
assert result['pivots']['NXPIV02']=={'cost':5,'hp':4,'def':6,'att':4,'kind':'f9s1bAdjacentMoveLock'}
assert result['pivots']['EXPIV02']=={'cost':5,'hp':5,'def':4,'att':5,'kind':'f9s1bLineSuppression'}
assert result['pivots']['LXPIV02']=={'cost':4,'hp':4,'def':3,'att':3,'kind':'f9s1bCrash'}
assert result['pivots']['AGPIV02']=={'cost':6,'hp':6,'def':5,'att':4,'kind':'f9s1bErkos'}
assert result['pivots']['FBPIV02']=={'cost':6,'hp':6,'def':8,'att':0,'kind':'f9s1CellBarrage'}
assert not result['duplicates'],result
assert result['pre']['ok'] and not result['pre']['problems'],result
assert result['runtime']=='function',result
assert not errors,errors
assert not console_errors,console_errors
print(json.dumps({'ok':True,**result,'pageErrors':errors,'consoleErrors':console_errors},ensure_ascii=False,indent=2))
