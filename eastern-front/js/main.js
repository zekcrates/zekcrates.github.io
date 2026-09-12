'use strict';
/* =====================================================================
   MAIN — bootstrap, UI, input, loop, audio, intro/learn/end screens.
===================================================================== */

/* ---------------- audio (procedural, no assets) ---------------- */
const Snd = {
  ctx:null, master:null, muted:false,
  init(){
    if(this.ctx) return;
    try{
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    }catch(e){ this.ctx = null; }
  },
  env(node, t0, a, d, peak){
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(peak, t0+a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0+a+d);
    node.connect(g); g.connect(this.master);
    return g;
  },
  tone(f, t0, dur, type='sine', peak=0.3, slide=0){
    if(!this.ctx || this.muted) return;
    const o = this.ctx.createOscillator();
    o.type = type; o.frequency.setValueAtTime(f, t0);
    if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f+slide), t0+dur);
    this.env(o, t0, 0.01, dur, peak);
    o.start(t0); o.stop(t0+dur+0.1);
  },
  noise(t0, dur, peak=0.4, freq=800){
    if(!this.ctx || this.muted) return;
    const len = this.ctx.sampleRate * dur;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for(let i=0; i<len; i++) d[i] = (Math.random()*2-1) * (1 - i/len);
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const f = this.ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value = freq;
    src.connect(f); this.env(f, t0, 0.005, dur, peak);
    src.start(t0);
  },
  click(){ if(!this.ctx) return; this.tone(660, this.ctx.currentTime, 0.06, 'square', 0.12); },
  send(){ if(!this.ctx) return; const t = this.ctx.currentTime; this.tone(330, t, 0.1, 'square', 0.15); this.tone(440, t+0.09, 0.12, 'square', 0.15); },
  boom(){ if(!this.ctx) return; const t = this.ctx.currentTime; this.noise(t, 0.5, 0.5, 300); this.tone(90, t, 0.5, 'sine', 0.5, -60); },
  gun(){ if(!this.ctx || this.muted) return; const t = this.ctx.currentTime;   // MG burst: 4 cracks
    for(let i=0; i<4; i++){
      const tt = t + i*0.045 + (Math.random()*0.02);
      this.noise(tt, 0.04, 0.42, 2400 + Math.random()*900);
      this.tone(180 + Math.random()*120, tt, 0.03, 'square', 0.1);
    }
  },
  cannon(){ if(!this.ctx || this.muted) return; const t = this.ctx.currentTime;   // 88mm speaks
    this.tone(58, t, 0.5, 'sine', 1.0, -34);
    this.tone(29, t, 0.6, 'sine', 0.7, -12);
    this.noise(t, 0.08, 0.75, 900);                       // muzzle crack
    this.noise(t+0.04, 0.45, 0.5, 240);                   // rolling blast
  },
  alarm(){ if(!this.ctx || this.muted) return; const t = this.ctx.currentTime;   // two-tone air-raid siren
    for(let i=0; i<6; i++){
      const f = i % 2 === 0 ? 640 : 440;
      this.tone(f, t + i*0.38, 0.36, 'sawtooth', 0.3);
      this.tone(f*2, t + i*0.38, 0.36, 'triangle', 0.12);
    }
  },
  rocket(){ if(!this.ctx || this.muted) return; const t = this.ctx.currentTime;   // the Katyusha scream
    for(let i=0; i<4; i++){
      const tt = t + i*0.26;
      const o = this.ctx.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(380, tt);
      o.frequency.exponentialRampToValueAtTime(1900, tt+0.24);
      this.env(o, tt, 0.02, 0.26, 0.13); o.start(tt); o.stop(tt+0.3);
      const o2 = this.ctx.createOscillator(); o2.type = 'square';
      o2.frequency.setValueAtTime(520, tt);
      o2.frequency.exponentialRampToValueAtTime(2300, tt+0.24);
      this.env(o2, tt, 0.02, 0.26, 0.05); o2.start(tt); o2.stop(tt+0.3);
      this.noise(tt+0.26, 0.34, 0.4, 210);
    }
    this.tone(58, t+1.1, 0.5, 'sine', 0.7, -25);
  },
  artillery(){ if(!this.ctx || this.muted) return; const t = this.ctx.currentTime;   // incoming shell: whistle, then the earth
    const o = this.ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(1400, t);
    o.frequency.exponentialRampToValueAtTime(190, t+0.72);
    this.env(o, t, 0.03, 0.72, 0.16); o.start(t); o.stop(t+0.78);
    this.noise(t+0.68, 0.2, 0.8, 700);
    this.noise(t+0.82, 0.5, 0.7, 170);
    this.tone(52, t+0.7, 0.55, 'sine', 0.95, -25);
  },
  siren(){ if(!this.ctx || this.muted) return; const t = this.ctx.currentTime;   // the Jericho wail
    for(let i=0; i<2; i++){
      const o = this.ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(820, t + i*1.1);
      o.frequency.exponentialRampToValueAtTime(310, t + i*1.1 + 0.95);
      this.env(o, t + i*1.1, 0.06, 0.9, 0.12);
      o.start(t + i*1.1); o.stop(t + i*1.1 + 1.0);
    }
  },
  event(){ if(!this.ctx) return; const t = this.ctx.currentTime; this.tone(520, t, 0.08, 'triangle', 0.15); this.tone(390, t+0.08, 0.1, 'triangle', 0.15); },
  capture(sov){ if(!this.ctx) return; const t = this.ctx.currentTime; this.tone(196, t, 0.14, 'triangle', 0.25); this.tone(sov?262:233, t+0.12, 0.16, 'triangle', 0.25); this.tone(sov?330:294, t+0.26, 0.3, 'triangle', 0.3); },
  win(){ if(!this.ctx) return; const t = this.ctx.currentTime; [262,330,392,523].forEach((f,i)=>this.tone(f, t+i*0.16, 0.4, 'triangle', 0.3)); },
  lose(){ if(!this.ctx) return; const t = this.ctx.currentTime; [330,311,262,196].forEach((f,i)=>this.tone(f, t+i*0.2, 0.5, 'sawtooth', 0.18)); }
};

/* ---------------- shortcuts to DOM ---------------- */
const $ = s => document.querySelector(s);
const canvas = $('#map');

/* small HTML flag chips — real flag renders (Wikimedia), drawn in assets/ */
const flagHTML = (side, style) =>
  `<img class="wflag" src="assets/flag-${side==='GER'?'ger':'sov'}.png" alt="${side}"${style ? ` style="${style}"` : ''}>`;

/* ---------------- global ui state ---------------- */
let game = null, renderer = null;
const ui = {
  sel:null, target:null, frac:0.75, useAir:false,
  deploy:null,          // dock selection: 'inf' | 'tank' | 'heavy' | 'air'
  chosen:null, started:false, paused:false,
  lastPanel:0, lastTop:0, gunT:0
};
const DAY_MS = DAY_SEC * 1000;   // the war never stops — no pause, one tempo

/* =====================================================================
   INTRO
===================================================================== */
document.querySelectorAll('.faction-card').forEach(card => {
  card.addEventListener('click', () => {
    Snd.init(); Snd.click();
    document.querySelectorAll('.faction-card').forEach(c => c.classList.remove('sel'));
    card.classList.add('sel');
    ui.chosen = card.dataset.side;
    const b = $('#btn-start');
    b.disabled = false;
    b.textContent = `TAKE COMMAND — ${ui.chosen==='GER' ? 'WEHRMACHT' : 'RED ARMY'}`;
  });
});
$('#btn-start').addEventListener('click', () => {
  if(!ui.chosen) return;
  Snd.init(); Snd.capture(ui.chosen==='SOV');
  startGame(ui.chosen);
});
$('#btn-learn-intro').addEventListener('click', () => { Snd.init(); Snd.click(); buildLearn(); $('#learn').classList.remove('hidden'); });
$('#learn-close').addEventListener('click', () => { Snd.click(); $('#learn').classList.add('hidden'); });
$('#learn').addEventListener('click', e => { if(e.target.id === 'learn') $('#learn').classList.add('hidden'); });
$('#btn-again').addEventListener('click', () => location.reload());

document.body.querySelectorAll('[data-crest]').forEach(el => el.innerHTML = FACTIONS[el.dataset.crest].crest);

function startGame(side){
  Snd.init();
  game = new Game(side);
  window.__game = game;
  renderer = new Renderer(canvas, game);
  window.__renderer = renderer; window.__ui = ui;
  ui.sel = null; ui.target = null; ui.deploy = null; ui.started = true;
  document.body.dataset.side = side;
  $('#intro').classList.add('hidden');
  $('#topbar').classList.remove('hidden');
  $('#strip').classList.remove('hidden');
  $('#dock').classList.remove('hidden');
  buildTopbarStatic();
  buildDock();
}

/* =====================================================================
   DEPLOYMENT DOCK — Clash-style reserves
===================================================================== */
function buildDock(){
  const side = game.playerSide;
  const SHORT = { inf:'INFANTRY', tank:(side==='GER'?'PANZER':'T-34'), stug:'STUG III',
                  gd:'GROSSD.', nebelwerfer:'NEBELW.', guards:'GUARDS', kv1:'KV-1',
                  su76:'SU-76', heavy:(side==='GER'?'TIGER':'KATYUSHA') };
  const cards = DEPLOY_KEYS[side].map(k => ({ key:k, label:SHORT[k] }));
  cards.push({ key:'air', label:'AIR RAID', air:true });
  const profTxt = k => {
    const p = PROFILE[side][UNITS[side][k].cls];
    return `attack ×${p.atk.toFixed(2)} · defence ×${p.def.toFixed(2)} · city damage ×${p.siege.toFixed(2)}`;
  };
  $('#dock').innerHTML = cards.map(cd => {
    const u = cd.air ? null : UNITS[side][cd.key];
    const icon = cd.air ? SVG.plane : SVG[u.icon];
    const tip = cd.air ? 'Air raid — 3 sorties. Click an ENEMY city to bomb it.'
      : `Pick up, then click any GREEN ZONE near your cities — the ${u.name} land there and march to the front. (${profTxt(cd.key)})`;
    return `<div class="dock-card" data-key="${cd.key}" title="${tip}">
      <span class="dc-icon">${icon}</span>
      <span class="dc-count" id="dc-count-${cd.key}">×0</span>
      <span class="dc-name">${cd.label}</span>
      <span class="dc-train" id="dc-train-${cd.key}"><i></i></span>
    </div>`;
  }).join('');
}
function refreshDockSel(){
  document.querySelectorAll('#dock .dock-card').forEach(c => c.classList.toggle('sel', c.dataset.key === ui.deploy));
}
$('#dock').addEventListener('click', e => {
  const card = e.target.closest('.dock-card');
  if(!card) return;
  Snd.click();
  const key = card.dataset.key;
  ui.deploy = (ui.deploy === key) ? null : key;   // click to arm, click again to unarm
  refreshDockSel();
  });
function updateDock(){
  const side = game.playerSide;
  for(const k of DEPLOY_KEYS[side]){
    const cnt = document.getElementById('dc-count-'+k);
    if(cnt) cnt.textContent = '×' + game.reserve[side][k];
    const tr = document.getElementById('dc-train-'+k);
    if(tr){
      const q = game.training[side][k][0];
      tr.firstElementChild.style.width = q ? Math.min(100, q.prog/q.cost*100)+'%' : '0%';
    }
    const card = document.querySelector(`#dock .dock-card[data-key="${k}"]`);
    if(card) card.classList.toggle('locked', !game.unitUnlocked(side, k));
  }
  const air = document.getElementById('dc-count-air');
  if(air) air.textContent = '×' + Math.floor(game.air[side] / FACTIONS[side].air.strike);
}

/* =====================================================================
   TOP BAR
===================================================================== */
function buildTopbarStatic(){
  const side = game.playerSide;
  $('#tb-crest').innerHTML = FACTIONS[side].crest;
  $('#tb-faction').innerHTML = `${flagHTML(side)} <span style="vertical-align:middle">${FACTIONS[side].name}</span>`;
  $('#tb-buttons').innerHTML = `
    <button class="tb-icon" id="btn-mute" title="Sound (M)">🔊</button>
    <button class="tb-icon" id="btn-pause" title="Pause (Space)">⏸</button>
    <button class="tb-icon" id="btn-restart" title="Restart">↺</button>`;
  $('#btn-mute').addEventListener('click', toggleMute);
  $('#btn-pause').addEventListener('click', () => { ui.paused = !ui.paused; markPause(); Snd.click(); });
  $('#btn-restart').addEventListener('click', () => { if(confirm('Abandon this campaign and start over?')) location.reload(); });
}
function toggleMute(){
  Snd.init();
  Snd.muted = !Snd.muted;
  $('#btn-mute').textContent = Snd.muted ? '🔇' : '🔊';
}
function markPause(){
  const b = $('#btn-pause');
  if(b) b.textContent = ui.paused ? '▶' : '⏸';
  $('#paused-tag').classList.toggle('hidden', !ui.paused);
}
function updateTopbar(){
  $('#tb-date').textContent = game.dateLabel();
  const s = game.season();
  $('#tb-weather').textContent = `${s.icon} ${s.label}`;
}
/* =====================================================================
   BOTTOM COMMAND STRIP — city command + deployment dock
===================================================================== */
$('#strip').addEventListener('mousedown', () => { stripClickAt = performance.now(); });
$('#strip').addEventListener('click', e => {
  const t = e.target.closest('[data-act]');
  if(!t) return;
  Snd.click();
  const act = t.dataset.act;
  if(act === 'build'){ game.enqueue(ui.sel, t.dataset.key); }
  else if(act === 'qcancel'){ game.cancelBuild(ui.sel, +t.dataset.idx); }
  else if(act === 'frac'){ ui.frac = +t.dataset.v; }
  else if(act === 'air'){ ui.useAir = !ui.useAir; }
  else if(act === 'send'){
    if(ui.sel && ui.target){
      const ok = game.orderSend(ui.sel, ui.target, ui.frac, ui.useAir);
      if(ok){
        Snd.send();
        renderer.floater(ui.target, ui.useAir ? '⚔ ATTACK +✈' : (game.cities[ui.target].owner===game.playerSide ? '↗ REINFORCE' : '⚔ ATTACK'), '#f3e7c8');
        ui.target = null;
      } else if(game.battles.some(b => b.cityId === ui.sel)){
        renderer.floater(ui.sel, '⚔ GARRISON IS FIGHTING — CANNOT MARCH OUT', '#ff8d7a');
      } else {
        renderer.floater(ui.sel, 'NO TROOPS READY TO MARCH', '#ff8d7a');
      }
    }
  }
  else if(act === 'abort'){ game.abortMarch(+t.dataset.id); }
});

function routesHTML(){
  const side = game.playerSide;
  const mineM = game.marches.filter(m => m.side === side);
  if(!mineM.length) return '';
  let h = `<div class="cb-col cb-routes"><div class="cb-title">EN ROUTE</div>`;
  for(const m of mineM){
    const eta = Math.max(0, m.dur - m.prog);
    h += `<div class="qmini"><span>→ ${game.cities[m.to].def.name} <i>${eta.toFixed(1)}d</i></span><button class="q-x" data-act="abort" data-id="${m.id}" title="Turn back">⟲</button></div>`;
  }
  return h + `</div>`;
}

function refreshStrip(){
  try{
    const sh = sidePanelHTML();
    if(sh !== lastSideHtml){ $('#sidebox').innerHTML = sh; lastSideHtml = sh; }
  }catch(e){ (window.__errors = window.__errors || []).push('sidePanel: ' + e.message); }
  try{ updateDock(); }catch(e){ (window.__errors = window.__errors || []).push('dock: ' + e.message); }
  refreshDockSel();
}

function sidePanelHTML(){
  const side = game.playerSide;
  const c = ui.sel ? game.cities[ui.sel] : null;
  let html = '';
  /* march orders — right half of the strip, keeps the dock dead centre */
  if(ui.sel && ui.target && game.cities[ui.sel] && game.cities[ui.sel].owner === side){
    const from = game.cities[ui.sel], to = game.cities[ui.target];
    const mineT = to.owner === side;
    const km = llDistKm(from.def, to.def);
    const stack = { inf:Math.round(from.g.inf*ui.frac), tank:Math.round(from.g.tank*ui.frac), heavy:Math.round(from.g.heavy*ui.frac) };
    const eta = km / (game.marchSpeed(stack) * game.moveMult(side));
    const strike = FACTIONS[side].air.strike;
    const fighting = game.battles.some(b => b.cityId === ui.sel);
    html += `<div class="cb-col cb-send">
      <div class="cb-title">${mineT ? '↗ REINFORCE' : '⚔ ATTACK'} ${to.def.name}
        <small>${km.toFixed(0)} km · ETA ${eta.toFixed(1)}d · ${mineT ? 'garrison '+fmt(game.cp(to.g))+' CP' : 'enemy CP '+fmt(game.cp(to.g))+(to.supplied?'':' ✂')}</small></div>
      ${fighting ? '<div class="cb-fightwarn">⚔ your garrison is fighting — it cannot march out until the battle ends</div>' : ''}
      ${game.incomingOn(ui.sel, side) ? '<div class="cb-fightwarn">⚠ an enemy army is already marching on ' + from.def.name + '</div>' : ''}
      ${(!mineT && OBJECTIVES.includes(ui.target)) ? '<div class="cb-fightwarn">★ ' + to.def.name + ' cannot fall — it is a pillar of the Soviet state. Bleed its garrison instead.</div>' : ''}
      ${(!mineT && to.def.flags.cap && game.day < D('1942-11-19')) ? '<div class="cb-fightwarn">★ ' + to.def.name + ' holds until the Uranus era — bring an overwhelming army after November 1942.</div>' : ''}
      <div class="fracs">${[0.25,0.5,0.75,1].map(v=>`<button class="frac ${ui.frac===v?'on':''}" data-act="frac" data-v="${v}">${v*100}%</button>`).join('')}</div>
      <div class="cb-keep">stays home: <b>${fmt(game.cp({ inf: from.g.inf - stack.inf, tank: from.g.tank - stack.tank, heavy: from.g.heavy - stack.heavy }))} CP</b> — thin garrisons invite counterattacks</div>
      <div class="cb-sendrow">
        <button class="air-toggle" data-act="air" title="Spend ${strike} sorties for +30% strength in the coming battle"><span class="chk ${ui.useAir?'on':''}">${ui.useAir?'✓':''}</span>✈ −${strike}</button>
        <button class="btn-send ${mineT?'reinf':''}" data-act="send" ${(game.cp(stack)<=0 || fighting)?'disabled':''} title="Armies march one city at a time along the railways">${mineT?'SEND':'ATTACK'} · ${fmt(game.cp(stack))} CP</button>
      </div>
    </div>`;
  }

  html += routesHTML();
  return html;
}

/* =====================================================================
   TICKER / TOASTS / REPORTS / HINTS
===================================================================== */

function drainEvents(){
  while(game.eventQueue.length){
    const ev = game.eventQueue.shift();
    if(ev.battleReport){ battleReport(ev.battleReport); continue; }
    if(ev.airRaid){
      const r = ev.airRaid;
      renderer.boom(r.cityId);
      renderer.floater(r.cityId, `✈ RAID −${fmt(game.men(r.dmg))}`, '#ffd27a');
      $('#reports').insertAdjacentHTML('beforeend', `<div class="report ${r.side.toLowerCase()}">
        <div class="r-title">✈ AIR RAID ON ${game.cities[r.cityId].def.name}</div>
        <div class="r-line">${FACTIONS[r.side].name} bombers — <b>${fmt(game.men(r.dmg))}</b> men killed, <b>${fmt(r.dmg.tank)}</b> tanks destroyed</div></div>`);
      const reps = document.querySelectorAll('#reports .report');
      if(reps.length > 4) reps[0].remove();
      const last = $('#reports .report:last-child');
      if(last) setTimeout(() => { last.classList.add('out'); setTimeout(()=>last.remove(), 600); }, 8000);
      Snd.boom();
      continue;
    }
    if(ev.stragglers){
      const g = ev.stragglers;
      renderer.floater(g.cityId, 'SURVIVORS FALL BACK', '#c9e8b0');
      $('#reports').insertAdjacentHTML('beforeend', `<div class="report ${g.side.toLowerCase()}">
        <div class="r-title">🩸 CUT OFF AT ${game.cities[g.city].def.name}</div>
        <div class="r-line">The beaten column lost <b>30%</b> more men escaping — survivors reached <b>${game.cities[g.cityId].def.name}</b></div></div>`);
      const reps = document.querySelectorAll('#reports .report');
      if(reps.length > 4) reps[0].remove();
      const last = $('#reports .report:last-child');
      if(last) setTimeout(() => { last.classList.add('out'); setTimeout(()=>last.remove(), 600); }, 8000);
      continue;
    }
    if(ev.arrived){
      const a = ev.arrived;
      if(a.side === game.playerSide){
        renderer.floater(a.cityId, `＋${fmt(a.men)} MEN ARRIVED`, '#c9e8b0');
        Snd.click();
      }
      continue;
    }
    if(ev.battleStarted){
      const b = ev.battleStarted;
      Snd.alarm();                                             // the siren of the first assault
      renderer.floater(b.cityId, '⚔ THE ASSAULT BEGINS', '#ffb9a8', true);
      continue;
    }
    if(ev.landed){
      const l = ev.landed;
      const gives = UNITS[l.side][l.key].gives;
      renderer.floater(l.cityId, `+${fmt(gives.inf||gives.tank||gives.heavy)} ${l.key==='inf'?'MEN':l.key==='tank'?'TANKS':'GUNS'}`, '#c9e8b0');
      Snd.click();
      continue;
    }
    // historical events happen silently — the briefing on the home page tells the story
  }
}
function battleReport(res){
  const atkName = FACTIONS[res.atkSide].name;
  const cityName = game.cities[res.city].def.name;
  const title = res.captured ? `⚔ ${cityName.toUpperCase()} HAS FALLEN`
    : res.unbreakable ? `🛡 ${cityName.toUpperCase()} HOLDS — IT CANNOT FALL`
    : `🛡 ATTACK ON ${cityName.toUpperCase()} REPELLED`;
  const line = res.unbreakable
    ? `${atkName} batters the walls but the city is beyond breaking — losses · ${res.atkSide}: <b>${fmt(game.men(res.atkLost))}</b> men · ${res.defSide}: <b>${fmt(game.men(res.defLost))}</b> men`
    : `${atkName} ${res.captured?'captures':'fails before'} ${cityName} — losses · ${res.atkSide}: <b>${fmt(game.men(res.atkLost))}</b> men · ${res.defSide}: <b>${fmt(game.men(res.defLost))}</b> men${res.air?' · ✈ air strike':''}`;
  $('#reports').insertAdjacentHTML('beforeend', `<div class="report ${res.atkSide.toLowerCase()}"><div class="r-title">${title}</div><div class="r-line">${line}</div></div>`);
  const reps = document.querySelectorAll('#reports .report');
  if(reps.length > 4) reps[0].remove();
  const last = $('#reports .report:last-child');
  if(last) setTimeout(() => { last.classList.add('out'); setTimeout(()=>last.remove(), 600); }, 8000);

  // map fx
  if(res.captured){
    renderer.captureFx(res.city, res.atkSide);
    renderer.floater(res.city, `−${fmt(game.men(res.atkLost))} / −${fmt(game.men(res.defLost))}`, '#ffb9a8');
    Snd.boom(); setTimeout(()=>Snd.capture(res.atkSide==='SOV'), 350);
  } else {
    renderer.boom(res.city);
    renderer.floater(res.city, 'REPELLED −'+fmt(game.men(res.atkLost)), '#8fd48a');
    Snd.boom();
  }
}

/* =====================================================================
   LEARN MODAL
===================================================================== */
function buildLearn(){
  const tl = $('#learn-timeline');
  if(!tl.dataset.built){
    tl.innerHTML = '<h3>⏳ WHAT HAPPENED, AND WHEN</h3>' + EVENTS.map(ev =>
      `<div class="ev"><div class="ev-date">${ev.d}</div><div class="ev-t">${ev.i} ${ev.t}</div><div class="ev-x">${ev.x}</div></div>`).join('') +
      `<div class="ev"><div class="ev-date">1943-02-02</div><div class="ev-t">🕯 THE TURNING POINT</div>
      <div class="ev-x">The last 91,000 men of the 6th Army capitulate. Of ~300,000 trapped, fewer than 6,000 ever returned home. Stalingrad became the hinge of the Second World War in Europe.</div></div>`;
    tl.dataset.built = '1';
  }
  const wp = $('#learn-weapons');
  if(!wp.dataset.built){
    let h = '<h3>🔧 THE WEAPONS</h3>';
    ['GER','SOV'].forEach(side => {
      h += `<div class="ev" style="border-color:${side==='GER'?'#8b98a3':'#d05a4a'}"><div class="ev-t">${FACTIONS[side].name}</div></div>`;
      for(const k of DEPLOY_KEYS[side]){
        const u = UNITS[side][k];
        const p = PROFILE[side][u.cls];
        h += `<div class="wp">${SVG[u.icon]}<span><span class="wp-n">${u.name}${u.unlock?` <small style="color:#7a2c1e">(from ${u.unlock})</small>`:''}</span><br><span class="wp-x">${u.blurb} <b style="color:#7a2c1e">[attack ×${p.atk.toFixed(2)} · defence ×${p.def.toFixed(2)} · city damage ×${p.siege.toFixed(2)}]</b></span></span></div>`;
      }
    });
    h += `<div class="wp">${SVG.plane}<span><span class="wp-n">Luftwaffe · VVS</span><br><span class="wp-x">Air sorties (✈) add +30% strength to one battle. The Ju 87 Stuka was a flying artillery battery; the Il-2 Shturmovik — "the flying tank" — was the most-produced military aircraft in history.</span></span></div>`;
    h += `<div class="wp"><span style="font-size:26px">✂</span><span><span class="wp-n">Supply &amp; encirclement</span><br><span class="wp-x">A city is supplied only if a friendly path reaches its capital. Cut-off garrisons bleed strength daily and fight at −40% — this is how the great pockets of Minsk, Kiev and Stalingrad were won.</span></span></div>`;
    h += `<div class="wp"><span style="font-size:26px">❄</span><span><span class="wp-n">General Winter &amp; Rasputitsa</span><br><span class="wp-x">October mud and December frost slowed the Wehrmacht to a crawl (−30…50% movement, −28% attack). The Red Army, fighting at home, suffered far less. Watch the calendar.</span></span></div>`;
    wp.innerHTML = h;
    wp.dataset.built = '1';
  }
}

/* =====================================================================
   END SCREEN
===================================================================== */
function showEnd(){
  const info = game.endInfo;
  const won = info.winner === game.playerSide;
  const held = game.objectivesHeld();
  const heldList = OBJECTIVES.map(id => `${game.cities[id].def.name}: <b>${FACTIONS[held[id]].name}</b>`).join(' · ');
  let title, text, kicker;
  if(info.winner === 'GER'){
    if(info.reason === 'total'){ kicker='THE THREE PILLARS HAVE FALLEN'; title = won ? 'TOTAL VICTORY' : 'THE UNION FALLS';
      text = won ? 'Moscow, Leningrad and Stalingrad are all in German hands. The Soviet state has lost its three pillars. Your armies stand from the Arctic to the Caspian — history has been rewritten.'
                 : 'Moscow, Leningrad and Stalingrad are all in German hands. The Soviet state has lost its three pillars.'; }
    else if(info.reason === 'annihilate'){ kicker='THE RED ARMY IS DESTROYED'; title = won ? 'ANNIHILATION' : 'ANNIHILATION';
      text = 'The last Soviet field army has ceased to exist. Nothing remains between the Wehrmacht and the Urals.'; }
  } else {
    if(info.reason === 'berlin'){ kicker='THE SWASTIKA FALLS OVER BERLIN'; title = won ? 'MARCH ON BERLIN' : 'BERLIN HAS FALLEN';
      text = won ? 'You did more than survive — you reversed the invasion. Soviet banners fly over the Reich Chancellery, four years early. Barbarossa is not merely stalled; it is avenged.'
                 : 'The Soviets have done the unthinkable: Berlin itself has fallen.'; }
    else if(game.playerSide === 'GER'){
      kicker = 'AUGUST 23, 1943 — AFTER KURSK'; title = 'THE LONG ROAD WEST';
      text = 'You drove to the Volga, stood at the gates of Moscow and bled the Soviet state white — and on the fields of Prokhorovka the last great German offensive died in the fire of 800 tanks. From this day the Wehrmacht never attacks again. Like every invader before, you have learned the oldest lesson of the East: Russia does not surrender — Russia advances.';
    } else {
      kicker = 'AUGUST 23, 1943 — AFTER KURSK'; title = 'THE LONG ROAD WEST';
      text = 'You held Moscow, Leningrad and Stalingrad through two winters of fire. At Kursk, the last German offensive shattered against your defences — and from this day, the Wehrmacht never attacks again. The road west is long, and every kilometre of it is yours.';
    }
  }
  $('#end-kicker').textContent = kicker;
  $('#end-title').textContent = title;
  $('#end-text').innerHTML = `${text}<br><br>${heldList}`;
  $('#end-stats').innerHTML = `
    <div class="stat-box"><div class="s-v">${Math.floor(game.day)}</div><div class="s-k">days elapsed</div></div>
    <div class="stat-box"><div class="s-v">${game.stats.won[game.playerSide]}</div><div class="s-k">battles won</div></div>
    <div class="stat-box"><div class="s-v">${game.stats.lost[game.playerSide]}</div><div class="s-k">battles lost</div></div>
    <div class="stat-box"><div class="s-v">${fmt(game.stats.cas[game.playerSide])}</div><div class="s-k">your losses (men)</div></div>
    <div class="stat-box"><div class="s-v">${fmt(game.stats.cas[game.other])}</div><div class="s-k">enemy losses (men)</div></div>
    <div class="stat-box"><div class="s-v">${game.stats.taken[game.playerSide]}</div><div class="s-k">cities taken</div></div>`;
  $('#end-history').innerHTML =
    `<b>WHAT REALLY HAPPENED —</b> Barbarossa stalled before Moscow in the snow of December 1941; at Stalingrad the 62nd Army under Vasily Chuikov fought the 6th Army house by house, until Operation Uranus encircled 300,000 men. ` +
    `On 2 February 1943 Field Marshal Paulus surrendered — <b>the turning point of the Second World War in Europe</b>. In July 1943 Hitler gambled everything on one last offensive at the Kursk salient; at Prokhorovka, 800 tanks burned, and Citadel was called off after a week. ` +
    `<b>Kursk was the second turning point</b> — from that day, the Wehrmacht never launched a major attack on the Eastern Front again. The road from Stalingrad ran through Kursk, and it led to Berlin.`;
  $('#end').classList.remove('hidden');
  if(won) Snd.win(); else Snd.lose();
}

/* =====================================================================
   INPUT
===================================================================== */
let dragStart = null, dragged = false;
canvas.addEventListener('mousedown', e => { dragStart = { x:e.clientX, y:e.clientY, px:renderer.pan.x, py:renderer.pan.y }; dragged = false; });
window.addEventListener('mouseup', () => { dragStart = null; canvas.style.cursor = 'default'; });
canvas.addEventListener('mousemove', e => {
  if(!renderer) return;
  if(dragStart && (e.buttons & 1)){
    const dx = e.clientX - dragStart.x, dy = e.clientY - dragStart.y;
    if(Math.abs(dx) + Math.abs(dy) > 4) dragged = true;
    renderer.pan.x = dragStart.px + dx;
    renderer.pan.y = dragStart.py + dy;
    renderer.applyView();
    canvas.style.cursor = 'grabbing';
    return;
  }
  canvas.style.cursor = renderer.hitCity(e.clientX, e.clientY) ? 'pointer' : 'grab';
});
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  if(renderer) renderer.wheelZoom(e.clientX, e.clientY, e.deltaY);
}, { passive:false });
canvas.addEventListener('click', e => {
  if(!game || !renderer || game.phase !== 'play' || dragged){ dragged = false; return; }
  const id = renderer.hitCity(e.clientX, e.clientY);

  /* Clash-style deployment: drop anywhere in the green zones */
  if(ui.deploy){
    const side = game.playerSide;
    if(ui.deploy === 'air'){
      if(id && game.airRaid(side, id)){
        Snd.send();
        Snd.siren();
        renderer.floater(id, '✈ AIR RAID INBOUND', '#ffd27a');
        if(game.air[side] < FACTIONS[side].air.strike) ui.deploy = null;
      } else if(id){
        renderer.floater(id, game.cities[id].owner === side ? 'PICK AN ENEMY CITY' : 'NO SORTIES AVAILABLE', '#ff8d7a');
        Snd.click();
      }
    } else {
      const m = renderer.toMap(e.clientX, e.clientY);
      if(game.dropDeploy(side, m.x, m.y, ui.deploy)){
        Snd.send();
        renderer.floaterXY(e.clientX, e.clientY, 'DEPLOYED — MARCHING', '#c9e8b0');
        if(game.reserve[side][ui.deploy] <= 0) ui.deploy = null;
      } else {
        renderer.floaterXY(e.clientX, e.clientY, 'DROP INSIDE THE GREEN ZONES', '#ff8d7a');
        Snd.click();
      }
    }
    refreshStrip();
    refreshDockSel();
    return;
  }

  if(!id){ ui.sel = null; ui.target = null; return; }
  Snd.click();
  if(ui.sel && ui.sel !== id && game.cities[ui.sel].owner === game.playerSide){
    // a march-capable city is selected
    if(game.adjTo(ui.sel, id)){
      ui.target = id;                      // connected: valid march destination
    } else if(game.cities[id].owner === game.playerSide){
      ui.sel = id; ui.target = null;       // switch to your other city
      ui.frac = 0.75; ui.useAir = false;
    } else {
      // enemy city without a rail link from the selection — say so, keep selection
      renderer.floater(id, 'NO RAIL FROM ' + game.cities[ui.sel].def.name + ' — CLICK A CONNECTED CITY', '#ff8d7a');
    }
  } else {
    // nothing selected, or an intel view: select the clicked city
    ui.sel = id; ui.target = null;
    ui.frac = 0.75; ui.useAir = false;
  }
  refreshStrip();
});
canvas.addEventListener('contextmenu', e => { e.preventDefault(); ui.sel = null; ui.target = null; ui.deploy = null; refreshDockSel(); });
window.addEventListener('mousedown', () => { if(Snd.ctx && Snd.ctx.state === 'suspended') Snd.ctx.resume(); });
window.addEventListener('keydown', e => {
  if(!game) return;
  if(e.code === 'Space' && !e.repeat){ e.preventDefault(); ui.paused = !ui.paused; markPause(); }
  else if(e.key === 'Escape'){ ui.sel = null; ui.target = null; ui.deploy = null; refreshDockSel(); }
  else if(e.key === 'm' || e.key === 'M'){ toggleMute(); }
  
});

/* =====================================================================
   LOOP
===================================================================== */
let lastT = performance.now();
let stripClickAt = -9999, lastSideHtml = '';
function frame(t){
  const dtReal = Math.min(0.05, (t - lastT)/1000);
  lastT = t;
  try { if(game && renderer){
    if(ui.started && game.phase === 'play' && !ui.paused){
      game.tick(dtReal * 1000 / DAY_MS);
      // ambient battlefield sound — layered by what is actually fighting
      if(game.battles.length){
        let armour = 0, rockets = 0, rifles = 0;
        for(const b of game.battles){
          const cc = game.cities[b.cityId];
          if(cc){ armour += cc.g.tank + b.g.tank; rockets += cc.g.heavy + b.g.heavy; rifles += cc.g.inf + b.g.inf; }
        }
        ui.gunT -= dtReal;
        if(ui.gunT <= 0){
          const roll = Math.random();
          if(rockets > 20 && roll < 0.28){ Snd.rocket(); ui.gunT = 1.5 + Math.random()*0.7; }
          else if(armour > 20 && roll < 0.6){ Snd.cannon(); ui.gunT = 0.42 + Math.random()*0.38; }
          else if(rifles > 1500 && roll < 0.8){ Snd.artillery(); ui.gunT = 0.75 + Math.random()*0.6; }
          else { Snd.gun(); ui.gunT = 0.07 + Math.random()*0.13; }
        }
      }
    }
    renderer.sel = ui.sel; renderer.target = ui.target;
    renderer.deployType = ui.deploy;
    renderer.draw(dtReal, ui);
    if(ui.started) drainEvents();
    if(game.phase === 'end' && $('#end').classList.contains('hidden')) showEnd();
    // UI refresh throttled — and never swapped while the user is mid-click,
    // so buttons can't be destroyed under the pointer
    if(t - ui.lastTop > 400){ if(ui.started) updateTopbar(); ui.lastTop = t; }
    if(t - ui.lastPanel > 350){
      if(ui.started && performance.now() - stripClickAt > 750) refreshStrip();
      ui.lastPanel = t;
    }
  }
  } catch(e){ (window.__errors = window.__errors || []).push('frame: ' + e.message); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* pre-game backdrop: show the June 1941 map behind the intro */
game = new Game('GER');
renderer = new Renderer(canvas, game);
game.day = 0;
