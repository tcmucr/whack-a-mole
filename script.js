(function () {
    'use strict';

    const scoreDisplay = document.getElementById('score');
    const timerDisplay = document.getElementById('timer');
    const startBtn = document.getElementById('start-btn');
    const holes = document.querySelectorAll('.hole');
    const countdownEl = document.getElementById('countdown');
    const comboEl = document.getElementById('combo');
    const comboValue = document.getElementById('combo-value');
    const highScoreEl = document.getElementById('high-score');
    const powerupIndicator = document.getElementById('powerup-indicator');

    let score = 0;
    let timeLeft = 30;
    let gameInterval = null;
    let timerInterval = null;
    let lastHole = null;
    let isGameActive = false;
    let combo = 0;
    let moleSpeed = 800;
    let moleVisibleTime = 1200;

    // Power-up state
    const POWERUPS = {
        freeze: { icon: '⏸️', label: 'FREEZE', duration: 5000 },
        double: { icon: '⭐', label: 'x2 PTS', duration: 5000 },
        slow:   { icon: '🐌', label: 'SLOW', duration: 5000 }
    };
    let activePowerups = {}; // { type: { timeout, badgeInterval } }
    let powerupSpawnTimer = null;
    let isTimerFrozen = false;

    // Load high score
    let highScore = parseInt(localStorage.getItem('whackamole-highscore')) || 0;
    if (highScore > 0) {
        highScoreEl.textContent = `🏆 Best: ${highScore}`;
    }

    function getRandomHole() {
        let hole;
        do {
            const index = Math.floor(Math.random() * holes.length);
            hole = holes[index];
        } while (hole === lastHole);

        lastHole = hole;
        return hole;
    }

    function showMole() {
        if (!isGameActive) return;

        const hole = getRandomHole();
        hole.classList.add('active');

        const visibleTime = Math.random() * (moleVisibleTime * 0.5) + moleVisibleTime * 0.5;

        setTimeout(() => {
            if (hole.classList.contains('active')) {
                hole.classList.remove('active');
                // Reset combo on miss (mole escaped)
                if (isGameActive) {
                    combo = 0;
                    comboValue.textContent = '—';
                    comboEl.classList.remove('active');
                }
            }
        }, visibleTime);
    }

    function showScoreFloat(hole, points) {
        const float = document.createElement('div');
        float.className = 'score-float';
        float.textContent = typeof points === 'string' ? points : `+${points}`;
        hole.appendChild(float);
        setTimeout(() => float.remove(), 800);
    }

    function vibrate(ms) {
        if (navigator.vibrate) {
            navigator.vibrate(ms);
        }
    }

    function screenShake(intensity) {
        const board = document.getElementById('board');
        const cls = intensity >= 3 ? 'shake-hard' : 'shake';
        board.classList.remove('shake', 'shake-hard');
        void board.offsetWidth;
        board.classList.add(cls);
        setTimeout(() => board.classList.remove(cls), intensity >= 3 ? 400 : 300);
    }

    function spawnParticles(hole, count) {
        const colors = ['#ffd700', '#ff6b6b', '#ff9f43', '#fff'];
        const rect = hole.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
            const distance = 30 + Math.random() * 40;
            particle.style.setProperty('--px', `${Math.cos(angle) * distance}px`);
            particle.style.setProperty('--py', `${Math.sin(angle) * distance}px`);
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];
            particle.style.left = `${cx}px`;
            particle.style.top = `${cy}px`;
            particle.style.position = 'fixed';
            document.body.appendChild(particle);
            setTimeout(() => particle.remove(), 600);
        }
    }

    // === Power-up System ===

    function getRandomPowerupType() {
        const types = Object.keys(POWERUPS);
        return types[Math.floor(Math.random() * types.length)];
    }

    function spawnPowerup() {
        if (!isGameActive) return;

        // Find a hole that isn't active or already has a power-up
        const available = Array.from(holes).filter(
            h => !h.classList.contains('active') && !h.classList.contains('powerup')
        );
        if (available.length === 0) return;

        const hole = available[Math.floor(Math.random() * available.length)];
        const type = getRandomPowerupType();
        const config = POWERUPS[type];

        hole.classList.add('powerup', `powerup-${type}`, 'active');
        hole.setAttribute('data-powerup-icon', config.icon);
        hole.dataset.powerupType = type;

        // Power-up disappears after 3 seconds if not collected
        setTimeout(() => {
            hole.classList.remove('powerup', `powerup-${type}`, 'active');
            hole.removeAttribute('data-powerup-icon');
            delete hole.dataset.powerupType;
        }, 3000);
    }

    function activatePowerup(type) {
        const config = POWERUPS[type];

        // If already active, clear old timeout and refresh
        if (activePowerups[type]) {
            clearTimeout(activePowerups[type].timeout);
            clearInterval(activePowerups[type].badgeInterval);
        }

        let remaining = config.duration / 1000;

        // Apply effect
        if (type === 'freeze') {
            isTimerFrozen = true;
        }
        if (type === 'slow') {
            moleSpeed = Math.min(moleSpeed + 400, 1400);
            moleVisibleTime = Math.min(moleVisibleTime + 500, 2000);
        }

        // Show badge
        updatePowerupBadge(type, remaining);

        const badgeInterval = setInterval(() => {
            remaining--;
            if (remaining > 0) {
                updatePowerupBadge(type, remaining);
            }
        }, 1000);

        const timeout = setTimeout(() => {
            deactivatePowerup(type);
        }, config.duration);

        activePowerups[type] = { timeout, badgeInterval };
    }

    function deactivatePowerup(type) {
        if (type === 'freeze') {
            isTimerFrozen = false;
        }
        if (type === 'slow') {
            // Recalculate from current difficulty
            increaseDifficulty();
        }

        if (activePowerups[type]) {
            clearInterval(activePowerups[type].badgeInterval);
            delete activePowerups[type];
        }

        removePowerupBadge(type);
    }

    function updatePowerupBadge(type, seconds) {
        const config = POWERUPS[type];
        let badge = powerupIndicator.querySelector(`.powerup-badge.${type}`);
        if (!badge) {
            badge = document.createElement('div');
            badge.className = `powerup-badge ${type}`;
            powerupIndicator.appendChild(badge);
        }
        badge.innerHTML = `${config.icon} ${config.label} <span class="badge-timer">${seconds}s</span>`;
    }

    function removePowerupBadge(type) {
        const badge = powerupIndicator.querySelector(`.powerup-badge.${type}`);
        if (badge) badge.remove();
    }

    function clearAllPowerups() {
        Object.keys(activePowerups).forEach(type => {
            clearTimeout(activePowerups[type].timeout);
            clearInterval(activePowerups[type].badgeInterval);
        });
        activePowerups = {};
        isTimerFrozen = false;
        powerupIndicator.innerHTML = '';
        clearTimeout(powerupSpawnTimer);

        // Remove powerup states from holes
        holes.forEach(hole => {
            hole.classList.remove('powerup', 'powerup-freeze', 'powerup-double', 'powerup-slow');
            hole.removeAttribute('data-powerup-icon');
            delete hole.dataset.powerupType;
        });
    }

    function schedulePowerupSpawn() {
        if (!isGameActive) return;
        // Spawn a power-up every 6-10 seconds
        const delay = 6000 + Math.random() * 4000;
        powerupSpawnTimer = setTimeout(() => {
            spawnPowerup();
            schedulePowerupSpawn();
        }, delay);
    }

    // === End Power-up System ===

    function whackMole(e) {
        if (!isGameActive) return;

        const hole = e.currentTarget;

        // Check if it's a power-up
        if (hole.classList.contains('powerup') && hole.classList.contains('active')) {
            const type = hole.dataset.powerupType;
            hole.classList.remove('powerup', `powerup-${type}`, 'active');
            hole.removeAttribute('data-powerup-icon');
            delete hole.dataset.powerupType;

            activatePowerup(type);
            vibrate([50, 30, 50]); // Double vibration for power-up
            showScoreFloat(hole, POWERUPS[type].icon);
            return;
        }

        if (!hole.classList.contains('active')) {
            hole.classList.add('miss');
            combo = 0;
            comboValue.textContent = '—';
            comboEl.classList.remove('active');
            vibrate(30);
            setTimeout(() => hole.classList.remove('miss'), 300);
            return;
        }

        // Successful whack
        combo++;
        let points = combo >= 5 ? 3 : combo >= 3 ? 2 : 1;

        // Double points power-up
        if (activePowerups.double) {
            points *= 2;
        }

        score += points;
        scoreDisplay.textContent = score;

        // Score pop effect
        const scoreParent = scoreDisplay.closest('.hud-item');
        scoreParent.classList.add('pop');
        setTimeout(() => scoreParent.classList.remove('pop'), 200);

        // Combo display
        if (combo >= 2) {
            comboValue.textContent = `🔥 x${combo}`;
            comboEl.classList.add('active');
            setTimeout(() => comboEl.classList.remove('active'), 150);
        }

        // Float score
        showScoreFloat(hole, points);

        // Haptic feedback — stronger with combos
        vibrate(combo >= 5 ? [50, 30, 50] : combo >= 3 ? [40, 20, 40] : 50);

        // Screen shake — scales with combo
        screenShake(combo);

        // Particles — more with higher combos
        spawnParticles(hole, combo >= 5 ? 12 : combo >= 3 ? 8 : 5);

        hole.classList.remove('active');
        hole.classList.add('hit');
        setTimeout(() => hole.classList.remove('hit'), 250);
    }

    function runCountdown(callback) {
        let count = 3;
        startBtn.style.display = 'none';
        countdownEl.classList.add('visible');

        function tick() {
            if (count > 0) {
                countdownEl.textContent = count;
                countdownEl.classList.remove('visible');
                // Force reflow to restart animation
                void countdownEl.offsetWidth;
                countdownEl.classList.add('visible');
                count--;
                setTimeout(tick, 800);
            } else {
                countdownEl.textContent = 'GO!';
                countdownEl.classList.remove('visible');
                void countdownEl.offsetWidth;
                countdownEl.classList.add('visible');
                setTimeout(() => {
                    countdownEl.classList.remove('visible');
                    countdownEl.textContent = '';
                    callback();
                }, 600);
            }
        }

        tick();
    }

    function increaseDifficulty() {
        const elapsed = 30 - timeLeft;
        // Speed up over time
        moleSpeed = Math.max(400, 800 - elapsed * 15);
        moleVisibleTime = Math.max(500, 1200 - elapsed * 25);
    }

    function startGame() {
        score = 0;
        timeLeft = 30;
        combo = 0;
        moleSpeed = 800;
        moleVisibleTime = 1200;
        scoreDisplay.textContent = score;
        timerDisplay.textContent = timeLeft;
        comboValue.textContent = '—';
        startBtn.disabled = true;
        clearAllPowerups();

        const timerParent = timerDisplay.closest('.hud-item');
        timerParent.classList.remove('warning');

        runCountdown(() => {
            isGameActive = true;

            // Show moles with dynamic interval
            function scheduleMole() {
                if (!isGameActive) return;
                showMole();
                gameInterval = setTimeout(scheduleMole, moleSpeed + Math.random() * 400);
            }
            scheduleMole();

            // Schedule power-up spawns
            schedulePowerupSpawn();

            // Countdown timer
            timerInterval = setInterval(() => {
                if (isTimerFrozen) return; // Freeze power-up active

                timeLeft--;
                timerDisplay.textContent = timeLeft;
                increaseDifficulty();

                if (timeLeft <= 5) {
                    timerParent.classList.add('warning');
                }

                if (timeLeft <= 0) {
                    endGame();
                }
            }, 1000);
        });
    }

    function endGame() {
        isGameActive = false;
        clearTimeout(gameInterval);
        clearInterval(timerInterval);
        clearAllPowerups();

        holes.forEach(hole => hole.classList.remove('active'));

        const isNewRecord = score > highScore;
        if (isNewRecord) {
            highScore = score;
            localStorage.setItem('whackamole-highscore', highScore);
            highScoreEl.textContent = `🏆 Best: ${highScore}`;
        }

        // Show game over overlay
        const overlay = document.createElement('div');
        overlay.className = 'game-over-overlay';
        overlay.innerHTML = `
            <h2>Game Over!</h2>
            <div class="final-score">Score: ${score}</div>
            ${isNewRecord ? '<div class="new-record">🎉 New Record!</div>' : ''}
            <button id="play-again-btn">Play Again</button>
        `;
        document.body.appendChild(overlay);

        overlay.querySelector('#play-again-btn').addEventListener('click', () => {
            overlay.remove();
            startBtn.style.display = '';
            startBtn.disabled = false;
            startBtn.textContent = 'Start Game';
            startGame();
        });

        // Also allow closing with Escape
        function handleEscape(e) {
            if (e.key === 'Escape') {
                overlay.remove();
                startBtn.style.display = '';
                startBtn.disabled = false;
                startBtn.textContent = 'Play Again';
                document.removeEventListener('keydown', handleEscape);
            }
        }
        document.addEventListener('keydown', handleEscape);
    }

    // Event listeners
    holes.forEach(hole => {
        hole.addEventListener('click', whackMole);
        // Prevent double-tap zoom on mobile
        hole.addEventListener('touchend', (e) => {
            e.preventDefault();
            hole.click();
        });
    });

    startBtn.addEventListener('click', startGame);
})();
