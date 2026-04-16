/**
 * 游戏主逻辑类
 * 负责游戏状态管理、计分、难度控制等
 */
class Game {
    constructor() {
        this.board = new Board();
        this.factory = new TetrominoFactory();
        this.currentPiece = null;
        this.nextPiece = null;
        this.state = GAME_STATE.READY;
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.highScore = this.loadHighScore();
        this.dropInterval = LEVEL_SPEED[1];
        this.lastDropTime = 0;
        this.isSoftDropping = false;
    }

    /**
     * 开始游戏
     */
    start() {
        this.board.reset();
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.dropInterval = LEVEL_SPEED[1];
        this.state = GAME_STATE.PLAYING;
        this.spawnPiece();
        this.lastDropTime = performance.now();
    }

    /**
     * 暂停/继续游戏
     */
    togglePause() {
        if (this.state === GAME_STATE.PLAYING) {
            this.state = GAME_STATE.PAUSED;
        } else if (this.state === GAME_STATE.PAUSED) {
            this.state = GAME_STATE.PLAYING;
            this.lastDropTime = performance.now();
        }
    }

    /**
     * 重新开始游戏
     */
    restart() {
        this.start();
    }

    /**
     * 生成新方块
     */
    spawnPiece() {
        if (this.nextPiece === null) {
            this.nextPiece = this.factory.create();
        }
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.factory.create();

        // 检查新方块是否可以放置
        if (!this.board.canPlace(this.currentPiece)) {
            this.gameOver();
        }
    }

    /**
     * 游戏结束
     */
    gameOver() {
        this.state = GAME_STATE.GAME_OVER;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
        }
    }

    /**
     * 更新游戏状态
     */
    update(timestamp) {
        if (this.state !== GAME_STATE.PLAYING) {
            return;
        }

        const interval = this.isSoftDropping ? 50 : this.dropInterval;

        if (timestamp - this.lastDropTime > interval) {
            this.drop();
            this.lastDropTime = timestamp;
        }
    }

    /**
     * 方块下落
     */
    drop() {
        if (!this.currentPiece) return;

        this.currentPiece.moveDown();

        if (!this.board.canPlace(this.currentPiece)) {
            this.currentPiece.moveUp();
            this.lockPiece();
        }
    }

    /**
     * 硬降（直接落到底部）
     */
    hardDrop() {
        if (!this.currentPiece || this.state !== GAME_STATE.PLAYING) return;

        while (this.board.canPlace(this.currentPiece)) {
            this.currentPiece.moveDown();
        }
        this.currentPiece.moveUp();
        this.lockPiece();
    }

    /**
     * 锁定方块并处理消行
     */
    lockPiece() {
        this.board.place(this.currentPiece);

        const linesCleared = this.board.clearLines();
        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += SCORE_TABLE[linesCleared] * this.level;
            this.updateLevel();
        }

        if (this.board.isGameOver()) {
            this.gameOver();
        } else {
            this.spawnPiece();
        }
    }

    /**
     * 更新等级
     */
    updateLevel() {
        const newLevel = Math.floor(this.lines / LINES_PER_LEVEL) + 1;
        if (newLevel > this.level) {
            this.level = Math.min(newLevel, 10);
            this.dropInterval = LEVEL_SPEED[this.level];
        }
    }

    /**
     * 向左移动
     */
    moveLeft() {
        if (this.state !== GAME_STATE.PLAYING || !this.currentPiece) return;

        this.currentPiece.moveLeft();
        if (!this.board.canPlace(this.currentPiece)) {
            this.currentPiece.moveRight();
        }
    }

    /**
     * 向右移动
     */
    moveRight() {
        if (this.state !== GAME_STATE.PLAYING || !this.currentPiece) return;

        this.currentPiece.moveRight();
        if (!this.board.canPlace(this.currentPiece)) {
            this.currentPiece.moveLeft();
        }
    }

    /**
     * 旋转方块（带踢墙）
     */
    rotate() {
        if (this.state !== GAME_STATE.PLAYING || !this.currentPiece) return;

        const originalX = this.currentPiece.x;
        this.currentPiece.rotate();

        // 尝试踢墙
        const kicks = [0, -1, 1, -2, 2];
        for (const kick of kicks) {
            this.currentPiece.x = originalX + kick;
            if (this.board.canPlace(this.currentPiece)) {
                return;
            }
        }

        // 无法旋转，回退
        this.currentPiece.rotateBack();
        this.currentPiece.x = originalX;
    }

    /**
     * 设置软降状态
     */
    setSoftDropping(isSoftDropping) {
        this.isSoftDropping = isSoftDropping;
    }

    /**
     * 从localStorage加载最高分
     */
    loadHighScore() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? parseInt(saved, 10) : 0;
        } catch (e) {
            return 0;
        }
    }

    /**
     * 保存最高分到localStorage
     */
    saveHighScore() {
        try {
            localStorage.setItem(STORAGE_KEY, this.highScore.toString());
        } catch (e) {
            console.warn('无法保存最高分');
        }
    }

    /**
     * 获取游戏状态
     */
    getState() {
        return {
            board: this.board,
            currentPiece: this.currentPiece,
            nextPiece: this.nextPiece,
            score: this.score,
            lines: this.lines,
            level: this.level,
            highScore: this.highScore,
            gameState: this.state
        };
    }
}
