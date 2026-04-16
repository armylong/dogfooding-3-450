/**
 * 蛇模块
 * 管理蛇的状态和行为
 */

import { DIRECTIONS, INITIAL_SNAKE_LENGTH, CELL_SIZE } from './config.js';

export class Snake {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.reset();
    }

    reset() {
        const cols = Math.floor(this.canvasWidth / CELL_SIZE);
        const rows = Math.floor(this.canvasHeight / CELL_SIZE);
        const centerX = Math.floor(cols / 2);
        const centerY = Math.floor(rows / 2);

        this.body = [];
        for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
            this.body.push({ x: centerX - i, y: centerY });
        }

        this.direction = DIRECTIONS.RIGHT;
        this.nextDirection = DIRECTIONS.RIGHT;
    }

    setDirection(newDirection) {
        if (this._isOppositeDirection(newDirection)) {
            return;
        }
        this.nextDirection = newDirection;
    }

    _isOppositeDirection(newDirection) {
        return (
            (this.direction.x + newDirection.x === 0) &&
            (this.direction.y + newDirection.y === 0)
        );
    }

    move() {
        this.direction = this.nextDirection;
        const head = this.body[0];
        const newHead = {
            x: head.x + this.direction.x,
            y: head.y + this.direction.y
        };
        this.body.unshift(newHead);
        return this.body.pop();
    }

    grow(tail) {
        this.body.push(tail);
    }

    getHead() {
        return this.body[0];
    }

    checkWallCollision() {
        const head = this.getHead();
        const cols = Math.floor(this.canvasWidth / CELL_SIZE);
        const rows = Math.floor(this.canvasHeight / CELL_SIZE);

        return (
            head.x < 0 ||
            head.x >= cols ||
            head.y < 0 ||
            head.y >= rows
        );
    }

    checkSelfCollision() {
        const head = this.getHead();
        for (let i = 1; i < this.body.length; i++) {
            if (head.x === this.body[i].x && head.y === this.body[i].y) {
                return true;
            }
        }
        return false;
    }

    occupiesPosition(x, y) {
        return this.body.some(segment => segment.x === x && segment.y === y);
    }
}
