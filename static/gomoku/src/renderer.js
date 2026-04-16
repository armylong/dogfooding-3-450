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

        this.ctx.strokeStyle = COLORS.LAST_MOVE;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 6, 0, Math.PI * 2);
        this.ctx.stroke();
    }

    drawWinLine(line) {
        if (line.length < 2) return;

        const padding = CELL_SIZE;
        const start = line[0];
        const end = line[line.length - 1];

        this.ctx.strokeStyle = COLORS.LAST_MOVE;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(padding + start[1] * CELL_SIZE, padding + start[0] * CELL_SIZE);
        this.ctx.lineTo(padding + end[1] * CELL_SIZE, padding + end[0] * CELL_SIZE);
        this.ctx.stroke();
    }

    drawStatus(currentPlayer, state, winner) {
        const padding = CELL_SIZE;
        const boardWidth = (BOARD_SIZE - 1) * CELL_SIZE;
        const statusY = padding + boardWidth + CELL_SIZE / 2 + 20;

        this.ctx.fillStyle = COLORS.TEXT;
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        let text = '';
        if (state === 'game_over') {
            if (winner) {
                text = winner === PLAYERS.BLACK ? '黑棋获胜！' : '白棋获胜！';
            } else {
                text = '平局！';
            }
        } else {
            text = currentPlayer === PLAYERS.BLACK ? '黑棋走子' : '白棋走子';
        }

        this.ctx.fillText(text, this.canvas.width / 2, statusY);

        this.ctx.font = '14px Arial';
        this.ctx.fillText('按 R 重新开始 | 按 U 悔棋', this.canvas.width / 2, statusY + 25);
    }
}
