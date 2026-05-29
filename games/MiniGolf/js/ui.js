// ============================================
// Mini Golf - UI System
// ============================================

import { COURSES, COURSE_NAMES } from './config.js';

// Start overlay
export function createStartOverlay(onStart) {
    // Create overlay background
    var overlay = document.createElement('div');
    overlay.id = 'startOverlay';
    overlay.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;background:rgba(10,10,26,0.92);z-index:100;display:flex;justify-content:center;align-items:center;padding:20px;overflow-y:auto;';

    // Course selection state
    var courseMode = 'all';

    // Build content
    var content = document.createElement('div');
    content.style.cssText = 'text-align:center;max-width:500px;color:#fff;font-family:Segoe UI,PingFang SC,Microsoft YaHei,sans-serif;';

    content.innerHTML =
        '<div style="font-size:2.5em;margin-bottom:8px;">⛳</div>' +
        '<h1 style="font-size:2.4em;margin:0 0 6px;color:#4ADE80;letter-spacing:2px;">迷你高尔夫</h1>' +
        '<p style="color:#94a3b8;margin:0 0 20px;font-size:1.05em;">Mini Golf · 18洞挑战</p>' +
        '<div style="margin-bottom:18px;">' +
            '<label style="color:#ccc;font-size:0.95em;display:block;margin-bottom:6px;">选择球场</label>' +
            '<div id="courseSelect" style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">' +
                '<button class="course-btn active" data-course="all" style="background:rgba(74,222,128,0.2);border:1px solid #4ADE80;color:#4ADE80;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:0.9em;">全部18洞</button>' +
                '<button class="course-btn" data-course="front" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:#aaa;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:0.9em;">前9洞</button>' +
                '<button class="course-btn" data-course="back" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:#aaa;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:0.9em;">后9洞</button>' +
            '</div>' +
        '</div>';

    // Create start button separately for reliable click handling
    var startBtn = document.createElement('button');
    startBtn.textContent = '开始游戏';
    startBtn.style.cssText = 'background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;border:none;padding:14px 48px;font-size:1.2em;border-radius:12px;cursor:pointer;box-shadow:0 4px 15px rgba(34,197,94,0.4);display:inline-block;margin:10px 0;';

    content.appendChild(startBtn);

    // Instructions
    var instructions = document.createElement('div');
    instructions.style.cssText = 'margin-top:20px;text-align:left;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:14px 18px;';
    instructions.innerHTML =
        '<div style="color:#4ADE80;font-weight:bold;margin-bottom:8px;">操作说明</div>' +
        '<div style="color:#aaa;font-size:0.9em;line-height:1.8;">' +
            '· 点击球并拖动瞄准（反向射击）<br>' +
            '· 拖动越远，击球力度越大<br>' +
            '· 松开鼠标/手指击球<br>' +
            '· 目标：用最少杆数将球打入洞中' +
        '</div>' +
        '<div style="color:#4ADE80;font-weight:bold;margin:10px 0 6px;">障碍物</div>' +
        '<div style="color:#aaa;font-size:0.9em;line-height:1.8;">' +
            '<span style="color:#FF4444;">●</span> 弹力器 — 球碰到会弹开<br>' +
            '<span style="color:#885533;">✦</span> 风车 — 旋转的障碍物<br>' +
            '<span style="color:#E8D5A3;">■</span> 沙坑 — 减速区域<br>' +
            '<span style="color:#4488CC;">■</span> 水障碍 — 球会回到原位' +
        '</div>';
    content.appendChild(instructions);

    // High score
    var highScore = document.createElement('div');
    highScore.style.cssText = 'margin-top:14px;color:#FFD700;font-size:0.9em;';
    var saved = localStorage.getItem('miniGolfHighScore');
    if (saved) {
        highScore.textContent = '最佳成绩: ' + saved + ' 杆';
    }
    content.appendChild(highScore);

    overlay.appendChild(content);
    document.body.appendChild(overlay);

    // Course selection handlers
    var courseBtns = content.querySelectorAll('.course-btn');
    for (var i = 0; i < courseBtns.length; i++) {
        (function(btn) {
            btn.onclick = function() {
                for (var j = 0; j < courseBtns.length; j++) {
                    courseBtns[j].style.background = 'rgba(255,255,255,0.08)';
                    courseBtns[j].style.borderColor = 'rgba(255,255,255,0.15)';
                    courseBtns[j].style.color = '#aaa';
                    courseBtns[j].classList.remove('active');
                }
                btn.style.background = 'rgba(74,222,128,0.2)';
                btn.style.borderColor = '#4ADE80';
                btn.style.color = '#4ADE80';
                btn.classList.add('active');
                courseMode = btn.getAttribute('data-course');
            };
        })(courseBtns[i]);
    }

    // Start button click handler
    startBtn.onclick = function() {
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
        overlay.style.transition = 'opacity 0.4s';
        startBtn.style.pointerEvents = 'none';
        setTimeout(function() {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }, 400);
        var s = (courseMode === 'back') ? 9 : 0;
        var en = (courseMode === 'front') ? 9 : 18;
        onStart(s, en);
    };

    return overlay;
}

// Hole transition
export function showHoleTransition(holeNum, par, courseName, callback) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;background:rgba(10,10,26,0.92);z-index:100;display:flex;justify-content:center;align-items:center;opacity:0;transition:opacity 0.3s;';

    var content = document.createElement('div');
    content.style.cssText = 'text-align:center;color:#fff;font-family:Segoe UI,PingFang SC,Microsoft YaHei,sans-serif;background:rgba(30,30,50,0.95);border:1px solid rgba(74,222,128,0.2);border-radius:16px;padding:28px 32px;box-shadow:0 8px 40px rgba(0,0,0,0.5);';
    content.innerHTML =
        '<div style="color:#4ADE80;font-size:1.1em;margin-bottom:4px;">第 ' + (holeNum + 1) + ' 洞</div>' +
        '<div style="font-size:2em;color:#fff;font-weight:bold;margin-bottom:6px;">' + courseName + '</div>' +
        '<div style="color:#ccc;font-size:1.2em;">标准杆: ' + par + '</div>';

    overlay.appendChild(content);
    document.body.appendChild(overlay);

    // Fade in
    setTimeout(function() { overlay.style.opacity = '1'; }, 10);

    // Fade out after delay
    setTimeout(function() {
        overlay.style.opacity = '0';
        setTimeout(function() {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            callback();
        }, 300);
    }, 1200);
}

// Game complete overlay
export function showGameComplete(totalStrokes, totalPar, holeScores, startHole, onReplay) {
    var diff = totalStrokes - totalPar;
    var diffText = diff === 0 ? '平标准杆' : (diff > 0 ? '+' + diff : '' + diff);
    var rating = diff <= -6 ? '神级表现' : diff <= -3 ? '出色发挥' : diff <= 0 ? '不错的成绩' : diff <= 3 ? '还需努力' : '继续加油';
    var stars = diff <= -6 ? '⭐⭐⭐' : diff <= -3 ? '⭐⭐' : diff <= 0 ? '⭐' : '';

    // Save high score
    var prev = localStorage.getItem('miniGolfHighScore');
    if (!prev || totalStrokes < parseInt(prev)) {
        localStorage.setItem('miniGolfHighScore', totalStrokes);
    }

    var scoreRows = '';
    for (var i = startHole; i < startHole + holeScores.length; i++) {
        var s = holeScores[i - startHole];
        var c = COURSES[i];
        var diff2 = s - c.par;
        var color = diff2 < 0 ? '#4ADE80' : diff2 === 0 ? '#fff' : diff2 <= 1 ? '#FFA500' : '#FF4444';
        var label = diff2 === -2 ? '老鹰' : diff2 === -1 ? '小鸟' : diff2 === 0 ? '标准杆' : diff2 === 1 ? '柏忌' : diff2 === 2 ? '双柏忌' : '+' + diff2;
        scoreRows += '<tr>' +
            '<td style="padding:4px 10px;color:#aaa;">' + (i + 1) + '</td>' +
            '<td style="padding:4px 10px;color:#ccc;">' + COURSE_NAMES[i] + '</td>' +
            '<td style="padding:4px 10px;color:#aaa;">' + c.par + '</td>' +
            '<td style="padding:4px 10px;font-weight:bold;color:' + color + ';">' + s + '</td>' +
            '<td style="padding:4px 10px;color:' + color + ';">' + label + '</td>' +
        '</tr>';
    }

    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;background:rgba(10,10,26,0.92);z-index:100;display:flex;justify-content:center;align-items:center;padding:20px;overflow-y:auto;';

    var content = document.createElement('div');
    content.style.cssText = 'text-align:center;max-width:550px;max-height:90vh;overflow-y:auto;color:#fff;font-family:Segoe UI,PingFang SC,Microsoft YaHei,sans-serif;background:rgba(30,30,50,0.95);border:1px solid rgba(74,222,128,0.2);border-radius:16px;padding:28px 32px;box-shadow:0 8px 40px rgba(0,0,0,0.5);';
    content.innerHTML =
        '<div style="font-size:2.5em;margin-bottom:6px;">🏆</div>' +
        '<h2 style="color:#FFD700;margin:0 0 6px;font-size:1.8em;">比赛结束</h2>' +
        '<div style="font-size:1.3em;color:#fff;margin-bottom:2px;">' + stars + ' ' + rating + ' ' + stars + '</div>' +
        '<div style="font-size:2.2em;color:#4ADE80;font-weight:bold;margin:8px 0;">' + totalStrokes + ' 杆</div>' +
        '<div style="color:#ccc;font-size:1.1em;margin-bottom:16px;">标准杆 ' + totalPar + ' · ' + diffText + '</div>' +
        '<table style="width:100%;border-collapse:collapse;margin-bottom:18px;font-size:0.88em;">' +
            '<tr style="border-bottom:1px solid rgba(255,255,255,0.15);">' +
                '<th style="padding:6px 10px;color:#4ADE80;">洞</th>' +
                '<th style="padding:6px 10px;color:#4ADE80;">名称</th>' +
                '<th style="padding:6px 10px;color:#4ADE80;">标准</th>' +
                '<th style="padding:6px 10px;color:#4ADE80;">杆数</th>' +
                '<th style="padding:6px 10px;color:#4ADE80;">成绩</th>' +
            '</tr>' +
            scoreRows +
        '</table>';

    // Create replay button separately
    var replayBtn = document.createElement('button');
    replayBtn.textContent = '再来一局';
    replayBtn.style.cssText = 'background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;border:none;padding:12px 40px;font-size:1.1em;border-radius:10px;cursor:pointer;box-shadow:0 4px 12px rgba(34,197,94,0.4);display:inline-block;';
    content.appendChild(replayBtn);

    overlay.appendChild(content);
    document.body.appendChild(overlay);

    replayBtn.onclick = function() {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        if (onReplay) onReplay();
    };
}
