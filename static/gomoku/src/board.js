import { BOARD_SIZE } from './config.js';

export class Board {
    constructor() {
        this.size = BOARD_SIZE;
        this.grid = [];
        this.reset();
    }

    reset() {
        this.grid = [];
        for (let i = 0; i < this.size; i++) {
            this.grid[i] = [];
            for (let j = 0; j < this.size; j++) {
                this.grid[i][j] = null;
            }
        }
    }

    get(row, col) {
        if (row < 0 || row >= this.size || col < 0 || col >= this.size) {
            return null;
        }
        return this.grid[row][col];
    }

    set(row, col, value) {
        if (row >= 0 && row < this.size && col >= 0 && col < this.size) {
            this.grid[row][col] = value;
        }
    }

    isFull() {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.grid[i][j] === null) {
                    return false;
                }
            }
        }
        return true;
    }
}
