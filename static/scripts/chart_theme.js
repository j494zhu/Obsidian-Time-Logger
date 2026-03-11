/* static/scripts/chart_theme.js */
/* THEME: OBSIDIAN PREMIUM PALETTE */

// 1. 定义 10 种高级颜色 (背景色带透明度，边框不带)
const COLOR_POOL = [
    // 1. Cyber Gold (黑金)
    { bg: 'rgba(255, 215, 0, 0.6)', border: 'rgba(255, 215, 0, 1)' },
    // 2. Matrix Green (矩阵绿)
    { bg: 'rgba(0, 255, 65, 0.5)', border: 'rgba(0, 255, 65, 1)' },
    // 3. Electric Blue (电光蓝)
    { bg: 'rgba(0, 123, 255, 0.6)', border: 'rgba(0, 123, 255, 1)' },
    // 4. Hot Pink (赛博粉)
    { bg: 'rgba(255, 0, 127, 0.5)', border: 'rgba(255, 0, 127, 1)' },
    // 5. Deep Purple (深紫)
    { bg: 'rgba(138, 43, 226, 0.6)', border: 'rgba(138, 43, 226, 1)' },
    // 6. Teal (青色)
    { bg: 'rgba(0, 206, 209, 0.5)', border: 'rgba(0, 206, 209, 1)' },
    // 7. Sunset Orange (日落橙)
    { bg: 'rgba(255, 69, 0, 0.6)', border: 'rgba(255, 69, 0, 1)' },
    // 8. Slate White (灰白 - 用于杂项)
    { bg: 'rgba(200, 200, 200, 0.4)', border: 'rgba(200, 200, 200, 0.9)' },
    // 9. Lime (酸橙)
    { bg: 'rgba(127, 255, 0, 0.5)', border: 'rgba(127, 255, 0, 1)' },
    // 10. Crimson (深红 - 用于警告/Break)
    { bg: 'rgba(220, 20, 60, 0.6)', border: 'rgba(220, 20, 60, 1)' }
];

/**
 * 随机获取指定数量的配色方案 (洗牌算法)
 * @param {number} count - 需要多少种颜色
 * @returns {object} { bgColors: [], borderColors: [] }
 */
function getRandomPalette(count) {
    // 1. 克隆颜色池，防止污染原数组
    let pool = [...COLOR_POOL];
    
    // 2. Fisher-Yates 洗牌算法 (这是最随机的)
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    
    // 3. 截取前 count 个颜色
    const selected = pool.slice(0, count);
    
    // 4. 如果需要的颜色超过 10 个 (极少见)，就循环使用
    while (selected.length < count) {
        selected.push(pool[selected.length % pool.length]);
    }
    
    // 5. 拆分成 Chart.js 需要的两个数组
    return {
        bgColors: selected.map(c => c.bg),
        borderColors: selected.map(c => c.border)
    };
}