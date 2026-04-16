import { CELL_SIZE, BOARD_SIZE, COLORS, PLAYERS, STAR_POINTS } from './config.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    clear() {
        this.ctx.fillStyle = COLORS.BACKGROUND;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawBoard() {
        const padding = CELL_SIZE;
        const boardWidth = (BOARD_SIZE - 1) * CELL_SIZE;

        this.ctx.fillStyle = COLORS.BOARD;
        this.ctx.fillRect(padding - CELL_SIZE / 2, padding - CELL_SIZE / 2, boardWidth + CELL_SIZE, boardWidth + CELL_SIZE);

        this.ctx.strokeStyle = COLORS.LINE;
        this.ctx.lineWidth = 1;

        for (let i = 0; i < BOARD_SIZE; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(padding, padding + i * CELL_SIZE);
            this.ctx.lineTo(padding + boardWidth, padding + i * CELL_SIZE);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(padding + i * CELL_SIZE, padding);
            this.ctx.lineTo(padding + i * CELL_SIZE, padding + boardWidth);
            this.ctx.stroke();
        }

        this.ctx.fillStyle = COLORS.STAR_POINT;
        for (const [row, col] of STAR_POINTS) {
            this.ctx.beginPath();
            this.ctx.arc(padding + col * CELL_SIZE, padding + row * CELL_SIZE, 4, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawStones(board) {
        const padding = CELL_SIZE;

        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const stone = board.get(row, col);
                if (stone) {
                    this._drawStone(padding + col * CELL_SIZE, padding + row * CELL_SIZE, stone);
                }
            }
        }
    }

    _drawStone(x, y, player) {
        const radius = CELL_SIZE / 2 - 2;

        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);

        if (player === PLAYERS.BLACK) {
            const gradient = this.ctx.createRadialGradient(x - 5, y - 5, 0, x, y, radius);
            gradient.addColorStop(0, '#666666');
            gradient.addColorStop(1, '#000000');
            this.ctx.fillStyle = gradient;
        } else {
            const gradient = this.ctx.createRadialGradient(x - 5, y - 5, 0, x, y, radius);
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(1, '#cccccc');
            this.ctx.fillStyle = gradient;
        }

        this.ctx.fill();
        this.ctx.strokeStyle = player === PLAYERS.BLACK ? '#000000' : '#999999';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }

    drawLastMove(row, col) {
        const padding = CELL_SIZE;
        const x = padding + col * CELL_SIZE;
        const y = padding + row * CELL_SIZE;

        const board = this.canvas;
        const ctx = this.ctx;
        const stone = ctx.getImageData(x - 10, y - 10, 20, 20);
        const isBlack = stone.data[0] < 128;

        this.ctx.strokeStyle = isBlack ? '#ffffff' : '#000000';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 5, 0, Math.PI * 2);
        this.ctx.stroke();
    }

    drawStatus(currentPlayer, state, captures) {
        const padding = CELL_SIZE;
        const boardWidth = (BOARD_SIZE - 1) * CELL_SIZE;
        const statusY = padding + boardWidth + CELL_SIZE / 2 + 20;

        this.ctx.fillStyle = COLORS.TEXT;
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        if (state === 'game_over') {
            this.ctx.fillText('双方连续弃权，游戏结束', this.canvas.width / 2, statusY);
        } else {
            const text = currentPlayer === PLAYERS.BLACK ? '黑棋走子' : '白棋走子';
            this.ctx.fillText(text, this.canvas.width / 2, statusY);
        }

        this.ctx.font = '14px Arial';
        this.ctx.fillText(`提子 - 黑: ${captures.black} | 白: ${captures.white}`, this.canvas.width / 2, statusY + 22);

        this.ctx.font = '12px Arial';
        this.ctx.fillText('按 P 弃权 | 按 U 悔棋 | 按 R 重新开始', this.canvas.width / 2, statusY + 44);
    }
}
