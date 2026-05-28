// ============================================
// Mini Golf - UI System
// ============================================

import { COURSES, COURSE_NAMES } from './config.js';

// Start overlay
export function createStartOverlay(onStart) {
    const overlay = document.createElement('div');
    overlay.id = 'startOverlay';
    overlay.className = 'overlay';
    overlay.innerHTML = `
        <div class="overlay-content" style="text-align:center; max-width:500px;">
            <div style="font-size:2.5em; margin-bottom:8px;">⛳</div>
            <h1 style="font-size:2.4em; margin:0 0 6px; color:#4ADE80; letter-spacing:2px;">迷你高尔夫</h1>
            <p style="color:#94a3b8; margin:0 0 20px; font-size:1.05em;">Mini Golf · 18洞挑战</p>

            <div style="margin-bottom:18px;">
                <label style="color:#ccc; font-size:0.95em; display:block; margin-bottom:6px;">选择球场</label>
                <div id="courseSelect" style="display:flex; gap:8px; justify-content:center; flex-wrap:wrap;">
                    <button class="course-btn active" data-course="all">全部18洞</button>
                    <button class="course-btn" data-course="front">前9洞</button>
                    <button class="course-btn" data-course="back">后9洞</button>
                </div>
            </div>

            <button id="startBtn" style="
                background: linear-gradient(135deg, #22c55e, #16a34a);
                color: #fff; border: none; padding: 14px 48px;
                font-size: 1.2em; border-radius: 12px; cursor: pointer;
                box-shadow: 0 4px 15px rgba(34,197,94,0.4);
                transition: transform 0.15s, box-shadow 0.15s;
            ">开始游戏</button>

            <div style="margin-top:20px; text-align:left; background:rgba(0,0,0,0.3);
                border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:14px 18px;">
                <div style="color:#4ADE80; font-weight:bold; margin-bottom:8px;">操作说明</div>
                <div style="color:#aaa; font-size:0.9em; line-height:1.8;">
                    · 点击球并拖动瞄准（反向射击）<br>
                    · 拖动越远，击球力度越大<br>
                    · 松开鼠标/手指击球<br>
                    · 目标：用最少杆数将球打入洞中
                </div>
                <div style="color:#4ADE80; font-weight:bold; margin:10px 0 6px;">障碍物</div>
                <div style="color:#aaa; font-size:0.9em; line-height:1.8;">
                    <span style="color:#FF4444;">●</span> 弹力器 — 球碰到会弹开<br>
                    <span style="color:#885533;">✦</span> 风车 — 旋转的障碍物<br>
                    <span style="color:#E8D5A3;">■</span> 沙坑 — 减速区域<br>
                    <span style="color:#4488CC;">■</span> 水障碍 — 球会回到原位
                </div>
            </div>

            <div id="highScoreDisplay" style="margin-top:14px; color:#FFD700; font-size:0.9em;"></div>
        </div>
    `;
    document.body.appendChild(overlay);

    // Course selection
    let courseMode = 'all';
    overlay.querySelectorAll('.course-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            overlay.querySelectorAll('.course-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            courseMode = btn.dataset.course;
        });
    });

    // High score
    const saved = localStorage.getItem('miniGolfHighScore');
    if (saved) {
        overlay.querySelector('#highScoreDisplay').textContent = `最佳成绩: ${saved} 杆`;
    }

    // Start
    overlay.querySelector('#startBtn').addEventListener('click', () => {
        overlay.classList.add('fade-out');
        setTimeout(() => { overlay.remove(); }, 400);
        const startHole = courseMode === 'back' ? 9 : 0;
        const endHole = courseMode === 'front' ? 9 : 18;
        onStart(startHole, endHole);
    });

    return overlay;
}

// Hole transition
export function showHoleTransition(holeNum, par, courseName, callback) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay fade-fast';
    overlay.innerHTML = `
        <div class="overlay-content" style="text-align:center;">
            <div style="color:#4ADE80; font-size:1.1em; margin-bottom:4px;">第 ${holeNum + 1} 洞</div>
            <div style="font-size:2em; color:#fff; font-weight:bold; margin-bottom:6px;">${courseName}</div>
            <div style="color:#ccc; font-size:1.2em;">标准杆: ${par}</div>
        </div>
    `;
    document.body.appendChild(overlay);
    setTimeout(() => {
        overlay.classList.add('fade-out');
        setTimeout(() => { overlay.remove(); callback(); }, 400);
    }, 1200);
}

// Game complete overlay
export function showGameComplete(totalStrokes, totalPar, holeScores, startHole) {
    const diff = totalStrokes - totalPar;
    const diffText = diff === 0 ? '平标准杆' : diff > 0 ? `+${diff}` : `${diff}`;
    const rating = diff <= -6 ? '神级表现' : diff <= -3 ? '出色发挥' : diff <= 0 ? '不错的成绩' : diff <= 3 ? '还需努力' : '继续加油';
    const stars = diff <= -6 ? '⭐⭐⭐' : diff <= -3 ? '⭐⭐' : diff <= 0 ? '⭐' : '';

    // Save high score
    const prev = localStorage.getItem('miniGolfHighScore');
    if (!prev || totalStrokes < parseInt(prev)) {
        localStorage.setItem('miniGolfHighScore', totalStrokes);
    }

    let scoreRows = '';
    for (let i = startHole; i < startHole + holeScores.length; i++) {
        const s = holeScores[i - startHole];
        const c = COURSES[i];
        const diff2 = s - c.par;
        const color = diff2 < 0 ? '#4ADE80' : diff2 === 0 ? '#fff' : diff2 <= 1 ? '#FFA500' : '#FF4444';
        const label = diff2 === -2 ? '老鹰' : diff2 === -1 ? '小鸟' : diff2 === 0 ? '标准杆' : diff2 === 1 ? '柏忌' : diff2 === 2 ? '双柏忌' : `+${diff2}`;
        scoreRows += `<tr>
            <td style="padding:4px 10px; color:#aaa;">${i + 1}</td>
            <td style="padding:4px 10px; color:#ccc;">${COURSE_NAMES[i]}</td>
            <td style="padding:4px 10px; color:#aaa;">${c.par}</td>
            <td style="padding:4px 10px; font-weight:bold; color:${color};">${s}</td>
            <td style="padding:4px 10px; color:${color};">${label}</td>
        </tr>`;
    }

    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.innerHTML = `
        <div class="overlay-content" style="text-align:center; max-width:550px; max-height:90vh; overflow-y:auto;">
            <div style="font-size:2.5em; margin-bottom:6px;">🏆</div>
            <h2 style="color:#FFD700; margin:0 0 6px; font-size:1.8em;">比赛结束</h2>
            <div style="font-size:1.3em; color:#fff; margin-bottom:2px;">${stars} ${rating} ${stars}</div>
            <div style="font-size:2.2em; color:#4ADE80; font-weight:bold; margin:8px 0;">${totalStrokes} 杆</div>
            <div style="color:#ccc; font-size:1.1em; margin-bottom:16px;">标准杆 ${totalPar} · ${diffText}</div>

            <table style="width:100%; border-collapse:collapse; margin-bottom:18px; font-size:0.88em;">
                <tr style="border-bottom:1px solid rgba(255,255,255,0.15);">
                    <th style="padding:6px 10px; color:#4ADE80;">洞</th>
                    <th style="padding:6px 10px; color:#4ADE80;">名称</th>
                    <th style="padding:6px 10px; color:#4ADE80;">标准</th>
                    <th style="padding:6px 10px; color:#4ADE80;">杆数</th>
                    <th style="padding:6px 10px; color:#4ADE80;">成绩</th>
                </tr>
                ${scoreRows}
            </table>

            <button id="replayBtn" style="
                background: linear-gradient(135deg, #22c55e, #16a34a);
                color: #fff; border: none; padding: 12px 40px;
                font-size: 1.1em; border-radius: 10px; cursor: pointer;
                box-shadow: 0 4px 12px rgba(34,197,94,0.4);
                margin-right: 10px;
            ">再来一局</button>
        </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#replayBtn').addEventListener('click', () => {
        overlay.remove();
        window.location.reload();
    });
}
