// --- RECORDER & CLOCK LOGIC ---

// 1. 电子时钟 (每秒刷新)
function updateDigitalClock() {
    const clockEl = document.getElementById('digital-clock');
    if (!clockEl) return;

    const now = new Date();
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    
    // [修改] 只有小时和分钟，中间加个带动画的冒号
    // 注意：这里不再输出秒数s
    clockEl.innerHTML = `${h}<span class="blink-colon">:</span>${m}`;
}

// 确保定时器还在 (可以改成每1秒或者每半秒执行一次，但每秒足矣)
setInterval(updateDigitalClock, 2500);
updateDigitalClock();


// 2. 录制按钮逻辑
let isRecordingSession = false; 

/* static/scripts/hud_logic.js -> toggleRecording 部分 */

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
        const now = new Date();
        inputStart.value = formatTime(now);
        
        // 文字变化
        btn.innerHTML = '<span style="color: inherit;">■</span> Stop & Log';
        
        // [STYLE CHANGE] 
        // 1. 不变色，而是加上呼吸动画
        btn.style.animation = "pulse-glow 2s infinite";
        // 2. 稍微增加一点背景不透明度，表示由“虚”变“实”
        btn.style.background = "rgba(255, 255, 255, 0.1)";
        btn.style.color = "rgba(255, 255, 255, 0.9)";
        
        // 时钟稍微亮起，表示关联性
        if(clockEl) clockEl.style.color = "rgba(255,255,255,1)";

    } else {
        // === STOP ===
        isRecordingSession = false;
        const now = new Date();
        inputEnd.value = formatTime(now);
        
        // UI 切换
        btn.style.display = "none";
        submitBtn.style.display = "block";
        submitBtn.innerHTML = `Confirm <span style="font-weight:normal; opacity:0.7; font-size:0.8em; margin-left:5px;">${inputStart.value} - ${inputEnd.value}</span>`;
        
        // 停止动画
        btn.style.animation = "none";
        
        // 恢复时钟
        if(clockEl) clockEl.style.color = "rgba(255,255,255,0.8)";
        
        if(descInput) descInput.focus();
    }
}

// (确保 formatTime 函数还在下面)
function formatTime(date) {
    let h = date.getHours();
    let m = date.getMinutes();
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}