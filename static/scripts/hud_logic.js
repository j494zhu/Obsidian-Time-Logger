/* * PROJECT: NEURAL AUDIT LOGIC 
 * Handles interaction with the /api/ai/audit endpoint
 */
// [NEW] 全局变量：用来暂存当前的对话上下文，方便打分时调用
let currentAuditSession = null;

async function runNeuralAudit() {
    const btn = document.getElementById('audit-btn');
    const contentArea = document.getElementById('hud-content');
    const statusDot = document.getElementById('hud-status-dot');
    const statusText = document.getElementById('hud-status-text');
    // [NEW] 获取 RLHF 区域
    const rlhfZone = document.getElementById('rlhf-zone'); 

    // 1. 获取语气
    const toneInput = document.querySelector('input[name="ai_tone"]:checked');
    const selectedTone = toneInput ? toneInput.value : 'strict';

    // --- Reset UI ---
    btn.disabled = true;
    btn.innerText = "UPLINKING...";
    statusDot.style.backgroundColor = "var(--neon-yellow)";
    statusDot.style.boxShadow = "0 0 10px var(--neon-yellow)";
    statusText.innerText = "Processing";
    
    // [NEW] 每次重新扫描时，先把旧的打分按钮藏起来，避免逻辑混乱
    if(rlhfZone) rlhfZone.style.display = 'none';

    try {
        const response = await fetch('/api/ai/audit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tone: selectedTone })
        });

        if (!response.ok) throw new Error("Connection Refused");
        const data = await response.json();

        // --- Render Data (你原本的代码) ---
        const scoreEl = document.getElementById('hud-score-val');
        scoreEl.innerText = data.score;
        document.getElementById('hud-insight-text').innerText = data.insight;
        
        const warnBox = document.getElementById('hud-warning-box');
        if (data.warning && data.warning !== "None") {
            warnBox.style.display = 'flex';
            document.getElementById('hud-warn-text').innerText = data.warning;
        } else {
            warnBox.style.display = 'none';
        }

        // Color Logic... (省略你原本的颜色代码，保持不变即可)
        const colorMap = {'green': 'var(--neon-green)', 'yellow': 'var(--neon-yellow)', 'red': 'var(--neon-red)'};
        const activeColor = colorMap[data.status] || '#fff';
        scoreEl.style.color = activeColor;
        statusDot.style.backgroundColor = activeColor;
        statusDot.style.boxShadow = `0 0 15px ${activeColor}`;
        statusText.innerText = "Online";
        
        contentArea.style.display = 'flex';
        btn.innerText = "REFRESH DATA";

        // ==========================================
        // [NEW] 核心改动：保存上下文 + 显示打分按钮
        // ==========================================
        
        // 1. 保存案发现场：当时选的语气(Input) 和 AI 说的话(Output)
        currentAuditSession = {
            context: `Tone: ${selectedTone}`, // 这里简化了，理想情况是后端返回完整的 Prompt，但这样也够用
            response: data.insight
        };

        // 2. 只有成功获取数据后，才允许打分
        if(rlhfZone) {
            rlhfZone.style.display = 'block';
            // 加一个小动画效果（可选）
            rlhfZone.style.opacity = '0';
            setTimeout(() => rlhfZone.style.opacity = '1', 500); 
        }

    } catch (err) {
        console.error(err);
        btn.innerText = "LINK FAILED";
        statusDot.style.backgroundColor = "var(--neon-red)";
        contentArea.style.display = 'flex';
        document.getElementById('hud-insight-text').innerText = "System Failure: " + err.message;
        document.getElementById('hud-score-val').innerText = "ERR";
        document.getElementById('hud-score-val').style.color = "var(--neon-red)";
    } finally {
        btn.disabled = false;
    }
}

// [NEW] 处理RLHF打分提交
async function submitRLHF(score) {
    // 防御性编程：如果没有上下文，说明还没扫描过
    if (!currentAuditSession) return;

    const rlhfZone = document.getElementById('rlhf-zone');
    
    try {
        // UI 反馈：用户点了之后，立刻禁用按钮，防止重复提交
        rlhfZone.style.opacity = '0.5';
        rlhfZone.style.pointerEvents = 'none';

        const payload = {
            context: currentAuditSession.context,
            response: currentAuditSession.response,
            score: score
            // correction: "..." // 如果你以后做了文本框，可以在这里传修正意见
        };

        const res = await fetch('/api/alignment', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            // 成功后：直接隐藏打分区域，或者显示一个 "Saved"
            rlhfZone.innerHTML = '<span style="color: var(--neon-green); font-size: 0.8rem;">[ DATASET UPDATED ]</span>';
            rlhfZone.style.opacity = '1';
        } else {
            console.error("Feedback failed");
        }
        
    } catch (e) {
        console.error(e);
    }
}