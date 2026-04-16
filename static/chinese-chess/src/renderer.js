import { CellSize, COLS, ROWS, COLORS, PIECE_NAMES } from './config.js';

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
        const padding = CellSize;
        const boardWidth = (COLS - 1) * CellSize;
        const boardHeight = (ROWS - 1) * CellSize;

        this.ctx.fillStyle = COLORS.BOARD;
        this.ctx.fillRect(padding - 20, padding - 20, boardWidth + 40, boardHeight + 40);

        this.ctx.strokeStyle = COLORS.LINE;
        this.ctx.lineWidth = 1;

        for (let i = 0; i < ROWS; i++) {
            if (i === 4 || i === 5) continue;
            this.ctx.beginPath();
            this.ctx.moveTo(padding, padding + i * CellSize);
            this.ctx.lineTo(padding + boardWidth, padding + i * CellSize);
            this.ctx.stroke();
        }

        this.ctx.beginPath();
        this.ctx.moveTo(padding, padding + 4 * CellSize);
        this.ctx.lineTo(padding, padding + 5 * CellSize);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(padding + boardWidth, padding + 4 * CellSize);
        this.ctx.lineTo(padding + boardWidth, padding + 5 * CellSize);
        this.ctx.stroke();

        for (let i = 0; i < COLS; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(padding + i * CellSize, padding);
            this.ctx.lineTo(padding + i * CellSize, padding + boardHeight);
            this.ctx.stroke();
        }

        this.ctx.fillStyle = COLORS.RIVER;
        this.ctx.fillRect(padding - 20, padding + 4 * CellSize, boardWidth + 40, CellSize);

        this.ctx.fillStyle = COLORS.LINE;
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('楚 河', padding + boardWidth / 4, padding + 4.5 * CellSize);
        this.ctx.fillText('汉 界', padding + 3 * boardWidth / 4, padding + 4.5 * CellSize);

        this._drawPalace(padding + 3 * CellSize, padding);
        this._drawPalace(padding + 3 * CellSize, padding + 7 * CellSize);
    }

    _drawPalace(x, y) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x + 2 * CellSize, y + 2 * CellSize);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(x + 2 * CellSize, y);
        this.ctx.lineTo(x, y + 2 * CellSize);
        this.ctx.stroke();
    }

    drawPieces(board) {
        const padding = CellSize;

        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                const piece = board.get(row, col);
                if (piece) {
                    this._drawPiece(padding + col * CellSize, padding + row * CellSize, piece);
                }
            }
        }
    }

    _drawPiece(x, y, piece) {
        const radius = CellSize / 2 - 4;

        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = '#f5deb3';
        this.ctx.fill();
        this.ctx.strokeStyle = piece.side === 'red' ? COLORS.RED : COLORS.BLACK;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.arc(x, y, radius - 4, 0, Math.PI * 2);
        this.ctx.strokeStyle = piece.side === 'red' ? COLORS.RED : COLORS.BLACK;
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        this.ctx.fillStyle = piece.side === 'red' ? COLORS.RED : COLORS.BLACK;
        this.ctx.font = 'bold 28px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(PIECE_NAMES[piece.side][piece.type], x, y);
    }

    drawSelection(row, col) {
        const padding = CellSize;
        const x = padding + col * CellSize;
        const y = padding + row * CellSize;
        const radius = CellSize / 2 - 2;

        this.ctx.strokeStyle = COLORS.SELECTED;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.stroke();
    }

    drawValidMoves(moves) {
        const padding = CellSize;

        for (const move of moves) {
            const x = padding + move.col * CellSize;
            const y = padding + move.row * CellSize;

            this.ctx.fillStyle = COLORS.VALID_MOVE;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 10, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawStatus(currentSide, state) {
        const padding = CellSize;
        const boardHeight = (ROWS - 1) * CellSize;
        const statusY = padding + boardHeight + CellSize / 2 + 30;

        this.ctx.fillStyle = COLORS.TEXT;
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        let text = '';
        if (state === 'red_win') {
            text = '红方获胜！';
        } else if (state === 'black_win') {
            text = '黑方获胜！';
        } else {
            text = currentSide === 'red' ? '红方走子' : '黑方走子';
        }

        this.ctx.fillText(text, this.canvas.width / 2, statusY);

        this.ctx.font = '14px Arial';
        this.ctx.fillText('按 R 重新开始', this.canvas.width / 2, statusY + 25);
    }
}
