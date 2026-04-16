import { Board } from './board.js';
import { Renderer } from './renderer.js';
import { CELL_SIZE, BOARD_SIZE, GAME_STATES, PLAYERS } from './config.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.renderer = new Renderer(canvas);
        this.board = new Board();
        this.currentPlayer = PLAYERS.BLACK;
        this.state = GAME_STATES.PLAYING;
        this.history = [];
        this.winner = null;
        this.winLine = null;

        this._init();
    }

    _init() {
        const size = (BOARD_SIZE + 1) * CELL_SIZE;
        this.canvas.width = size;
        this.canvas.height = size + 60;
        this._render();
    }

    handleClick(x, y) {
        if (this.state !== GAME_STATES.PLAYING) {
            return;
        }

        const col = Math.round((x - CELL_SIZE) / CELL_SIZE);
        const row = Math.round((y - CELL_SIZE) / CELL_SIZE);

        if (col < 0 || col >= BOARD_SIZE || row < 0 || row >= BOARD_SIZE) {
            return;
        }

        if (this.board.get(row, col) !== null) {
            return;
        }

        this._makeMove(row, col);
    }

    _makeMove(row, col) {
        this.board.set(row, col, this.currentPlayer);
        this.history.push({ row, col, player: this.currentPlayer });

        const winLine = this._checkWin(row, col);
        if (winLine) {
            this.state = GAME_STATES.GAME_OVER;
            this.winner = this.currentPlayer;
            this.winLine = winLine;
        } else if (this.board.isFull()) {
            this.state = GAME_STATES.GAME_OVER;
            this.winner = null;
        } else {
            this.currentPlayer = this.currentPlayer === PLAYERS.BLACK ? PLAYERS.WHITE : PLAYERS.BLACK;
        }

        this._render();
    }

    _checkWin(row, col) {
        const directions = [
            [[0, 1], [0, -1]],
            [[1, 0], [-1, 0]],
            [[1, 1], [-1, -1]],
            [[1, -1], [-1, 1]]
        ];

        const player = this.board.get(row, col);

        for (const [dir1, dir2] of directions) {
            const line = [[row, col]];

            for (const [dr, dc] of [dir1, dir2]) {
                let r = row + dr;
                let c = col + dc;
                while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && this.board.get(r, c) === player) {
                    line.push([r, c]);
                    r += dr;
                    c += dc;
                }
            }

            if (line.length >= 5) {
                return line;
            }
        }

        return null;
    }

    restart() {
        this.board.reset();
        this.currentPlayer = PLAYERS.BLACK;
        this.state = GAME_STATES.PLAYING;
        this.history = [];
        this.winner = null;
        this.winLine = null;
        this._render();
    }

    undo() {
        if (this.history.length === 0) {
            return;
        }

        if (this.state === GAME_STATES.GAME_OVER) {
            this.state = GAME_STATES.PLAYING;
            this.winner = null;
            this.winLine = null;
        }

        const lastMove = this.history.pop();
        this.board.set(lastMove.row, lastMove.col, null);
        this.currentPlayer = lastMove.player;
        this._render();
    }

    _render() {
        this.renderer.clear();
        this.renderer.drawBoard();
        this.renderer.drawStones(this.board);
        
        if (this.history.length > 0) {
            const lastMove = this.history[this.history.length - 1];
            this.renderer.drawLastMove(lastMove.row, lastMove.col);
        }

        if (this.winLine) {
            this.renderer.drawWinLine(this.winLine);
        }

        this.renderer.drawStatus(this.currentPlayer, this.state, this.winner);
    }
}
