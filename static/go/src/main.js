import { Game } from './game.js';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const game = new Game(canvas);

    canvas.addEventListener('click', (event) => {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        game.handleClick(x, y);
    });

    document.addEventListener('keydown', (event) => {
        if (event.code === 'KeyR') {
            game.restart();
        }
        if (event.code === 'KeyP') {
            game.pass();
        }
        if (event.code === 'KeyU') {
            game.undo();
        }
    });
});
