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
        this.captures = { black: 0, white: 0 };
        this.lastMove = null;
        this.koPoint = null;
        this.consecutivePasses = 0;

        this._init();
    }

    _init() {
        const size = (BOARD_SIZE + 1) * CELL_SIZE;
        this.canvas.width = size;
        this.canvas.height = size + 80;
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

        if (this.koPoint && this.koPoint.row === row && this.koPoint.col === col) {
            return;
        }

        this._makeMove(row, col);
    }

    _makeMove(row, col) {
        const previousBoard = this.board.copy();
        const previousCaptures = { ...this.captures };

        this.board.set(row, col, this.currentPlayer);
        const captured = this.board.removeDeadStones(this.currentPlayer === PLAYERS.BLACK ? PLAYERS.WHITE : PLAYERS.BLACK);

        if (this.currentPlayer === PLAYERS.BLACK) {
            this.captures.black += captured.length;
        } else {
            this.captures.white += captured.length;
        }

        if (!this.board.hasLiberties(row, col)) {
            this.board = previousBoard;
            this.captures = previousCaptures;
            return;
        }

        this.history.push({
            board: previousBoard,
            captures: previousCaptures,
            player: this.currentPlayer,
            koPoint: this.koPoint
        });

        if (captured.length === 1) {
            const capturedStone = captured[0];
            const neighbors = this.board.getNeighbors(row, col);
            let isKo = true;
            for (const n of neighbors) {
                if (this.board.get(n.row, n.col) === null && !(n.row === capturedStone.row && n.col === capturedStone.col)) {
                    isKo = false;
                    break;
                }
            }
            if (isKo && this.board.countLiberties(row, col) === 1) {
                this.koPoint = capturedStone;
            } else {
                this.koPoint = null;
            }
        } else {
            this.koPoint = null;
        }

        this.lastMove = { row, col };
        this.consecutivePasses = 0;
        this.currentPlayer = this.currentPlayer === PLAYERS.BLACK ? PLAYERS.WHITE : PLAYERS.BLACK;
        this._render();
    }

    pass() {
        if (this.state !== GAME_STATES.PLAYING) {
            return;
        }

        this.history.push({
            board: this.board.copy(),
            captures: { ...this.captures },
            player: this.currentPlayer,
            koPoint: this.koPoint
        });

        this.consecutivePasses++;
        this.koPoint = null;
        this.lastMove = null;

        if (this.consecutivePasses >= 2) {
            this.state = GAME_STATES.GAME_OVER;
        } else {
            this.currentPlayer = this.currentPlayer === PLAYERS.BLACK ? PLAYERS.WHITE : PLAYERS.BLACK;
        }

        this._render();
    }

    undo() {
        if (this.history.length === 0) {
            return;
        }

        const lastState = this.history.pop();
        this.board = lastState.board;
        this.captures = lastState.captures;
        this.currentPlayer = lastState.player;
        this.koPoint = lastState.koPoint;
        this.state = GAME_STATES.PLAYING;
        this.consecutivePasses = 0;

        if (this.history.length > 0) {
            const prev = this.history[this.history.length - 1];
            this.board = prev.board;
        } else {
            this.lastMove = null;
        }

        this._render();
    }

    restart() {
        this.board = new Board();
        this.currentPlayer = PLAYERS.BLACK;
        this.state = GAME_STATES.PLAYING;
        this.history = [];
        this.captures = { black: 0, white: 0 };
        this.lastMove = null;
        this.koPoint = null;
        this.consecutivePasses = 0;
        this._render();
    }

    _render() {
        this.renderer.clear();
        this.renderer.drawBoard();
        this.renderer.drawStones(this.board);
        
        if (this.lastMove) {
            this.renderer.drawLastMove(this.lastMove.row, this.lastMove.col);
        }

        this.renderer.drawStatus(this.currentPlayer, this.state, this.captures);
    }
}
