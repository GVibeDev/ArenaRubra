from pathlib import Path
from playwright.sync_api import sync_playwright
import json

ROOT=Path(__file__).resolve().parents[1]
errors=[]
console_errors=[]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox','--allow-file-access-from-files'])
    page=browser.new_page(viewport={"width":1000,"height":720})
    page.on('pageerror', lambda exc: errors.append(str(exc)))
    page.on('console', lambda msg: console_errors.append(msg.text) if msg.type=='error' else None)
    page.set_content('''<!doctype html><html><body>
      <div id="boardVisualStack"><div id="board"></div></div>
    </body></html>''')
    page.evaluate("() => { try { Element.prototype.replaceChildren = undefined; } catch (_) {} }")
    page.add_script_tag(content=r'''
      const CENTER_X=460,CENTER_Y=390,HEX_SIZE=45,RADIUS=6;
      let mode='idle',selectedId='u1',pendingAbility=null,pendingHandCardUid=null,pendingTacticId=null,pendingBuildBlueprintId=null,pendingPurchaseBlueprintId=null,pendingBuildSource=null;
      let moveTargets=[];
      let clicks=[];
      let state={
        currentPlayer:1,
        cells:[
          {coord:[0,0,0],ps:false,control:null},
          {coord:[1,-1,0],ps:true,control:1},
          {coord:[0,-1,1],ps:false,control:null}
        ],
        units:[{uid:'u1',name:'Fante Robot',faction:'Nexus',side:1,type:'Fanteria',weight:'Leggera',alive:true,acted:false,pos:[0,0,0],currentHp:2,maxHp:2,currentDef:1,currentAtt:2,buffs:[]}]
      };
      function $(id){return document.getElementById(id)}
      function gameScreenDisplayedUnitId(){return selectedId}
      function getSelectedUnit(){return state.units.find(u=>u.uid===selectedId)||null}
      function hqSideAt(){return null}
      function isPsLocked(){return false}
      function isCellBlockedByEffect(){return false}
      function hasCellEffect(){return false}
      function cellEffectsSummary(){return ''}
      function factionMeta(){return {key:'nexus'}}
      function factionMetaBySide(){return {color:'#2b6fb8'}}
      function playerName(side){return 'G'+side}
      function hasStatus(){return false}
      function hasAnyInhibition(){return false}
      function effectiveThorns(){return 0}
      function effectiveAtt(unit){return unit.currentAtt}
      function unitStatusSummary(){return ''}
      function visualAssetTokenGraphicsEnabled(){return false}
      function movableCells(){return moveTargets}
      function adjacentAttackTargets(){return []}
      function canAttack(){return true}
      function handleCellClick(coord){clicks.push(coord.join(','))}
    ''')
    page.add_script_tag(path=str(ROOT/'src/render.js'))
    page.add_script_tag(content="unitStatusSummary=function(){return ''};")

    first=page.evaluate('''() => {
      renderBoard();
      return {
        diag:boardRenderDiagnostics(),
        cells:[...document.querySelectorAll('.hex')],
        token:document.querySelector('.unitToken'),
        html:document.getElementById('board').innerHTML
      };
    }''')
    assert first['diag']['fullBuilds']==1 and first['diag']['cells']==3, first
    refs=page.evaluate_handle('''() => ({cells:[...document.querySelectorAll('.hex')],token:document.querySelector('.unitToken')})''')

    unchanged=page.evaluate('''() => {
      const before=[...document.querySelectorAll('.hex')]; const token=document.querySelector('.unitToken');
      renderBoard();
      const after=[...document.querySelectorAll('.hex')];
      return {sameCells:before.every((node,i)=>node===after[i]),sameToken:token===document.querySelector('.unitToken'),diag:boardRenderDiagnostics()};
    }''')
    assert unchanged['sameCells'] and unchanged['sameToken'], unchanged
    assert unchanged['diag']['patchedCells']==0 and unchanged['diag']['patchedTokens']==0, unchanged

    hp_update=page.evaluate('''() => {
      const token=document.querySelector('.unitToken');
      state.units[0].currentHp=1;
      renderBoard();
      return {sameToken:token===document.querySelector('.unitToken'),hp:document.querySelector('.statHp').textContent,diag:boardRenderDiagnostics()};
    }''')
    assert hp_update['sameToken'] and hp_update['hp']=='1' and hp_update['diag']['patchedTokens']==1, hp_update

    moved=page.evaluate('''() => {
      const token=document.querySelector('.unitToken');
      state.units[0].pos=[1,-1,0];
      renderBoard();
      return {sameToken:token===document.querySelector('.unitToken'),parent:token.parentElement.dataset.coordKey,diag:boardRenderDiagnostics()};
    }''')
    assert moved['sameToken'] and moved['parent']=='1,-1,0', moved
    assert moved['diag']['patchedCells']==2, moved

    targeting=page.evaluate('''() => {
      mode='move'; moveTargets=[[0,-1,1]];
      renderBoard();
      const target=document.querySelector('[data-coord-key="0,-1,1"]');
      return {target:target.classList.contains('moveTarget'),diag:boardRenderDiagnostics()};
    }''')
    assert targeting['target'], targeting

    delegated=page.evaluate('''() => {
      document.querySelector('.unitToken .symbol').click();
      return {clicks:[...clicks]};
    }''')
    assert delegated['clicks']==['1,-1,0'], delegated

    removed=page.evaluate('''() => {
      state.units[0].alive=false;
      renderBoard();
      return {tokens:document.querySelectorAll('.unitToken').length,diag:boardRenderDiagnostics()};
    }''')
    assert removed['tokens']==0 and removed['diag']['unitNodes']==0, removed

    rebuilt=page.evaluate('''() => {
      state.cells.push({coord:[-1,1,0],ps:false,control:null});
      renderBoard();
      return {count:document.querySelectorAll('.hex').length,diag:boardRenderDiagnostics()};
    }''')
    assert rebuilt['count']==4 and rebuilt['diag']['fullBuilds']==2, rebuilt
    browser.close()

result={
  'ok':True,
  'first':first['diag'],
  'unchanged':unchanged,
  'hpUpdate':hp_update,
  'moved':moved,
  'targeting':targeting,
  'delegated':delegated,
  'removed':removed,
  'rebuilt':rebuilt,
  'pageErrors':errors,
  'consoleErrors':console_errors
}
print(json.dumps(result,ensure_ascii=False,indent=2))
assert not errors, errors
assert not console_errors, console_errors
