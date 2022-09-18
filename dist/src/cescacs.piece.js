"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.csPieceTypes = exports.Pawn = exports.Almogaver = exports.Elephant = exports.Bishop = exports.Knight = exports.Pegasus = exports.Rook = exports.Wyvern = exports.Queen = exports.King = exports.Piece = void 0;
const cescacs_types_1 = require("./cescacs.types");
const cescacs_positionHelper_1 = require("./cescacs.positionHelper");
const ts_general_1 = require("./ts.general");
const cescacs_1 = require("./cescacs");
class Piece {
    constructor(color) {
        this.color = color;
    }
    static pieceValue(symbol) {
        switch (symbol) {
            case "K": return 256;
            case "D": return 15;
            case "V": return 14;
            case "R": return 11;
            case "G": return 8;
            case "N": return 4;
            case "J": return 3;
            case "E":
            case "M": return 2;
            case "P": return 1;
            default: {
                const exhaustiveCheck = symbol;
                throw new Error(exhaustiveCheck);
            }
        }
    }
    static isRegainablePiece(symbol) {
        switch (symbol) {
            case "D":
            case "V":
            case "R":
            case "G":
            case "N":
            case "J": return true;
            default: return false;
        }
    }
    get position() { return this._position; }
    setPositionTo(p) {
        if (this._position == null)
            this._position = p;
        else
            throw new Error("Piece can't be reassigned to a new position");
    }
    moveTo(c, l) {
        if (this._position != null) {
            this._position[0] = c;
            this._position[1] = l;
        }
    }
    get pin() {
        return this._pin;
    }
    set pin(value) {
        this._pin = value;
    }
    get hasOrthogonalAttack() {
        return this.symbol == 'R' || this.symbol == 'V' || this.symbol == 'D';
    }
    get hasDiagonalAttack() {
        return this.symbol == 'J' || this.symbol == 'G' || this.symbol == 'D';
    }
    get hasKnightJumpAttack() {
        return this.symbol == 'N' || this.symbol == 'V' || this.symbol == 'G';
    }
    get hasOnlyCloseAttack() {
        return this.symbol == 'P' || this.symbol == 'E' || this.symbol == 'M' || this.symbol == 'K';
    }
    get isRegainable() {
        return Piece.isRegainablePiece(this.symbol);
    }
    toString() {
        return this.uncapitalizedSymbol + this.position?.toString();
    }
    get uncapitalizedSymbol() {
        return (this.color == "w" ? this.symbol : this.symbol.toLowerCase());
    }
    get symbolPositionString() {
        return this.symbol + (this.position == null ? "" : cescacs_positionHelper_1.PositionHelper.toString(this.position));
    }
    get uncapitalizedSymbolPositionString() {
        return this.uncapitalizedSymbol + (this.position == null ? "" : cescacs_positionHelper_1.PositionHelper.toString(this.position));
    }
    canMoveTo(board, p) {
        return cescacs_positionHelper_1.PositionHelper.positionIteratorIncludes(this.moves(board), p);
    }
    canCaptureOn(board, p) {
        return this.canMoveTo(board, p); //default piece capture same as move
    }
    captured() {
        (0, ts_general_1.assertNonNullish)(this._position, "Don't capture again the piece");
        this._position = null;
    }
    *blockThreat(board, threatBlockingPositions) {
        yield* cescacs_positionHelper_1.PositionHelper.positionIteratorIntersection(this.moves(board), threatBlockingPositions);
    }
    *knightMoves(board, defends = false) {
        if (this._position != null && this.pin == null) {
            for (const pos of cescacs_positionHelper_1.PositionHelper.knightMoves(this._position)) {
                if (defends)
                    yield pos;
                else {
                    const pieceColor = board.hasPiece(pos);
                    if (pieceColor == null || pieceColor !== this.color)
                        yield pos;
                }
            }
        }
    }
    *orthogonalMoves(board, defends = false) {
        if (this._position != null) {
            const orientation = (this.pin == null ? null : cescacs_types_1.csTypes.isOrthogonalOrientation(this.pin) ? this.pin : []);
            for (const direction of (orientation ?? cescacs_types_1.csConvert.orthogonalDirections())) {
                const it = cescacs_positionHelper_1.PositionHelper.orthogonalRide(this._position, direction);
                let v = it.next();
                while (v.done == false) {
                    const pieceColor = board.hasPiece(v.value);
                    if (pieceColor == null) {
                        yield v.value;
                        v = it.next();
                    }
                    else {
                        if (defends || pieceColor !== this.color)
                            yield v.value;
                        v = it.return();
                    }
                }
            }
        }
    }
    *diagonalMoves(board, defends = false) {
        if (this._position != null) {
            const orientation = (this.pin == null ? null : cescacs_types_1.csTypes.isDiagonalOrientation(this.pin) ? this.pin : []);
            for (const direction of (orientation ?? cescacs_types_1.csConvert.diagonalDirections())) {
                const it = cescacs_positionHelper_1.PositionHelper.diagonalRide(this._position, direction);
                let v = it.next();
                while (!v.done) {
                    const pieceColor = board.hasPiece(v.value);
                    if (pieceColor == null) {
                        yield v.value;
                        v = it.next();
                    }
                    else {
                        if (defends || pieceColor !== this.color) {
                            yield v.value;
                        }
                        v = it.return();
                    }
                }
            }
        }
    }
    orthogonalStep(board, direction, capture = true, defends = false) {
        if (this._position != null) {
            const pinOrientation = (this.pin != null && cescacs_types_1.csTypes.isOrthogonalOrientation(this.pin) ? this.pin : null);
            if (this._pin == null || this._pin.includes(direction)) {
                const pos = cescacs_positionHelper_1.PositionHelper.orthogonalStep(this._position, direction);
                if (pos != undefined) {
                    const pieceColor = board.hasPiece(pos);
                    if (defends || pieceColor == null || (capture && pieceColor !== this.color))
                        return pos;
                    else
                        return null;
                }
                else
                    return null;
            }
            else
                return null;
        }
        else
            return null;
    }
    diagonalStep(board, direction, capture = true, defends = false) {
        if (this._position != null) {
            if (this._pin == null || this._pin.includes(direction)) {
                const pos = cescacs_positionHelper_1.PositionHelper.diagonalStep(this._position, direction);
                if (pos != undefined) {
                    const pieceColor = board.hasPiece(pos);
                    if (defends || pieceColor == null || (capture && pieceColor !== this.color))
                        return pos;
                    else
                        return null;
                }
                else
                    return null;
            }
            else
                return null;
        }
        else
            return null;
    }
    canMoveOrthogonallyTo(board, p, capture = true) {
        if (this.position != null) {
            const direction = cescacs_positionHelper_1.PositionHelper.isOrthogonally(this.position, p);
            if (direction != null && (this._pin == null || this._pin.includes(direction))) {
                const pieceColor = board.hasPiece(p);
                if (pieceColor == null || capture && pieceColor != this.color) {
                    for (const pos of cescacs_positionHelper_1.PositionHelper.orthogonalRide(this.position, direction)) {
                        if (cescacs_positionHelper_1.PositionHelper.equals(p, pos))
                            return true;
                        else if (board.hasPiece(pos) != null)
                            return false;
                    }
                    return false;
                }
                else
                    return false;
            }
            else
                return false;
        }
        else
            return false;
    }
    canMoveDiagonallyTo(board, p, capture = true) {
        if (this.position != null) {
            const direction = cescacs_positionHelper_1.PositionHelper.isDiagonally(this.position, p);
            if (direction != null && (this._pin == null || this._pin.includes(direction))) {
                const pieceColor = board.hasPiece(p);
                if (pieceColor == null || capture && pieceColor != this.color) {
                    for (const pos of cescacs_positionHelper_1.PositionHelper.diagonalRide(this.position, direction)) {
                        if (cescacs_positionHelper_1.PositionHelper.equals(p, pos))
                            return true;
                        else if (board.hasPiece(pos) != null)
                            return false;
                    }
                    return false;
                }
                else
                    return false;
            }
            else
                return false;
        }
        else
            return false;
    }
}
exports.Piece = Piece;
class King extends Piece {
    constructor(color) {
        super(color);
        this.symbol = "K";
        this.value = 0;
        this._moved = false;
        this.checkPosition = null;
        this.key = color + this.symbol;
    }
    setPositionTo(pos) {
        super.setPositionTo(pos);
        this._moved = !this.isInitialPosition;
    }
    setToInitialPosition() {
        super.setPositionTo(this.initialPosiition);
        this._moved = false;
    }
    get checked() {
        return this.checkPosition != null;
    }
    get moved() {
        return this._moved;
    }
    set castlingStatus(castlingStatusValue) {
        this._moved = this._moved || (castlingStatusValue == "-");
    }
    getCastlingStatus(callback) {
        if (this._moved)
            return "-";
        else {
            const rK = callback.getPiece(cescacs_positionHelper_1.PositionHelper.initialKingSideRookPosition(this.color, callback.isGrand));
            const rQ = callback.getPiece(cescacs_positionHelper_1.PositionHelper.initialQueenSideRookPosition(this.color, callback.isGrand));
            if (rK != null && rK.color == this.color && csPieceTypes.isRook(rK) && !rK.moved) {
                if (rQ != null && rQ.color == this.color && csPieceTypes.isRook(rQ) && !rQ.moved) {
                    return "RKR";
                }
                else
                    return "KR";
            }
            else if (rQ != null && rQ.color == this.color && csPieceTypes.isRook(rQ) && !rQ.moved) {
                return "KR";
            }
            else
                return "K";
        }
    }
    moveTo(c, l) {
        super.moveTo(c, l);
        this._moved = true;
    }
    *moves(board) {
        if (this.checked) {
            //King's pin is used for the direction of the attack, as backwards there's still no threat detected, cause of the king's shade
            (0, ts_general_1.assertNonNullish)(this.position);
            (0, ts_general_1.assertNonNullish)(this.checkPosition);
            for (const direction of cescacs_types_1.csConvert.orthogonalDirections()) {
                const pos = cescacs_positionHelper_1.PositionHelper.orthogonalStep(this.position, direction);
                if (pos != undefined) {
                    if (this.pin == null || !(this.pin.includes(direction)) || cescacs_types_1.csTypes.isCheckAttackPos(this.checkPosition, pos)) {
                        const pieceColor = board.hasPiece(pos);
                        if ((pieceColor == null || pieceColor != this.color) && !board.isThreatened(pos, this.color))
                            yield pos;
                    }
                }
            }
            for (const direction of cescacs_types_1.csConvert.diagonalDirections()) {
                const pos = cescacs_positionHelper_1.PositionHelper.diagonalStep(this.position, direction);
                if (pos != undefined) {
                    if (this.pin == null || !(this.pin.includes(direction)) || cescacs_types_1.csTypes.isCheckAttackPos(this.checkPosition, pos)) {
                        const pieceColor = board.hasPiece(pos);
                        if ((pieceColor == null || pieceColor != this.color) && !board.isThreatened(pos, this.color))
                            yield pos;
                    }
                }
            }
        }
        else {
            for (const m of this.attemptMoves(board)) {
                if (!board.isThreatened(m, this.color))
                    yield m;
            }
        }
    }
    markThreats(board) {
        for (const p of this.attemptMoves(board, true)) {
            //if (!board.isThreated(p, this.color))
            board.setThreat(p, this.color);
        }
    }
    computeCheckAndPins(board) {
        this.checkPosition = null;
        console.log(`Compute ${this.color} pins`);
        for (const p of cescacs_positionHelper_1.PositionHelper.knightMoves(this.position)) {
            const piece = board.getPiece(p);
            if (piece != null && piece.color != this.color && piece.hasKnightJumpAttack) {
                this.setKnightOrCloseAttack(p);
            }
        }
        for (const d of cescacs_types_1.csConvert.orthogonalDirections()) {
            const it = cescacs_positionHelper_1.PositionHelper.orthogonalRide(this.position, d);
            let v = it.next();
            let isCloseAttack = true;
            while (!v.done) {
                const p = v.value;
                const piece = board.getPiece(p);
                if (piece == null) {
                    isCloseAttack = false;
                    v = it.next();
                }
                else {
                    if (piece.color != this.color) {
                        if (isCloseAttack) {
                            if (piece.hasOrthogonalAttack)
                                this.setKnightOrCloseAttack(p, d);
                            else if (piece.hasOnlyCloseAttack && piece.canCaptureOn(board, this.position)) {
                                this.setKnightOrCloseAttack(p);
                            }
                        }
                        else if (piece.hasOrthogonalAttack) {
                            this.setOrthogonalAtack(p, d);
                        }
                    }
                    else {
                        const it2 = cescacs_positionHelper_1.PositionHelper.orthogonalRide(p, d);
                        let v2 = it2.next();
                        while (!v2.done) {
                            const p2 = v2.value;
                            const piece2 = board.getPiece(p2);
                            if (piece2 == null)
                                v2 = it2.next();
                            else {
                                if (piece2.color != this.color && piece2.hasOrthogonalAttack) {
                                    piece.pin = cescacs_types_1.csConvert.getOrthogonalOrientation(d);
                                }
                                v2 = it2.return();
                            }
                        }
                    }
                    v = it.return();
                }
            }
        }
        for (const d of cescacs_types_1.csConvert.diagonalDirections()) {
            const it = cescacs_positionHelper_1.PositionHelper.diagonalRide(this.position, d);
            let v = it.next();
            let isCloseAttack = true;
            while (!v.done) {
                const p = v.value;
                const piece = board.getPiece(p);
                if (piece == null) {
                    isCloseAttack = false;
                    v = it.next();
                }
                else {
                    if (piece.color != this.color) {
                        if (isCloseAttack) {
                            if (piece.hasDiagonalAttack)
                                this.setKnightOrCloseAttack(p, d);
                            else if (piece.hasOnlyCloseAttack && piece.canCaptureOn(board, this.position)) {
                                this.setKnightOrCloseAttack(p);
                            }
                        }
                        else if (piece.hasDiagonalAttack) {
                            this.setDiagonalAtack(p, d);
                        }
                    }
                    else {
                        const it2 = cescacs_positionHelper_1.PositionHelper.diagonalRide(p, d);
                        let v2 = it2.next();
                        while (!v2.done) {
                            const p2 = v2.value;
                            const piece2 = board.getPiece(p2);
                            if (piece2 == null)
                                v2 = it2.next();
                            else {
                                if (piece2.color != this.color && piece2.hasDiagonalAttack) {
                                    piece.pin = cescacs_types_1.csConvert.getDiagonalOrientation(d);
                                }
                                v2 = it2.return();
                            }
                        }
                    }
                    v = it.return();
                }
            }
        }
    }
    isKnightOrCloseCheck() {
        return this.checkPosition != null && cescacs_types_1.csTypes.isPosition(this.checkPosition);
    }
    isSingleCheck() {
        return this.checkPosition != null && cescacs_types_1.csTypes.isSingleCheck(this.checkPosition);
    }
    isDoubleCheck() {
        return this.checkPosition != null
            && !cescacs_types_1.csTypes.isPosition(this.checkPosition)
            && !cescacs_types_1.csTypes.isSingleCheck(this.checkPosition);
    }
    get checkThreat() {
        if (this.checkPosition != null) {
            if (cescacs_types_1.csTypes.isPosition(this.checkPosition))
                return this.checkPosition;
            else if (cescacs_types_1.csTypes.isSingleCheck(this.checkPosition))
                return this.checkPosition.p;
            else
                return null;
        }
        else
            return null;
    }
    getSingleCheckBlockingPositions(board) {
        const r = [];
        (0, ts_general_1.assertNonNullish)(this.position);
        if (cescacs_types_1.csTypes.isSingleCheck(this.checkPosition)) {
            const d = this.checkPosition.d;
            if (cescacs_types_1.csTypes.isDiagonalDirection(d)) {
                for (const p of cescacs_positionHelper_1.PositionHelper.diagonalRide(this.position, d)) {
                    if (board.hasPiece(p) == null)
                        r.push(p);
                    else
                        break;
                }
            }
            else if (cescacs_types_1.csTypes.isOrthogonalDirection(d)) {
                for (const p of cescacs_positionHelper_1.PositionHelper.orthogonalRide(this.position, d)) {
                    if (board.hasPiece(p) == null)
                        r.push(p);
                    else
                        break;
                }
            }
        }
        return r;
    }
    //NOT USED THIS WAY (castlingStrMoves is defined on Board)
    // public * castlings(board: IBoard): Generator<[Nullable<Position>, Position, Nullable<Position>], void, void> {
    //     // - No check on final king position
    //     // - Empty hexes
    //     // - Rook can do the move
    //     if (!this._moved && !this.checked) {
    //         const isWhite: boolean = this.color == "White";
    //         const qRookPos: Position = PositionHelper.initialQueenSideRookPosition(this.color, board.isGrand);
    //         const kRookPos: Position = PositionHelper.initialKingSideRookPosition(this.color, board.isGrand);
    //         const qRook: Nullable<Rook> = board.getPiece(qRookPos) as Nullable<Rook>;
    //         const kRook: Nullable<Rook> = board.getPiece(kRookPos) as Nullable<Rook>;
    //         if (qRook != null && !qRook.moved) {
    //             yield [PositionHelper.fromBoardPosition("D", isWhite ? 4 : 24), PositionHelper.fromBoardPosition("D", isWhite ? 2 : 26), null];
    //             yield [PositionHelper.fromBoardPosition("E", isWhite ? 1 : 27), PositionHelper.fromBoardPosition("D", isWhite ? 2 : 26), null];
    //             yield [PositionHelper.fromBoardPosition("H", isWhite ? 8 : 20), PositionHelper.fromBoardPosition("H", isWhite ? 6 : 22), null];
    //             yield [PositionHelper.fromBoardPosition("G", isWhite ? 7 : 21), PositionHelper.fromBoardPosition("H", isWhite ? 6 : 22), null];
    //             yield [PositionHelper.fromBoardPosition("G", isWhite ? 7 : 21), PositionHelper.fromBoardPosition("F", isWhite ? 6 : 22), null];
    //             yield [PositionHelper.fromBoardPosition("E", isWhite ? 5 : 23), PositionHelper.fromBoardPosition("F", isWhite ? 6 : 22), null];
    //             yield [PositionHelper.fromBoardPosition("F", isWhite ? 6 : 22), PositionHelper.fromBoardPosition("E", isWhite ? 5 : 23), null];
    //             yield [PositionHelper.fromBoardPosition("D", isWhite ? 4 : 24), PositionHelper.fromBoardPosition("E", isWhite ? 5 : 23), null];
    //         }
    //         if (kRook != null && !kRook.moved) {
    //             yield [null, PositionHelper.fromBoardPosition("I", isWhite ? 5 : 23), PositionHelper.fromBoardPosition("I", isWhite ? 7 : 21)];
    //             yield [null, PositionHelper.fromBoardPosition("I", isWhite ? 5 : 23), PositionHelper.fromBoardPosition("K", isWhite ? 4 : 24)];
    //             yield [null, PositionHelper.fromBoardPosition("I", isWhite ? 5 : 23), PositionHelper.fromBoardPosition("H", isWhite ? 4 : 24)];
    //             yield [null, PositionHelper.fromBoardPosition("H", isWhite ? 6 : 22), PositionHelper.fromBoardPosition("I", isWhite ? 5 : 23)];
    //             yield [null, PositionHelper.fromBoardPosition("H", isWhite ? 6 : 22), PositionHelper.fromBoardPosition("I", isWhite ? 7 : 21)];
    //             yield [null, PositionHelper.fromBoardPosition("H", isWhite ? 6 : 22), PositionHelper.fromBoardPosition("H", isWhite ? 4 : 24)];
    //             yield [null, PositionHelper.fromBoardPosition("H", isWhite ? 6 : 22), PositionHelper.fromBoardPosition("G", isWhite ? 5 : 23)];
    //             yield [null, PositionHelper.fromBoardPosition("F", isWhite ? 6 : 22), PositionHelper.fromBoardPosition("G", isWhite ? 5 : 23)];
    //             yield [null, PositionHelper.fromBoardPosition("F", isWhite ? 6 : 22), PositionHelper.fromBoardPosition("E", isWhite ? 7 : 21)];
    //             yield [null, PositionHelper.fromBoardPosition("E", isWhite ? 5 : 23), PositionHelper.fromBoardPosition("F", isWhite ? 6 : 22)];
    //             yield [null, PositionHelper.fromBoardPosition("E", isWhite ? 5 : 23), PositionHelper.fromBoardPosition("F", isWhite ? 7 : 21)];
    //         }
    //         if (qRook != null && !qRook.moved && kRook != null && !kRook.moved) {
    //             yield [PositionHelper.fromBoardPosition("H", isWhite ? 8 : 20), PositionHelper.fromBoardPosition("H", isWhite ? 6 : 22), PositionHelper.fromBoardPosition("H", isWhite ? 6 : 22)];
    //             yield [PositionHelper.fromBoardPosition("I", isWhite ? 7 : 21), PositionHelper.fromBoardPosition("H", isWhite ? 6 : 22), PositionHelper.fromBoardPosition("G", isWhite ? 5 : 23)];
    //             yield [PositionHelper.fromBoardPosition("G", isWhite ? 7 : 21), PositionHelper.fromBoardPosition("F", isWhite ? 6 : 22), PositionHelper.fromBoardPosition("G", isWhite ? 5 : 23)];
    //             yield [PositionHelper.fromBoardPosition("E", isWhite ? 5 : 23), PositionHelper.fromBoardPosition("F", isWhite ? 6 : 22), PositionHelper.fromBoardPosition("E", isWhite ? 7 : 21)];
    //             yield [PositionHelper.fromBoardPosition("F", isWhite ? 6 : 22), PositionHelper.fromBoardPosition("E", isWhite ? 5 : 23), PositionHelper.fromBoardPosition("E", isWhite ? 7 : 21)];
    //         }
    //     }
    // }
    setOrthogonalAtack(pos, dir) {
        if (this.checkPosition != null) {
            if (cescacs_types_1.csTypes.isPosition(this.checkPosition)) {
                this.checkPosition = [this.checkPosition, pos, null];
                this.pin = cescacs_types_1.csConvert.getOrthogonalOrientation(dir);
            }
            else if (cescacs_types_1.csTypes.isSingleCheck(this.checkPosition)) {
                this.checkPosition = [this.checkPosition.p, pos, cescacs_types_1.csConvert.getOrthogonalOrientation(dir)];
            }
            else {
                throw new Error("Triple check situation can't be achieved in the course of a game");
            }
        }
        else {
            this.checkPosition = { p: pos, d: dir };
            this.pin = cescacs_types_1.csConvert.getOrthogonalOrientation(dir);
        }
    }
    setDiagonalAtack(pos, dir) {
        if (this.checkPosition != null) {
            if (cescacs_types_1.csTypes.isPosition(this.checkPosition)) {
                this.checkPosition = [this.checkPosition, pos, null];
                this.pin = cescacs_types_1.csConvert.getDiagonalOrientation(dir);
            }
            else if (cescacs_types_1.csTypes.isSingleCheck(this.checkPosition)) {
                this.checkPosition = [this.checkPosition.p, pos, cescacs_types_1.csConvert.getDiagonalOrientation(dir)];
            }
            else {
                throw new Error("Triple check situation can't be achieved in the course of a game");
            }
        }
        else {
            this.checkPosition = { p: pos, d: dir };
            this.pin = cescacs_types_1.csConvert.getDiagonalOrientation(dir);
        }
    }
    setKnightOrCloseAttack(value, directional) {
        if (this.checkPosition != null) {
            if (cescacs_types_1.csTypes.isPosition(this.checkPosition)) {
                //this.checkPosition = [this.checkPosition, value];
                throw new Error("Double knight or close check situation can't be achieved in the course of a game");
            }
            else if (cescacs_types_1.csTypes.isSingleCheck(this.checkPosition)) {
                if (directional == null)
                    this.checkPosition = [this.checkPosition.p, value, null];
                else if (cescacs_types_1.csTypes.isOrthogonalDirection(directional)) {
                    this.checkPosition = [this.checkPosition.p, value, cescacs_types_1.csConvert.getOrthogonalOrientation(directional)];
                }
                else {
                    this.checkPosition = [this.checkPosition.p, value, cescacs_types_1.csConvert.getDiagonalOrientation(directional)];
                }
            }
            else {
                throw new Error("Triple check situation can't be reached along a game");
            }
        }
        else {
            this.checkPosition = value;
            if (directional != null) {
                this.pin = cescacs_types_1.csTypes.isOrthogonalDirection(directional) ?
                    cescacs_types_1.csConvert.getOrthogonalOrientation(directional)
                    : cescacs_types_1.csConvert.getDiagonalOrientation(directional);
            }
        }
    }
    *orthogonalStepList(board, defends) {
        (0, ts_general_1.assertNonNullish)(this.position);
        for (const direction of cescacs_types_1.csConvert.orthogonalDirections()) {
            const pos = cescacs_positionHelper_1.PositionHelper.orthogonalStep(this.position, direction);
            if (pos != undefined) {
                if (defends)
                    yield pos;
                else {
                    const pieceColor = board.hasPiece(pos);
                    if (pieceColor == null || pieceColor !== this.color)
                        yield pos;
                }
            }
        }
    }
    *diagonalStepList(board, defends) {
        (0, ts_general_1.assertNonNullish)(this.position);
        for (const direction of cescacs_types_1.csConvert.diagonalDirections()) {
            const pos = cescacs_positionHelper_1.PositionHelper.diagonalStep(this.position, direction);
            if (pos != undefined) {
                if (defends)
                    yield pos;
                else {
                    const pieceColor = board.hasPiece(pos);
                    if (pieceColor == null || pieceColor !== this.color)
                        yield pos;
                }
            }
        }
    }
    *attemptMoves(board, defends = false) {
        yield* this.orthogonalStepList(board, defends);
        yield* this.diagonalStepList(board, defends);
        if (!this._moved && !this.checked) {
            yield* this.knightMoves(board);
        }
    }
    get initialPosiition() {
        return this.color == "w" ? cescacs_positionHelper_1.PositionHelper.whiteKingInitPosition : cescacs_positionHelper_1.PositionHelper.blackKingInitPosition;
    }
    get isInitialPosition() {
        if (this.position == null)
            return false;
        else
            return this.position[0] == 8
                && (this.color == "w" && this.position[1] == 1 || this.color == "b" && this.position[1] == 27);
    }
}
exports.King = King;
class Queen extends Piece {
    constructor(color, column, line) {
        super(color);
        this.symbol = "D";
        this.value = 15;
        this.key = color + this.symbol;
        if (column !== undefined) {
            (0, ts_general_1.assertCondition)(cescacs_types_1.csTypes.isColumn(column));
            (0, ts_general_1.assertNonNullish)(line, "line of the column");
            super.setPositionTo(cescacs_positionHelper_1.PositionHelper.fromBoardPosition(column, line, true));
        }
    }
    *moves(board) {
        yield* this.orthogonalMoves(board);
        yield* this.diagonalMoves(board);
    }
    canMoveTo(board, p) {
        return super.canMoveOrthogonallyTo(board, p) || super.canMoveDiagonallyTo(board, p);
    }
    markThreats(board) {
        for (const p of this.orthogonalMoves(board, true)) {
            board.setThreat(p, this.color);
        }
        for (const p of this.diagonalMoves(board, true)) {
            board.setThreat(p, this.color);
        }
    }
}
exports.Queen = Queen;
class Wyvern extends Piece {
    constructor(color, column, line) {
        super(color);
        this.symbol = "V";
        this.value = 14;
        this.key = color + this.symbol;
        if (column !== undefined) {
            (0, ts_general_1.assertCondition)(cescacs_types_1.csTypes.isColumn(column));
            (0, ts_general_1.assertNonNullish)(line, "line of the column");
            super.setPositionTo(cescacs_positionHelper_1.PositionHelper.fromBoardPosition(column, line, true));
        }
    }
    *moves(board) {
        yield* this.orthogonalMoves(board);
        yield* this.knightMoves(board);
    }
    canMoveTo(board, p) {
        return super.canMoveOrthogonallyTo(board, p) ||
            cescacs_positionHelper_1.PositionHelper.positionIteratorIncludes(this.knightMoves(board), p);
    }
    markThreats(board) {
        for (const p of this.orthogonalMoves(board, true)) {
            board.setThreat(p, this.color);
        }
        for (const p of this.knightMoves(board, true)) {
            board.setThreat(p, this.color);
        }
    }
}
exports.Wyvern = Wyvern;
class Rook extends Piece {
    constructor(color, grand, columnOrNumber, line) {
        super(color);
        this.symbol = "R";
        this.value = 11;
        if (line !== undefined) {
            (0, ts_general_1.assertCondition)(cescacs_types_1.csTypes.isColumn(columnOrNumber));
            super.setPositionTo(cescacs_positionHelper_1.PositionHelper.fromBoardPosition(columnOrNumber, line, true));
            this.key = color + this.symbol +
                (this.isKingSide(grand) ? "k" : this.isQueenSide(grand) ? "q" : (columnOrNumber + line));
            // first moved heuristic aprox; but needs castlingStatus
            this._moved = !this.isKingSide(grand) && !this.isQueenSide(grand);
        }
        else {
            (0, ts_general_1.assertCondition)(typeof columnOrNumber == "number", `instance number of piece ${this.symbol}`);
            this.key = color + this.symbol + columnOrNumber;
            this._moved = false;
        }
    }
    setPositionTo(pos) {
        super.setPositionTo(pos);
        // first moved heuristic aprox; but needs castlingStatus
        this._moved = !this.isQueenSide(false) && !this.isKingSide(false)
            && !this.isQueenSide(true) && !this.isKingSide(true);
    }
    isQueenSide(grand) {
        if (this.position == null)
            return false;
        else if (grand)
            return this.position[0] == 3 && (this.color == "w" ? this.position[1] == 4 : this.position[1] == 24);
        else
            return this.position[0] == 4 && (this.color == "w" ? this.position[1] == 3 : this.position[1] == 25);
    }
    isKingSide(grand) {
        if (this.position == null)
            return false;
        else if (grand)
            return this.position[0] == 11 && (this.color == "w" ? this.position[1] == 4 : this.position[1] == 24);
        else
            return this.position[0] == 10 && (this.color == "w" ? this.position[1] == 3 : this.position[1] == 25);
    }
    *moves(board) {
        yield* this.orthogonalMoves(board);
    }
    moveTo(c, l) {
        super.moveTo(c, l);
        this._moved = true;
    }
    canMoveTo(board, p, capture = true) {
        return super.canMoveOrthogonallyTo(board, p, capture);
    }
    markThreats(board) {
        for (const p of this.orthogonalMoves(board, true)) {
            board.setThreat(p, this.color);
        }
    }
    setCastlingStatus(value, grand) {
        this._moved = this.isQueenSide(grand) ? !value.startsWith("R")
            : this.isKingSide(grand) ? !value.endsWith("R")
                : true;
    }
    get moved() {
        return this._moved;
    }
}
exports.Rook = Rook;
class Pegasus extends Piece {
    constructor(color, columnOrNumber, line) {
        super(color);
        this.symbol = "G";
        this.value = 8;
        if (line !== undefined) {
            (0, ts_general_1.assertCondition)(cescacs_types_1.csTypes.isColumn(columnOrNumber));
            super.setPositionTo(cescacs_positionHelper_1.PositionHelper.fromBoardPosition(columnOrNumber, line, true));
            this.key = color + this.symbol + columnOrNumber + line;
        }
        else {
            (0, ts_general_1.assertCondition)(typeof columnOrNumber == "number", `instance number of piece ${this.symbol}`);
            this.key = color + this.symbol + columnOrNumber;
        }
    }
    *moves(board) {
        yield* this.diagonalMoves(board);
        yield* this.knightMoves(board);
    }
    canMoveTo(board, p) {
        return super.canMoveDiagonallyTo(board, p) ||
            cescacs_positionHelper_1.PositionHelper.positionIteratorIncludes(this.knightMoves(board), p);
    }
    markThreats(board) {
        for (const p of this.diagonalMoves(board, true)) {
            board.setThreat(p, this.color);
        }
        for (const p of this.knightMoves(board, true)) {
            board.setThreat(p, this.color);
        }
    }
}
exports.Pegasus = Pegasus;
class Knight extends Piece {
    constructor(color, columnOrNumber, line) {
        super(color);
        this.symbol = "N";
        this.value = 4;
        if (line !== undefined) {
            (0, ts_general_1.assertCondition)(cescacs_types_1.csTypes.isColumn(columnOrNumber));
            super.setPositionTo(cescacs_positionHelper_1.PositionHelper.fromBoardPosition(columnOrNumber, line, true));
            this.key = color + this.symbol + columnOrNumber + line;
        }
        else {
            (0, ts_general_1.assertCondition)(typeof columnOrNumber == "number", `instance number of piece ${this.symbol}`);
            this.key = color + this.symbol + columnOrNumber;
        }
    }
    *moves(board) {
        yield* this.knightMoves(board);
        if (this.position != undefined && this.pin == null) {
            for (const d of cescacs_types_1.csConvert.knightDirections()) {
                const pos = cescacs_positionHelper_1.PositionHelper.knightJump(this.position, d);
                if (pos != null && board.hasPiece(pos) == null) {
                    const pride = cescacs_positionHelper_1.PositionHelper.knightJump(pos, d);
                    if (pride != null && board.hasPiece(pride) == null)
                        yield pride;
                }
            }
        }
    }
    canCaptureOn(board, p) {
        return cescacs_positionHelper_1.PositionHelper.positionIteratorIncludes(this.knightMoves(board), p);
    }
    markThreats(board) {
        for (const p of this.knightMoves(board, true)) {
            board.setThreat(p, this.color);
        }
    }
}
exports.Knight = Knight;
class Bishop extends Piece {
    constructor(color, columnOrHexcolor, line) {
        super(color);
        this.symbol = "J";
        this.value = 3;
        if (line !== undefined) {
            (0, ts_general_1.assertCondition)(cescacs_types_1.csTypes.isColumn(columnOrHexcolor));
            super.setPositionTo(cescacs_positionHelper_1.PositionHelper.fromBoardPosition(columnOrHexcolor, line, true));
            this.hexesColor = cescacs_positionHelper_1.PositionHelper.hexColor(this.position);
        }
        else if (cescacs_types_1.csTypes.isHexColor(columnOrHexcolor)) {
            this.hexesColor = columnOrHexcolor;
        }
        else
            throw new TypeError("Bishop constructor error");
        this.key = color + this.symbol + this.hexesColor;
    }
    *moves(board) {
        yield* super.diagonalMoves(board);
    }
    canMoveTo(board, p) {
        return super.canMoveDiagonallyTo(board, p);
    }
    markThreats(board) {
        for (const p of super.diagonalMoves(board, true)) {
            board.setThreat(p, this.color);
        }
    }
}
exports.Bishop = Bishop;
class Elephant extends Piece {
    constructor(color, column, line) {
        super(color);
        this.symbol = "E";
        this.value = 2;
        (0, ts_general_1.assertCondition)(cescacs_types_1.csTypes.isColumn(column));
        super.setPositionTo(cescacs_positionHelper_1.PositionHelper.fromBoardPosition(column, line, true));
        this.key = color + this.symbol + column + line;
    }
    *moves(board, defend = false) {
        const piecePos = this.position;
        if (piecePos != null) {
            const pin = this.pin;
            if (pin == null || pin[0] == "ColumnUp" && pin[1] == "ColumnDown") {
                const p = cescacs_positionHelper_1.PositionHelper.orthogonalStep(piecePos, this.ownOrthogonalDirection);
                if (p != null) {
                    const pieceColor = board.hasPiece(p);
                    if (pieceColor == null) {
                        yield p;
                        const p2 = cescacs_positionHelper_1.PositionHelper.orthogonalStep(p, this.ownOrthogonalDirection);
                        if (p2 != null) {
                            const pieceColor2 = board.hasPiece(p2);
                            if (pieceColor2 == null || defend || pieceColor2 != this.color)
                                yield p2;
                        }
                    }
                    else if (pieceColor != this.color) {
                        yield p;
                        if (defend /*hack:It's the only case its needed*/) {
                            const thp = board.getPiece(p);
                            if (cescacs_1.cspty.isKing(thp)) {
                                const p2 = cescacs_positionHelper_1.PositionHelper.orthogonalStep(p, this.ownOrthogonalDirection);
                                if (p2 != null && board.hasPiece(p2) == null)
                                    yield p2;
                            }
                        }
                    }
                    else if (defend)
                        yield p;
                }
            }
            for (const d of ["LineUp", "LineInvUp", "LineDown", "LineInvDown"]) {
                if (pin == null || pin.includes(d)) {
                    const diagP = cescacs_positionHelper_1.PositionHelper.diagonalStep(piecePos, d);
                    if (diagP != null) {
                        const pieceColor = board.hasPiece(diagP);
                        if (pieceColor == null || defend || pieceColor != this.color)
                            yield diagP;
                    }
                }
            }
        }
    }
    markThreats(board) {
        for (const p of this.moves(board, true)) {
            board.setThreat(p, this.color);
        }
    }
    get ownOrthogonalDirection() {
        return this.color === 'w' ? "ColumnUp" : "ColumnDown";
    }
}
exports.Elephant = Elephant;
class Almogaver extends Piece {
    constructor(color, column, line) {
        super(color);
        this.symbol = "M";
        this.value = 2;
        (0, ts_general_1.assertCondition)(cescacs_types_1.csTypes.isColumn(column));
        super.setPositionTo(cescacs_positionHelper_1.PositionHelper.fromBoardPosition(column, line, true));
        this.key = color + this.symbol + column + line;
    }
    *moves(board, onlyCaptures = false) {
        const piecePos = this.position;
        if (piecePos != null) {
            const pin = this.pin;
            if (!onlyCaptures) {
                for (const direction of cescacs_types_1.csConvert.orthogonalDirections()) {
                    if (pin == null || pin.includes(direction)) {
                        const pos = cescacs_positionHelper_1.PositionHelper.orthogonalStep(piecePos, direction);
                        if (pos != null && board.hasPiece(pos) == null) {
                            const pos2 = cescacs_positionHelper_1.PositionHelper.orthogonalStep(pos, direction);
                            if (pos2 != undefined && board.hasPiece(pos2) == null)
                                yield pos2;
                        }
                    }
                }
            }
            for (const direction of cescacs_types_1.csConvert.diagonalDirections()) {
                if (pin == null || pin.includes(direction)) {
                    const p = cescacs_positionHelper_1.PositionHelper.diagonalStep(piecePos, direction);
                    if (p != null) {
                        const pieceColor = board.hasPiece(p);
                        if (pieceColor == null) {
                            const specialCapture = board.specialPawnCapture;
                            if (specialCapture != null && specialCapture.isEnPassantCapturable() && specialCapture.isEnPassantCapture(p))
                                yield p;
                        }
                        else if (pieceColor !== this.color)
                            yield p;
                    }
                }
            }
        }
    }
    canCaptureOn(board, p) {
        return cescacs_positionHelper_1.PositionHelper.positionIteratorIncludes(this.moves(board, true), p);
    }
    markThreats(board) {
        const pawnPos = this.position;
        if (pawnPos != null) {
            const pin = this.pin;
            for (const direction of cescacs_types_1.csConvert.diagonalDirections()) {
                if (pin == null || pin.includes(direction)) {
                    const p = cescacs_positionHelper_1.PositionHelper.diagonalStep(pawnPos, direction);
                    if (p != null)
                        board.setThreat(p, this.color);
                }
            }
        }
    }
}
exports.Almogaver = Almogaver;
class Pawn extends Piece {
    constructor(color, column, line) {
        super(color);
        this.symbol = "P";
        this.value = 1;
        (0, ts_general_1.assertCondition)(cescacs_types_1.csTypes.isColumn(column));
        super.setPositionTo(cescacs_positionHelper_1.PositionHelper.fromBoardPosition(column, line, true));
        this.key = color + this.symbol + column + line;
    }
    *moves(board, onlyCaptures = false) {
        const pawnPos = this.position;
        if (pawnPos != null) {
            const pin = this.pin;
            if (!onlyCaptures) {
                const ownOrthogonalStraight = this.ownOrthogonalStraightDirection;
                if (pin == null || pin[0] == "ColumnUp" && pin[1] == "ColumnDown") {
                    const p = cescacs_positionHelper_1.PositionHelper.orthogonalStep(pawnPos, ownOrthogonalStraight);
                    if (p != null && board.hasPiece(p) == null) {
                        yield p;
                        const p2 = cescacs_positionHelper_1.PositionHelper.orthogonalStep(p, ownOrthogonalStraight);
                        if (p2 != null && board.hasPiece(p2) == null) {
                            yield p2;
                            if (this.hasTripleStep(board.isGrand)) {
                                const p3 = cescacs_positionHelper_1.PositionHelper.orthogonalStep(p2, ownOrthogonalStraight);
                                if (p3 != null && board.hasPiece(p3) == null)
                                    yield p3;
                            }
                        }
                    }
                }
                for (const d of this.ownOrthogonalAlternateDirections) {
                    if (pin == null || pin.includes(d)) {
                        const p = cescacs_positionHelper_1.PositionHelper.orthogonalStep(pawnPos, d);
                        if (p != null && board.hasPiece(p) == null)
                            yield p;
                    }
                }
            }
            const specialCapture = board.specialPawnCapture;
            if (specialCapture != null && specialCapture.isScornfulCapturable() && specialCapture.isScorned(this)) {
                if (this.pin == null)
                    yield specialCapture.capturablePiece.position;
                else {
                    const captureDirection = cescacs_positionHelper_1.PositionHelper.isOrthogonally(pawnPos, specialCapture.capturablePiece.position);
                    if (captureDirection != null && this.pin.includes(captureDirection))
                        yield specialCapture.capturablePiece.position; //pawn, this case
                }
            }
            for (const d of this.ownCaptureDirections) {
                if (pin == null || pin.includes(d)) {
                    const p = cescacs_positionHelper_1.PositionHelper.diagonalStep(pawnPos, d);
                    if (p != null) {
                        const pieceColor = board.hasPiece(p);
                        if (pieceColor != null) {
                            if (pieceColor != this.color)
                                yield p;
                        }
                        else if (specialCapture != null && specialCapture.isEnPassantCapturable() && specialCapture.isEnPassantCapture(p))
                            yield p;
                    }
                }
            }
        }
    }
    canCaptureOn(board, p) {
        return cescacs_positionHelper_1.PositionHelper.positionIteratorIncludes(this.moves(board, true), p);
    }
    markThreats(board) {
        const pawnPos = this.position;
        if (pawnPos != null) {
            const pin = this.pin;
            for (const d of this.ownCaptureDirections) {
                if (pin == null || pin.includes(d)) {
                    const p = cescacs_positionHelper_1.PositionHelper.diagonalStep(pawnPos, d);
                    if (p != null)
                        board.setThreat(p, this.color);
                }
            }
        }
    }
    hasTripleStep(grand) {
        const p = this.position;
        if (p != null) {
            const c = p[0];
            if (c > 3 && c < 7 || c == 3 && !grand) {
                return p[1] == (this.color == "w" ? c + 1 : 27 - c);
            }
            else if (c > 7 && c < 11 || c == 11 && !grand) {
                return p[1] == (this.color == "w" ? 15 - c : 13 + c);
            }
            else if (grand) {
                if (c == 2 || c == 12)
                    return p[1] == (this.color == "w" ? 5 : 23);
                else if (c == 3 || c == 11)
                    return p[1] == (this.color == "w" ? 6 : 22);
                else
                    return false;
            }
            else
                return false;
        }
        else
            return false;
    }
    promoteTo(piece) {
        (0, ts_general_1.assertNonNullish)(this.position, "Pawn to promote is not captured");
        (0, ts_general_1.assertCondition)(cescacs_positionHelper_1.PositionHelper.isPromotionHex(this.position, this.color), `Promotion hex ${cescacs_positionHelper_1.PositionHelper.toString(this.position)}`);
        piece.setPositionTo(this.position);
        this.captured();
    }
    get awaitingPromotion() {
        if (this.position != null)
            return cescacs_positionHelper_1.PositionHelper.isPromotionHex(this.position, this.color) ? cescacs_positionHelper_1.PositionHelper.lineHexColor(this.position[1]) : null;
        else
            return null;
    }
    get ownOrthogonalStraightDirection() {
        return this.color === 'w' ? "ColumnUp" : "ColumnDown";
    }
    get ownOrthogonalAlternateDirections() {
        return this.color === 'w' ? ["FileUp", "FileInvUp"] : ["FileDown", "FileInvDown"];
    }
    get ownCaptureDirections() {
        return this.color == 'w' ? ["LineUp", "LineInvUp"] : ["LineDown", "LineInvDown"];
    }
}
exports.Pawn = Pawn;
var csPieceTypes;
(function (csPieceTypes) {
    //* these functions apply to Piece instance, not valid to check any type
    function isKing(p) { return p.symbol == 'K'; }
    csPieceTypes.isKing = isKing;
    function isQueen(p) { return p.symbol == 'D'; }
    csPieceTypes.isQueen = isQueen;
    function isWyvern(p) { return p.symbol == 'V'; }
    csPieceTypes.isWyvern = isWyvern;
    function isRook(p) { return p.symbol == 'R'; }
    csPieceTypes.isRook = isRook;
    function isPegasus(p) { return p.symbol == 'G'; }
    csPieceTypes.isPegasus = isPegasus;
    function isKnight(p) { return p.symbol == 'N'; }
    csPieceTypes.isKnight = isKnight;
    function isBishop(p) { return p.symbol == 'J'; }
    csPieceTypes.isBishop = isBishop;
    function isElephant(p) { return p.symbol == 'E'; }
    csPieceTypes.isElephant = isElephant;
    function isPawn(p) { return p.symbol == 'P'; }
    csPieceTypes.isPawn = isPawn;
    function isAlmogaver(p) { return p.symbol == 'M'; }
    csPieceTypes.isAlmogaver = isAlmogaver;
})(csPieceTypes = exports.csPieceTypes || (exports.csPieceTypes = {}));
