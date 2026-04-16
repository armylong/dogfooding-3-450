/**
 * 游戏主逻辑模块
 * 管理游戏状态和游戏循环
 */

import { Snake } from './snake.js';
import { Food } from './food.js';
import { Renderer } from './renderer.js';
import { DIRECTIONS, GAME_STATES, GAME_SPEED } from './config.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.renderer = new Renderer(canvas);
        this.snake = null;
        this.food = null;
        this.score = 0;
        this.state = GAME_STATES.IDLE;
        this.gameLoop = null;

        this._init();
    }

    _init() {
        this._resizeCanvas();
        window.addEventListener('resize', () => this._resizeCanvas());
        this.renderer.drawStartScreen();
    }

    _resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        if (this.state === GAME_STATES.PLAYING) {
            this.snake.canvasWidth = this.canvas.width;
            this.snake.canvasHeight = this.canvas.height;
            this.food.canvasWidth = this.canvas.width;
            this.food.canvasHeight = this.canvas.height;
        }
    }

    start() {
        if (this.state === GAME_STATES.PLAYING) {
            return;
        }

        this.snake = new Snake(this.canvas.width, this.canvas.height);
        this.food = new Food(this.canvas.width, this.canvas.height);
        this.score = 0;
        this.state = GAME_STATES.PLAYING;

        this.food.generate(this.snake);
        this._startGameLoop();
    }

    _startGameLoop() {
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
        }
        this.gameLoop = setInterval(() => this._update(), GAME_SPEED);
    }

    _update() {
        if (this.state !== GAME_STATES.PLAYING) {
            return;
        }

        const tail = this.snake.move();

        if (this.snake.checkWallCollision() || this.snake.checkSelfCollision()) {
            this._gameOver();
            return;
        }

        const head = this.snake.getHead();
        const foodPos = this.food.getPosition();

        if (head.x === foodPos.x && head.y === foodPos.y) {
            this.snake.grow(tail);
            this.score += 10;
            this.food.generate(this.snake);
        }

        this._render();
    }

    _render() {
        this.renderer.clear();
        this.renderer.drawFood(this.food);
        this.renderer.drawSnake(this.snake);
        this.renderer.drawScore(this.score);
    }

    _gameOver() {
        this.state = GAME_STATES.GAME_OVER;
        clearInterval(this.gameLoop);
        this.gameLoop = null;
        this.renderer.drawGameOver(this.score);
    }

    handleKeyDown(keyCode) {
        if (keyCode === 'Space') {
            if (this.state === GAME_STATES.IDLE || this.state === GAME_STATES.GAME_OVER) {
                this.start();
            }
            return;
        }

        if (this.state !== GAME_STATES.PLAYING) {
            return;
        }

        switch (keyCode) {
            case 'ArrowUp':
                this.snake.setDirection(DIRECTIONS.UP);
                break;
            case 'ArrowDown':
                this.snake.setDirection(DIRECTIONS.DOWN);
                break;
            case 'ArrowLeft':
                this.snake.setDirection(DIRECTIONS.LEFT);
                break;
            case 'ArrowRight':
                this.snake.setDirection(DIRECTIONS.RIGHT);
                break;
        }
    }
}
