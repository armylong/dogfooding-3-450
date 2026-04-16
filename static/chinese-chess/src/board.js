import { COLS, ROWS, PIECES, SIDES } from './config.js';

export class Board {
    constructor() {
        this.grid = [];
        this.reset();
    }

    reset() {
        this.grid = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
        
        this._placePieces(SIDES.BLACK, 0);
        this._placePieces(SIDES.RED, 9);
    }

    _placePieces(side, baseRow) {
        const direction = side === SIDES.BLACK ? 1 : -1;
        const backRow = baseRow;
        const pawnRow = baseRow + direction * 3;

        this.grid[backRow][0] = { type: PIECES.ROOK, side };
        this.grid[backRow][1] = { type: PIECES.KNIGHT, side };
        this.grid[backRow][2] = { type: PIECES.BISHOP, side };
        this.grid[backRow][3] = { type: PIECES.ADVISOR, side };
        this.grid[backRow][4] = { type: PIECES.KING, side };
        this.grid[backRow][5] = { type: PIECES.ADVISOR, side };
        this.grid[backRow][6] = { type: PIECES.BISHOP, side };
        this.grid[backRow][7] = { type: PIECES.KNIGHT, side };
        this.grid[backRow][8] = { type: PIECES.ROOK, side };

        this.grid[backRow + direction * 2][1] = { type: PIECES.CANNON, side };
        this.grid[backRow + direction * 2][7] = { type: PIECES.CANNON, side };

        for (let col = 0; col < 9; col += 2) {
            this.grid[pawnRow][col] = { type: PIECES.PAWN, side };
        }
    }

    get(row, col) {
        if (row < 0 || row >= ROWS || col < 0 || col >= COLS) {
            return null;
        }
        return this.grid[row][col];
    }

    move(fromRow, fromCol, toRow, toCol) {
        this.grid[toRow][toCol] = this.grid[fromRow][fromCol];
        this.grid[fromRow][fromCol] = null;
    }

    getValidMoves(row, col, piece) {
        const moves = [];
        
        switch (piece.type) {
            case PIECES.KING:
                this._getKingMoves(row, col, piece, moves);
                break;
            case PIECES.ADVISOR:
                this._getAdvisorMoves(row, col, piece, moves);
                break;
            case PIECES.BISHOP:
                this._getBishopMoves(row, col, piece, moves);
                break;
            case PIECES.KNIGHT:
                this._getKnightMoves(row, col, piece, moves);
                break;
            case PIECES.ROOK:
                this._getRookMoves(row, col, piece, moves);
                break;
            case PIECES.CANNON:
                this._getCannonMoves(row, col, piece, moves);
                break;
            case PIECES.PAWN:
                this._getPawnMoves(row, col, piece, moves);
                break;
        }

        return moves;
    }

    _isValidPosition(row, col) {
        return row >= 0 && row < ROWS && col >= 0 && col < COLS;
    }

    _canMoveTo(row, col, side) {
        const piece = this.get(row, col);
        return !piece || piece.side !== side;
    }

    _getKingMoves(row, col, piece, moves) {
        const palace = piece.side === SIDES.RED ? { minRow: 7, maxRow: 9 } : { minRow: 0, maxRow: 2 };
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];

        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            if (newRow >= palace.minRow && newRow <= palace.maxRow && newCol >= 3 && newCol <= 5) {
                if (this._canMoveTo(newRow, newCol, piece.side)) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }
    }

    _getAdvisorMoves(row, col, piece, moves) {
        const palace = piece.side === SIDES.RED ? { minRow: 7, maxRow: 9 } : { minRow: 0, maxRow: 2 };
        const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            if (newRow >= palace.minRow && newRow <= palace.maxRow && newCol >= 3 && newCol <= 5) {
                if (this._canMoveTo(newRow, newCol, piece.side)) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }
    }

    _getBishopMoves(row, col, piece, moves) {
        const boundary = piece.side === SIDES.RED ? 5 : 4;
        const directions = [[2, 2], [2, -2], [-2, 2], [-2, -2]];
        const blocks = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

        for (let i = 0; i < directions.length; i++) {
            const [dr, dc] = directions[i];
            const [br, bc] = blocks[i];
            const newRow = row + dr;
            const newCol = col + dc;
            const blockRow = row + br;
            const blockCol = col + bc;

            const validRow = piece.side === SIDES.RED ? newRow >= boundary : newRow <= boundary;

            if (this._isValidPosition(newRow, newCol) && validRow) {
                if (!this.get(blockRow, blockCol) && this._canMoveTo(newRow, newCol, piece.side)) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }
    }

    _getKnightMoves(row, col, piece, moves) {
        const jumps = [
            { dr: -2, dc: -1, br: -1, bc: 0 },
            { dr: -2, dc: 1, br: -1, bc: 0 },
            { dr: 2, dc: -1, br: 1, bc: 0 },
            { dr: 2, dc: 1, br: 1, bc: 0 },
            { dr: -1, dc: -2, br: 0, bc: -1 },
            { dr: -1, dc: 2, br: 0, bc: 1 },
            { dr: 1, dc: -2, br: 0, bc: -1 },
            { dr: 1, dc: 2, br: 0, bc: 1 }
        ];

        for (const jump of jumps) {
            const newRow = row + jump.dr;
            const newCol = col + jump.dc;
            const blockRow = row + jump.br;
            const blockCol = col + jump.bc;

            if (this._isValidPosition(newRow, newCol)) {
                if (!this.get(blockRow, blockCol) && this._canMoveTo(newRow, newCol, piece.side)) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }
    }

    _getRookMoves(row, col, piece, moves) {
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];

        for (const [dr, dc] of directions) {
            let newRow = row + dr;
            let newCol = col + dc;

            while (this._isValidPosition(newRow, newCol)) {
                const target = this.get(newRow, newCol);
                if (!target) {
                    moves.push({ row: newRow, col: newCol });
                } else {
                    if (target.side !== piece.side) {
                        moves.push({ row: newRow, col: newCol });
                    }
                    break;
                }
                newRow += dr;
                newCol += dc;
            }
        }
    }

    _getCannonMoves(row, col, piece, moves) {
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];

        for (const [dr, dc] of directions) {
            let newRow = row + dr;
            let newCol = col + dc;
            let jumped = false;

            while (this._isValidPosition(newRow, newCol)) {
                const target = this.get(newRow, newCol);
                if (!jumped) {
                    if (!target) {
                        moves.push({ row: newRow, col: newCol });
                    } else {
                        jumped = true;
                    }
                } else {
                    if (target) {
                        if (target.side !== piece.side) {
                            moves.push({ row: newRow, col: newCol });
                        }
                        break;
                    }
                }
                newRow += dr;
                newCol += dc;
            }
        }
    }

    _getPawnMoves(row, col, piece, moves) {
        const forward = piece.side === SIDES.RED ? -1 : 1;
        const crossed = piece.side === SIDES.RED ? row <= 4 : row >= 5;

        const newRow = row + forward;
        if (this._isValidPosition(newRow, col) && this._canMoveTo(newRow, col, piece.side)) {
            moves.push({ row: newRow, col: col });
        }

        if (crossed) {
            for (const dc of [-1, 1]) {
                const newCol = col + dc;
                if (this._isValidPosition(row, newCol) && this._canMoveTo(row, newCol, piece.side)) {
                    moves.push({ row: row, col: newCol });
                }
            }
        }
    }
}
