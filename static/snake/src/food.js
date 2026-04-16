/**
 * 食物模块
 * 管理食物的生成和位置
 */

import { CELL_SIZE } from './config.js';

export class Food {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.position = null;
    }

    generate(snake) {
        const cols = Math.floor(this.canvasWidth / CELL_SIZE);
        const rows = Math.floor(this.canvasHeight / CELL_SIZE);

        let newPosition;
        let attempts = 0;
        const maxAttempts = cols * rows;

        do {
            newPosition = {
                x: Math.floor(Math.random() * cols),
                y: Math.floor(Math.random() * rows)
            };
            attempts++;
        } while (snake.occupiesPosition(newPosition.x, newPosition.y) && attempts < maxAttempts);

        this.position = newPosition;
    }

    getPosition() {
        return this.position;
    }
}
