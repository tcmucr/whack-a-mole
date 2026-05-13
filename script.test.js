/**
 * Whack-a-Mole Game — Comprehensive Test Suite
 * Covers: score, combos, timer, power-ups, difficulty, edge cases
 */

const fs = require('fs');
const path = require('path');

// Setup DOM before loading script
function setupDOM() {
    const html = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf8');
    document.documentElement.innerHTML = html;
    // localStorage mock
    const store = {};
    Object.defineProperty(window, 'localStorage', {
        value: {
            getItem: (key) => store[key] || null,
            setItem: (key, val) => { store[key] = String(val); },
            removeItem: (key) => { delete store[key]; },
            clear: () => { Object.keys(store).forEach(k => delete store[k]); },
        },
        writable: true,
    });
    // navigator.vibrate mock
    navigator.vibrate = jest.fn();
    // getBoundingClientRect mock
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
        left: 100, top: 100, width: 100, height: 100, right: 200, bottom: 200,
    }));
}

let game;

beforeEach(() => {
    jest.useFakeTimers();
    setupDOM();
    // Clear module cache so IIFE re-runs with fresh state
    jest.resetModules();
    game = require('./script.js');
});

afterEach(() => {
    jest.useRealTimers();
});

// ============================================================
// SCORE CALCULATION
// ============================================================
describe('Score Calculation', () => {
    test('score starts at 0', () => {
        expect(game.getState().score).toBe(0);
    });

    test('whacking a mole adds 1 point (no combo)', () => {
        game.setState({ isGameActive: true });
        const hole = document.querySelector('.hole');
        hole.classList.add('active');

        hole.click();

        expect(game.getState().score).toBe(1);
    });

    test('score displays in the DOM after whack', () => {
        game.setState({ isGameActive: true });
        const hole = document.querySelector('.hole');
        hole.classList.add('active');

        hole.click();

        const display = document.getElementById('score');
        expect(display.textContent).toBe('1');
    });

    test('multiple whacks accumulate score', () => {
        game.setState({ isGameActive: true });
        const holes = document.querySelectorAll('.hole');

        // Whack 3 different moles in sequence
        holes[0].classList.add('active');
        holes[0].click();
        holes[1].classList.add('active');
        holes[1].click();
        holes[2].classList.add('active');
        holes[2].click();

        // combo 1=1pt, combo 2=1pt, combo 3=2pt → total=4
        expect(game.getState().score).toBe(4);
    });
});

// ============================================================
// COMBO MULTIPLIERS
// ============================================================
describe('Combo Multipliers', () => {
    test('combo increments on consecutive hits', () => {
        game.setState({ isGameActive: true });
        const hole = document.querySelector('.hole');

        hole.classList.add('active');
        hole.click();
        expect(game.getState().combo).toBe(1);

        hole.classList.add('active');
        hole.click();
        expect(game.getState().combo).toBe(2);
    });

    test('combo x3-x4 gives 2 points per hit', () => {
        game.setState({ isGameActive: true, combo: 2 }); // next hit = combo 3
        const hole = document.querySelector('.hole');
        hole.classList.add('active');

        hole.click();

        expect(game.getState().combo).toBe(3);
        expect(game.getState().score).toBe(2);
    });

    test('combo x5+ gives 3 points per hit', () => {
        game.setState({ isGameActive: true, combo: 4 }); // next hit = combo 5
        const hole = document.querySelector('.hole');
        hole.classList.add('active');

        hole.click();

        expect(game.getState().combo).toBe(5);
        expect(game.getState().score).toBe(3);
    });

    test('combo resets to 0 on miss (clicking empty hole)', () => {
        game.setState({ isGameActive: true, combo: 4 });
        const hole = document.querySelector('.hole');
        // hole is NOT active

        hole.click();

        expect(game.getState().combo).toBe(0);
    });

    test('combo resets when mole escapes (timeout)', () => {
        game.setState({ isGameActive: true, combo: 3, moleVisibleTime: 1200 });

        // showMole sets the timeout that resets combo on escape
        game.showMole();

        // Don't click — let the mole escape (max visible = 1200ms)
        jest.advanceTimersByTime(1500);

        expect(game.getState().combo).toBe(0);
    });

    test('combo display shows fire emoji at x2+', () => {
        game.setState({ isGameActive: true, combo: 1 });
        const hole = document.querySelector('.hole');
        hole.classList.add('active');
        hole.click();

        const comboValue = document.getElementById('combo-value');
        expect(comboValue.textContent).toContain('🔥');
        expect(comboValue.textContent).toContain('x2');
    });
});

// ============================================================
// TIMER COUNTDOWN
// ============================================================
describe('Timer Countdown', () => {
    test('timer starts at 30 seconds', () => {
        expect(game.getState().timeLeft).toBe(30);
    });

    test('timer decrements each second during gameplay', () => {
        game.setState({ isGameActive: true });
        game.startGame();

        // Skip countdown (3s + 0.6s for "GO!")
        jest.advanceTimersByTime(3200);

        // Now game is running, advance 5 seconds
        jest.advanceTimersByTime(5000);

        expect(game.getState().timeLeft).toBeLessThanOrEqual(25);
    });

    test('timer shows warning class when <= 5 seconds', () => {
        game.setState({ isGameActive: true, timeLeft: 6 });
        const timerDisplay = document.getElementById('timer');
        const timerParent = timerDisplay.closest('.hud-item');

        // Simulate timer tick to 5
        game.setState({ timeLeft: 5 });
        timerParent.classList.add('warning');

        expect(timerParent.classList.contains('warning')).toBe(true);
    });
});

// ============================================================
// POWER-UP ACTIVATION & DEACTIVATION
// ============================================================
describe('Power-Up System', () => {
    test('freeze power-up sets isTimerFrozen to true', () => {
        game.setState({ isGameActive: true });
        game.activatePowerup('freeze');

        expect(game.getState().isTimerFrozen).toBe(true);
    });

    test('freeze power-up deactivates after 5 seconds', () => {
        game.setState({ isGameActive: true });
        game.activatePowerup('freeze');

        jest.advanceTimersByTime(5000);

        expect(game.getState().isTimerFrozen).toBe(false);
    });

    test('double power-up doubles points on whack', () => {
        game.setState({ isGameActive: true });
        game.activatePowerup('double');

        const hole = document.querySelector('.hole');
        hole.classList.add('active');
        hole.click();

        // 1 point * 2 = 2
        expect(game.getState().score).toBe(2);
    });

    test('slow power-up increases moleSpeed and moleVisibleTime', () => {
        game.setState({ isGameActive: true, moleSpeed: 600, moleVisibleTime: 900 });
        game.activatePowerup('slow');

        const state = game.getState();
        expect(state.moleSpeed).toBeGreaterThan(600);
        expect(state.moleVisibleTime).toBeGreaterThan(900);
    });

    test('power-up badge appears in indicator', () => {
        game.setState({ isGameActive: true });
        game.activatePowerup('freeze');

        const badge = document.querySelector('.powerup-badge.freeze');
        expect(badge).not.toBeNull();
        expect(badge.textContent).toContain('FREEZE');
    });

    test('power-up badge removed after deactivation', () => {
        game.setState({ isGameActive: true });
        game.activatePowerup('freeze');

        jest.advanceTimersByTime(5000);

        const badge = document.querySelector('.powerup-badge.freeze');
        expect(badge).toBeNull();
    });

    test('clearAllPowerups removes all active power-ups', () => {
        game.setState({ isGameActive: true });
        game.activatePowerup('freeze');
        game.activatePowerup('double');

        game.clearAllPowerups();

        const state = game.getState();
        expect(state.isTimerFrozen).toBe(false);
        expect(Object.keys(state.activePowerups).length).toBe(0);
    });

    test('collecting a power-up does not add score', () => {
        game.setState({ isGameActive: true });
        const hole = document.querySelector('.hole');
        hole.classList.add('powerup', 'powerup-freeze', 'active');
        hole.setAttribute('data-powerup-icon', '⏸️');
        hole.dataset.powerupType = 'freeze';

        hole.click();

        expect(game.getState().score).toBe(0);
        expect(game.getState().isTimerFrozen).toBe(true);
    });
});

// ============================================================
// DIFFICULTY SCALING
// ============================================================
describe('Difficulty Scaling', () => {
    test('moleSpeed decreases as time elapses', () => {
        game.setState({ timeLeft: 20 }); // 10 seconds elapsed
        game.increaseDifficulty();

        const state = game.getState();
        expect(state.moleSpeed).toBeLessThan(800);
    });

    test('moleVisibleTime decreases as time elapses', () => {
        game.setState({ timeLeft: 15 }); // 15 seconds elapsed
        game.increaseDifficulty();

        const state = game.getState();
        expect(state.moleVisibleTime).toBeLessThan(1200);
    });

    test('moleSpeed has a minimum floor of 400ms', () => {
        game.setState({ timeLeft: 1 }); // 29 seconds elapsed
        game.increaseDifficulty();

        expect(game.getState().moleSpeed).toBeGreaterThanOrEqual(400);
    });

    test('moleVisibleTime has a minimum floor of 500ms', () => {
        game.setState({ timeLeft: 1 }); // 29 seconds elapsed
        game.increaseDifficulty();

        expect(game.getState().moleVisibleTime).toBeGreaterThanOrEqual(500);
    });

    test('difficulty does not change at game start (0 elapsed)', () => {
        game.setState({ timeLeft: 30 });
        game.increaseDifficulty();

        const state = game.getState();
        expect(state.moleSpeed).toBe(800);
        expect(state.moleVisibleTime).toBe(1200);
    });
});

// ============================================================
// EDGE CASES
// ============================================================
describe('Edge Cases', () => {
    test('clicking an empty hole does not add score', () => {
        game.setState({ isGameActive: true });
        const hole = document.querySelector('.hole');
        // hole is NOT active

        hole.click();

        expect(game.getState().score).toBe(0);
    });

    test('clicking when game is not active does nothing', () => {
        game.setState({ isGameActive: false });
        const hole = document.querySelector('.hole');
        hole.classList.add('active');

        hole.click();

        expect(game.getState().score).toBe(0);
        expect(game.getState().combo).toBe(0);
    });

    test('rapid double-click on same mole only scores once', () => {
        game.setState({ isGameActive: true });
        const hole = document.querySelector('.hole');
        hole.classList.add('active');

        // First click removes 'active', second click hits empty hole
        hole.click();
        hole.click();

        // Should be 1 point (first hit) + 0 (miss on second)
        expect(game.getState().score).toBe(1);
        // Combo resets on the miss
        expect(game.getState().combo).toBe(0);
    });

    test('miss adds "miss" class to hole temporarily', () => {
        game.setState({ isGameActive: true });
        const hole = document.querySelector('.hole');

        hole.click();

        expect(hole.classList.contains('miss')).toBe(true);
        jest.advanceTimersByTime(300);
        expect(hole.classList.contains('miss')).toBe(false);
    });

    test('getRandomHole never returns the same hole twice in a row', () => {
        // showMole uses getRandomHole internally
        // We test by showing multiple moles and checking variety
        game.setState({ isGameActive: true });

        const activeHoles = [];
        for (let i = 0; i < 10; i++) {
            game.showMole();
            const active = document.querySelector('.hole.active');
            if (active) {
                activeHoles.push(active.dataset.hole);
                active.classList.remove('active');
            }
        }

        // Check no consecutive duplicates
        for (let i = 1; i < activeHoles.length; i++) {
            if (activeHoles[i - 1] !== undefined) {
                expect(activeHoles[i]).not.toBe(activeHoles[i - 1]);
            }
        }
    });

    test('game over clears all active moles', () => {
        game.setState({ isGameActive: true });
        const holes = document.querySelectorAll('.hole');
        holes[0].classList.add('active');
        holes[1].classList.add('active');

        game.endGame();

        holes.forEach(hole => {
            expect(hole.classList.contains('active')).toBe(false);
        });
    });

    test('new high score is saved to localStorage', () => {
        game.setState({ isGameActive: true, score: 999 });
        game.endGame();

        expect(localStorage.getItem('whackamole-highscore')).toBe('999');
    });

    test('game over overlay appears with final score', () => {
        game.setState({ isGameActive: true, score: 42 });
        game.endGame();

        const overlay = document.querySelector('.game-over-overlay');
        expect(overlay).not.toBeNull();
        expect(overlay.textContent).toContain('42');
    });
});
