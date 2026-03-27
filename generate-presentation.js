#!/usr/bin/env node
/**
 * Saisonrückblick Generator
 * Aufruf: node generate-presentation.js
 * Ausgabe: saisonrueckblick.html (im Projektroot öffnen)
 */

const fs = require('fs');
const SEASON = '2024/2025';

const games   = require('./src/assets/games.json');
const stats   = require('./src/assets/stats.json');
const legs    = require('./src/assets/legs.json');
const players = require('./src/assets/players.json');

// ─── Hilfsfunktionen ────────────────────────────────────────────────────────

const getPlayer  = (id) => players.find(p => p.player_id === id);
const getName    = (id) => getPlayer(id)?.name || 'Unbekannt';
const getImage   = (id) => {
  const p = getPlayer(id);
  return p?.image ? `src/assets/players/${p.image}` : 'src/assets/players/default-avatar.png';
};
const rankClass  = (i) => i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : 'rank-other';

// ─── Daten filtern ──────────────────────────────────────────────────────────

const sGames = games.filter(g => g.season === SEASON);
const sStats = stats.filter(s => s.season === SEASON);
const sLegs  = legs.filter(g => g.season === SEASON);

const matchdays  = [...new Set(sGames.map(g => g.matchday))].sort((a,b) => a-b);
const totalGames = sGames.length;
let   totalLegs  = 0; sLegs.forEach(g => { totalLegs += (g.legs || []).length; });
let   totalDarts = 0; sStats.forEach(s => { totalDarts += s.darts_thrown || 0; });

// ─── Tabelle ────────────────────────────────────────────────────────────────

const punkteMap = {};
sGames.forEach(g => {
  if (!punkteMap[g.player1]) punkteMap[g.player1] = { name: g.player1, punkte: 0, wins: 0, losses: 0 };
  if (!punkteMap[g.player2]) punkteMap[g.player2] = { name: g.player2, punkte: 0, wins: 0, losses: 0 };
  punkteMap[g.player1].punkte += g.p1_legs_won || 0;
  punkteMap[g.player2].punkte += g.p2_legs_won || 0;
  const p1won = (g.p1_legs_won || 0) > (g.p2_legs_won || 0);
  const p2won = (g.p2_legs_won || 0) > (g.p1_legs_won || 0);
  if (p1won) { punkteMap[g.player1].wins++; punkteMap[g.player2].losses++; }
  if (p2won) { punkteMap[g.player2].wins++; punkteMap[g.player1].losses++; }
});
const tabelle = Object.values(punkteMap)
  .sort((a,b) => b.punkte - a.punkte)
  .map((e, i) => {
    const p = players.find(pl => pl.name === e.name);
    return { ...e, platz: i+1, image: p?.image ? `src/assets/players/${p.image}` : 'src/assets/players/default-avatar.png' };
  });

// ─── Averages ───────────────────────────────────────────────────────────────

const avgMap = {}, f9Map = {};
sStats.forEach(s => {
  if (s.avg_3dart  && s.avg_3dart  > (avgMap[s.player_id]?.avg || 0)) avgMap[s.player_id] = { avg: s.avg_3dart,  name: getName(s.player_id), image: getImage(s.player_id) };
  if (s.avg_first9 && s.avg_first9 > (f9Map[s.player_id]?.avg  || 0)) f9Map[s.player_id]  = { avg: s.avg_first9, name: getName(s.player_id), image: getImage(s.player_id) };
});
const topAvg  = Object.values(avgMap).sort((a,b) => b.avg - a.avg);
const topF9   = Object.values(f9Map).sort((a,b)  => b.avg - a.avg);

// ─── High Scores ────────────────────────────────────────────────────────────

const scoreMap = {};
sStats.forEach(s => {
  if (!scoreMap[s.player_id]) scoreMap[s.player_id] = { name: getName(s.player_id), image: getImage(s.player_id), s180: 0, s140: 0 };
  scoreMap[s.player_id].s180 += s.score_180 || 0;
  scoreMap[s.player_id].s140 += (s.score_140 || 0) + (s.score_140_plus || 0);
});
const top180    = Object.values(scoreMap).sort((a,b) => b.s180 - a.s180).filter(x => x.s180 > 0);
const total180s = Object.values(scoreMap).reduce((sum, p) => sum + p.s180, 0);

// ─── Checkouts ──────────────────────────────────────────────────────────────

const allCheckouts = [];
sStats.forEach(s => {
  if (s.high_finish > 0) allCheckouts.push({ name: getName(s.player_id), image: getImage(s.player_id), value: s.high_finish, matchday: s.matchday });
});
const topCheckouts = allCheckouts.sort((a,b) => b.value - a.value).slice(0, 8);

// ─── Oskargewinne ───────────────────────────────────────────────────────────

const mdGroups = {};
sGames.forEach(g => {
  if (!mdGroups[g.matchday]) mdGroups[g.matchday] = {};
  mdGroups[g.matchday][g.player1] = (mdGroups[g.matchday][g.player1] || 0) + (g.p1_legs_won || 0);
  mdGroups[g.matchday][g.player2] = (mdGroups[g.matchday][g.player2] || 0) + (g.p2_legs_won || 0);
});
const oskarWins = {};
Object.values(mdGroups).forEach(day => {
  const sorted = Object.entries(day).sort((a,b) => b[1]-a[1]);
  const maxLegs = sorted[0][1];
  sorted.filter(([,l]) => l === maxLegs).forEach(([name]) => {
    oskarWins[name] = (oskarWins[name] || 0) + 1;
  });
});
const oskarRanking = Object.entries(oskarWins)
  .sort((a,b) => b[1]-a[1])
  .map(([name, count]) => {
    const p = players.find(pl => pl.name === name);
    return { name, count, image: p?.image ? `src/assets/players/${p.image}` : 'src/assets/players/default-avatar.png' };
  });

// ─── Engste Duelle ──────────────────────────────────────────────────────────

const duellMap = {};
sGames.forEach(g => {
  const [nameA, nameB] = [g.player1, g.player2].sort();
  const key = `${nameA}|||${nameB}`;
  if (!duellMap[key]) duellMap[key] = { nameA, nameB, legsA: 0, legsB: 0 };
  if (duellMap[key].nameA === g.player1) {
    duellMap[key].legsA += g.p1_legs_won || 0;
    duellMap[key].legsB += g.p2_legs_won || 0;
  } else {
    duellMap[key].legsA += g.p2_legs_won || 0;
    duellMap[key].legsB += g.p1_legs_won || 0;
  }
});
const engsteDuelle = Object.values(duellMap)
  .map(d => ({ ...d, diff: Math.abs(d.legsA - d.legsB) }))
  .sort((a,b) => a.diff - b.diff)
  .slice(0, 3)
  .map(d => {
    const pA = players.find(pl => pl.name === d.nameA);
    const pB = players.find(pl => pl.name === d.nameB);
    return { ...d, imgA: pA?.image ? `src/assets/players/${pA.image}` : 'src/assets/players/default-avatar.png',
                    imgB: pB?.image ? `src/assets/players/${pB.image}` : 'src/assets/players/default-avatar.png' };
  });

// ─── Short Games ────────────────────────────────────────────────────────────

const shortGames = [];
sLegs.forEach(game => {
  (game.legs || []).forEach(leg => {
    const wid = leg.leg_winner_id;
    if (!wid) return;
    const darts = wid === game.player1_id ? leg.p1_darts_leg : leg.p2_darts_leg;
    if (darts && darts <= 21) shortGames.push({ name: getName(wid), image: getImage(wid), darts, matchday: game.matchday });
  });
});
shortGames.sort((a,b) => a.darts - b.darts);

// ─── HTML-Bausteine ─────────────────────────────────────────────────────────

const playerRow = (p, i) => `
  <div class="player-row">
    <div class="rank-badge ${rankClass(i)}">${i+1}</div>
    <img class="player-avatar" src="${p.image}" onerror="this.src='src/assets/players/default-avatar.png'" />
    <span class="player-name">${p.name}</span>
    <span class="player-value">${p.value}</span>
  </div>`;

const podiumCard = (e, cls, medal) => !e ? '' : `
  <div class="podium-card ${cls}">
    <span class="podium-medal">${medal}</span>
    <img class="podium-avatar" src="${e.image}" onerror="this.src='src/assets/players/default-avatar.png'" />
    <div class="podium-name">${e.name}</div>
    <div class="podium-pts">${e.punkte} Pts</div>
  </div>`;

// ─── HTML generieren ────────────────────────────────────────────────────────

const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <title>Saisonrückblick ${SEASON} – Dartfreunde Borchen n.e.V.</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.6.1/reveal.min.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.6.1/theme/black.min.css">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');

    :root {
      --gold:    #b08040;
      --gold-dim: rgba(176,128,64,.15);
      --silver:  #8a9ab5;
      --bronze:  #9a6b3e;
      --text:    #dde3ec;
      --muted:   #5a6680;
      --bg-card: rgba(255,255,255,.04);
      --border:  rgba(176,128,64,.22);
    }

    .reveal, .reveal h1, .reveal h2, .reveal h3, .reveal p { font-family: 'Inter', sans-serif; }
    .reveal h1 { font-size: 1.8em; font-weight: 700; color: var(--text);   letter-spacing: -.02em; text-transform: none; }
    .reveal h2 { font-size: 1.2em; font-weight: 600; color: var(--gold);   letter-spacing: .06em;  text-transform: uppercase; margin-bottom: 14px; }
    .reveal .slides section { padding: 8px 44px; }
    .reveal .progress span { background: var(--gold); }

    /* ── Titelfolie ── */
    .club-logo  { width: 110px; margin: 0 auto 18px; display: block; text-align: center; }
    .reveal .slides section.title-slide { text-align: center; }
    .club-date  { font-size: .85em !important; color: var(--muted) !important; margin-top: 10px; }
    .title-divider { width: 60px; height: 2px; background: var(--gold); margin: 14px auto; opacity: .6; }

    /* ── Stat Cards ── */
    .stats-grid  { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-top: 20px; }
    .stat-card   { background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; padding: 16px 8px; text-align: center; }
    .stat-number { font-size: 2em; font-weight: 700; color: var(--gold); display: block; line-height: 1; }
    .stat-label  { font-size: .7em; color: var(--muted); margin-top: 5px; display: block; letter-spacing: .04em; }

    /* ── Podium (card layout) ── */
    .podium        { display: flex; justify-content: center; align-items: flex-end; gap: 12px; margin: 10px 0 8px; }
    .podium-card   { display: flex; flex-direction: column; align-items: center; gap: 5px; border-radius: 10px; padding: 12px 10px 10px; background: var(--bg-card); border: 1px solid var(--border); width: 195px; }
    .podium-card.p1 { border-color: var(--gold); background: rgba(176,128,64,.1); padding-top: 16px; }
    .podium-avatar { width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border); }
    .podium-card.p1 .podium-avatar { width: 60px; height: 60px; border-color: var(--gold); }
    .podium-name   { font-size: .76em; font-weight: 600; color: var(--text); text-align: center; line-height: 1.2; }
    .podium-medal  { font-size: 1.4em; line-height: 1; }
    .podium-pts    { font-size: .68em; color: var(--gold); font-weight: 700; }

    /* ── Standings Table ── */
    .standings-table { width: 100%; border-collapse: collapse; font-size: .78em; margin-top: 12px; }
    .standings-table th { color: var(--muted); border-bottom: 1px solid var(--border); padding: 5px 10px; text-align: center; font-weight: 400; letter-spacing: .05em; font-size: .9em; }
    .standings-table td { padding: 5px 10px; border-bottom: 1px solid rgba(255,255,255,.05); text-align: center; color: var(--text); }
    .standings-table tr:nth-child(1) td { font-weight: 700; color: var(--gold); }
    .standings-table tr:nth-child(2) td { color: var(--silver); }
    .standings-table tr:nth-child(3) td { color: var(--bronze); }

    /* ── Player Rows ── */
    .player-row   { display: flex; align-items: center; gap: 12px; padding: 7px 11px; border-radius: 7px; background: var(--bg-card); border: 1px solid rgba(255,255,255,.04); margin: 4px 0; }
    .player-avatar { width: 38px; height: 38px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border); flex-shrink: 0; }
    .player-name  { flex: 1; font-weight: 500; text-align: left; font-size: .88em; color: var(--text); }
    .player-value { font-size: 1.15em; font-weight: 700; color: var(--gold); white-space: nowrap; }
    .rank-badge   { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: .68em; flex-shrink: 0; }
    .rank-1  { background: var(--gold);   color: #111; }
    .rank-2  { background: var(--silver); color: #111; }
    .rank-3  { background: var(--bronze); color: #fff; }
    .rank-other { background: rgba(255,255,255,.08); color: var(--muted); }

    /* ── Checkout / Short Game Rows ── */
    .checkout-item { display: flex; align-items: center; gap: 10px; padding: 5px 10px; border-radius: 6px; background: var(--bg-card); border: 1px solid rgba(255,255,255,.04); margin: 3px 0; }
    .checkout-value { font-size: 1.05em; font-weight: 700; color: var(--gold); min-width: 44px; text-align: right; }
    .checkout-md    { font-size: .65em; color: var(--muted); margin-left: auto; white-space: nowrap; }
    .checkout-item .player-name  { font-size: .82em; }
    .checkout-item .player-avatar { width: 30px; height: 30px; }
    .checkout-item .rank-badge   { width: 28px; height: 28px; font-size: .65em; }

    /* ── Duelle ── */
    .duelle-list  { display: flex; flex-direction: column; gap: 14px; margin-top: 10px; }
    .duell-card   { display: flex; align-items: center; background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; padding: 14px 20px; gap: 12px; }
    .duell-player { display: flex; align-items: center; gap: 10px; flex: 1; }
    .duell-player.right { flex-direction: row-reverse; }
    .duell-avatar { width: 46px; height: 46px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border); }
    .duell-name   { font-size: .88em; font-weight: 600; color: var(--text); }
    .duell-score  { display: flex; align-items: center; gap: 6px; font-size: 1.6em; font-weight: 800; color: var(--gold); white-space: nowrap; flex-shrink: 0; }
    .duell-score span { font-size: .55em; color: var(--muted); font-weight: 400; }
    .duell-diff   { font-size: .65em; color: var(--muted); margin-top: 2px; text-align: center; }

    /* ── Two columns ── */
    .two-col   { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-top: 8px; }
    .col-title { color: var(--muted); font-size: .75em; letter-spacing: .08em; text-transform: uppercase; margin-bottom: 7px; text-align: center; border-bottom: 1px solid var(--border); padding-bottom: 4px; }
    .two-col .player-row    { gap: 8px; padding: 6px 10px; }
    .two-col .rank-badge    { width: 28px; height: 28px; font-size: .65em; flex-shrink: 0; }
    .two-col .player-avatar { width: 30px; height: 30px; }
    .two-col .player-value  { font-size: 1.05em; }
  </style>
</head>
<body>
<div class="reveal">
  <div class="slides">

    <!-- ── 1. Titel ── -->
    <section data-transition="fade" class="title-slide" style="text-align:center">
      <img src="src/assets/logo.svg" alt="Dartfreunde Borchen" style="width:110px;display:block;margin:0 auto 18px" />
      <div class="title-divider"></div>
      <h1>Saisonrückblick ${SEASON}</h1>
      <p class="club-date">${new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
    </section>

    <!-- ── 2. Saison in Zahlen ── -->
    <section data-transition="slide">
      <h2>Die Saison in Zahlen</h2>
      <div class="stats-grid">
        <div class="stat-card"><span class="stat-number">${matchdays.length}</span><span class="stat-label">Spieltage</span></div>
        <div class="stat-card"><span class="stat-number">${totalGames}</span><span class="stat-label">Spiele</span></div>
        <div class="stat-card"><span class="stat-number">${totalLegs}</span><span class="stat-label">Legs</span></div>
        <div class="stat-card"><span class="stat-number">${totalDarts.toLocaleString('de-DE')}</span><span class="stat-label">Darts geworfen</span></div>
      </div>
    </section>

    <!-- ── 3. Podium ── -->
    <section data-transition="slide">
      <h2>Abschlusstabelle</h2>
      <div class="podium">
        ${podiumCard(tabelle[1], 'p2', '🥈')}
        ${podiumCard(tabelle[0], 'p1', '🏆')}
        ${podiumCard(tabelle[2], 'p3', '🥉')}
      </div>
      <table class="standings-table">
        <thead><tr><th>#</th><th>Spieler</th><th>Punkte (Legs)</th><th>Siege</th><th>Niederlagen</th></tr></thead>
        <tbody>
          ${tabelle.map(e => `<tr><td>${e.platz}</td><td>${e.name}</td><td>${e.punkte}</td><td>${e.wins}</td><td>${e.losses}</td></tr>`).join('')}
        </tbody>
      </table>
    </section>

    <!-- ── 4. Averages ── -->
    <section data-transition="slide">
      <h2>Averages <small style="font-size:.5em;opacity:.5">(bestes Einzelspiel)</small></h2>
      <div class="two-col">
        <div>
          <div class="col-title">3-Dart Average</div>
          ${topAvg.slice(0,5).map((p, i) => playerRow({ ...p, value: p.avg.toFixed(2) }, i)).join('')}
        </div>
        <div>
          <div class="col-title">First-9 Average</div>
          ${topF9.slice(0,5).map((p, i) => playerRow({ ...p, value: p.avg.toFixed(2) }, i)).join('')}
        </div>
      </div>
    </section>

    <!-- ── 5. Checkouts ── -->
    <section data-transition="slide">
      <h2>🎯 Höchste Checkouts</h2>
      ${topCheckouts.map((c, i) => `
      <div class="checkout-item">
        <div class="rank-badge ${rankClass(i)}">${i+1}</div>
        <img class="player-avatar" src="${c.image}" onerror="this.src='src/assets/players/default-avatar.png'" />
        <span class="player-name">${c.name}</span>
        <span class="checkout-md">Spieltag ${c.matchday}</span>
        <span class="checkout-value">${c.value}</span>
      </div>`).join('')}
    </section>

    <!-- ── 6. High Scores ── -->
    <section data-transition="slide">
      <h2>High Scores</h2>
      <div class="two-col">
        <div>
          <div class="col-title">180er</div>
          ${top180.length === 0 ? '<p style="opacity:.5;font-size:.8em">Keine 180er</p>' :
            top180.slice(0,5).map((p, i) => playerRow({ ...p, value: p.s180 + '× 180' }, i)).join('')}
        </div>
        <div>
          <div class="col-title">140+</div>
          ${Object.values(scoreMap).filter(x => x.s140 > 0).sort((a,b) => b.s140 - a.s140).length === 0
            ? '<p style="opacity:.5;font-size:.8em">Keine 140er</p>'
            : Object.values(scoreMap).filter(x => x.s140 > 0).sort((a,b) => b.s140 - a.s140).slice(0,5).map((p, i) => playerRow({ ...p, value: p.s140 + '× 140+' }, i)).join('')}
        </div>
      </div>
    </section>

    <!-- ── 7. Short Games ── -->
    <section data-transition="slide">
      <h2>Best Legs</h2>
      <p style="opacity:.5;font-size:.75em;margin:0 0 8px">Legs gewonnen in ≤21 Darts</p>
      ${shortGames.length === 0 ? '<p style="opacity:.5">Keine Short Games diese Saison.</p>' :
        shortGames.slice(0,8).map((s, i) => `
        <div class="checkout-item">
          <div class="rank-badge ${rankClass(i)}">${i+1}</div>
          <img class="player-avatar" src="${s.image}" onerror="this.src='src/assets/players/default-avatar.png'" />
          <span class="player-name">${s.name}</span>
          <span class="checkout-md">Spieltag ${s.matchday}</span>
          <span class="checkout-value">${s.darts} Darts</span>
        </div>`).join('')}
    </section>

    <!-- ── 8. Oskargewinne ── -->
    <section data-transition="slide">
      <h2>Oskargewinne</h2>
      ${oskarRanking.map((p, i) => playerRow({ ...p, value: p.count + '×' }, i)).join('')}
    </section>

    <!-- ── 9. Engste Duelle ── -->
    <section data-transition="slide">
      <h2>Engste Duelle</h2>
      <p style="opacity:.5;font-size:.75em;margin:0 0 14px">Gesamte Legs der Saison — die 3 knappsten Paarungen</p>
      <div class="duelle-list">
        ${engsteDuelle.map((d, i) => `
        <div class="duell-card">
          <div class="duell-player">
            <img class="duell-avatar" src="${d.imgA}" onerror="this.src='src/assets/players/default-avatar.png'" />
            <div>
              <div class="duell-name">${d.nameA}</div>
              <div class="duell-diff">&nbsp;</div>
            </div>
          </div>
          <div style="text-align:center;flex-shrink:0">
            <div class="duell-score">${d.legsA} <span>:</span> ${d.legsB}</div>
            <div class="duell-diff">Differenz: ${d.diff} Leg${d.diff !== 1 ? 's' : ''}</div>
          </div>
          <div class="duell-player right">
            <img class="duell-avatar" src="${d.imgB}" onerror="this.src='src/assets/players/default-avatar.png'" />
            <div style="text-align:right">
              <div class="duell-name">${d.nameB}</div>
              <div class="duell-diff">&nbsp;</div>
            </div>
          </div>
        </div>`).join('')}
      </div>
    </section>

    <!-- ── 10. Abschluss ── -->
    <section data-transition="fade" style="text-align:center">
      <img src="src/assets/logo.svg" alt="Dartfreunde Borchen" style="width:110px;display:block;margin:0 auto 18px" />
      <div class="title-divider"></div>
      <h1>Danke für eine tolle Saison!</h1>
      <p class="club-date">Dartfreunde Borchen n.e.V. · ${SEASON}</p>
      <p style="margin-top:40px;color:var(--muted);font-size:.6em">← → Pfeiltasten oder Leertaste zum Navigieren</p>
    </section>

  </div>
</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.6.1/reveal.min.js"></script>
<script>
  Reveal.initialize({
    hash: true,
    transition: 'slide',
    controls: true,
    progress: true,
    center: true,
    slideNumber: 'c/t',
  });
</script>
</body>
</html>`;

fs.writeFileSync('saisonrueckblick.html', html, 'utf8');

// ─── Vorjahresvergleich ─────────────────────────────────────────────────────
const seasons = [...new Set(games.map(g => g.season))].sort();
const prevSeason = seasons[seasons.indexOf(SEASON) - 1];
let prevLegs = 0, prevDarts = 0, prevGames = 0;
if (prevSeason) {
  legs.filter(g => g.season === prevSeason).forEach(g => { prevLegs += (g.legs || []).length; });
  stats.filter(s => s.season === prevSeason).forEach(s => { prevDarts += s.darts_thrown || 0; });
  prevGames = games.filter(g => g.season === prevSeason).length;
}

console.log('\n✅  saisonrueckblick.html wurde erstellt!\n');
console.log('═══════════════════════════════════════════════');
console.log(`  Saison ${SEASON}`);
console.log('═══════════════════════════════════════════════');
console.log(`  Spieltage:      ${matchdays.length}`);
console.log(`  Spiele:         ${totalGames}`);
console.log(`  Legs:           ${totalLegs}`);
console.log(`  Darts geworfen: ${totalDarts.toLocaleString('de-DE')}`);
if (prevSeason) {
  const diffLegs  = totalLegs  - prevLegs;
  const diffDarts = totalDarts - prevDarts;
  const diffGames = totalGames - prevGames;
  console.log('\n───────────────────────────────────────────────');
  console.log(`  Vergleich mit Vorjahr (${prevSeason})`);
  console.log('───────────────────────────────────────────────');
  console.log(`  Spiele:         ${prevGames}  →  ${totalGames}  (${diffGames >= 0 ? '+' : ''}${diffGames})`);
  console.log(`  Legs:           ${prevLegs}   →  ${totalLegs}   (${diffLegs  >= 0 ? '+' : ''}${diffLegs})`);
  console.log(`  Darts geworfen: ${prevDarts.toLocaleString('de-DE')}  →  ${totalDarts.toLocaleString('de-DE')}  (${diffDarts >= 0 ? '+' : ''}${diffDarts.toLocaleString('de-DE')})`);
}
console.log('═══════════════════════════════════════════════\n');
