/**
 * 游戏面板类
 * 负责管理游戏区域的状态、碰撞检测、消行等逻辑
 */
class Board {
    constructor() {
        this.grid = [];
        this.reset();
    }

    /**
     * 重置游戏面板
     */
    reset() {
        this.grid = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
    }

    /**
     * 检查位置是否有效（在边界内且未被占用）
     */
    isValidPosition(x, y) {
        return x >= 0 && x < COLS && y >= 0 && y < ROWS && !this.grid[y][x];
    }

    /**
     * 检查方块是否可以放置在当前位置
     */
    canPlace(tetromino) {
        const positions = tetromino.getPositions();
        for (const pos of positions) {
            if (!this.isValidPosition(pos.x, pos.y)) {
                return false;
            }
        }
        return true;
    }

    /**
     * 将方块固定到面板
     */
    place(tetromino) {
        const positions = tetromino.getPositions();
        for (const pos of positions) {
            if (pos.y >= 0 && pos.y < ROWS && pos.x >= 0 && pos.x < COLS) {
                this.grid[pos.y][pos.x] = tetromino.color;
            }
        }
    }

    /**
     * 检查并消除满行
     * @returns {number} 消除的行数
     */
    clearLines() {
        let linesCleared = 0;
        let y = ROWS - 1;

        while (y >= 0) {
            // 检查当前行是否已满
            if (this.grid[y].every(cell => cell !== null)) {
                // 消除该行
                this.grid.splice(y, 1);
                // 在顶部添加新行
                this.grid.unshift(Array(COLS).fill(null));
                linesCleared++;
                // 不减少y，因为上面的行已经下移
            } else {
                y--;
            }
        }

        return linesCleared;
    }

    /**
     * 检查游戏是否结束（方块堆到顶部）
     */
    isGameOver() {
        // 检查最上面几行是否有方块
        for (let x = 0; x < COLS; x++) {
            if (this.grid[0][x] !== null) {
                return true;
            }
        }
        return false;
    }

    /**
     * 获取方块的影子位置（硬降位置）
     */
    getGhostPosition(tetromino) {
        const ghost = tetromino.clone();
        while (this.canPlace(ghost)) {
            ghost.moveDown();
        }
        ghost.moveUp(); // 回退到最后一个有效位置
        return ghost;
    }

    /**
     * 获取面板状态
     */
    getGrid() {
        return this.grid;
    }
}
