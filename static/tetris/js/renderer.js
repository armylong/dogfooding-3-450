/**
 * 渲染器类
 * 负责Canvas绘制和游戏界面渲染
 */
class Renderer {
    constructor() {
        this.gameCanvas = document.getElementById('game-canvas');
        this.nextCanvas = document.getElementById('next-canvas');
        this.gameCtx = this.gameCanvas.getContext('2d');
        this.nextCtx = this.nextCanvas.getContext('2d');
    }

    /**
     * 绘制单个方块
     */
    drawBlock(ctx, x, y, size, color, isGhost = false) {
        if (!color) return;

        if (isGhost) {
            // 绘制影子（半透明边框）
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
            ctx.fillStyle = color + '20'; // 20% 透明度
            ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        } else {
            // 绘制实心方块
            ctx.fillStyle = color;
            ctx.fillRect(x, y, size, size);

            // 绘制高光效果
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(x, y, size, 4);
            ctx.fillRect(x, y, 4, size);

            // 绘制阴影效果
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(x, y + size - 4, size, 4);
            ctx.fillRect(x + size - 4, y, 4, size);

            // 绘制边框
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, size, size);
        }
    }

    /**
     * 绘制游戏面板
     */
    drawBoard(board) {
        const grid = board.getGrid();

        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                const x = col * BLOCK_SIZE;
                const y = row * BLOCK_SIZE;
                const color = grid[row][col];

                // 清空格子
                this.gameCtx.clearRect(x, y, BLOCK_SIZE, BLOCK_SIZE);

                // 绘制网格线
                this.gameCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
                this.gameCtx.lineWidth = 1;
                this.gameCtx.strokeRect(x, y, BLOCK_SIZE, BLOCK_SIZE);

                // 绘制方块
                if (color) {
                    this.drawBlock(this.gameCtx, x, y, BLOCK_SIZE, color);
                }
            }
        }
    }

    /**
     * 绘制当前方块
     */
    drawPiece(piece, isGhost = false) {
        if (!piece) return;

        const positions = piece.getPositions();
        for (const pos of positions) {
            if (pos.y >= 0) {
                const x = pos.x * BLOCK_SIZE;
                const y = pos.y * BLOCK_SIZE;
                this.drawBlock(this.gameCtx, x, y, BLOCK_SIZE, piece.color, isGhost);
            }
        }
    }

    /**
     * 绘制方块影子
     */
    drawGhost(board, piece) {
        if (!piece) return;

        const ghost = board.getGhostPosition(piece);
        this.drawPiece(ghost, true);
    }

    /**
     * 绘制下一个方块预览
     */
    drawNextPiece(piece) {
        // 清空画布
        this.nextCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);

        if (!piece) return;

        const shape = piece.getCurrentShape();
        const offsetX = (this.nextCanvas.width - shape[0].length * NEXT_BLOCK_SIZE) / 2;
        const offsetY = (this.nextCanvas.height - shape.length * NEXT_BLOCK_SIZE) / 2;

        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const x = offsetX + col * NEXT_BLOCK_SIZE;
                    const y = offsetY + row * NEXT_BLOCK_SIZE;
                    this.drawBlock(this.nextCtx, x, y, NEXT_BLOCK_SIZE, piece.color);
                }
            }
        }
    }

    /**
     * 渲染整个游戏画面
     */
    render(gameState) {
        const { board, currentPiece, nextPiece } = gameState;

        // 绘制游戏面板
        this.drawBoard(board);

        // 绘制方块影子
        this.drawGhost(board, currentPiece);

        // 绘制当前方块
        this.drawPiece(currentPiece);

        // 绘制下一个方块
        this.drawNextPiece(nextPiece);
    }

    /**
     * 更新UI显示
     */
    updateUI(gameState) {
        const { score, lines, level, highScore } = gameState;

        document.getElementById('score').textContent = score;
        document.getElementById('lines').textContent = lines;
        document.getElementById('level').textContent = level;
        document.getElementById('high-score').textContent = highScore;
    }

    /**
     * 显示游戏结束画面
     */
    showGameOver(score, highScore, isNewRecord) {
        const overlay = document.getElementById('game-overlay');
        const title = document.getElementById('overlay-title');
        const message = document.getElementById('overlay-message');
        const btn = document.getElementById('overlay-btn');

        title.textContent = '游戏结束';

        let msg = `最终得分: ${score}<br>最高分: ${highScore}`;
        if (isNewRecord) {
            msg += '<br><span class="new-record">🎉 新纪录！</span>';
        }
        message.innerHTML = msg;

        btn.textContent = '重新开始';
        overlay.classList.add('active');
    }

    /**
     * 显示暂停画面
     */
    showPause() {
        const overlay = document.getElementById('game-overlay');
        const title = document.getElementById('overlay-title');
        const message = document.getElementById('overlay-message');
        const btn = document.getElementById('overlay-btn');

        title.textContent = '游戏暂停';
        message.textContent = '按 P 键或点击按钮继续游戏';
        btn.textContent = '继续游戏';
        overlay.classList.add('active');
    }

    /**
     * 隐藏覆盖层
     */
    hideOverlay() {
        const overlay = document.getElementById('game-overlay');
        overlay.classList.remove('active');
    }
}
