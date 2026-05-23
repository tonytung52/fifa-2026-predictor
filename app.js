// 2026 World Cup Predictor & Simulator App Logic

let currentTeams = JSON.parse(JSON.stringify(TEAMS)); // Clone local team database
let groupMatches = {}; // Store results of group matches
let groupStandings = {}; // Store group table states
let bestThirds = []; // Top 8 third-placed teams
let bracket = {
  r32: [],
  r16: [],
  qf: [],
  sf: [],
  final: [],
  thirdPlayoff: []
};

// Simulation Settings default
let settings = {
  upsetChance: 0.25,
  scoringFactor: 1.5,
  hostAdvantage: true,
  theme: 'realistic' // realistic, chaotic, attack
};

// DOM references
document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

function initApp() {
  setupTabs();
  setupSettingsListeners();
  setupGroupStageDOM();
  setupResetBtn();
  setupKnockoutControls();
  setupModal();
}

// Tabs switching
function setupTabs() {
  const tabs = document.querySelectorAll(".nav-tabs .tab-btn");
  const contents = document.querySelectorAll(".tab-content");
  
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      contents.forEach(c => c.classList.remove("active"));
      
      tab.classList.add("active");
      const target = tab.getAttribute("data-tab");
      document.getElementById(target).classList.add("active");
    });
  });
}

// Settings changes
function setupSettingsListeners() {
  const upsetSlider = document.getElementById("param-upset");
  const upsetVal = document.getElementById("upset-val");
  upsetSlider.addEventListener("input", (e) => {
    settings.upsetChance = parseInt(e.target.value) / 100;
    upsetVal.textContent = `${e.target.value}%`;
  });

  const scoringSlider = document.getElementById("param-scoring");
  const scoringVal = document.getElementById("scoring-val");
  scoringSlider.addEventListener("input", (e) => {
    const val = parseFloat(e.target.value) / 10;
    settings.scoringFactor = val;
    scoringVal.textContent = val === 1.5 ? "標準 (1.5x)" : `${val}x`;
  });

  const hostCheckbox = document.getElementById("param-host");
  hostCheckbox.addEventListener("change", (e) => {
    settings.hostAdvantage = e.target.checked;
  });

  const themeBtns = document.querySelectorAll("#sim-theme-group .radio-btn");
  themeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      themeBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      settings.theme = btn.getAttribute("data-theme");
    });
  });
}

// Reset button
function setupResetBtn() {
  document.getElementById("btn-reset").addEventListener("click", () => {
    currentTeams = JSON.parse(JSON.stringify(TEAMS));
    groupMatches = {};
    groupStandings = {};
    bestThirds = [];
    bracket = { r32: [], r16: [], qf: [], sf: [], final: [], thirdPlayoff: [] };
    
    // Clear live ticker
    const ticker = document.getElementById("live-ticker");
    ticker.innerHTML = `
      <div class="ticker-title">🕒 賽事已重置</div>
      <div class="ticker-event">
        <div class="ticker-time">00'</div>
        <div class="ticker-txt">所有預測數據已重置為初始狀態。請點選上方「小組積分賽」開始預測！</div>
      </div>
    `;

    setupGroupStageDOM();
    renderKnockoutBracket();
    checkChampionView();
    alert("預測數據已重置！");
  });

  // Quick full simulation
  document.getElementById("btn-quick-full").addEventListener("click", () => {
    simulateFullTournament();
  });
}

// Setup group stage UI
function setupGroupStageDOM() {
  const container = document.getElementById("groups-container");
  container.innerHTML = "";
  
  const groups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
  
  groups.forEach(grp => {
    const grpTeams = currentTeams.filter(t => t.group === grp);
    
    // Initialize group standings array
    groupStandings[grp] = grpTeams.map(t => ({
      id: t.id,
      name: t.name,
      flag: t.flag,
      code: t.code,
      pts: 0,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      gd: 0
    }));

    const card = document.createElement("div");
    card.className = "group-card";
    card.id = `group-card-${grp}`;
    
    card.innerHTML = `
      <div class="group-header">
        <span class="group-name">小組 ${grp}</span>
        <button class="simulate-grp-btn" onclick="simulateGroup('${grp}')">⚡ 模擬本組</button>
      </div>
      <table class="standings-table">
        <thead>
          <tr>
            <th>球隊</th>
            <th style="text-align:center;">場</th>
            <th style="text-align:center;">得</th>
            <th style="text-align:center;">失</th>
            <th style="text-align:center;">淨</th>
            <th style="text-align:center;">分</th>
          </tr>
        </thead>
        <tbody id="standings-body-${grp}">
          ${renderTableRows(groupStandings[grp])}
        </tbody>
      </table>
    `;
    container.appendChild(card);
  });

  // Render thirds container empty
  renderThirdsList();
  
  // Connect simulation for Group view button
  document.getElementById("btn-sim-all-groups").addEventListener("click", () => {
    simulateAllGroups();
  });
}

function renderTableRows(standings) {
  return standings.map((st, index) => {
    let qualClass = "";
    if (st.played > 0) {
      if (index < 2) qualClass = "qualified-direct";
    }
    return `
      <tr class="${qualClass}">
        <td class="team-info" onclick="openTeamModal('${st.id}')" style="cursor:pointer;">
          <span class="team-flag">${st.flag}</span>
          <span class="team-name-abbr" title="${st.name}">${st.code}</span>
        </td>
        <td class="table-stat">${st.played}</td>
        <td class="table-stat">${st.gf}</td>
        <td class="table-stat">${st.ga}</td>
        <td class="table-stat">${st.gd >= 0 ? '+' + st.gd : st.gd}</td>
        <td class="table-pts">${st.pts}</td>
      </tr>
    `;
  }).join("");
}

// ----------------------------------------------------
// SIMULATION ENGINE CORE
// ----------------------------------------------------
function simulateMatch(teamA, teamB, isKnockout = false) {
  // Base ratings
  let attA = teamA.ratingOffense;
  let defA = teamA.ratingDefense;
  let midA = teamA.ratingMidfield;
  
  let attB = teamB.ratingOffense;
  let defB = teamB.ratingDefense;
  let midB = teamB.ratingMidfield;

  // Apply Host Advantage (USA, Canada, Mexico)
  if (settings.hostAdvantage) {
    if (["usa", "canada", "mexico"].includes(teamA.id)) {
      attA += 4; midA += 3; defA += 2;
    }
    if (["usa", "canada", "mexico"].includes(teamB.id)) {
      attB += 4; midB += 3; defB += 2;
    }
  }

  // Calculate probabilities based on stats
  let weightA = (attA * 0.4 + midA * 0.4 + (100 - defB) * 0.2);
  let weightB = (attB * 0.4 + midB * 0.4 + (100 - defA) * 0.2);

  // Apply simulation themes
  if (settings.theme === 'chaotic') {
    // Increase randomness / narrow the gap
    weightA = weightA * 0.7 + Math.random() * 30;
    weightB = weightB * 0.7 + Math.random() * 30;
  } else if (settings.theme === 'attack') {
    weightA += 10;
    weightB += 10;
  }

  // Standard goal expectations (using Poisson-like logic)
  let expectedA = (weightA / weightB) * 1.35 * settings.scoringFactor;
  let expectedB = (weightB / weightA) * 1.35 * settings.scoringFactor;

  // Add random Upset slider influence
  if (Math.random() < settings.upsetChance) {
    // Boost the weaker team or add heavy randomness
    if (expectedA > expectedB) expectedB += Math.random() * 2;
    else expectedA += Math.random() * 2;
  }

  let goalsA = Math.max(0, Math.floor(poissonRandom(expectedA)));
  let goalsB = Math.max(0, Math.floor(poissonRandom(expectedB)));

  let extraTime = false;
  let penScore = null;
  let winner = null;

  // Handle Knockout tie-breaker
  if (isKnockout && goalsA === goalsB) {
    extraTime = true;
    // Simulate extra time
    let expectedExtraA = expectedA * 0.3;
    let expectedExtraB = expectedB * 0.3;
    let extraGoalsA = Math.floor(poissonRandom(expectedExtraA));
    let extraGoalsB = Math.floor(poissonRandom(expectedExtraB));
    
    goalsA += extraGoalsA;
    goalsB += extraGoalsB;

    if (goalsA === goalsB) {
      // Simulate Penalty Shootout
      let penA = 0;
      let penB = 0;
      let round = 1;
      // standard sudden death penalty simulator
      while (true) {
        if (Math.random() < 0.78) penA++;
        if (Math.random() < 0.78) penB++;
        
        if (round >= 5) {
          if (penA !== penB) break;
        }
        round++;
        if (round > 15) { // fallback
          if (Math.random() > 0.5) penA++; else penB++;
          break;
        }
      }
      penScore = { a: penA, b: penB };
      winner = penA > penB ? teamA : teamB;
    } else {
      winner = goalsA > goalsB ? teamA : teamB;
    }
  } else {
    if (goalsA > goalsB) winner = teamA;
    else if (goalsB > goalsA) winner = teamB;
  }

  // Generate Match events & commentary
  let events = generateEvents(teamA, teamB, goalsA, goalsB, extraTime, penScore);

  return {
    scoreA: goalsA,
    scoreB: goalsB,
    winner: winner,
    extraTime: extraTime,
    penScore: penScore,
    events: events
  };
}

// Simple Poisson Random Number Generator
function poissonRandom(mean) {
  let L = Math.exp(-mean);
  let k = 0;
  let p = 1.0;
  do {
    k++;
    p *= Math.random();
  } while (p > L && k < 10);
  return k - 1;
}

// Event commentary generator
function generateEvents(teamA, teamB, goalsA, goalsB, extraTime, penScore) {
  let events = [];
  let scorerPoolA = [teamA.starPlayer, "中鋒", "邊鋒", "中場球員"];
  let scorerPoolB = [teamB.starPlayer, "中鋒", "邊鋒", "中場球員"];

  // Generate Goal times
  let totalMinutes = extraTime ? 120 : 90;
  let goalTimes = [];
  
  for (let i = 0; i < goalsA; i++) {
    goalTimes.push({ team: 'A', time: Math.floor(Math.random() * totalMinutes) + 1 });
  }
  for (let i = 0; i < goalsB; i++) {
    goalTimes.push({ team: 'B', time: Math.floor(Math.random() * totalMinutes) + 1 });
  }

  // Sort chronologically
  goalTimes.sort((x, y) => x.time - y.time);

  // Map to commentary texts
  goalTimes.forEach(gt => {
    let teamName = gt.team === 'A' ? teamA.name : teamB.name;
    let scorer = gt.team === 'A' ? scorerPoolA[Math.floor(Math.random() * scorerPoolA.length)] : scorerPoolB[Math.floor(Math.random() * scorerPoolB.length)];
    let flag = gt.team === 'A' ? teamA.flag : teamB.flag;
    
    let descriptions = [
      `進球！${flag} <strong>${scorer}</strong> 在禁區前沿一記世界波直掛球門死角！`,
      `破門！${flag} <strong>${scorer}</strong> 接應隊友妙傳，門前輕鬆推射得手！`,
      `得分！${flag} <strong>${scorer}</strong> 頭槌攻門建功，門將鞭長莫及！`,
      `罰球命中！${flag} <strong>${scorer}</strong> 冷靜點射破網，改寫場上比分！`
    ];

    events.push({
      time: `${gt.time}'`,
      text: descriptions[Math.floor(Math.random() * descriptions.length)] + ` (${teamA.code} ${gt.team === 'A' ? '加' : ' +'}分)`
    });
  });

  // Add random yellow cards or big moments
  if (Math.random() < 0.6) {
    let timeCard = Math.floor(Math.random() * 85) + 1;
    let cardTeam = Math.random() > 0.5 ? teamA : teamB;
    events.push({
      time: `${timeCard}'`,
      text: `🟨 黃牌警告！${cardTeam.flag} <strong>${cardTeam.name}</strong> 的防守隊員因戰術犯規吃到一張黃牌。`
    });
  }

  if (extraTime) {
    events.push({
      time: `90'`,
      text: `⏱️ 常規時間結束，雙方戰成平手，賽事進入 30 分鐘延長加時賽！`
    });
    
    if (penScore) {
      events.push({
        time: `120'`,
        text: `🥊 延長賽結束依然平手！進入殘酷的 12 碼點球大戰！`
      });
      events.push({
        time: `點球`,
        text: `🎯 點球大戰結果：${teamA.flag} ${teamA.name} [ ${penScore.a} ] vs [ ${penScore.b} ] ${teamB.flag} ${teamB.name}！`
      });
    }
  }

  return events;
}

// ----------------------------------------------------
// TOURNAMENT RESOLUTION STAGES
// ----------------------------------------------------

// Simulate a single group
function simulateGroup(grp) {
  const grpTeams = currentTeams.filter(t => t.group === grp);
  const standings = groupStandings[grp];
  
  // Reset standings values
  standings.forEach(st => {
    st.pts = 0; st.played = 0; st.won = 0; st.drawn = 0; st.lost = 0; st.gf = 0; st.ga = 0; st.gd = 0;
  });

  // 6 Matches in a group of 4:
  // 0v1, 2v3, 0v2, 1v3, 0v3, 1v2
  const fixtures = [
    [0, 1], [2, 3],
    [0, 2], [1, 3],
    [0, 3], [1, 2]
  ];

  let grpEvents = [];

  fixtures.forEach(([aIdx, bIdx]) => {
    let tA = grpTeams[aIdx];
    let tB = grpTeams[bIdx];
    
    let res = simulateMatch(tA, tB, false);
    
    let stA = standings.find(s => s.id === tA.id);
    let stB = standings.find(s => s.id === tB.id);

    stA.played++; stB.played++;
    stA.gf += res.scoreA; stA.ga += res.scoreB;
    stB.gf += res.scoreB; stB.ga += res.scoreA;
    stA.gd = stA.gf - stA.ga;
    stB.gd = stB.gf - stB.ga;

    if (res.winner === tA) {
      stA.pts += 3; stA.won++; stB.lost++;
    } else if (res.winner === tB) {
      stB.pts += 3; stB.won++; stA.lost++;
    } else {
      stA.pts += 1; stB.pts += 1;
      stA.drawn++; stB.drawn++;
    }

    // Capture match event commentary snippet
    grpEvents.push(`⚽ ${tA.flag} ${tA.code} ${res.scoreA} - ${res.scoreB} ${tB.flag} ${tB.code}`);
  });

  // Sort standings
  // Order: Points > Goal Difference > Goals For > Base Average rating (tiebreaker)
  standings.sort((x, y) => {
    if (y.pts !== x.pts) return y.pts - x.pts;
    if (y.gd !== x.gd) return y.gd - x.gd;
    if (y.gf !== x.gf) return y.gf - x.gf;
    
    // Average rating comparison
    let ratingX = getTeamAverageRating(x.id);
    let ratingY = getTeamAverageRating(y.id);
    return ratingY - ratingX;
  });

  // Render to DOM
  const tbody = document.getElementById(`standings-body-${grp}`);
  if (tbody) {
    tbody.innerHTML = renderTableRows(standings);
  }

  // Update Live Ticker
  const ticker = document.getElementById("live-ticker");
  ticker.querySelector(".ticker-title").textContent = `⚡ 小組 ${grp} 模擬完畢`;
  const div = document.createElement("div");
  div.className = "ticker-event";
  div.innerHTML = `
    <div class="ticker-time">FT</div>
    <div class="ticker-txt">小組 ${grp} 戰況熱烈！結果：<br>${grpEvents.join("<br>")}<br><strong>${standings[0].flag}${standings[0].code}</strong> 與 <strong>${standings[1].flag}${standings[1].code}</strong> 位居前兩名晉級！</div>
  `;
  ticker.appendChild(div);
  ticker.scrollTop = ticker.scrollHeight;

  // Re-calculate best third places and re-render
  calculateBestThirds();
}

function getTeamAverageRating(id) {
  let t = currentTeams.find(x => x.id === id);
  if (!t) return 0;
  return (t.ratingOffense + t.ratingDefense + t.ratingMidfield) / 3;
}

// Simulate all groups
function simulateAllGroups() {
  const groups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
  groups.forEach(grp => simulateGroup(grp));
  calculateBestThirds();
  
  // Seed the round of 32
  seedRoundOf32();
  renderKnockoutBracket();
}

// Best third places resolution
function calculateBestThirds() {
  const groups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
  let candidates = [];

  groups.forEach(grp => {
    const standings = groupStandings[grp];
    // if group is not simulated yet, skip or use default placeholder
    if (standings && standings[0].played > 0) {
      candidates.push({
        group: grp,
        ...standings[2] // The 3rd placed team
      });
    }
  });

  // Sort third places candidates: Points > GD > GF > average rating
  candidates.sort((x, y) => {
    if (y.pts !== x.pts) return y.pts - x.pts;
    if (y.gd !== x.gd) return y.gd - x.gd;
    if (y.gf !== x.gf) return y.gf - x.gf;
    let ratingX = getTeamAverageRating(x.id);
    let ratingY = getTeamAverageRating(y.id);
    return ratingY - ratingX;
  });

  bestThirds = candidates;
  renderThirdsList();
}

function renderThirdsList() {
  const container = document.getElementById("thirds-container");
  container.innerHTML = "";

  if (bestThirds.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; color:var(--text-muted); font-size:0.9rem;">等待小組賽模擬數據...</div>`;
    return;
  }

  bestThirds.forEach((cand, idx) => {
    const qualified = idx < 8; // Top 8 advance
    const pill = document.createElement("div");
    pill.className = `third-team-pill ${qualified ? 'qualified' : 'eliminated'}`;
    pill.innerHTML = `
      <div class="team-info" onclick="openTeamModal('${cand.id}')" style="cursor:pointer;">
        <span style="font-weight:800; color:var(--text-muted); margin-right:4px;">#${idx+1}</span>
        <span class="team-flag">${cand.flag}</span>
        <span style="font-weight:600;">${cand.code}</span>
        <span style="font-size:0.7rem; color:var(--text-muted);">(${cand.group}組)</span>
      </div>
      <div style="display:flex; gap:0.5rem; align-items:center;">
        <span style="font-family:monospace; font-weight:700;">${cand.pts}分/GD ${cand.gd >= 0 ? '+' + cand.gd : cand.gd}</span>
        <span class="pill-status">${qualified ? '晉級' : '淘汰'}</span>
      </div>
    `;
    container.appendChild(pill);
  });
}

// ----------------------------------------------------
// KNOCKOUT BRACKET STAGE SEEDING
// ----------------------------------------------------
function seedRoundOf32() {
  // Check if all groups are simulated
  const groups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
  let unsimulated = groups.some(grp => groupStandings[grp][0].played === 0);
  if (unsimulated) {
    bracket.r32 = [];
    return;
  }

  // Gather group winners, runners up and top 8 thirds
  const winners = {};
  const runnersUp = {};
  groups.forEach(grp => {
    winners[grp] = currentTeams.find(t => t.id === groupStandings[grp][0].id);
    runnersUp[grp] = currentTeams.find(t => t.id === groupStandings[grp][1].id);
  });

  const thirds = bestThirds.slice(0, 8).map(cand => currentTeams.find(t => t.id === cand.id));

  // Round of 32 Seeding Matches
  // Let's create a solid, clean, balanced 16 matches pairing.
  bracket.r32 = [
    { id: "m32-1", teamA: winners["A"], teamB: thirds[0] || null, scoreA: null, scoreB: null, winner: null, commentary: [] },
    { id: "m32-2", teamA: runnersUp["B"], teamB: runnersUp["F"], scoreA: null, scoreB: null, winner: null, commentary: [] },
    { id: "m32-3", teamA: winners["C"], teamB: thirds[1] || null, scoreA: null, scoreB: null, winner: null, commentary: [] },
    { id: "m32-4", teamA: winners["D"], teamB: runnersUp["E"], scoreA: null, scoreB: null, winner: null, commentary: [] },
    { id: "m32-5", teamA: winners["E"], teamB: thirds[2] || null, scoreA: null, scoreB: null, winner: null, commentary: [] },
    { id: "m32-6", teamA: winners["F"], teamB: runnersUp["D"], scoreA: null, scoreB: null, winner: null, commentary: [] },
    { id: "m32-7", teamA: winners["G"], teamB: thirds[3] || null, scoreA: null, scoreB: null, winner: null, commentary: [] },
    { id: "m32-8", teamA: winners["H"], teamB: runnersUp["I"], scoreA: null, scoreB: null, winner: null, commentary: [] },
    { id: "m32-9", teamA: winners["I"], teamB: thirds[4] || null, scoreA: null, scoreB: null, winner: null, commentary: [] },
    { id: "m32-10", teamA: runnersUp["J"], teamB: runnersUp["L"], scoreA: null, scoreB: null, winner: null, commentary: [] },
    { id: "m32-11", teamA: winners["J"], teamB: thirds[5] || null, scoreA: null, scoreB: null, winner: null, commentary: [] },
    { id: "m32-12", teamA: winners["K"], teamB: runnersUp["A"], scoreA: null, scoreB: null, winner: null, commentary: [] },
    { id: "m32-13", teamA: winners["L"], teamB: thirds[6] || null, scoreA: null, scoreB: null, winner: null, commentary: [] },
    { id: "m32-14", teamA: runnersUp["C"], teamB: runnersUp["G"], scoreA: null, scoreB: null, winner: null, commentary: [] },
    { id: "m32-15", teamA: winners["B"], teamB: thirds[7] || null, scoreA: null, scoreB: null, winner: null, commentary: [] },
    { id: "m32-16", teamA: runnersUp["H"], teamB: runnersUp["K"], scoreA: null, scoreB: null, winner: null, commentary: [] }
  ];

  // Initialize other rounds with empty slots
  bracket.r16 = Array.from({ length: 8 }, (_, i) => ({ id: `m16-${i+1}`, teamA: null, teamB: null, scoreA: null, scoreB: null, winner: null, commentary: [] }));
  bracket.qf = Array.from({ length: 4 }, (_, i) => ({ id: `mqf-${i+1}`, teamA: null, teamB: null, scoreA: null, scoreB: null, winner: null, commentary: [] }));
  bracket.sf = Array.from({ length: 2 }, (_, i) => ({ id: `msf-${i+1}`, teamA: null, teamB: null, scoreA: null, scoreB: null, winner: null, commentary: [] }));
  bracket.final = [{ id: "mfinal", teamA: null, teamB: null, scoreA: null, scoreB: null, winner: null, commentary: [] }];
  bracket.thirdPlayoff = [{ id: "mthird", teamA: null, teamB: null, scoreA: null, scoreB: null, winner: null, commentary: [] }];
}

// Render Knockout Bracket
function renderKnockoutBracket() {
  renderRound("round-r32", bracket.r32, simulateR32Match);
  renderRound("round-r16", bracket.r16, simulateR16Match);
  renderRound("round-qf", bracket.qf, simulateQFMatch);
  renderRound("round-sf", bracket.sf, simulateSFMatch);

  // Render Final & 3rd Playoff
  renderFinalBox();
}

function renderRound(containerId, matches, simCallback) {
  const roundEl = document.getElementById(containerId);
  if (!roundEl) return;
  const listEl = roundEl.querySelector(".round-matches-list");
  listEl.innerHTML = "";

  if (matches.length === 0) {
    listEl.innerHTML = `<div style="text-align:center; padding: 2rem 0; color:var(--text-muted); font-size:0.85rem;">等待小組賽確定晉級名單...</div>`;
    return;
  }

  matches.forEach((m, idx) => {
    const card = document.createElement("div");
    card.className = "match-card";
    
    const teamAName = m.teamA ? m.teamA.name : "待定";
    const teamBName = m.teamB ? m.teamB.name : "待定";
    const teamAFlag = m.teamA ? m.teamA.flag : "🏳️";
    const teamBFlag = m.teamB ? m.teamB.flag : "🏳️";
    
    const scoreATxt = m.scoreA !== null ? m.scoreA : "-";
    const scoreBTxt = m.scoreB !== null ? m.scoreB : "-";
    
    let penTxt = "";
    if (m.penScore) {
      penTxt = ` <span style="font-size:0.7rem; color:var(--accent-gold); font-family:monospace;">(${m.penScore.a}:${m.penScore.b} PK)</span>`;
    }

    let aWinnerClass = m.winner && m.winner.id === m.teamA.id ? "winner" : (m.winner ? "loser" : "");
    let bWinnerClass = m.winner && m.winner.id === m.teamB.id ? "winner" : (m.winner ? "loser" : "");

    card.innerHTML = `
      <div class="match-info">
        <span>場次 ${idx+1}</span>
        ${m.teamA && m.teamB && !m.winner ? `<button class="match-simulate-btn" id="btn-sim-${m.id}">模擬</button>` : (m.winner ? `<span style="color:var(--accent-green); font-weight:700;">已結束</span>` : "")}
      </div>
      <div class="match-teams">
        <div class="match-team-row ${aWinnerClass}" onclick="${m.teamA ? `openTeamModal('${m.teamA.id}')` : ''}">
          <span class="team-info"><span class="team-flag">${m.teamA ? m.teamA.flag : "🏳️"}</span> ${m.teamA ? m.teamA.code : "待定"}</span>
          <span class="match-score">${scoreATxt}</span>
        </div>
        <div class="match-team-row ${bWinnerClass}" onclick="${m.teamB ? `openTeamModal('${m.teamB.id}')` : ''}">
          <span class="team-info"><span class="team-flag">${m.teamB ? m.teamB.flag : "🏳️"}</span> ${m.teamB ? m.teamB.code : "待定"}</span>
          <span class="match-score">${scoreBTxt}${penTxt}</span>
        </div>
      </div>
    `;

    listEl.appendChild(card);

    // Bind click trigger for single match simulation
    const btnSim = card.querySelector(`#btn-sim-${m.id}`);
    if (btnSim) {
      btnSim.addEventListener("click", (e) => {
        e.stopPropagation();
        simCallback(idx);
      });
    }
  });
}

function renderFinalBox() {
  const finalContainer = document.getElementById("final-match-box");
  const thirdContainer = document.getElementById("third-place-match-box");
  finalContainer.innerHTML = "";
  thirdContainer.innerHTML = "";

  if (bracket.final.length === 0) return;

  // Final Match Card
  const f = bracket.final[0];
  const fCard = document.createElement("div");
  fCard.className = "match-card";
  fCard.style.borderColor = "var(--accent-gold)";
  
  let penFTxt = f.penScore ? ` <span style="font-size:0.7rem; color:var(--accent-gold);">(${f.penScore.a}:${f.penScore.b} PK)</span>` : "";
  let fWinnerA = f.winner && f.winner.id === f.teamA?.id ? "winner" : (f.winner ? "loser" : "");
  let fWinnerB = f.winner && f.winner.id === f.teamB?.id ? "winner" : (f.winner ? "loser" : "");

  fCard.innerHTML = `
    <div class="match-info" style="background:rgba(255, 215, 0, 0.1);">
      <span style="color:var(--accent-gold); font-weight:700;">🏆 冠軍戰 (Grand Final)</span>
      ${f.teamA && f.teamB && !f.winner ? `<button class="match-simulate-btn" onclick="simulateFinal()">模擬</button>` : ""}
    </div>
    <div class="match-teams">
      <div class="match-team-row ${fWinnerA}" onclick="${f.teamA ? `openTeamModal('${f.teamA.id}')` : ''}">
        <span class="team-info"><span class="team-flag">${f.teamA ? f.teamA.flag : "🏳️"}</span> ${f.teamA ? f.teamA.code : "待定"}</span>
        <span class="match-score">${f.scoreA !== null ? f.scoreA : "-"}</span>
      </div>
      <div class="match-team-row ${fWinnerB}" onclick="${f.teamB ? `openTeamModal('${f.teamB.id}')` : ''}">
        <span class="team-info"><span class="team-flag">${f.teamB ? f.teamB.flag : "🏳️"}</span> ${f.teamB ? f.teamB.code : "待定"}</span>
        <span class="match-score">${f.scoreB !== null ? f.scoreB : "-"}${penFTxt}</span>
      </div>
    </div>
  `;
  finalContainer.appendChild(fCard);

  // Third Place Playoff
  const t = bracket.thirdPlayoff[0];
  const tCard = document.createElement("div");
  tCard.className = "match-card";
  tCard.style.borderColor = "var(--accent-purple)";

  let penTTxt = t.penScore ? ` <span style="font-size:0.7rem; color:var(--accent-purple);">(${t.penScore.a}:${t.penScore.b} PK)</span>` : "";
  let tWinnerA = t.winner && t.winner.id === t.teamA?.id ? "winner" : (t.winner ? "loser" : "");
  let tWinnerB = t.winner && t.winner.id === t.teamB?.id ? "winner" : (t.winner ? "loser" : "");

  tCard.innerHTML = `
    <div class="match-info">
      <span>🥉 季軍戰 (3rd Place Match)</span>
      ${t.teamA && t.teamB && !t.winner ? `<button class="match-simulate-btn" onclick="simulateThirdPlayoff()">模擬</button>` : ""}
    </div>
    <div class="match-teams">
      <div class="match-team-row ${tWinnerA}" onclick="${t.teamA ? `openTeamModal('${t.teamA.id}')` : ''}">
        <span class="team-info"><span class="team-flag">${t.teamA ? t.teamA.flag : "🏳️"}</span> ${t.teamA ? t.teamA.code : "待定"}</span>
        <span class="match-score">${t.scoreA !== null ? t.scoreA : "-"}</span>
      </div>
      <div class="match-team-row ${tWinnerB}" onclick="${t.teamB ? `openTeamModal('${t.teamB.id}')` : ''}">
        <span class="team-info"><span class="team-flag">${t.teamB ? t.teamB.flag : "🏳️"}</span> ${t.teamB ? t.teamB.code : "待定"}</span>
        <span class="match-score">${t.scoreB !== null ? t.scoreB : "-"}${penTTxt}</span>
      </div>
    </div>
  `;
  thirdContainer.appendChild(tCard);
}

// ----------------------------------------------------
// SIMULATE MATCHES PER ROUND & PROGRESSION
// ----------------------------------------------------

function postLiveCommentary(teamA, teamB, result) {
  const ticker = document.getElementById("live-ticker");
  ticker.innerHTML = "";

  const title = document.createElement("div");
  title.className = "ticker-title";
  title.textContent = `🎤 賽事轉播中: ${teamA.flag}${teamA.name} vs ${teamB.flag}${teamB.name}`;
  ticker.appendChild(title);

  // Play events one by one quickly
  let index = 0;
  function showNextEvent() {
    if (index < result.events.length) {
      const ev = result.events[index];
      const div = document.createElement("div");
      div.className = "ticker-event";
      div.innerHTML = `<div class="ticker-time">${ev.time}</div><div class="ticker-txt">${ev.text}</div>`;
      ticker.appendChild(div);
      ticker.scrollTop = ticker.scrollHeight;
      index++;
      setTimeout(showNextEvent, 200); // Dynamic speed up
    } else {
      // Show Final Score
      const div = document.createElement("div");
      div.className = "ticker-event";
      let pkTxt = result.penScore ? ` (點球大戰 ${result.penScore.a}:${result.penScore.b})` : "";
      div.innerHTML = `<div class="ticker-time">FT</div><div class="ticker-txt">比賽結束！最終比分：<strong>${teamA.name} ${result.scoreA} - ${result.scoreB} ${teamB.name}</strong>${pkTxt}。恭喜 <strong>${result.winner.flag}${result.winner.name}</strong> 晉級下一輪！</div>`;
      ticker.appendChild(div);
      ticker.scrollTop = ticker.scrollHeight;
    }
  }

  showNextEvent();
}

function simulateR32Match(idx) {
  const m = bracket.r32[idx];
  if (!m.teamA || !m.teamB || m.winner) return;

  const res = simulateMatch(m.teamA, m.teamB, true);
  m.scoreA = res.scoreA;
  m.scoreB = res.scoreB;
  m.winner = res.winner;
  m.penScore = res.penScore;

  postLiveCommentary(m.teamA, m.teamB, res);
  progressToR16(idx, res.winner);
  renderKnockoutBracket();
}

function progressToR16(r32Idx, winner) {
  // r32 matches 1 & 2 feed into r16 match 1
  // matches 3 & 4 feed into r16 match 2, etc.
  const r16Idx = Math.floor(r32Idx / 2);
  const matchSlot = r32Idx % 2 === 0 ? "teamA" : "teamB";
  bracket.r16[r16Idx][matchSlot] = winner;
}

function simulateR16Match(idx) {
  const m = bracket.r16[idx];
  if (!m.teamA || !m.teamB || m.winner) return;

  const res = simulateMatch(m.teamA, m.teamB, true);
  m.scoreA = res.scoreA;
  m.scoreB = res.scoreB;
  m.winner = res.winner;
  m.penScore = res.penScore;

  postLiveCommentary(m.teamA, m.teamB, res);
  progressToQF(idx, res.winner);
  renderKnockoutBracket();
}

function progressToQF(r16Idx, winner) {
  const qfIdx = Math.floor(r16Idx / 2);
  const matchSlot = r16Idx % 2 === 0 ? "teamA" : "teamB";
  bracket.qf[qfIdx][matchSlot] = winner;
}

function simulateQFMatch(idx) {
  const m = bracket.qf[idx];
  if (!m.teamA || !m.teamB || m.winner) return;

  const res = simulateMatch(m.teamA, m.teamB, true);
  m.scoreA = res.scoreA;
  m.scoreB = res.scoreB;
  m.winner = res.winner;
  m.penScore = res.penScore;

  postLiveCommentary(m.teamA, m.teamB, res);
  progressToSF(idx, res.winner);
  renderKnockoutBracket();
}

function progressToSF(qfIdx, winner) {
  const sfIdx = Math.floor(qfIdx / 2);
  const matchSlot = qfIdx % 2 === 0 ? "teamA" : "teamB";
  bracket.sf[sfIdx][matchSlot] = winner;
}

function simulateSFMatch(idx) {
  const m = bracket.sf[idx];
  if (!m.teamA || !m.teamB || m.winner) return;

  const res = simulateMatch(m.teamA, m.teamB, true);
  m.scoreA = res.scoreA;
  m.scoreB = res.scoreB;
  m.winner = res.winner;
  m.penScore = res.penScore;

  postLiveCommentary(m.teamA, m.teamB, res);
  
  // Winner goes to Final, Loser goes to 3rd Place Match
  const otherTeam = res.winner.id === m.teamA.id ? m.teamB : m.teamA;
  
  const finalSlot = idx === 0 ? "teamA" : "teamB";
  bracket.final[0][finalSlot] = res.winner;

  const thirdSlot = idx === 0 ? "teamA" : "teamB";
  bracket.thirdPlayoff[0][thirdSlot] = otherTeam;

  renderKnockoutBracket();
}

function simulateFinal() {
  const f = bracket.final[0];
  if (!f.teamA || !f.teamB || f.winner) return;

  const res = simulateMatch(f.teamA, f.teamB, true);
  f.scoreA = res.scoreA;
  f.scoreB = res.scoreB;
  f.winner = res.winner;
  f.penScore = res.penScore;

  postLiveCommentary(f.teamA, f.teamB, res);
  renderKnockoutBracket();
  checkChampionView();
}

function simulateThirdPlayoff() {
  const t = bracket.thirdPlayoff[0];
  if (!t.teamA || !t.teamB || t.winner) return;

  const res = simulateMatch(t.teamA, t.teamB, true);
  t.scoreA = res.scoreA;
  t.scoreB = res.scoreB;
  t.winner = res.winner;
  t.penScore = res.penScore;

  postLiveCommentary(t.teamA, t.teamB, res);
  renderKnockoutBracket();
  checkChampionView();
}

// Automate all knockouts
function simulateAllKnockouts() {
  const groups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
  let unsimulatedGroup = groups.some(grp => groupStandings[grp][0].played === 0);
  if (unsimulatedGroup) {
    simulateAllGroups();
  }

  // Simulate R32
  for (let i = 0; i < bracket.r32.length; i++) {
    if (!bracket.r32[i].winner) simulateR32Match(i);
  }
  // Simulate R16
  for (let i = 0; i < bracket.r16.length; i++) {
    if (!bracket.r16[i].winner) simulateR16Match(i);
  }
  // Simulate QF
  for (let i = 0; i < bracket.qf.length; i++) {
    if (!bracket.qf[i].winner) simulateQFMatch(i);
  }
  // Simulate SF
  for (let i = 0; i < bracket.sf.length; i++) {
    if (!bracket.sf[i].winner) simulateSFMatch(i);
  }
  // Simulate Final & 3rd Playoff
  if (!bracket.final[0].winner) simulateFinal();
  if (!bracket.thirdPlayoff[0].winner) simulateThirdPlayoff();
}

function setupKnockoutControls() {
  document.getElementById("btn-sim-all-knockouts").addEventListener("click", () => {
    simulateAllKnockouts();
  });
}

// Simulate full tournament in one click
function simulateFullTournament() {
  simulateAllGroups();
  simulateAllKnockouts();
  // Redirect to champion page
  const tabBtn = document.querySelector('.tab-btn[data-tab="champion-view"]');
  if (tabBtn) tabBtn.click();
}

// ----------------------------------------------------
// CHAMPION VIEW & SHARING
// ----------------------------------------------------
function checkChampionView() {
  const f = bracket.final[0];
  const t = bracket.thirdPlayoff[0];
  const champPanel = document.getElementById("celebration-panel");
  const noChampPanel = document.getElementById("no-champion-panel");

  if (f && f.winner) {
    champPanel.style.display = "block";
    noChampPanel.style.display = "none";

    // Setup names
    document.getElementById("champ-team-name").innerHTML = `${f.winner.flag} ${f.winner.name}`;
    
    const runnerUp = f.winner.id === f.teamA.id ? f.teamB : f.teamA;
    document.getElementById("runner-up-box").innerHTML = `${runnerUp.flag} ${runnerUp.name}`;
    
    if (t && t.winner) {
      document.getElementById("third-place-box").innerHTML = `${t.winner.flag} ${t.winner.name}`;
    }

    // Predict Golden Boot shooter from the champion or runner up
    const goldenBootWinner = f.winner.starPlayer;
    document.getElementById("golden-boot-box").innerHTML = `
      <span style="color:var(--accent-gold); font-size:1.4rem; font-weight:800;">${goldenBootWinner}</span>
      <span style="font-size:0.85rem; color:var(--text-secondary);">${f.winner.name} | 前鋒 / 射手</span>
    `;

    // Start Confetti!
    startConfetti();

    // Bind share summary button
    document.getElementById("btn-share").onclick = () => {
      const summaryText = `🏆 2026 世界盃預測大師報告：\n🥇 冠軍：${f.winner.name} ${f.winner.flag}\n🥈 亞軍：${runnerUp.name} ${runnerUp.flag}\n🥉 季軍：${t.winner ? t.winner.name : '--'} ${t.winner ? t.winner.flag : ''}\n🎖️ 金靴熱門：${goldenBootWinner} (${f.winner.name})\n快來寫下你的 2026 世界盃預測吧！`;
      navigator.clipboard.writeText(summaryText).then(() => {
        alert("預測報告已複製至剪貼簿！可直接貼上分享！");
      }).catch(err => {
        console.error("複製失敗:", err);
      });
    };

  } else {
    champPanel.style.display = "none";
    noChampPanel.style.display = "block";
    stopConfetti();
  }
}

// ----------------------------------------------------
// TEAM DETAILS MODAL
// ----------------------------------------------------
let selectedTeamId = null;

function setupModal() {
  const modal = document.getElementById("team-modal");
  const closeBtn = document.getElementById("modal-close-btn");
  
  closeBtn.addEventListener("click", () => {
    modal.classList.remove("active");
  });

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("active");
    }
  });

  // Slider interactive listeners
  const sliders = [
    { id: "input-modal-att", lbl: "lbl-modal-att" },
    { id: "input-modal-def", lbl: "lbl-modal-def" },
    { id: "input-modal-mid", lbl: "lbl-modal-mid" }
  ];

  sliders.forEach(s => {
    const input = document.getElementById(s.id);
    const lbl = document.getElementById(s.lbl);
    input.addEventListener("input", (e) => {
      lbl.textContent = e.target.value;
    });
  });

  // Save changes
  document.getElementById("btn-save-team-stats").addEventListener("click", () => {
    if (!selectedTeamId) return;
    
    const t = currentTeams.find(x => x.id === selectedTeamId);
    if (t) {
      t.ratingOffense = parseInt(document.getElementById("input-modal-att").value);
      t.ratingDefense = parseInt(document.getElementById("input-modal-def").value);
      t.ratingMidfield = parseInt(document.getElementById("input-modal-mid").value);
      
      alert(`${t.name} 的戰力數據已更新！`);
      modal.classList.remove("active");

      // Recalculate standings since team stats updated
      const grp = t.group;
      if (groupStandings[grp] && groupStandings[grp][0].played > 0) {
        simulateGroup(grp);
      }
    }
  });
}

function openTeamModal(id) {
  selectedTeamId = id;
  const t = currentTeams.find(x => x.id === id);
  if (!t) return;

  document.getElementById("modal-team-flag").textContent = t.flag;
  document.getElementById("modal-team-name").textContent = t.name;
  document.getElementById("modal-team-meta").textContent = `${t.conf} | 小組 ${t.group}`;
  document.getElementById("modal-team-star").textContent = t.starPlayer;

  // Set sliders value
  document.getElementById("input-modal-att").value = t.ratingOffense;
  document.getElementById("lbl-modal-att").textContent = t.ratingOffense;

  document.getElementById("input-modal-def").value = t.ratingDefense;
  document.getElementById("lbl-modal-def").textContent = t.ratingDefense;

  document.getElementById("input-modal-mid").value = t.ratingMidfield;
  document.getElementById("lbl-modal-mid").textContent = t.ratingMidfield;

  document.getElementById("team-modal").classList.add("active");
}

// ----------------------------------------------------
// CANVAS CONFETTI FX
// ----------------------------------------------------
let confettiInterval = null;
let confettiActive = false;

function startConfetti() {
  if (confettiActive) return;
  confettiActive = true;
  const canvas = document.getElementById("confetti-canvas");
  const ctx = canvas.getContext("2d");
  
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;
  
  window.addEventListener("resize", () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const colors = ["#ffd700", "#00f2fe", "#9b51e0", "#39ff14", "#ff3b30", "#ffffff"];
  const pieces = [];

  for (let i = 0; i < 150; i++) {
    pieces.push({
      x: Math.random() * width,
      y: Math.random() * height - height,
      r: Math.random() * 6 + 4,
      d: Math.random() * height,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngleIncremental: Math.random() * 0.07 + 0.02,
      tiltAngle: 0
    });
  }

  function draw() {
    if (!confettiActive) return;
    ctx.clearRect(0, 0, width, height);

    pieces.forEach(p => {
      p.tiltAngle += p.tiltAngleIncremental;
      p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
      p.x += Math.sin(p.tiltAngle);
      p.tilt = Math.sin(p.tiltAngle - p.r / 2) * 5;

      ctx.beginPath();
      ctx.lineWidth = p.r;
      ctx.strokeStyle = p.color;
      ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
      ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
      ctx.stroke();

      if (p.y > height) {
        p.x = Math.random() * width;
        p.y = -20;
        p.tilt = Math.random() * 10 - 5;
      }
    });

    requestAnimationFrame(draw);
  }

  draw();
}

function stopConfetti() {
  confettiActive = false;
  const canvas = document.getElementById("confetti-canvas");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}
