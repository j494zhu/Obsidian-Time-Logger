document.addEventListener("DOMContentLoaded", function() {
    const canvas = document.getElementById('rain-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const container = document.querySelector('.glass-container');

    let width, height;
    let drops = [];

    function resize() {
        width = container.offsetWidth;
        height = container.offsetHeight;
        canvas.width = width;
        canvas.height = height;
        initRain(); // 调整窗口大小时重置雨水
    }

    // 创建单个水滴对象
    function createDrop(initial = false) {
        return {
            x: Math.random() * width,
            // 初始生成时分布在满屏，后续生成在顶部上方
            y: initial ? Math.random() * height : -Math.random() * 50, 
            // 半径范围扩大，模拟大小不一的水珠
            r: Math.random() * 10 + 0.5, 
            // 基础速度
            baseSpeed: Math.random() * 0.3 + 0.1,
            // 当前速度
            speed: 0, 
            // 透明度基础值
            opacityBase: Math.random() * 0.4 + 0.2
        };
    }

    // 初始化雨水数组
    function initRain() {
        drops = [];
        // 增加水滴数量，制造淅淅沥沥的感觉
        for (let i = 0; i < 80; i++) { 
            let drop = createDrop(true);
            drop.speed = drop.baseSpeed;
            drops.push(drop);
        }
    }

    // 核心：绘制逼真的水滴
    function drawRealisticDrop(ctx, drop) {
        // 1. 绘制微弱的阴影/折射边框（深色细圈）
        ctx.beginPath();
        ctx.arc(drop.x, drop.y, drop.r, 0, Math.PI * 2);
        // 使用极淡的黑色描边模拟边缘折射
        ctx.strokeStyle = `rgba(0, 0, 0, ${drop.opacityBase * 0.3})`; 
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // 2. 绘制高光（底部偏右的白色弧线）
        // 这是让它看起来像水珠的关键！
        ctx.beginPath();
        // 只画圆的下半部分弧线 (约从 0.1 PI 到 0.9 PI)
        ctx.arc(drop.x, drop.y, drop.r * 0.85, 0.1 * Math.PI, 0.9 * Math.PI);
        // 高光更亮
        ctx.strokeStyle = `rgba(255, 255, 255, ${drop.opacityBase * 1.8})`; 
        ctx.lineWidth = 1.2; // 高光稍微粗一点
        ctx.lineCap = 'round'; // 线条端点圆润
        ctx.stroke();
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        
        drops.forEach(drop => {
            // 使用新的绘制函数
            drawRealisticDrop(ctx, drop);

            // 物理更新
            // 加入极微小的重力加速度，让下落不那么死板
            drop.speed += 0.002; 
            drop.y += drop.speed;
            
            // 轻微的左右晃动，模拟受风或表面不平
            drop.x += Math.sin(drop.y / 25) * 0.1;

            // 越界重置
            if (drop.y > height + 10) {
                Object.assign(drop, createDrop(false)); // 重置此水滴的状态
            }
        });

        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resize);
    // 初始化并开始动画
    resize();
    animate();
});