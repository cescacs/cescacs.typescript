import { csTypes as csty, csConvert as cscnv } from "./cescacs.types";
import { PositionHelper } from "./cescacs.positionHelper";
import { assertCondition, assertNonNullish } from "./ts.general";
import { cspty } from "./cescacs";
export class Piece {
    color;
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
    _position;
    _pin;
    constructor(color) {
        this.color = color;
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
        return this.symbol + (this.position == null ? "" : PositionHelper.toString(this.position));
    }
    get uncapitalizedSymbolPositionString() {
        return this.uncapitalizedSymbol + (this.position == null ? "" : PositionHelper.toString(this.position));
    }
    canMoveTo(board, p) {
        return PositionHelper.positionIteratorIncludes(this.moves(board), p);
    }
    canCaptureOn(board, p) {
        return this.canMoveTo(board, p); //default piece capture same as move
    }
    captured() {
        assertNonNullish(this._position, "Don't capture again the piece");
        this._position = null;
    }
    *blockThreat(board, threatBlockingPositions) {
        yield* PositionHelper.positionIteratorIntersection(this.moves(board), threatBlockingPositions);
    }
    *knightMoves(board, defends = false) {
        if (this._position != null && this.pin == null) {
            for (const pos of PositionHelper.knightMoves(this._position)) {
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
            const orientation = (this.pin == null ? null : csty.isOrthogonalOrientation(this.pin) ? this.pin : []);
            for (const direction of (orientation ?? cscnv.orthogonalDirections())) {
                const it = PositionHelper.orthogonalRide(this._position, direction);
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
            const orientation = (this.pin == null ? null : csty.isDiagonalOrientation(this.pin) ? this.pin : []);
            for (const direction of (orientation ?? cscnv.diagonalDirections())) {
                const it = PositionHelper.diagonalRide(this._position, direction);
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
            const pinOrientation = (this.pin != null && csty.isOrthogonalOrientation(this.pin) ? this.pin : null);
            if (this._pin == null || this._pin.includes(direction)) {
                const pos = PositionHelper.orthogonalStep(this._position, direction);
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
                const pos = PositionHelper.diagonalStep(this._position, direction);
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
            const direction = PositionHelper.isOrthogonally(this.position, p);
            if (direction != null && (this._pin == null || this._pin.includes(direction))) {
                const pieceColor = board.hasPiece(p);
                if (pieceColor == null || capture && pieceColor != this.color) {
                    for (const pos of PositionHelper.orthogonalRide(this.position, direction)) {
                        if (PositionHelper.equals(p, pos))
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
            const direction = PositionHelper.isDiagonally(this.position, p);
            if (direction != null && (this._pin == null || this._pin.includes(direction))) {
                const pieceColor = board.hasPiece(p);
                if (pieceColor == null || capture && pieceColor != this.color) {
                    for (const pos of PositionHelper.diagonalRide(this.position, direction)) {
                        if (PositionHelper.equals(p, pos))
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
export class King extends Piece {
    key;
    symbol = "K";
    value = 0;
    _moved = false;
    checkPosition = null;
    constructor(color) {
        super(color);
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
        this._moved = this.isInitialPosition && (castlingStatusValue == "-");
    }
    getCastlingStatus(callback) {
        if (this._moved)
            return "-";
        else {
            const rK = callback.getPiece(PositionHelper.initialKingSideRookPosition(this.color, callback.isGrand));
            const rQ = callback.getPiece(PositionHelper.initialQueenSideRookPosition(this.color, callback.isGrand));
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
            assertNonNullish(this.position);
            assertNonNullish(this.checkPosition);
            for (const direction of cscnv.orthogonalDirections()) {
                const pos = PositionHelper.orthogonalStep(this.position, direction);
                if (pos != undefined) {
                    if (this.pin == null || !(this.pin.includes(direction)) || csty.isCheckAttackPos(this.checkPosition, pos)) {
                        const pieceColor = board.hasPiece(pos);
                        if ((pieceColor == null || pieceColor != this.color) && !board.isThreatened(pos, this.color))
                            yield pos;
                    }
                }
            }
            for (const direction of cscnv.diagonalDirections()) {
                const pos = PositionHelper.diagonalStep(this.position, direction);
                if (pos != undefined) {
                    if (this.pin == null || !(this.pin.includes(direction)) || csty.isCheckAttackPos(this.checkPosition, pos)) {
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
        for (const p of PositionHelper.knightMoves(this.position)) {
            const piece = board.getPiece(p);
            if (piece != null && piece.color != this.color && piece.hasKnightJumpAttack) {
                this.setKnightOrCloseAttack(p);
            }
        }
        for (const d of cscnv.orthogonalDirections()) {
            const it = PositionHelper.orthogonalRide(this.position, d);
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
                        const it2 = PositionHelper.orthogonalRide(p, d);
                        let v2 = it2.next();
                        while (!v2.done) {
                            const p2 = v2.value;
                            const piece2 = board.getPiece(p2);
                            if (piece2 == null)
                                v2 = it2.next();
                            else {
                                if (piece2.color != this.color && piece2.hasOrthogonalAttack) {
                                    piece.pin = cscnv.getOrthogonalOrientation(d);
                                }
                                v2 = it2.return();
                            }
                        }
                    }
                    v = it.return();
                }
            }
        }
        for (const d of cscnv.diagonalDirections()) {
            const it = PositionHelper.diagonalRide(this.position, d);
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
                        const it2 = PositionHelper.diagonalRide(p, d);
                        let v2 = it2.next();
                        while (!v2.done) {
                            const p2 = v2.value;
                            const piece2 = board.getPiece(p2);
                            if (piece2 == null)
                                v2 = it2.next();
                            else {
                                if (piece2.color != this.color && piece2.hasDiagonalAttack) {
                                    piece.pin = cscnv.getDiagonalOrientation(d);
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
        return this.checkPosition != null && csty.isPosition(this.checkPosition);
    }
    isSingleCheck() {
        return this.checkPosition != null && csty.isSingleCheck(this.checkPosition);
    }
    isDoubleCheck() {
        return this.checkPosition != null
            && !csty.isPosition(this.checkPosition)
            && !csty.isSingleCheck(this.checkPosition);
    }
    get checkThreat() {
        if (this.checkPosition != null) {
            if (csty.isPosition(this.checkPosition))
                return this.checkPosition;
            else if (csty.isSingleCheck(this.checkPosition))
                return this.checkPosition.p;
            else
                return null;
        }
        else
            return null;
    }
    getSingleCheckBlockingPositions(board) {
        const r = [];
        assertNonNullish(this.position);
        if (csty.isSingleCheck(this.checkPosition)) {
            const d = this.checkPosition.d;
            if (csty.isDiagonalDirection(d)) {
                for (const p of PositionHelper.diagonalRide(this.position, d)) {
                    if (board.hasPiece(p) == null)
                        r.push(p);
                    else
                        break;
                }
            }
            else if (csty.isOrthogonalDirection(d)) {
                for (const p of PositionHelper.orthogonalRide(this.position, d)) {
                    if (board.hasPiece(p) == null)
                        r.push(p);
                    else
                        break;
                }
            }
        }
        return r;
    }
    setOrthogonalAtack(pos, dir) {
        if (this.checkPosition != null) {
            if (csty.isPosition(this.checkPosition)) {
                this.checkPosition = [this.checkPosition, pos, null];
                this.pin = cscnv.getOrthogonalOrientation(dir);
            }
            else if (csty.isSingleCheck(this.checkPosition)) {
                this.checkPosition = [this.checkPosition.p, pos, cscnv.getOrthogonalOrientation(dir)];
            }
            else {
                throw new Error("Triple check situation can't be achieved in the course of a game");
            }
        }
        else {
            this.checkPosition = { p: pos, d: dir };
            this.pin = cscnv.getOrthogonalOrientation(dir);
        }
    }
    setDiagonalAtack(pos, dir) {
        if (this.checkPosition != null) {
            if (csty.isPosition(this.checkPosition)) {
                this.checkPosition = [this.checkPosition, pos, null];
                this.pin = cscnv.getDiagonalOrientation(dir);
            }
            else if (csty.isSingleCheck(this.checkPosition)) {
                this.checkPosition = [this.checkPosition.p, pos, cscnv.getDiagonalOrientation(dir)];
            }
            else {
                throw new Error("Triple check situation can't be achieved in the course of a game");
            }
        }
        else {
            this.checkPosition = { p: pos, d: dir };
            this.pin = cscnv.getDiagonalOrientation(dir);
        }
    }
    setKnightOrCloseAttack(value, directional) {
        if (this.checkPosition != null) {
            if (csty.isPosition(this.checkPosition)) {
                //this.checkPosition = [this.checkPosition, value];
                throw new Error("Double knight or close check situation can't be achieved in the course of a game");
            }
            else if (csty.isSingleCheck(this.checkPosition)) {
                if (directional == null)
                    this.checkPosition = [this.checkPosition.p, value, null];
                else if (csty.isOrthogonalDirection(directional)) {
                    this.checkPosition = [this.checkPosition.p, value, cscnv.getOrthogonalOrientation(directional)];
                }
                else {
                    this.checkPosition = [this.checkPosition.p, value, cscnv.getDiagonalOrientation(directional)];
                }
            }
            else {
                throw new Error("Triple check situation can't be reached along a game");
            }
        }
        else {
            this.checkPosition = value;
            if (directional != null) {
                this.pin = csty.isOrthogonalDirection(directional) ?
                    cscnv.getOrthogonalOrientation(directional)
                    : cscnv.getDiagonalOrientation(directional);
            }
        }
    }
    *orthogonalStepList(board, defends) {
        assertNonNullish(this.position);
        for (const direction of cscnv.orthogonalDirections()) {
            const pos = PositionHelper.orthogonalStep(this.position, direction);
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
        assertNonNullish(this.position);
        for (const direction of cscnv.diagonalDirections()) {
            const pos = PositionHelper.diagonalStep(this.position, direction);
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
        return this.color == "w" ? PositionHelper.whiteKingInitPosition : PositionHelper.blackKingInitPosition;
    }
    get isInitialPosition() {
        if (this.position == null)
            return false;
        else
            return this.position[0] == 8
                && (this.color == "w" && this.position[1] == 1 || this.color == "b" && this.position[1] == 27);
    }
}
export class Queen extends Piece {
    key;
    symbol = "D";
    value = 15;
    constructor(color, column, line) {
        super(color);
        this.key = color + this.symbol;
        if (column !== undefined) {
            assertCondition(csty.isColumn(column));
            assertNonNullish(line, "line of the column");
            super.setPositionTo(PositionHelper.fromBoardPosition(column, line, true));
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
export class Wyvern extends Piece {
    key;
    symbol = "V";
    value = 14;
    constructor(color, column, line) {
        super(color);
        this.key = color + this.symbol;
        if (column !== undefined) {
            assertCondition(csty.isColumn(column));
            assertNonNullish(line, "line of the column");
            super.setPositionTo(PositionHelper.fromBoardPosition(column, line, true));
        }
    }
    *moves(board) {
        yield* this.orthogonalMoves(board);
        yield* this.knightMoves(board);
    }
    canMoveTo(board, p) {
        return super.canMoveOrthogonallyTo(board, p) ||
            PositionHelper.positionIteratorIncludes(this.knightMoves(board), p);
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
export class Rook extends Piece {
    key;
    symbol = "R";
    value = 11;
    _moved;
    constructor(color, grand, columnOrNumber, line) {
        super(color);
        if (line !== undefined) {
            assertCondition(csty.isColumn(columnOrNumber));
            super.setPositionTo(PositionHelper.fromBoardPosition(columnOrNumber, line, true));
            this.key = color + this.symbol +
                (this.isKingSide(grand) ? "k" : this.isQueenSide(grand) ? "q" : (columnOrNumber + line));
            // first moved heuristic aprox; but needs castlingStatus
            this._moved = !this.isKingSide(grand) && !this.isQueenSide(grand);
        }
        else {
            assertCondition(typeof columnOrNumber == "number", `instance number of piece ${this.symbol}`);
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
export class Pegasus extends Piece {
    key;
    symbol = "G";
    value = 8;
    constructor(color, columnOrNumber, line) {
        super(color);
        if (line !== undefined) {
            assertCondition(csty.isColumn(columnOrNumber));
            super.setPositionTo(PositionHelper.fromBoardPosition(columnOrNumber, line, true));
            this.key = color + this.symbol + columnOrNumber + line;
        }
        else {
            assertCondition(typeof columnOrNumber == "number", `instance number of piece ${this.symbol}`);
            this.key = color + this.symbol + columnOrNumber;
        }
    }
    *moves(board) {
        yield* this.diagonalMoves(board);
        yield* this.knightMoves(board);
    }
    canMoveTo(board, p) {
        return super.canMoveDiagonallyTo(board, p) ||
            PositionHelper.positionIteratorIncludes(this.knightMoves(board), p);
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
export class Knight extends Piece {
    key;
    symbol = "N";
    value = 4;
    constructor(color, columnOrNumber, line) {
        super(color);
        if (line !== undefined) {
            assertCondition(csty.isColumn(columnOrNumber));
            super.setPositionTo(PositionHelper.fromBoardPosition(columnOrNumber, line, true));
            this.key = color + this.symbol + columnOrNumber + line;
        }
        else {
            assertCondition(typeof columnOrNumber == "number", `instance number of piece ${this.symbol}`);
            this.key = color + this.symbol + columnOrNumber;
        }
    }
    *moves(board) {
        yield* this.knightMoves(board);
        if (this.position != undefined && this.pin == null) {
            for (const d of cscnv.knightDirections()) {
                const pos = PositionHelper.knightJump(this.position, d);
                if (pos != null && board.hasPiece(pos) == null) {
                    const pride = PositionHelper.knightJump(pos, d);
                    if (pride != null && board.hasPiece(pride) == null)
                        yield pride;
                }
            }
        }
    }
    canCaptureOn(board, p) {
        return PositionHelper.positionIteratorIncludes(this.knightMoves(board), p);
    }
    markThreats(board) {
        for (const p of this.knightMoves(board, true)) {
            board.setThreat(p, this.color);
        }
    }
}
export class Bishop extends Piece {
    key;
    symbol = "J";
    value = 3;
    hexesColor;
    constructor(color, columnOrHexcolor, line) {
        super(color);
        if (line !== undefined) {
            assertCondition(csty.isColumn(columnOrHexcolor));
            super.setPositionTo(PositionHelper.fromBoardPosition(columnOrHexcolor, line, true));
            this.hexesColor = PositionHelper.hexColor(this.position);
        }
        else if (csty.isHexColor(columnOrHexcolor)) {
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
export class Elephant extends Piece {
    key;
    symbol = "E";
    value = 2;
    constructor(color, column, line) {
        super(color);
        assertCondition(csty.isColumn(column));
        super.setPositionTo(PositionHelper.fromBoardPosition(column, line, true));
        this.key = color + this.symbol + column + line;
    }
    *moves(board, defend = false) {
        const piecePos = this.position;
        if (piecePos != null) {
            const pin = this.pin;
            if (pin == null || pin[0] == "ColumnUp" && pin[1] == "ColumnDown") {
                const p = PositionHelper.orthogonalStep(piecePos, this.ownOrthogonalDirection);
                if (p != null) {
                    const pieceColor = board.hasPiece(p);
                    if (pieceColor == null) {
                        yield p;
                        const p2 = PositionHelper.orthogonalStep(p, this.ownOrthogonalDirection);
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
                            if (cspty.isKing(thp)) {
                                const p2 = PositionHelper.orthogonalStep(p, this.ownOrthogonalDirection);
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
                    const diagP = PositionHelper.diagonalStep(piecePos, d);
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
export class Almogaver extends Piece {
    key;
    symbol = "M";
    value = 2;
    constructor(color, column, line) {
        super(color);
        assertCondition(csty.isColumn(column));
        super.setPositionTo(PositionHelper.fromBoardPosition(column, line, true));
        this.key = color + this.symbol + column + line;
    }
    *moves(board, onlyCaptures = false) {
        const piecePos = this.position;
        if (piecePos != null) {
            const pin = this.pin;
            if (!onlyCaptures) {
                for (const direction of cscnv.orthogonalDirections()) {
                    if (pin == null || pin.includes(direction)) {
                        const pos = PositionHelper.orthogonalStep(piecePos, direction);
                        if (pos != null && board.hasPiece(pos) == null) {
                            const pos2 = PositionHelper.orthogonalStep(pos, direction);
                            if (pos2 != undefined && board.hasPiece(pos2) == null)
                                yield pos2;
                        }
                    }
                }
            }
            for (const direction of cscnv.diagonalDirections()) {
                if (pin == null || pin.includes(direction)) {
                    const p = PositionHelper.diagonalStep(piecePos, direction);
                    if (p != null) {
                        const pieceColor = board.hasPiece(p);
                        if (pieceColor == null) {
                            const specialCapture = board.specialPawnCapture;
                            if (specialCapture != null
                                && specialCapture.isEnPassantCapturable()
                                && specialCapture.isEnPassantCapture(p))
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
        return PositionHelper.positionIteratorIncludes(this.moves(board, true), p);
    }
    markThreats(board) {
        const pawnPos = this.position;
        if (pawnPos != null) {
            const pin = this.pin;
            for (const direction of cscnv.diagonalDirections()) {
                if (pin == null || pin.includes(direction)) {
                    const p = PositionHelper.diagonalStep(pawnPos, direction);
                    if (p != null)
                        board.setThreat(p, this.color);
                }
            }
        }
    }
}
export class Pawn extends Piece {
    key;
    symbol = "P";
    value = 1;
    constructor(color, column, line) {
        super(color);
        assertCondition(csty.isColumn(column));
        super.setPositionTo(PositionHelper.fromBoardPosition(column, line, true));
        this.key = color + this.symbol + column + line;
    }
    *moves(board, onlyCaptures = false) {
        const pawnPos = this.position;
        if (pawnPos != null) {
            const pin = this.pin;
            if (!onlyCaptures) {
                const ownOrthogonalStraight = this.ownOrthogonalStraightDirection;
                if (pin == null || pin[0] == "ColumnUp" && pin[1] == "ColumnDown") {
                    const p = PositionHelper.orthogonalStep(pawnPos, ownOrthogonalStraight);
                    if (p != null && board.hasPiece(p) == null) {
                        yield p;
                        const p2 = PositionHelper.orthogonalStep(p, ownOrthogonalStraight);
                        if (p2 != null && board.hasPiece(p2) == null) {
                            yield p2;
                            if (this.hasTripleStep(board.isGrand)) {
                                const p3 = PositionHelper.orthogonalStep(p2, ownOrthogonalStraight);
                                if (p3 != null && board.hasPiece(p3) == null)
                                    yield p3;
                            }
                        }
                    }
                }
                for (const d of this.ownOrthogonalAlternateDirections) {
                    if (pin == null || pin.includes(d)) {
                        const p = PositionHelper.orthogonalStep(pawnPos, d);
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
                    const captureDirection = PositionHelper.isOrthogonally(pawnPos, specialCapture.capturablePiece.position);
                    if (captureDirection != null && this.pin.includes(captureDirection))
                        yield specialCapture.capturablePiece.position; //pawn, this case
                }
            }
            for (const d of this.ownCaptureDirections) {
                if (pin == null || pin.includes(d)) {
                    const p = PositionHelper.diagonalStep(pawnPos, d);
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
        return PositionHelper.positionIteratorIncludes(this.moves(board, true), p);
    }
    markThreats(board) {
        const pawnPos = this.position;
        if (pawnPos != null) {
            const pin = this.pin;
            for (const d of this.ownCaptureDirections) {
                if (pin == null || pin.includes(d)) {
                    const p = PositionHelper.diagonalStep(pawnPos, d);
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
            if (c > 4 && c < 7 || !grand && (c == 3 || c == 4)) {
                return p[1] == (this.color == "w" ? c + 1 : 27 - c);
            }
            else if (c > 7 && c < 10 || !grand && (c == 10 || c == 11)) {
                return p[1] == (this.color == "w" ? 15 - c : 13 + c);
            }
            else if (grand) {
                if (c == 3 || c == 11)
                    return p[1] == (this.color == "w" ? 6 : 22);
                else if (c == 4 || c == 10)
                    return p[1] == (this.color == "w" ? 7 : 23);
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
        assertNonNullish(this.position, "Pawn to promote is not captured");
        assertCondition(PositionHelper.isPromotionHex(this.position, this.color), `Promotion hex ${PositionHelper.toString(this.position)}`);
        piece.setPositionTo(this.position);
        this.captured();
    }
    get awaitingPromotion() {
        if (this.position != null)
            return PositionHelper.isPromotionHex(this.position, this.color) ? PositionHelper.lineHexColor(this.position[1]) : null;
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
export var csPieceTypes;
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
    function isMajorPiece(p) { return ['D', 'V', 'R'].includes(p.symbol); }
    csPieceTypes.isMajorPiece = isMajorPiece;
    function isMinorPiece(p) { return p.symbol == 'J' || p.symbol == 'N'; }
    csPieceTypes.isMinorPiece = isMinorPiece;
    function isMediumPiece(p) { return p.symbol == 'G'; }
    csPieceTypes.isMediumPiece = isMediumPiece;
    function isTroup(p) { return ['P', 'E', 'M'].includes(p.symbol); }
    csPieceTypes.isTroup = isTroup;
})(csPieceTypes || (csPieceTypes = {}));
