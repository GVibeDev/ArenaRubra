from pathlib import Path
from playwright.sync_api import sync_playwright
import json

ROOT = Path(__file__).resolve().parents[1]
errors=[]
console_errors=[]

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox','--allow-file-access-from-files'])
    page=browser.new_page(viewport={"width":900,"height":620}, has_touch=True)
    page.on('pageerror', lambda exc: errors.append(str(exc)))
    page.on('console', lambda msg: console_errors.append(msg.text) if msg.type=='error' else None)
    page.set_content('''<!doctype html><html><body><div id="gameScreen" style="display:block;position:fixed;inset:0"></div><div id="backHost"></div><button data-arena-card-motion-toggle>Carte animate ON</button></body></html>''')
    page.add_style_tag(path=str(ROOT/'css/style.css'))
    page.add_script_tag(content='''
      let _settings={}; function arenaStorageReadSettings(){return _settings;} function arenaStorageWriteSettings(value){_settings=value;return true;}
      const state={modes:{1:'human',2:'bot'},currentPlayer:2,factions:{1:'Nexus',2:'Exordium'},hand:{1:[{cardUid:'h1',name:'Mia',sourceType:'unit'}],2:[{cardUid:'b1',name:'Segreta',sourceType:'unit'},{cardUid:'m2',name:'Missione',sourceType:'mission'},{cardUid:'c2',name:'Varran',cardType:'commander'}]},discard:{1:[],2:[]}};
    ''')
    page.add_script_tag(path=str(ROOT/'src/card_assets.js'))
    page.add_script_tag(path=str(ROOT/'src/card_motion.js'))

    privacy=page.evaluate('''() => ({
      viewer:cardPresentationViewerSide(), display:cardPresentationDisplaySide(),
      botOrdinaryHidden:handCardHiddenFromViewer(2,state.hand[2][0]),
      missionPublic:!handCardHiddenFromViewer(2,state.hand[2][1]),
      commanderPublic:!handCardHiddenFromViewer(2,state.hand[2][2]),
      humanVisible:!handCardHiddenFromViewer(1,state.hand[1][0]),
      exoCandidates:cardBackCandidatesForFaction('Exordium'), hiddenName:cardPresentationVisibleCardName(2,state.hand[2][0]), hiddenList:cardPresentationVisibleCardsLabel(2,[state.hand[2][0]])
    })''')
    assert privacy['viewer']==1 and privacy['display']==1, privacy
    assert privacy['botOrdinaryHidden'] and privacy['missionPublic'] and privacy['commanderPublic'] and privacy['humanVisible'], privacy
    assert privacy['exoCandidates'][0].endswith('/exoback.webp'), privacy
    assert privacy['hiddenName']=='una carta coperta' and privacy['hiddenList']=='1 carta coperta', privacy

    back=page.evaluate('''() => {
      const host=document.getElementById('backHost');
      host.innerHTML=cardBackVisualHtml('Exordium',{blocked:true});
      const shell=host.querySelector('.factionCardBack');
      const img=host.querySelector('img');
      const src=img.getAttribute('src');
      const candidates=img.getAttribute('data-card-back-candidates');
      img.onerror=null; img.hidden=true; shell.classList.add('assetMissing');
      return {src,candidates,blocked:!!host.querySelector('.cardBackBlockedMark'),fallback:!!host.querySelector('.factionCardBackFallback'),text:host.textContent};
    }''')
    assert back['src'].endswith('/exoback.webp') and back['blocked'] and back['fallback'], back
    assert 'Segreta' not in back['text'], back

    page.evaluate('''() => cardMotionEnqueueGameEvent({type:'CARD_DRAWN',seq:1,data:{player:2,faction:'Exordium',count:1,cards:[{cardUid:'b1'}]}})''')
    page.wait_for_timeout(40)
    hidden_draw=page.evaluate('''() => { const s=document.querySelector('#cardMotionStage'); return {hidden:s.hidden,text:s.textContent,hasBack:!!s.querySelector('.factionCardBack')}; }''')
    assert not hidden_draw['hidden'] and hidden_draw['hasBack'], hidden_draw
    assert 'Carta pescata' in hidden_draw['text'] and 'Segreta' not in hidden_draw['text'], hidden_draw

    page.evaluate('cardMotionClear()')
    page.evaluate('''() => cardMotionEnqueueGameEvent({type:'CARD_PLAYED',seq:2,data:{player:2,faction:'Exordium',cardUid:'b1',cardName:'Segreta',sourceType:'unit'}})''')
    page.wait_for_timeout(40)
    public_play=page.evaluate('''() => { const s=document.querySelector('#cardMotionStage'); return {hidden:s.hidden,text:s.textContent,face:!!s.querySelector('.cardMotionFace')}; }''')
    assert not public_play['hidden'] and public_play['face'] and 'Segreta' in public_play['text'], public_play

    manual_reduced=page.evaluate('''() => { cardMotionSetReduced(true,{persist:true}); const b=document.querySelector('[data-arena-card-motion-toggle]'); return {reduced:cardMotionReducedMotion(),text:b.textContent,dataset:document.documentElement.dataset.cardMotion,persisted:_settings.presentation&&_settings.presentation.cardAnimationsReduced}; }''')
    assert manual_reduced['reduced'] and manual_reduced['persisted'] and manual_reduced['dataset']=='reduced' and 'RIDOTTE' in manual_reduced['text'], manual_reduced

    mission_dedupe=page.evaluate('''() => cardMotionDescriptorForGameEvent({type:'CARD_PLAYED',seq:3,data:{player:1,sourceType:'mission',cardName:'Missione'}})===null''')
    assert mission_dedupe

    page.emulate_media(reduced_motion='reduce')
    page.evaluate('cardMotionClear()')
    page.evaluate('''() => cardMotionEnqueueGameEvent({type:'CARD_BLOCKED',seq:4,data:{enemy:2,enemyFaction:'Exordium',count:2}})''')
    page.wait_for_timeout(20)
    reduced=page.evaluate('''() => { const s=document.querySelector('#cardMotionStage'); const cs=getComputedStyle(s); return {animation:cs.animationName,duration:cs.animationDuration,text:s.textContent}; }''')
    assert reduced['animation']=='arenaCardMotionReduced', reduced
    assert '2 carta/e bloccata/e' in reduced['text'], reduced
    browser.close()

result={'ok':True,'privacy':privacy,'back':back,'hiddenDraw':hidden_draw,'publicPlay':public_play,'manualReduced':manual_reduced,'missionDedupe':mission_dedupe,'reducedMotion':reduced,'pageErrors':errors,'consoleErrors':console_errors}
print(json.dumps(result,ensure_ascii=False,indent=2))
assert not errors, errors
assert not console_errors, console_errors
