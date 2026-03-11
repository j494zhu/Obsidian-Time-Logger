/* ══════════════════════════════════════════════════════════════
   ONYX NEURAL ENGINE — Dashboard Logic
   Unified JS: Clock, Recorder, Notebook, Chart, HUD, Modal, Pomodoro
   ══════════════════════════════════════════════════════════════ */

// ═══════════════════════════════════════════
//  1. UTILITY FUNCTIONS
// ═══════════════════════════════════════════

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function formatTime(date) {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

function formatDuration(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

function hexToRgba(hex, alpha) {
  let c;
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    c = hex.substring(1).split('');
    if (c.length === 3) c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    c = '0x' + c.join('');
    return `rgba(${(c >> 16) & 255},${(c >> 8) & 255},${c & 255},${alpha})`;
  }
  return `rgba(52,152,219,${alpha})`;
}


// ═══════════════════════════════════════════
//  2. DIGITAL CLOCK
// ═══════════════════════════════════════════

function updateDigitalClock() {
  const el = document.getElementById('digital-clock');
  if (!el) return;
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  el.innerHTML = `${h}<span class="blink-colon">:</span>${m}`;
}

setInterval(updateDigitalClock, 2500);
updateDigitalClock();


// ═══════════════════════════════════════════
//  3. SESSION RECORDER
// ═══════════════════════════════════════════

let isRecordingSession = false;

function toggleRecording() {
  const btn = document.getElementById('record-btn');
  const submitBtn = document.getElementById('submit-btn');
  const inputStart = document.getElementById('start_time');
  const inputEnd = document.getElementById('end_time');
  const clockEl = document.getElementById('digital-clock');
  const descInput = document.getElementById('desc_input');

  if (!isRecordingSession) {
    // === START ===
    isRecordingSession = true;
    inputStart.value = formatTime(new Date());
    btn.innerHTML = '<span>■</span> Stop & Log';
    btn.classList.add('is-recording');
    if (clockEl) clockEl.style.color = 'rgba(255,255,255,1)';
  } else {
    // === STOP ===
    isRecordingSession = false;
    const now = new Date();
    inputEnd.value = formatTime(now);
    btn.style.display = 'none';
    btn.classList.remove('is-recording');
    submitBtn.style.display = 'block';
    submitBtn.innerHTML = `Confirm <span style="font-weight:normal;opacity:0.6;font-size:0.8em;margin-left:5px;">${inputStart.value} – ${inputEnd.value}</span>`;
    if (clockEl) clockEl.style.color = 'rgba(255,255,255,0.85)';
    if (descInput) descInput.focus();
  }
}


// ═══════════════════════════════════════════
//  4. NOTEBOOK AUTOSAVE
// ═══════════════════════════════════════════

function saveNote(type, content, statusId) {
  const statusSpan = document.getElementById(statusId);
  if (statusSpan) statusSpan.innerText = 'Saving...';

  fetch('/notes', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, content }),
  })
    .then((r) => r.json())
    .then((data) => {
      if (statusSpan) statusSpan.innerText = 'Saved ' + data.saved_at;
    })
    .catch(() => {
      if (statusSpan) statusSpan.innerText = 'Error!';
    });
}

document.addEventListener('DOMContentLoaded', () => {
  const quickInput = document.getElementById('quick_note_area');
  const bookInput = document.getElementById('notebook_area');

  if (quickInput) {
    quickInput.addEventListener(
      'input',
      debounce(function () {
        saveNote('quick_note', this.value, 'status-quick');
      }, 1000)
    );
  }
  if (bookInput) {
    bookInput.addEventListener(
      'input',
      debounce(function () {
        saveNote('notebook', this.value, 'status-book');
      }, 1000)
    );
  }
});


// ═══════════════════════════════════════════
//  5. DATA VISUALIZATION (Chart.js)
// ═══════════════════════════════════════════

const PALETTE = {
  coding:   { solid: '#a78bda', light: 'rgba(167,139,218,0.15)' },
  math:     { solid: '#d4727a', light: 'rgba(212,114,122,0.15)' },
  break:    { solid: '#c9a94e', light: 'rgba(201,169,78,0.15)' },
  deepwork: { solid: '#56b6a2', light: 'rgba(86,182,162,0.15)' },
  other:    { solid: '#6fa8dc', light: 'rgba(111,168,220,0.15)' },
};

class VizChart {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.chart = null;
    this.currentType = 'doughnut';
    this.data = [];
  }

  _getKey(cat) {
    return PALETTE[cat.key] ? cat.key : 'other';
  }

  _getColors() {
    return this.data.map((c) => PALETTE[this._getKey(c)].solid);
  }

  _buildBarGradients() {
    return this.data.map((cat) => {
      const p = PALETTE[this._getKey(cat)];
      const g = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      g.addColorStop(0, p.solid);
      g.addColorStop(1, p.light);
      return g;
    });
  }

  _baseDataset() {
    return {
      data: this.data.map((c) => c.minutes),
      borderWidth: 0,
      hoverOffset: this.currentType === 'doughnut' ? 6 : 0,
    };
  }

  _tooltipConfig() {
    return {
      enabled: true,
      backgroundColor: 'rgba(22,27,34,0.95)',
      titleColor: '#e6edf3',
      bodyColor: '#8b949e',
      padding: 12,
      cornerRadius: 8,
      displayColors: true,
      callbacks: {
        label: (ctx) => ` ${formatDuration(ctx.parsed.y || ctx.parsed)}`,
      },
    };
  }

  _doughnutConfig() {
    return {
      type: 'doughnut',
      data: {
        labels: this.data.map((c) => c.label),
        datasets: [
          {
            ...this._baseDataset(),
            backgroundColor: this._getColors(),
            borderRadius: 4,
            spacing: 3,
            cutout: '64%',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: this._tooltipConfig() },
        animation: { animateRotate: true, duration: 700, easing: 'easeOutQuart' },
      },
    };
  }

  _barConfig() {
    return {
      type: 'bar',
      data: {
        labels: this.data.map((c) => c.label),
        datasets: [
          {
            ...this._baseDataset(),
            backgroundColor: this._buildBarGradients(),
            borderRadius: { topLeft: 6, topRight: 6 },
            barPercentage: 0.55,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { display: false }, ticks: { color: '#6e7681', font: { family: "'Inter'", size: 10 } } },
          y: { beginAtZero: true, grid: { color: 'rgba(139,148,158,0.06)' }, ticks: { display: false } },
        },
        plugins: { legend: { display: false }, tooltip: this._tooltipConfig() },
      },
    };
  }

  render(type = 'doughnut') {
    this.currentType = type;
    if (this.chart) this.chart.destroy();
    const cfg = type === 'bar' ? this._barConfig() : this._doughnutConfig();
    this.chart = new Chart(this.ctx, cfg);
  }

  updateData(newData) {
    this.data = newData;
    this.render(this.currentType);
  }
}

function buildLegend(container, categories) {
  container.innerHTML = '';
  const total = categories.reduce((s, c) => s + c.minutes, 0);
  categories.forEach((cat) => {
    const li = document.createElement('li');
    li.className = 'viz-legend__item';
    const pct = total > 0 ? ((cat.minutes / total) * 100).toFixed(0) : 0;
    const key = PALETTE[cat.key] ? cat.key : 'other';
    li.innerHTML = `
      <span class="viz-legend__swatch" style="background:${PALETTE[key].solid}"></span>
      ${cat.label}
      <span class="viz-legend__value">${pct}%</span>`;
    container.appendChild(li);
  });
}

function showLoader(el, show) {
  if (!el) return;
  el.classList.toggle('is-visible', show);
  el.setAttribute('aria-hidden', String(!show));
}

async function fetchChartData() {
  try {
    const res = await fetch('/api/logs/visualize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('No data');
    const d = await res.json();
    const cats = d.labels.map((label, i) => {
      let key = 'other';
      const l = label.toLowerCase();
      if (l.includes('code') || l.includes('py') || l.includes('program')) key = 'coding';
      else if (l.includes('math') || l.includes('alg')) key = 'math';
      else if (l.includes('break') || l.includes('rest') || l.includes('sleep')) key = 'break';
      else if (l.includes('deep') || l.includes('focus')) key = 'deepwork';
      return { key, label, minutes: d.data[i] };
    });
    return { categories: cats, total: d.total_minutes || cats.reduce((a, b) => a + b.minutes, 0) };
  } catch {
    return null;
  }
}

// Init chart on DOM ready
document.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementById('vizChart');
  const legend = document.querySelector('.viz-legend');
  const totalEl = document.getElementById('vizTotal');
  const loader = document.querySelector('.viz-loader');
  const emptyEl = document.getElementById('vizEmpty');
  const toggles = document.querySelectorAll('.viz-toggle__btn');

  if (!canvas) return;
  const chart = new VizChart(canvas);

  showLoader(loader, true);
  const result = await fetchChartData();
  showLoader(loader, false);

  if (result && result.categories.length > 0) {
    chart.updateData(result.categories);
    if (legend) buildLegend(legend, result.categories);
    if (totalEl) totalEl.textContent = formatDuration(result.total);
    if (emptyEl) emptyEl.classList.remove('is-visible');
  } else {
    // Show elegant empty state
    if (emptyEl) emptyEl.classList.add('is-visible');
    if (totalEl) totalEl.textContent = '—';
    if (canvas) canvas.style.display = 'none';
  }

  // Toggle buttons
  toggles.forEach((btn) => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.chart;
      if (chart.currentType === type) return;
      toggles.forEach((b) => {
        b.classList.remove('is-active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-selected', 'true');
      chart.render(type);
    });
  });
});


// ═══════════════════════════════════════════
//  6. NEURAL AUDIT HUD
// ═══════════════════════════════════════════

let currentAuditSession = null;

async function runNeuralAudit() {
  const btn = document.getElementById('audit-btn');
  const contentArea = document.getElementById('hud-content');
  const statusDot = document.getElementById('hud-status-dot');
  const statusText = document.getElementById('hud-status-text');
  const rlhfZone = document.getElementById('rlhf-zone');

  const toneInput = document.querySelector('input[name="ai_tone"]:checked');
  const selectedTone = toneInput ? toneInput.value : 'strict';

  btn.disabled = true;
  btn.innerText = 'UPLINKING...';
  statusDot.style.backgroundColor = 'var(--neon-yellow)';
  statusDot.style.boxShadow = '0 0 10px var(--neon-yellow)';
  statusText.innerText = 'Processing';

  if (rlhfZone) rlhfZone.style.display = 'none';

  try {
    const response = await fetch('/api/ai/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tone: selectedTone }),
    });
    if (!response.ok) throw new Error('Connection Refused');
    const data = await response.json();

    const scoreEl = document.getElementById('hud-score-val');
    scoreEl.innerText = data.score;
    document.getElementById('hud-insight-text').innerText = data.insight;

    const warnBox = document.getElementById('hud-warning-box');
    if (data.warning && data.warning !== 'None') {
      warnBox.style.display = 'flex';
      document.getElementById('hud-warn-text').innerText = data.warning;
    } else {
      warnBox.style.display = 'none';
    }

    const colorMap = { green: 'var(--neon-green)', yellow: 'var(--neon-yellow)', red: 'var(--neon-red)' };
    const activeColor = colorMap[data.status] || '#fff';
    scoreEl.style.color = activeColor;
    statusDot.style.backgroundColor = activeColor;
    statusDot.style.boxShadow = `0 0 15px ${activeColor}`;
    statusText.innerText = 'Online';

    contentArea.style.display = 'flex';
    btn.innerText = 'REFRESH DATA';

    currentAuditSession = {
      context: `Tone: ${selectedTone}`,
      response: data.insight,
    };

    if (rlhfZone) {
      rlhfZone.style.display = 'block';
      rlhfZone.style.opacity = '0';
      setTimeout(() => (rlhfZone.style.opacity = '1'), 400);
    }
  } catch (err) {
    console.error(err);
    btn.innerText = 'LINK FAILED';
    statusDot.style.backgroundColor = 'var(--neon-red)';
    contentArea.style.display = 'flex';
    document.getElementById('hud-insight-text').innerText = 'System Failure: ' + err.message;
    document.getElementById('hud-score-val').innerText = 'ERR';
    document.getElementById('hud-score-val').style.color = 'var(--neon-red)';
  } finally {
    btn.disabled = false;
  }
}

// RLHF feedback for Neural Audit
async function submitRLHF(score) {
  if (!currentAuditSession) return;
  const zone = document.getElementById('rlhf-zone');
  zone.style.opacity = '0.5';
  zone.style.pointerEvents = 'none';

  try {
    const res = await fetch('/api/alignment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: currentAuditSession.context,
        response: currentAuditSession.response,
        score: score,
      }),
    });
    if (res.ok) {
      zone.innerHTML = '<span style="color:var(--neon-green);font-size:0.78rem;letter-spacing:1px;">[ DATASET UPDATED ]</span>';
      zone.style.opacity = '1';
    }
  } catch (e) {
    console.error(e);
  }
}


// ═══════════════════════════════════════════
//  7. WEEKLY INSIGHT MODAL
// ═══════════════════════════════════════════

async function openWeeklyInsight() {
  const modal = document.getElementById('insight-modal');
  const card = document.getElementById('insight-card');

  modal.style.display = 'flex';
  setTimeout(() => card.classList.add('is-open'), 10);

  // Reset feedback state
  const fbBox = document.getElementById('insight-feedback-box');
  const fbSuccess = document.getElementById('insight-feedback-success');
  if (fbBox) { fbBox.style.display = 'block'; fbBox.style.opacity = '1'; fbBox.style.transform = 'none'; }
  if (fbSuccess) { fbSuccess.style.display = 'none'; fbSuccess.classList.remove('is-visible'); }

  // Loading state
  document.getElementById('card-week-label').innerText = 'Establishing Uplink...';
  document.getElementById('card-roast').innerText = 'Analyzing neural patterns...';

  try {
    const res = await fetch('/api/ai/weekly-insight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();

    if (data.status === 'error') {
      alert(data.message);
      closeInsight();
      return;
    }

    // Map data to UI
    document.getElementById('card-week-label').innerText = data.week_label || 'Unknown Protocol';
    document.getElementById('card-achievement').innerText = data.achievement || 'No data.';
    document.getElementById('card-advice').innerText = data.optimization_protocol || 'No advice generated.';
    document.getElementById('card-phase').innerText = `STATUS: ${data.neural_phase || 'CALCULATING'}`;
    document.getElementById('card-dw-ratio').innerText = `${data.deep_work_ratio || 0}%`;
    document.getElementById('card-peak').innerText = data.peak_window || '--:--';
    document.getElementById('card-roast').innerText = `"${data.roast || 'No anomalies detected.'}"`;

    // Dynamic mood coloring
    const color = data.primary_mood_color || '#3498db';

    const colorBar = document.getElementById('card-color-bar');
    if (colorBar) colorBar.style.backgroundColor = color;

    const phaseTag = document.getElementById('card-phase');
    if (phaseTag) {
      phaseTag.style.color = color;
      phaseTag.style.borderColor = color;
      phaseTag.style.backgroundColor = hexToRgba(color, 0.1);
    }

    const roastBox = document.getElementById('card-roast-box');
    if (roastBox) {
      roastBox.style.borderLeftColor = color;
      roastBox.style.backgroundColor = hexToRgba(color, 0.04);
      const roastHeader = roastBox.querySelector('.modal-roast-box__header');
      if (roastHeader) roastHeader.style.color = color;
    }

    const title = document.getElementById('card-week-label');
    if (title) {
      title.style.backgroundImage = `linear-gradient(45deg, #fff, ${color})`;
      title.style.webkitBackgroundClip = 'text';
      title.style.webkitTextFillColor = 'transparent';
    }
  } catch (e) {
    console.error('Neural Link Failed:', e);
    alert('Neural Link Severed: Check console for details.');
    closeInsight();
  }
}

function closeInsight() {
  const modal = document.getElementById('insight-modal');
  const card = document.getElementById('insight-card');
  card.classList.remove('is-open');
  setTimeout(() => (modal.style.display = 'none'), 250);
}

// RLHF feedback for Weekly Insight (ACCURATE / HALLUCINATION)
async function submitInsightFeedback(score) {
  const feedbackBox = document.getElementById('insight-feedback-box');
  const successBox = document.getElementById('insight-feedback-success');

  // Animate out buttons
  if (feedbackBox) {
    feedbackBox.style.opacity = '0';
    feedbackBox.style.transform = 'translateY(-6px)';
  }

  setTimeout(() => {
    if (feedbackBox) feedbackBox.style.display = 'none';
    if (successBox) {
      successBox.style.display = 'flex';
      requestAnimationFrame(() => successBox.classList.add('is-visible'));
    }
  }, 300);

  // Send to backend
  try {
    await fetch('/api/alignment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: 'Weekly Insight Report',
        response: document.getElementById('card-week-label')?.innerText || '',
        score: score,
      }),
    });
  } catch (e) {
    console.error('Feedback submission failed:', e);
  }
}


// ═══════════════════════════════════════════
//  8. POMODORO TIMER
// ═══════════════════════════════════════════

const WORK_TIME = 25 * 60;
const SHORT_BREAK = 3 * 60;
const LONG_BREAK = 15 * 60;
const CYCLES_BEFORE_LONG = 4;

let pomoTimer = null;
let pomoLeft = WORK_TIME;
let isPomoRunning = false;
let currentPhase = 'WORK';
let cycleCount = 0;

function togglePomodoro() {
  const btn = document.getElementById('pomo-btn');

  if (!isPomoRunning) {
    isPomoRunning = true;
    btn.innerText = currentPhase === 'WORK' ? 'PAUSE FOCUS' : 'PAUSE BREAK';
    btn.style.borderColor = 'rgba(255,255,255,0.5)';

    pomoTimer = setInterval(() => {
      if (pomoLeft > 0) {
        pomoLeft--;
        updatePomoDisplay();
      } else {
        handlePhaseComplete();
      }
    }, 1000);
  } else {
    clearInterval(pomoTimer);
    isPomoRunning = false;
    btn.innerText = 'RESUME';
    btn.style.borderColor = 'rgba(255,255,255,0.2)';
  }
}

function handlePhaseComplete() {
  clearInterval(pomoTimer);
  isPomoRunning = false;

  const btn = document.getElementById('pomo-btn');
  const statusText = document.getElementById('pomo-status-text');

  if (currentPhase === 'WORK') {
    cycleCount++;
    updateDots();
    if (cycleCount >= CYCLES_BEFORE_LONG) {
      currentPhase = 'LONG';
      pomoLeft = LONG_BREAK;
      statusText.innerText = '>>> SYSTEM COOLING (LONG BREAK) <<<';
      statusText.style.color = '#3498db';
      cycleCount = 0;
    } else {
      currentPhase = 'SHORT';
      pomoLeft = SHORT_BREAK;
      statusText.innerText = '>>> STANDBY MODE (SHORT BREAK) <<<';
      statusText.style.color = '#2ecc71';
    }
  } else {
    currentPhase = 'WORK';
    pomoLeft = WORK_TIME;
    statusText.innerText = '>>> READY TO FOCUS <<<';
    statusText.style.color = '#ccc';
    if (cycleCount === 0) updateDots();
  }

  updatePomoDisplay();
  btn.innerText = 'START NEXT PHASE';
  btn.style.background = 'transparent';
  btn.style.borderColor = 'rgba(255,255,255,0.2)';
}

function updatePomoDisplay() {
  const display = document.getElementById('pomo-timer-display');
  const btn = document.getElementById('pomo-btn');
  if (!display || !btn) return;

  const m = Math.floor(pomoLeft / 60);
  const s = pomoLeft % 60;
  display.innerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  document.title = `(${m}:${s.toString().padStart(2, '0')}) Onyx`;

  let totalTime = currentPhase === 'WORK' ? WORK_TIME : currentPhase === 'SHORT' ? SHORT_BREAK : LONG_BREAK;
  const progress = ((totalTime - pomoLeft) / totalTime) * 100;

  if (btn.innerText !== 'START NEXT PHASE' && btn.innerText !== 'INITIALIZE SEQUENCE') {
    btn.style.background = `linear-gradient(90deg, rgba(255,255,255,0.12) ${progress}%, transparent ${progress}%)`;
  } else {
    btn.style.background = 'transparent';
  }
}

function updateDots() {
  const container = document.getElementById('pomo-cycle-dots');
  if (!container) return;
  container.innerHTML = '';

  for (let i = 0; i < CYCLES_BEFORE_LONG; i++) {
    const dot = document.createElement('span');
    dot.className = 'dot' + (i < cycleCount ? ' is-done' : '');
    container.appendChild(dot);
  }
}

// Init pomodoro display on load
document.addEventListener('DOMContentLoaded', () => {
  updateDots();
  updatePomoDisplay();
});
