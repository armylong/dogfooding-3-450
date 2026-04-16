/**
 * 渲染模块
 * 负责所有Canvas绑制逻辑
 */

import { CELL_SIZE, COLORS } from './config.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    clear() {
        this.ctx.fillStyle = COLORS.BACKGROUND;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this._drawGrid();
    }

    _drawGrid() {
        this.ctx.strokeStyle = COLORS.GRID;
        this.ctx.lineWidth = 0.5;

        for (let x = 0; x <= this.canvas.width; x += CELL_SIZE) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        for (let y = 0; y <= this.canvas.height; y += CELL_SIZE) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    drawSnake(snake) {
        snake.body.forEach((segment, index) => {
            this.ctx.fillStyle = index === 0 ? COLORS.SNAKE_HEAD : COLORS.SNAKE_BODY;
            this.ctx.fillRect(
                segment.x * CELL_SIZE + 1,
                segment.y * CELL_SIZE + 1,
                CELL_SIZE - 2,
                CELL_SIZE - 2
            );
        });
    }

    drawFood(food) {
        const position = food.getPosition();
        if (position) {
            this.ctx.fillStyle = COLORS.FOOD;
            this.ctx.beginPath();
            this.ctx.arc(
                position.x * CELL_SIZE + CELL_SIZE / 2,
                position.y * CELL_SIZE + CELL_SIZE / 2,
                CELL_SIZE / 2 - 2,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        }
    }

    drawScore(score) {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(`分数: ${score}`, 20, 20);
    }

    drawStartScreen() {
        this.clear();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('贪吃蛇游戏', this.canvas.width / 2, this.canvas.height / 2 - 50);

        this.ctx.font = '24px Arial';
        this.ctx.fillText('按空格键开始游戏', this.canvas.width / 2, this.canvas.height / 2 + 20);

        this.ctx.font = '18px Arial';
        this.ctx.fillText('使用方向键控制蛇的移动', this.canvas.width / 2, this.canvas.height / 2 + 60);
    }

    drawGameOver(score) {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#e53935';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('游戏结束', this.canvas.width / 2, this.canvas.height / 2 - 50);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 32px Arial';
        this.ctx.fillText(`最终分数: ${score}`, this.canvas.width / 2, this.canvas.height / 2 + 10);

        this.ctx.font = '24px Arial';
        this.ctx.fillText('按空格键重新开始', this.canvas.width / 2, this.canvas.height / 2 + 60);
    }
}
