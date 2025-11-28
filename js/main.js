import { Game } from './game.js';

/**
 * Main entry point for Idle Bricks game
 */

let game;

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    game = new Game(canvas);
    
    // Try to load saved game
    game.load();
    
    // Setup shop event listeners
    setupShopListeners();
    
    // Setup button listeners
    setupButtonListeners();
    
    // Auto-save every 30 seconds
    setInterval(() => {
        game.save();
        updateAutoSaveStatus();
    }, 30000);
});

function setupShopListeners() {
    // Ball purchase buttons
    const ballButtons = document.querySelectorAll('[data-ball]');
    ballButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const ballType = btn.dataset.ball;
            game.buyBall(ballType);
        });
    });
    
    // Upgrade buttons
    document.getElementById('upgrade-all-speed').addEventListener('click', () => {
        game.buyUpgrade('speed');
    });
    
    document.getElementById('upgrade-all-damage').addEventListener('click', () => {
        game.buyUpgrade('damage');
    });
    
    document.getElementById('upgrade-coin-mult').addEventListener('click', () => {
        game.buyUpgrade('coinMult');
    });
    
    // Prestige button
    document.getElementById('prestige-btn').addEventListener('click', () => {
        if (confirm('Are you sure you want to prestige? You will lose all progress but gain a permanent 25% coin bonus.')) {
            game.prestige();
        }
    });
}

function setupButtonListeners() {
    // Save button
    document.getElementById('save-btn').addEventListener('click', () => {
        if (game.save()) {
            updateAutoSaveStatus('Saved!');
            setTimeout(() => updateAutoSaveStatus(), 2000);
        }
    });
    
    // Reset button
    document.getElementById('reset-btn').addEventListener('click', () => {
        if (confirm('Are you sure you want to reset ALL progress? This cannot be undone!')) {
            game.reset();
        }
    });
}

function updateAutoSaveStatus(message = 'Auto-saves every 30s') {
    document.getElementById('auto-save-status').textContent = message;
}

// Save before page unload
window.addEventListener('beforeunload', () => {
    if (game) {
        game.save();
    }
});
