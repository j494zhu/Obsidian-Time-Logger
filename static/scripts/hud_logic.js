/* * PROJECT: NEURAL AUDIT LOGIC 
 * Handles interaction with the /api/ai/audit endpoint
 */

async function runNeuralAudit() {
    const btn = document.getElementById('audit-btn');
    const contentArea = document.getElementById('hud-content');
    const statusDot = document.getElementById('hud-status-dot');
    const statusText = document.getElementById('hud-status-text');
    
    // 1. 切换到加载状态 (Industrial Loading State)
    btn.disabled = true;
    btn.innerText = "UPLINKING TO SATELLITE..."; // 稍微中二一点
    statusDot.style.backgroundColor = "var(--neon-yellow)";
    statusDot.style.boxShadow = "0 0 10px var(--neon-yellow)";
    statusText.innerText = "Processing";

    try {
        // 2. 请求后端 API
        const response = await fetch('/api/ai/audit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) throw new Error("Connection Refused");
        
        const data = await response.json();
        
        // 3. 渲染数据
        // 分数
        const scoreEl = document.getElementById('hud-score-val');
        scoreEl.innerText = data.score;
        
        // 评语
        document.getElementById('hud-insight-text').innerText = data.insight;
        
        // 警告
        const warnBox = document.getElementById('hud-warning-box');
        if (data.warning && data.warning !== "None") {
            warnBox.style.display = 'flex';
            document.getElementById('hud-warn-text').innerText = data.warning;
        } else {
            warnBox.style.display = 'none';
        }

        // 颜色逻辑 (根据 status: green/yellow/red)
        const colorMap = {
            'green': 'var(--neon-green)',
            'yellow': 'var(--neon-yellow)',
            'red': 'var(--neon-red)'
        };
        const activeColor = colorMap[data.status] || '#fff';

        scoreEl.style.color = activeColor;
        statusDot.style.backgroundColor = activeColor;
        statusDot.style.boxShadow = `0 0 15px ${activeColor}`; // 增强光晕
        statusText.innerText = "Online";

        // 4. 展开面板
        contentArea.style.display = 'flex';
        btn.innerText = "REFRESH DATA";

    } catch (err) {
        console.error(err);
        btn.innerText = "LINK FAILED";
        statusDot.style.backgroundColor = "var(--neon-red)";
        statusText.innerText = "Error";
        // 即使出错也可以显示错误信息
        contentArea.style.display = 'flex';
        document.getElementById('hud-insight-text').innerText = "System Failure: " + err.message;
        document.getElementById('hud-score-val').innerText = "ERR";
    } finally {
        btn.disabled = false;
    }
}