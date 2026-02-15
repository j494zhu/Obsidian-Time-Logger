/* viz_logic.js - 融合版 */

// ─── 1. 核心配色与配置 ───
const PALETTE = {
  coding:   { solid: '#a78bda', light: 'rgba(167, 139, 218, 0.15)' },
  math:     { solid: '#d4727a', light: 'rgba(212, 114, 122, 0.15)' },
  break:    { solid: '#c9a94e', light: 'rgba(201, 169,  78, 0.15)' },
  deepwork: { solid: '#56b6a2', light: 'rgba( 86, 182, 162, 0.15)' },
  other:    { solid: '#6fa8dc', light: 'rgba(111, 168, 220, 0.15)' },
};

// 辅助函数：时间格式化
function formatDuration(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

// ─── 2. 图表类 (保留 Opus 的优雅设计) ───
class VizChart {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.chart = null;
    this.currentType = 'doughnut';
    this.data = []; // 初始为空，等待 API 填充
  }

  // 构建渐变色 (用于 Bar Chart)
  _buildBarGradients() {
    return this.data.map((cat) => {
      // 如果后端传回来的 key 在我们的调色板里找不到，就用 other
      const key = PALETTE[cat.key] ? cat.key : 'other'; 
      const p = PALETTE[key];
      const grad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      grad.addColorStop(0, p.solid);
      grad.addColorStop(1, p.light);
      return grad;
    });
  }

  // 获取对应颜色
  _getColors() {
      return this.data.map(cat => {
          const key = PALETTE[cat.key] ? cat.key : 'other';
          return PALETTE[key].solid;
      });
  }

  // 基础数据集配置
  _baseDataset() {
    return {
      data: this.data.map((c) => c.minutes),
      borderWidth: 0,
      hoverOffset: this.currentType === 'doughnut' ? 6 : 0,
    };
  }

  // 甜甜圈图配置
  _doughnutConfig() {
    return {
      type: 'doughnut',
      data: {
        labels: this.data.map((c) => c.label),
        datasets: [{
          ...this._baseDataset(),
          backgroundColor: this._getColors(),
          borderRadius: 4,
          spacing: 3,
          cutout: '62%',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: this._tooltipConfig(),
        },
        animation: { animateRotate: true, duration: 700, easing: 'easeOutQuart' },
      },
    };
  }

  // 柱状图配置
  _barConfig() {
    return {
      type: 'bar',
      data: {
        labels: this.data.map((c) => c.label),
        datasets: [{
          ...this._baseDataset(),
          backgroundColor: this._buildBarGradients(),
          borderRadius: { topLeft: 6, topRight: 6 },
          barPercentage: 0.55,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { display: false }, ticks: { color: '#6e7681', font: { family: "'Inter'", size: 10 } } },
          y: { beginAtZero: true, grid: { color: 'rgba(139, 148, 158, 0.06)' }, ticks: { display: false } }, // 隐藏 Y 轴数值更极简
        },
        plugins: { legend: { display: false }, tooltip: this._tooltipConfig() },
      },
    };
  }

  // Tooltip 配置
  _tooltipConfig() {
    return {
      enabled: true,
      backgroundColor: 'rgba(22, 27, 34, 0.95)',
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

  render(type = 'doughnut') {
    this.currentType = type;
    if (this.chart) this.chart.destroy();
    const config = type === 'bar' ? this._barConfig() : this._doughnutConfig();
    this.chart = new Chart(this.ctx, config);
  }

  updateData(newData) {
    this.data = newData;
    this.render(this.currentType);
  }
}

// ─── 3. 业务逻辑 (对接后端) ───

// 生成图例 DOM
function buildLegend(container, categories) {
  container.innerHTML = '';
  const total = categories.reduce((sum, c) => sum + c.minutes, 0);

  categories.forEach((cat) => {
    const li = document.createElement('li');
    li.className = 'viz-legend__item';
    const pct = total > 0 ? ((cat.minutes / total) * 100).toFixed(0) : 0;
    
    // 安全获取颜色
    const key = PALETTE[cat.key] ? cat.key : 'other';
    const color = PALETTE[key].solid;

    li.innerHTML = `
      <span class="viz-legend__swatch" style="background:${color}"></span>
      ${cat.label}
      <span class="viz-legend__value">${pct}%</span>
    `;
    container.appendChild(li);
  });
}

// 加载动画控制
function showLoader(el, show = true) {
  if(show) {
      el.classList.add('is-visible');
      el.setAttribute('aria-hidden', 'false');
  } else {
      el.classList.remove('is-visible');
      el.setAttribute('aria-hidden', 'true');
  }
}

// ★★★ 核心：从后端获取数据 ★★★
async function fetchData() {
    try {
        // 这里假设你的后端 /api/visualize 返回的数据结构是:
        // { 
        //    "labels": ["Coding", "Math", ...], 
        //    "data": [120, 60, ...],
        //    "total_minutes": 180 
        // }
        // 如果结构不一样，需要在这里调整
        
        const response = await fetch('/api/visualize', {
            method: 'POST', // 保持你原有的 method
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error("API Error");
        const backendData = await response.json();

        // 将后端数据转换为新 UI 需要的格式 [{key, label, minutes}, ...]
        // 注意：这里需要你根据实际后端返回的 label 来映射 key (coding, math等)
        // 为了简单，我们这里做一个简单的自动映射
        
        const processedData = backendData.labels.map((label, index) => {
            let key = 'other';
            const lowerLabel = label.toLowerCase();
            if (lowerLabel.includes('code') || lowerLabel.includes('py')) key = 'coding';
            else if (lowerLabel.includes('math') || lowerLabel.includes('alg')) key = 'math';
            else if (lowerLabel.includes('break') || lowerLabel.includes('sleep')) key = 'break';
            else if (lowerLabel.includes('deep') || lowerLabel.includes('focus')) key = 'deepwork';
            
            return {
                key: key,
                label: label,
                minutes: backendData.data[index]
            };
        });

        return {
            categories: processedData,
            total: backendData.total_minutes || processedData.reduce((a, b) => a + b.minutes, 0)
        };

    } catch (err) {
        console.error("Data Fetch Failed:", err);
        return null;
    }
}

// ─── 4. 初始化 ───
document.addEventListener('DOMContentLoaded', async () => {
  const canvas   = document.getElementById('vizChart');
  const legend   = document.querySelector('.viz-legend');
  const totalEl  = document.getElementById('vizTotal');
  const loader   = document.querySelector('.viz-loader');
  const toggles  = document.querySelectorAll('.viz-toggle__btn');

  // 初始化图表实例
  const chart = new VizChart(canvas);
  
  // 显示加载动画
  showLoader(loader, true);

  // 获取真实数据
  const result = await fetchData();
  
  if (result) {
      // 渲染数据
      chart.updateData(result.categories);
      buildLegend(legend, result.categories);
      totalEl.textContent = formatDuration(result.total);
  } else {
      totalEl.textContent = "Error";
  }

  // 关闭加载动画
  showLoader(loader, false);

  // 绑定切换按钮事件
  toggles.forEach((btn) => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.chart;
      if (chart.currentType === type) return;

      // 更新按钮状态
      toggles.forEach((b) => {
        b.classList.remove('is-active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-selected', 'true');

      // 切换图表类型
      chart.render(type);
    });
  });
});