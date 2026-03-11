/* static/scripts/hud_logic.js */

// --- POMODORO STATE MACHINE ---
const WORK_TIME = 25 * 60;    
const SHORT_BREAK = 3 * 60;   
const LONG_BREAK = 15 * 60;   
const CYCLES_BEFORE_LONG = 4; 

let pomoTimer = null;
let pomoLeft = WORK_TIME;
let isPomoRunning = false;
let currentPhase = 'WORK'; // 'WORK', 'SHORT', 'LONG'
let cycleCount = 0;        

// 初始化 UI
updateDots(); 
updatePomoDisplay(); // 初始化时也刷新一下按钮状态

function togglePomodoro() {
    const btn = document.getElementById('pomo-btn');
    
    if (!isPomoRunning) {
        // === START ===
        isPomoRunning = true;
        
        // 只有在 FOCUS 模式下才显示“PAUSE”，休息模式显示“PAUSE BREAK”
        if (currentPhase === 'WORK') {
            btn.innerText = "PAUSE FOCUS";
        } else {
            btn.innerText = "PAUSE BREAK";
        }
        
        // 运行中：边框变成稍微亮一点的白色
        btn.style.borderColor = "rgba(255, 255, 255, 0.5)"; 
        
        pomoTimer = setInterval(() => {
            if (pomoLeft > 0) {
                pomoLeft--;
                updatePomoDisplay();
            } else {
                // === TIME IS UP ===
                handlePhaseComplete();
            }
        }, 1000);
        
    } else {
        // === PAUSE ===
        clearInterval(pomoTimer);
        isPomoRunning = false;
        btn.innerText = "RESUME";
        btn.style.borderColor = "rgba(255, 255, 255, 0.2)"; // 暂停时边框变暗
    }
}

function handlePhaseComplete() {
    clearInterval(pomoTimer);
    isPomoRunning = false;
    
    // 播放提示音 (可选)
    // const audio = new Audio('/static/sounds/bell.mp3'); audio.play().catch(e=>{});
    
    const btn = document.getElementById('pomo-btn');
    const statusText = document.getElementById('pomo-status-text');

    if (currentPhase === 'WORK') {
        // --- 工作结束 -> 进入休息 ---
        cycleCount++;
        updateDots();
        
        if (cycleCount >= CYCLES_BEFORE_LONG) {
            // 长休
            currentPhase = 'LONG';
            pomoLeft = LONG_BREAK;
            statusText.innerText = ">>> SYSTEM COOLING (LONG BREAK) <<<";
            statusText.style.color = "#3498db"; // 柔和蓝
            cycleCount = 0; 
        } else {
            // 短休
            currentPhase = 'SHORT';
            pomoLeft = SHORT_BREAK;
            statusText.innerText = ">>> STANDBY MODE (SHORT BREAK) <<<";
            statusText.style.color = "#2ecc71"; // 柔和绿
        }
        
    } else {
        // --- 休息结束 -> 回到工作 ---
        currentPhase = 'WORK';
        pomoLeft = WORK_TIME;
        statusText.innerText = ">>> READY TO FOCUS <<<";
        statusText.style.color = "#ccc"; // 银灰色，不刺眼
        
        if (cycleCount === 0) updateDots(); 
    }
    
    updatePomoDisplay();
    btn.innerText = "START NEXT PHASE";
    btn.style.background = "transparent"; // 重置进度条
    btn.style.borderColor = "rgba(255, 255, 255, 0.2)";
}

function updatePomoDisplay() {
    const display = document.getElementById('pomo-timer-display');
    const btn = document.getElementById('pomo-btn');
    
    // 1. 更新数字
    const m = Math.floor(pomoLeft / 60);
    const s = pomoLeft % 60;
    display.innerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    
    // 2. 更新网页标题
    document.title = `(${m}:${s}) Obsidian`;
    
    // --- 3. 进度条动画核心逻辑 ---
    // 只有在非初始状态（或者是暂停状态）我们都显示进度，为了美观
    let totalTime;
    
    if (currentPhase === 'WORK') totalTime = WORK_TIME;
    else if (currentPhase === 'SHORT') totalTime = SHORT_BREAK;
    else totalTime = LONG_BREAK;

    // 计算已经过去的时间比例 (0% -> 100%)
    // 公式: (总时间 - 剩余时间) / 总时间
    const progress = ((totalTime - pomoLeft) / totalTime) * 100;

    // 只有当开始跑了之后（或者暂停中但有进度），才显示背景
    // 如果是刚刚重置完等待开始，保持透明
    if (btn.innerText !== "START NEXT PHASE" && btn.innerText !== "INITIALIZE SEQUENCE") {
        // 使用 CSS 线性渐变：
        // 从左到右 | 白色半透明(15%) 填充到 progress% | 之后全是透明
        btn.style.background = `linear-gradient(90deg, rgba(255, 255, 255, 0.15) ${progress}%, transparent ${progress}%)`;
    } else {
        btn.style.background = "transparent";
    }
}

function updateDots() {
    const dotsContainer = document.getElementById('pomo-cycle-dots');
    if (!dotsContainer) return;
    
    dotsContainer.innerHTML = '';
    
    for (let i = 0; i < CYCLES_BEFORE_LONG; i++) {
        const dot = document.createElement('span');
        dot.style.width = "6px";  // 稍微改小一点，更精致
        dot.style.height = "6px";
        dot.style.borderRadius = "50%";
        dot.style.margin = "0 4px"; // 间距稍微拉开
        
        if (i < cycleCount) {
            // 已完成：亮白色，带一点透明度
            dot.style.backgroundColor = "rgba(255, 255, 255, 0.8)"; 
            dot.style.boxShadow = "0 0 5px rgba(255, 255, 255, 0.5)"; // 淡淡的发光
        } else {
            // 未完成：深灰，几乎隐形
            dot.style.backgroundColor = "#333"; 
            dot.style.boxShadow = "none";
        }
        
        dotsContainer.appendChild(dot);
    }
}