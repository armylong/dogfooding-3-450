import { BOARD_SIZE, PLAYERS } from './config.js';

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

    copy() {
        const newBoard = new Board();
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                newBoard.grid[i][j] = this.grid[i][j];
            }
        }
        return newBoard;
    }

    get(row, col) {
        if (row < 0 || row >= this.size || col < 0 || col >= this.size) {
            return undefined;
        }
        return this.grid[row][col];
    }

    set(row, col, value) {
        if (row >= 0 && row < this.size && col >= 0 && col < this.size) {
            this.grid[row][col] = value;
        }
    }

    getNeighbors(row, col) {
        const neighbors = [];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        for (const [dr, dc] of directions) {
            const r = row + dr;
            const c = col + dc;
            if (r >= 0 && r < this.size && c >= 0 && c < this.size) {
                neighbors.push({ row: r, col: c });
            }
        }
        return neighbors;
    }

    getGroup(row, col) {
        const color = this.get(row, col);
        if (!color) return [];

        const group = [];
        const visited = new Set();
        const stack = [{ row, col }];

        while (stack.length > 0) {
            const pos = stack.pop();
            const key = `${pos.row},${pos.col}`;
            
            if (visited.has(key)) continue;
            visited.add(key);

            if (this.get(pos.row, pos.col) === color) {
                group.push(pos);
                const neighbors = this.getNeighbors(pos.row, pos.col);
                for (const n of neighbors) {
                    if (!visited.has(`${n.row},${n.col}`)) {
                        stack.push(n);
                    }
                }
            }
        }

        return group;
    }

    countLiberties(row, col) {
        const group = this.getGroup(row, col);
        const liberties = new Set();

        for (const stone of group) {
            const neighbors = this.getNeighbors(stone.row, stone.col);
            for (const n of neighbors) {
                if (this.get(n.row, n.col) === null) {
                    liberties.add(`${n.row},${n.col}`);
                }
            }
        }

        return liberties.size;
    }

    hasLiberties(row, col) {
        return this.countLiberties(row, col) > 0;
    }

    removeDeadStones(color) {
        const captured = [];
        const checked = new Set();

        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                const key = `${row},${col}`;
                if (checked.has(key)) continue;

                if (this.get(row, col) === color) {
                    const group = this.getGroup(row, col);
                    for (const stone of group) {
                        checked.add(`${stone.row},${stone.col}`);
                    }

                    if (!this.hasLiberties(row, col)) {
                        for (const stone of group) {
                            this.set(stone.row, stone.col, null);
                            captured.push(stone);
                        }
                    }
                }
            }
        }

        return captured;
    }
}
