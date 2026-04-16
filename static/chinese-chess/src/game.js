import { Board } from './board.js';
import { Renderer } from './renderer.js';
import { CellSize, COLS, ROWS, GAME_STATES, SIDES } from './config.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.renderer = new Renderer(canvas);
        this.board = new Board();
        this.currentSide = SIDES.RED;
        this.state = GAME_STATES.PLAYING;
        this.selectedPiece = null;
        this.validMoves = [];

        this._init();
    }

    _init() {
        this.canvas.width = (COLS + 1) * CellSize;
        this.canvas.height = (ROWS + 2) * CellSize + 40;
        this._render();
    }

    handleClick(x, y) {
        if (this.state !== GAME_STATES.PLAYING) {
            return;
        }

        const col = Math.round((x - CellSize) / CellSize);
        const row = Math.round((y - CellSize) / CellSize);

        if (col < 0 || col >= COLS || row < 0 || row >= ROWS) {
            return;
        }

        const piece = this.board.get(row, col);

        if (this.selectedPiece) {
            const isValidMove = this.validMoves.some(m => m.row === row && m.col === col);
            
            if (isValidMove) {
                this._makeMove(this.selectedPiece.row, this.selectedPiece.col, row, col);
            } else if (piece && piece.side === this.currentSide) {
                this._selectPiece(row, col, piece);
            } else {
                this._clearSelection();
            }
        } else {
            if (piece && piece.side === this.currentSide) {
                this._selectPiece(row, col, piece);
            }
        }

        this._render();
    }

    _selectPiece(row, col, piece) {
        this.selectedPiece = { row, col, piece };
        this.validMoves = this.board.getValidMoves(row, col, piece);
    }

    _clearSelection() {
        this.selectedPiece = null;
        this.validMoves = [];
    }

    _makeMove(fromRow, fromCol, toRow, toCol) {
        const captured = this.board.get(toRow, toCol);
        
        this.board.move(fromRow, fromCol, toRow, toCol);
        this._clearSelection();

        if (captured && captured.type === 'king') {
            this.state = captured.side === SIDES.RED ? GAME_STATES.BLACK_WIN : GAME_STATES.RED_WIN;
        } else {
            this.currentSide = this.currentSide === SIDES.RED ? SIDES.BLACK : SIDES.RED;
        }
    }

    restart() {
        this.board.reset();
        this.currentSide = SIDES.RED;
        this.state = GAME_STATES.PLAYING;
        this._clearSelection();
        this._render();
    }

    _render() {
        this.renderer.clear();
        this.renderer.drawBoard();
        this.renderer.drawPieces(this.board);
        
        if (this.selectedPiece) {
            this.renderer.drawSelection(this.selectedPiece.row, this.selectedPiece.col);
            this.renderer.drawValidMoves(this.validMoves);
        }

        this.renderer.drawStatus(this.currentSide, this.state);
    }
}
