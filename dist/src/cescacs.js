"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = exports.Board = exports.EnPassantCapturable = exports.ScornfulCapturable = exports.PawnSpecialCaptureStatus = exports.round2hundredths = exports.cspty = exports.PositionHelper = void 0;
const ts_general_1 = require("./ts.general");
Object.defineProperty(exports, "round2hundredths", { enumerable: true, get: function () { return ts_general_1.round2hundredths; } });
const cescacs_types_1 = require("./cescacs.types");
const cescacs_positionHelper_1 = require("./cescacs.positionHelper");
Object.defineProperty(exports, "PositionHelper", { enumerable: true, get: function () { return cescacs_positionHelper_1.PositionHelper; } });
const cescacs_piece_1 = require("./cescacs.piece");
Object.defineProperty(exports, "cspty", { enumerable: true, get: function () { return cescacs_piece_1.csPieceTypes; } });
const cescacs_piece_2 = require("./cescacs.piece");
class PawnSpecialCaptureStatus {
    constructor(capturablePawn) {
        this._capturablePiece = capturablePawn;
    }
    static parse(board, value) {
        if (value != null && value.length > 0 && value != "-") {
            if (value.length >= 4) {
                const elements = value.split("@");
                if (elements.length = 2) {
                    const p0 = cescacs_positionHelper_1.PositionHelper.parse(elements[0]);
                    if (elements[1].includes(",") || !isNaN(Number(elements[1]))) {
                        const piece = board.getPiece(p0);
                        if (piece != null && cescacs_piece_1.csPieceTypes.isPawn(piece)) {
                            const values = elements[1].split(",");
                            if (values.length >= 1 && values.length <= 2) {
                                let captureTo = [];
                                for (const s of values) {
                                    let l = Number(s);
                                    if (!isNaN(l) && cescacs_types_1.csTypes.isLine(l)) {
                                        captureTo.push(cescacs_positionHelper_1.PositionHelper.fromBoardPosition(p0[0], l, true));
                                    }
                                    else
                                        throw new TypeError("Invalid en passant capture line value");
                                }
                                return new EnPassantCapturable(piece, captureTo);
                            }
                            else
                                throw new TypeError("Missing or invalid en passant capture lines");
                        }
                        else
                            throw new Error(cescacs_positionHelper_1.PositionHelper.toString(p0) + " doesn't have a pawn");
                    }
                    else {
                        const p1 = cescacs_positionHelper_1.PositionHelper.parse(elements[1]);
                        const piece = board.getPiece(p1);
                        if (piece != null && cescacs_piece_1.csPieceTypes.isPawn(piece)) {
                            return new ScornfulCapturable(piece, p0);
                        }
                        else
                            throw new Error(cescacs_positionHelper_1.PositionHelper.toString(p1) + " doesn't have a pawn");
                    }
                }
                else
                    throw new TypeError("Invalid special pawn capture status string");
            }
            else
                throw new TypeError("Too short special pawn capture status string");
        }
        else
            return null;
    }
    isScornfulCapturable() {
        return this.specialCaptureType == 'scornful';
    }
    isEnPassantCapturable() {
        return this.specialCaptureType == 'enPassant';
    }
    get capturablePawn() {
        (0, ts_general_1.assertCondition)(cescacs_piece_1.csPieceTypes.isPawn(this._capturablePiece));
        return this._capturablePiece;
    }
}
exports.PawnSpecialCaptureStatus = PawnSpecialCaptureStatus;
class ScornfulCapturable extends PawnSpecialCaptureStatus {
    constructor(capturablePawn, scornedPawnPos) {
        super(capturablePawn);
        this.specialCaptureType = 'scornful';
        this._capturerPawnPos = scornedPawnPos;
    }
    static promoteCapturablePawn(scorfulCapturable, capturablePiece) {
        return new ScornfulCapturable(capturablePiece, scorfulCapturable._capturerPawnPos);
    }
    get capturablePiece() { return this._capturablePiece; }
    isScorned(pawn, pos) {
        const result = pawn.position != null && cescacs_positionHelper_1.PositionHelper.equals(pawn.position, this._capturerPawnPos);
        if (pos == null)
            return result;
        else
            return result && cescacs_positionHelper_1.PositionHelper.equals(pos, this.capturablePawn.position);
    }
    get scornfulCaptureDirection() {
        const capturerColumnIndex = this._capturerPawnPos[0];
        const capturablePawnPos = this.capturablePawn.position;
        const capturableColumnIndex = capturablePawnPos[0];
        if (capturablePawnPos[1] > this._capturerPawnPos[1]) {
            return capturableColumnIndex > capturerColumnIndex ? "FileUp" : "FileInvUp";
        }
        else {
            return capturableColumnIndex > capturerColumnIndex ? "FileDown" : "FileInvDown";
        }
    }
    toString() {
        return cescacs_positionHelper_1.PositionHelper.toString(this._capturerPawnPos) + "@" + cescacs_positionHelper_1.PositionHelper.toString(this.capturablePiece.position);
    }
}
exports.ScornfulCapturable = ScornfulCapturable;
class EnPassantCapturable extends PawnSpecialCaptureStatus {
    constructor(capturablePawn, captureTo) {
        super(capturablePawn);
        this.specialCaptureType = 'enPassant';
        this._captureTo = captureTo;
    }
    isEnPassantCapture(pos, capturerPawn) {
        const isEnPassantCapturePos = this._captureTo.some(x => cescacs_positionHelper_1.PositionHelper.equals(x, pos));
        if (capturerPawn == null)
            return isEnPassantCapturePos;
        else if (isEnPassantCapturePos && capturerPawn.position != null) {
            const capturerPos = capturerPawn.position;
            if (Math.abs(pos[0] - capturerPos[0]) == 1) {
                if (capturerPawn.color == 'White')
                    return pos[1] - capturerPos[1] == 3;
                else
                    return capturerPos[1] - pos[1] == 3;
            }
            else
                return false;
        }
        else
            return false;
    }
    toString() {
        return cescacs_positionHelper_1.PositionHelper.toString(this.capturablePawn.position) + "@" + this.captureLines();
    }
    captureLines() {
        const captureTo = this._captureTo;
        if (captureTo.length > 0 && captureTo.length <= 2) {
            let r = (captureTo[0][1]).toString();
            if (captureTo.length > 1) {
                r += "," + (captureTo[1][1]).toString();
            }
            return r;
        }
        else
            throw new Error("Invalid en passant capture positions set");
    }
}
exports.EnPassantCapturable = EnPassantCapturable;
//TODO: Optimization: pieces are not removed, only set null to position; is it always checked position is not null?
// - optimized operations of capture, which dont modify the wPieces / wPieces Maps.
//TODO: Also, if pieces are not removed, regainable pieces set are not needed
//May be it is not a great optimization, thus only afect captures
//but it is obvious, and may be important in the mini-max explore
class Board {
    constructor(grand, turn) {
        this.wPositions = [0, 0, 0, 0, 0, 0, 0, 0];
        this.bPositions = [0, 0, 0, 0, 0, 0, 0, 0];
        this.wThreats = [0, 0, 0, 0, 0, 0, 0, 0];
        this.bThreats = [0, 0, 0, 0, 0, 0, 0, 0];
        this.wPieces = new Map();
        this.bPieces = new Map();
        this._regainablePieces = [];
        this.wKing = new cescacs_piece_2.King('White');
        this.bKing = new cescacs_piece_2.King('Black');
        this._specialPawnCapture = null;
        this._wAwaitingPromotion = false;
        this._bAwaitingPromotion = false;
        this._anyMove = true;
        this._grand = grand;
        this._turn = turn !== null && turn !== void 0 ? turn : 'w';
    }
    static newHeuristic() {
        return { pieces: [0, 0], space: [0, 0], positioning: 0, mobility: 0, king: 0 };
    }
    static splitCastlingStatus(source) {
        if (source != null && source.length > 0) {
            let wSrc;
            let bSrc;
            let i = 0;
            while (i < source.length && source[i].toUpperCase() == source[i])
                i++;
            if (i == 0) {
                wSrc = "-";
                bSrc = source;
            }
            else if (i == source.length) {
                wSrc = source;
                bSrc = "-";
            }
            else {
                wSrc = source.slice(0, i);
                bSrc = source.slice(i);
            }
            bSrc = bSrc.toUpperCase();
            if (!cescacs_types_1.csTypes.isCastlingStatus(wSrc) || !cescacs_types_1.csTypes.isCastlingStatus(bSrc))
                throw new TypeError(`Invalid TLPD issued castling status ${source}`);
            return [wSrc, bSrc];
        }
        else
            return ["RKR", "RKR"];
    }
    static lineMask(l) { return 1 << l; }
    get isGrand() { return this._grand; }
    get turn() { return this._turn; }
    get isAwaitingPromotion() { return this._turn == 'w' ? this._wAwaitingPromotion : this._bAwaitingPromotion; }
    set isAwaitingPromotion(value) { if (this._turn == 'w')
        this._wAwaitingPromotion = value;
    else
        this._bAwaitingPromotion = value; }
    get specialPawnCapture() { return this._specialPawnCapture; }
    set specialPawnCapture(value) { this._specialPawnCapture = value; }
    get anyMove() { return this._anyMove; }
    get checked() { return this.currentKing.checked; }
    get isKnightOrCloseCheck() { return this.currentKing.isKnightOrCloseCheck(); }
    get isSingleCheck() { return this.currentKing.isSingleCheck(); }
    get isDoubleCheck() { return this.currentKing.isDoubleCheck(); }
    get currentKing() { return (this.turn === 'w' ? this.wKing : this.bKing); }
    *whitePieces() { for (const p of this.wPieces.values())
        yield p; }
    *blackPieces() { for (const p of this.bPieces.values())
        yield p; }
    *whitePiecePositions() { for (const p of this.wPieces.values())
        yield p.position; }
    *blackPiecePositions() { for (const p of this.bPieces.values())
        yield p.position; }
    hasRegainablePieces(hexColor) {
        const currentColor = this._turn == 'w' ? 'White' : 'Black';
        return this._regainablePieces.reduce((total, x) => total + (x.color == currentColor && (!cescacs_piece_1.csPieceTypes.isBishop(x) || x.hexesColor == hexColor) ? 1 : 0), 0) > 0;
    }
    currentRegainablePieceNames(hexColor) {
        const currentColor = this._turn == 'w' ? 'White' : 'Black';
        return this._regainablePieces.reduce((s, x) => x.color == currentColor && (!cescacs_piece_1.csPieceTypes.isBishop(x) || x.hexesColor == hexColor) ? s.add(x.symbol) : s, new Set());
    }
    currentRegainablePieces(hexColor) {
        const currentColor = this._turn == 'w' ? 'White' : 'Black';
        const regainables = this._regainablePieces;
        return regainables.filter((x, index) => x.color == currentColor && (!cescacs_piece_1.csPieceTypes.isBishop(x) || x.hexesColor == hexColor)
            && index == regainables.findIndex(p => p.color == currentColor && p.symbol == x.symbol && (!cescacs_piece_1.csPieceTypes.isBishop(p) || p.hexesColor == hexColor)));
    }
    addRegainablePiece(piece) {
        if (piece.position == null)
            this._regainablePieces.push(piece);
    }
    getHexPiece(pos) {
        const p = cescacs_positionHelper_1.PositionHelper.parse(pos);
        if (p == null)
            return null;
        else
            return this.getPiece(p);
    }
    hasPiece(pos) {
        const posCol = (pos[0] + 1) >>> 1;
        const posLineMask = Board.lineMask(pos[1]);
        if ((this.wPositions[posCol] & posLineMask) != 0) {
            return 'White';
        }
        else if ((this.bPositions[posCol] & posLineMask) != 0) {
            return 'Black';
        }
        else
            return null;
    }
    getPiece(pos) {
        const color = this.hasPiece(pos);
        if (color == null)
            return null;
        else if (color == 'White') {
            return this.wPieces.get(cescacs_positionHelper_1.PositionHelper.positionKey(pos));
        }
        else {
            return this.bPieces.get(cescacs_positionHelper_1.PositionHelper.positionKey(pos));
        }
    }
    hasThreat(pos, color) {
        const posCol = (pos[0] + 1) >>> 1;
        return ((color == "White" ? this.wThreats : this.bThreats)[posCol] & Board.lineMask(pos[1])) != 0;
    }
    isThreated(pos, color) {
        const posCol = (pos[0] + 1) >>> 1;
        return ((color == "White" ? this.bThreats : this.wThreats)[posCol] & Board.lineMask(pos[1])) != 0;
    }
    setThreat(pos, color) {
        const posCol = (pos[0] + 1) >>> 1;
        (color == "White" ? this.wThreats : this.bThreats)[posCol] |= Board.lineMask(pos[1]);
    }
    *pieceMoves(piece) {
        const currentKing = this.currentKing;
        if (currentKing.checked) {
            if (piece.symbol == "K")
                yield* piece.moves(this);
            else {
                const capturePos = currentKing.checkThreat;
                if (capturePos != null) {
                    if (piece.canCaptureOn(this, capturePos))
                        yield capturePos;
                }
                if (currentKing.isSingleCheck()) {
                    yield* piece.blockThreat(this, currentKing.getSingleCheckBlockingPositions(this));
                }
            }
        }
        else {
            yield* piece.moves(this);
        }
    }
    addPiece(piece) {
        (0, ts_general_1.assertNonNullish)(piece.position, `${piece.symbol} position`);
        const toPos = piece.position;
        const pieces = (piece.color == "White" ? this.wPieces : this.bPieces);
        pieces.set(cescacs_positionHelper_1.PositionHelper.positionKey(toPos), piece);
        const posCol = (toPos[0] + 1) >>> 1;
        const posLineMask = Board.lineMask(toPos[1]);
        const positions = (piece.color == "White" ? this.wPositions : this.bPositions);
        positions[posCol] |= posLineMask;
    }
    capturePiece(piece) {
        (0, ts_general_1.assertNonNullish)(piece.position, `${piece.symbol} position`);
        const fromPos = piece.position;
        const posCol = (fromPos[0] + 1) >>> 1;
        const posLineMask = Board.lineMask(fromPos[1]);
        const positions = (piece.color == "White" ? this.wPositions : this.bPositions);
        positions[posCol] &= ~posLineMask;
        const pieces = (piece.color == "White" ? this.wPieces : this.bPieces);
        pieces.delete(cescacs_positionHelper_1.PositionHelper.positionKey(fromPos));
        piece.captured();
        if (piece.isRegainable)
            this._regainablePieces.push(piece);
    }
    movePiece(piece, toColumnIndex, toLine) {
        (0, ts_general_1.assertNonNullish)(piece.position, `${piece.symbol} position`);
        const piecePos = piece.position;
        const fromPosCol = (piecePos[0] + 1) >>> 1;
        const fromPosLineMask = Board.lineMask(piecePos[1]);
        const pieces = (piece.color == "White" ? this.wPieces : this.bPieces);
        let scornedPawn = null;
        let multipleStep = null;
        if (cescacs_piece_1.csPieceTypes.isPawn(piece)) {
            if (piece.position[0] != toColumnIndex) {
                const frontPiece = this.getPiece([piece.position[0],
                    (toLine > piece.position[1] ? piece.position[1] + 2 : piece.position[1] - 2)]);
                if (frontPiece != null && cescacs_piece_1.csPieceTypes.isPawn(frontPiece))
                    scornedPawn = frontPiece;
            }
            else if (Math.abs(toLine - piece.position[1]) > 2) {
                multipleStep = [];
                if (toLine > piece.position[1]) {
                    multipleStep.push([toColumnIndex, (piece.position[1] + 2)]);
                    if (toLine > piece.position[1] + 4) {
                        multipleStep.push([toColumnIndex, (piece.position[1] + 4)]);
                    }
                }
                else {
                    multipleStep.push([toColumnIndex, (piece.position[1] - 2)]);
                    if (toLine < piece.position[1] - 4) {
                        multipleStep.push([toColumnIndex, (piece.position[1] - 4)]);
                    }
                }
            }
            if (cescacs_positionHelper_1.PositionHelper.isPromotionPos(toColumnIndex, toLine, piece.color)) {
                if (piece.color == 'White')
                    this._wAwaitingPromotion = true;
                else
                    this._bAwaitingPromotion = true;
            }
        }
        pieces.delete(cescacs_positionHelper_1.PositionHelper.positionKey(piecePos));
        piece.moveTo(toColumnIndex, toLine); //piecePos updated
        pieces.set(cescacs_positionHelper_1.PositionHelper.positionKey(piecePos), piece);
        const toPosCol = (piecePos[0] + 1) >>> 1;
        const toPosLineMask = Board.lineMask(piecePos[1]);
        const positions = (piece.color == "White" ? this.wPositions : this.bPositions);
        positions[fromPosCol] &= ~fromPosLineMask;
        positions[toPosCol] |= toPosLineMask;
        if (scornedPawn != null) {
            this._specialPawnCapture = new ScornfulCapturable(piece, scornedPawn.position);
        }
        else if (multipleStep != null) {
            this._specialPawnCapture = new EnPassantCapturable(piece, multipleStep);
        }
        else {
            this._specialPawnCapture = null;
        }
    }
    promotePawn(pawn, piece) {
        if (this._regainablePieces.includes(piece)) {
            const pieces = (piece.color == "White" ? this.wPieces : this.bPieces);
            pieces.delete(cescacs_positionHelper_1.PositionHelper.positionKey(pawn.position));
            pawn.promoteTo(piece);
            pieces.set(cescacs_positionHelper_1.PositionHelper.positionKey(piece.position), piece);
            if (this._specialPawnCapture != null
                && this._specialPawnCapture.isScornfulCapturable()
                && this._specialPawnCapture.capturablePawn == pawn) {
                this._specialPawnCapture = ScornfulCapturable.promoteCapturablePawn(this._specialPawnCapture, piece);
            }
            const pos = this._regainablePieces.indexOf(piece);
            this._regainablePieces.splice(pos, 1);
        }
    }
    resetGame(turn) {
        for (let i = 0; i < 8; i++) {
            this.wPositions[i] = 0;
            this.bPositions[i] = 0;
            this.wThreats[i] = 0;
            this.bThreats[i] = 0;
        }
        this.wPieces.clear();
        this.bPieces.clear();
        this._regainablePieces.length = 0;
        this._specialPawnCapture = null;
        this._anyMove = true;
        this._turn = turn;
    }
    prepareGame() {
        if (this._turn == 'w')
            this.prepareTurn(this.bKing);
        else
            this.prepareTurn(this.wKing);
        this.prepareCurrentTurn();
    }
    nextTurn() {
        this._turn = this._turn === 'w' ? 'b' : 'w';
        this.clearThreats(this._turn === 'w' ? 'Black' : 'White');
        this.clearPins(this._turn === 'w' ? 'White' : 'Black');
    }
    prepareCurrentTurn() {
        this.prepareTurn(this.currentKing);
        //NEEDED??? this.oponentKing.computeCheckAndPins(this);
        this.checkMoveableTurn();
    }
    prepareTurn(currentKing) {
        const threatingPieces = (currentKing.color == 'White' ? this.bPieces.values() : this.wPieces.values());
        for (const piece of threatingPieces) {
            piece.markThreats(this);
        }
        currentKing.computeCheckAndPins(this);
    }
    checkMoveableTurn() {
        const movingPieces = (this.turn === 'w' ? this.wPieces.values() : this.bPieces.values());
        let hasMoves = false;
        for (const piece of movingPieces) {
            const it = this.pieceMoves(piece);
            if (!it.next().done)
                hasMoves = true;
            it.return();
            if (hasMoves)
                break;
        }
        this._anyMove = hasMoves;
    }
    getHeuristicValue(h) {
        return (0, ts_general_1.round2hundredths)(h.pieces[0] - h.pieces[1] + h.space[0] - h.space[1] + h.positioning + h.mobility + h.king);
    }
    computeHeuristic(turn, result) {
        const countBitset = function (value) {
            const mask = 1;
            let r = 0;
            while (value > 0) {
                r += value & mask;
                value = value >>> 1;
            }
            return r;
        };
        const countEvenBitset = function (value) {
            const mask = 1;
            let r = 0;
            while (value > 0) {
                r += value & mask;
                value = value >>> 2;
            }
            return r;
        };
        const countOddBitset = function (value) {
            const mask = 1;
            let r = 0;
            value = value >>> 1;
            while (value > 0) {
                r += value & mask;
                value = value >>> 2;
            }
            return r;
        };
        const horizontalXray = function* (board, pos, color) {
            for (const direction of cescacs_types_1.csConvert.orthogonalDirections()) {
                const it = cescacs_positionHelper_1.PositionHelper.orthogonalRide(pos, direction);
                let v = it.next();
                while (v.done == false) {
                    const piece1 = board.getPiece(v.value);
                    if (piece1 == null)
                        v = it.next();
                    else {
                        const it2 = cescacs_positionHelper_1.PositionHelper.orthogonalRide(v.value, direction);
                        let v2 = it2.next();
                        while (v2.done == false) {
                            const piece2 = board.getPiece(v2.value);
                            if (piece2 == null)
                                v2 = it.next();
                            else {
                                if (piece2.color != color)
                                    yield [piece1, piece2];
                                v2 = it2.return();
                            }
                        }
                        v = it.return();
                    }
                }
            }
        };
        const diagonalXray = function* (board, pos, color) {
            for (const direction of cescacs_types_1.csConvert.diagonalDirections()) {
                const it = cescacs_positionHelper_1.PositionHelper.diagonalRide(pos, direction);
                let v = it.next();
                while (v.done == false) {
                    const piece1 = board.getPiece(v.value);
                    if (piece1 == null)
                        v = it.next();
                    else {
                        const it2 = cescacs_positionHelper_1.PositionHelper.diagonalRide(v.value, direction);
                        let v2 = it2.next();
                        while (v2.done == false) {
                            const piece2 = board.getPiece(v2.value);
                            if (piece2 == null)
                                v2 = it.next();
                            else {
                                if (piece2.color != color)
                                    yield [piece1, piece2];
                                v2 = it2.return();
                            }
                        }
                        v = it.return();
                    }
                }
            }
        };
        const currentKing = turn === 'w' ? this.wKing : this.bKing;
        const pieces = turn == 'w' ? this.wPieces : this.bPieces;
        const oponentPieces = turn == 'w' ? this.bPieces : this.wPieces;
        const color = (turn == 'w' ? 'White' : 'Black');
        const ownThreats = turn == 'w' ? this.wThreats : this.bThreats;
        const oponentThreats = turn == 'w' ? this.bThreats : this.wThreats;
        const ownCentralHexMask = turn == 'w' ? ((63 >>> 1) >>> 0) : (((63 >>> 1) >>> 0) << 24);
        const oponentCentralHexMask = turn == 'w' ? (((63 >>> 1) >>> 0) << 24) : ((63 >>> 1) >>> 0);
        const oponentPositions = turn == 'w' ? this.bPositions : this.wPositions;
        let ownTotalHexes = 0;
        let oponentTotalHexes = 0;
        let ownCentralHexes = 0;
        let oponentCentralHexes = 0;
        let nOwnBishops = 0;
        let nOponentBishops = 0;
        let enpriseTotal = 0;
        let threats = 0;
        let pin = 0;
        result.pieces[0] = 0;
        result.pieces[1] = 0;
        result.positioning = 0;
        result.mobility = 0;
        result.king = 0;
        {
            // reverse threats are already computed prepareCurrentTurn
            for (const piece of pieces.values()) {
                piece.markThreats(this);
            }
        }
        for (const piece of pieces.values()) {
            if (piece.position != null) {
                const defended = this.hasThreat(piece.position, color);
                result.pieces[0] += piece.value;
                if (piece.symbol === 'J')
                    nOwnBishops++;
                if (this.isThreated(piece.position, color)) {
                    threats -= defended ? piece.value * 0.75 : piece.value;
                }
                else if (defended)
                    threats += 1 - piece.value * 0.0625; //=1/16
                //pinned piece cant move
                if (piece.pin == null) {
                    for (const m of this.pieceMoves(piece)) {
                        result.mobility += 0.01;
                    }
                    if (piece.hasOrthogonalAttack) {
                        for (const [p1, p2] of horizontalXray(this, piece.position, color)) {
                            if (p1.color == color) {
                                if (p1.value <= piece.value && piece.value < p2.value) {
                                    if (p1.hasOrthogonalAttack) {
                                        //p2.value already counted other place
                                        threats += (p2.value - p1.value) * 0.25; //add attack for sure gain
                                    }
                                    else if ((defended || !p2.hasOrthogonalAttack)) {
                                        threats += p2.value * 0.0625; //attack to p2 hindered by p1
                                    }
                                }
                                //waring! else cases: p1.value already counted other place
                            }
                            else if (p1.value > piece.value) {
                                threats += (p1.value - piece.value) * 0.25; //add attack for sure gain
                            }
                            else if (p1.value < p2.value && !p1.hasOrthogonalAttack && p2.value > piece.value) {
                                threats += p1.value * 0.25; //p1 pinned cause of attack to p2
                            }
                        }
                    }
                    if (piece.hasDiagonalAttack) {
                        for (const [p1, p2] of diagonalXray(this, piece.position, color)) {
                            if (p1.color == color) {
                                if (p1.value <= piece.value && piece.value < p2.value) {
                                    if (p1.hasDiagonalAttack) {
                                        //p2.value already counted other place
                                        threats += (p2.value - p1.value) * 0.25; //add attack for sure gain
                                    }
                                    else if ((defended || !p2.hasDiagonalAttack)) {
                                        threats += p2.value * 0.0625; //attack to p2 hindered by p1
                                    }
                                }
                                //waring! else cases: p1.value already counted other place
                            }
                            else if (p1.value > piece.value) {
                                threats += (p1.value - piece.value) * 0.25; //add attack for sure gain
                            }
                            else if (p1.value < p2.value && !p1.hasDiagonalAttack && p2.value > piece.value) {
                                threats += p1.value * 0.25; //p1 pinned cause of attack to p2
                            }
                        }
                    }
                }
                else {
                    //simplification of pin case: cant do any move
                    pin -= piece.value;
                    result.king -= defended ? 0.2 : 0.4;
                }
            }
        }
        for (const piece of oponentPieces.values()) {
            if (piece.position != null) {
                result.pieces[1] += piece.value;
                if (piece.symbol === 'J')
                    nOponentBishops++;
                //be careful: Threated changed as hasThreat cause of color
                if (this.hasThreat(piece.position, color))
                    threats += piece.value;
                if (piece.pin != null)
                    pin += piece.value;
            }
        }
        for (let i = 0; i <= 7; i++) {
            let enprise = oponentPositions[i] & ownThreats[i] & ~oponentThreats[i];
            let j = 0;
            while (enprise != 0) {
                if ((enprise & 1) == 1) {
                    const colIndex = (i << 1) - ((j + 1) % 2);
                    const piece = this.getPiece([colIndex, j]);
                    enpriseTotal += piece.value;
                }
                enprise = enprise >>> 1;
                j++;
            }
            ownTotalHexes += countBitset(ownThreats[i]);
            oponentTotalHexes += countBitset(oponentThreats[i]);
        }
        ownCentralHexes += countOddBitset(ownThreats[2] & ~oponentThreats[2] & ownCentralHexMask);
        oponentCentralHexes += countOddBitset(oponentThreats[2] & ~ownThreats[2] & oponentCentralHexMask);
        for (let i = 3; i <= 5; i++) {
            ownCentralHexes += countBitset(ownThreats[i] & ~oponentThreats[i] & ownCentralHexMask);
            oponentCentralHexes += countBitset(oponentThreats[i] & ~ownThreats[i] & oponentCentralHexMask);
        }
        if (currentKing.checked) {
            if (!this.anyMove)
                result.king -= 120;
            else if (currentKing.isDoubleCheck())
                result.king -= 30;
            else if (currentKing.isKnightOrCloseCheck())
                result.king -= 20;
            else
                result.king -= 15;
        }
        else if (!this.anyMove)
            result.king -= 6;
        for (const pos of currentKing.attemptMoves(this)) {
            const pieceColor = this.hasPiece(pos);
            if (this.isThreated(pos, color)) {
                result.king -= this.hasThreat(pos, color) ? 0.25 : 0.5;
            }
            else if (pieceColor == null)
                result.king += 0.1;
            else
                result.king -= 0.05;
        }
        if (nOwnBishops >= 2)
            result.pieces[0] += nOwnBishops == 3 ? 1 : 0.5;
        if (nOponentBishops >= 2)
            result.pieces[1] += nOponentBishops == 3 ? 1 : 0.5;
        result.space[0] = ownTotalHexes * 0.01;
        result.space[1] = oponentTotalHexes * 0.01;
        result.positioning = (ownCentralHexes - oponentCentralHexes + threats + pin) * 0.01 + enpriseTotal * 0.125;
        //TODO: KING mobility + KING positioning
        //TODO: Piece development
        //TODO: Pawns near promotion
        return result;
    }
    clearThreats(color) {
        const threats = (color == "White" ? this.wThreats : this.bThreats);
        for (let i = 0; i <= 7; i++)
            threats[i] = 0;
    }
    clearPins(color) {
        for (const piece of (color == "White" ? this.wPieces.values() : this.bPieces.values()))
            piece.pin = null;
    }
}
exports.Board = Board;
class Game extends Board {
    constructor(grand = false, restoreStatusTLPD) {
        const restoreStatus = restoreStatusTLPD === null || restoreStatusTLPD === void 0 ? void 0 : restoreStatusTLPD.split(" ");
        const turn = (restoreStatus === null || restoreStatus === void 0 ? void 0 : restoreStatus[1]) != null && (restoreStatus[1] == 'w' || restoreStatus[1] == 'b') ? restoreStatus[1] : 'w';
        super(grand, turn);
        this.pawnMoved = false;
        this.pieceCaptured = false;
        this._mate = false;
        this._stalemate = false;
        this._draw = false;
        this._resigned = false;
        this._enpassantCaptureCoordString = null;
        this._lastMove = "";
        this._currentHeuristic = Board.newHeuristic();
        if (restoreStatusTLPD === undefined) {
            this.wKing.setToInitialPosition();
            this.addPiece(this.wKing);
            this.bKing.setToInitialPosition();
            this.addPiece(this.bKing);
            const pieces = Game.fillDefaultPositions(grand);
            for (const piece of pieces) {
                this.addPiece(piece);
            }
            this.halfmoveClock = 0;
            this.moveNumber = 1;
        }
        else if (restoreStatus != null && restoreStatus.length >= 2 && (restoreStatus[1] == 'w' || restoreStatus[1] == 'b')) {
            const [wCastlingStatus, bCastlingStatus] = Game.splitCastlingStatus(restoreStatus[2]);
            this.restorePositions(restoreStatus[0], wCastlingStatus, bCastlingStatus);
            this.halfmoveClock = cescacs_types_1.csTypes.isNumber(Number(restoreStatus[4])) ? Number(restoreStatus[4]) : 0;
            if (isNaN(Number(restoreStatus[4]))) {
                if (restoreStatus[4] != null && restoreStatus[4] !== "-")
                    throw new TypeError("Invalid halfmove clock value");
            }
            this.moveNumber = cescacs_types_1.csTypes.isNumber(Number(restoreStatus[5])) ? Number(restoreStatus[5]) : 1;
            if (isNaN(Number(restoreStatus[5]))) {
                if (restoreStatus[5] != null && restoreStatus[5] !== "-")
                    throw new TypeError("Invalid move number");
            }
            super.specialPawnCapture = PawnSpecialCaptureStatus.parse(this, restoreStatus[3]);
        }
        else
            throw new Error("Piece positions and turn are mandatory parts of the TLPD string");
        this.initGame();
    }
    static kingCastlingPosition(color, column) {
        const kingPosition = (color == 'White' ? cescacs_positionHelper_1.PositionHelper.whiteKingInitPosition : cescacs_positionHelper_1.PositionHelper.blackKingInitPosition);
        const kingCastleMove = (color == 'White' ? Game.whiteKingCastleMove : Game.blackKingCastleMove)[column];
        return cescacs_positionHelper_1.PositionHelper.knightJump(kingPosition, kingCastleMove);
    }
    static createPiece(pieceName, color, columnIndex, line) {
        if (columnIndex != null && line != null) {
            const column = cescacs_types_1.csConvert.columnFromIndex(columnIndex);
            switch (pieceName) {
                case "K": throw new Error("King must be created before setting it on the board (without position)");
                case "D": return new cescacs_piece_2.Queen(color, column, line);
                case "V": return new cescacs_piece_2.Wyvern(color, column, line);
                case "R": return new cescacs_piece_2.Rook(color, column, line);
                case "G": return new cescacs_piece_2.Pegasus(color, column, line);
                case "N": return new cescacs_piece_2.Knight(color, column, line);
                case "J": return new cescacs_piece_2.Bishop(color, column, line);
                case "E": return new cescacs_piece_2.Elephant(color, column, line);
                case "M": return new cescacs_piece_2.Almogaver(color, column, line);
                case "P": return new cescacs_piece_2.Pawn(color, column, line);
                default: {
                    const exhaustiveCheck = pieceName;
                    throw new Error(exhaustiveCheck);
                }
            }
        }
        else {
            switch (pieceName) {
                case "K": return new cescacs_piece_2.King(color);
                case "D": return new cescacs_piece_2.Queen(color);
                case "V": return new cescacs_piece_2.Wyvern(color);
                case "R": return new cescacs_piece_2.Rook(color);
                case "G": return new cescacs_piece_2.Pegasus(color);
                case "N": return new cescacs_piece_2.Knight(color);
                case "J": throw new Error("Bishop needs position or HexColor to be created");
                case "E": return new cescacs_piece_2.Elephant(color);
                case "M": return new cescacs_piece_2.Almogaver(color);
                case "P": return new cescacs_piece_2.Pawn(color);
                default: {
                    const exhaustiveCheck = pieceName;
                    throw new Error(exhaustiveCheck);
                }
            }
        }
    }
    static convertPieceAliases(pieceSymbol) {
        switch (pieceSymbol) {
            case "Q": return "D";
            case "W": return "V";
            case "T": return "R";
            case "C":
            case "S": return "N";
            case "A":
            case "B":
            case "F":
            case "L": return "J";
            default: {
                if (cescacs_types_1.csTypes.isPieceName(pieceSymbol))
                    return pieceSymbol;
                else
                    throw new TypeError(`Invalid piece symbol ${pieceSymbol}`);
            }
        }
    }
    static fillDefaultPositions(grand = false) {
        const pieces = [];
        pieces.push(new cescacs_piece_2.Queen("White", 'E', 1), new cescacs_piece_2.Wyvern("White", 'F', 0));
        pieces.push(new cescacs_piece_2.Pegasus("White", 'D', 2), new cescacs_piece_2.Bishop("White", 'F', 2), new cescacs_piece_2.Pegasus("White", 'H', 2));
        if (grand) {
            pieces.push(new cescacs_piece_2.Pawn("White", 'B', 6), new cescacs_piece_2.Rook("White", 'B', 4), new cescacs_piece_2.Knight("White", 'C', 3));
            pieces.push(new cescacs_piece_2.Knight("White", 'I', 3), new cescacs_piece_2.Rook("White", 'K', 4), new cescacs_piece_2.Pawn("White", 'K', 6));
            pieces.push(new cescacs_piece_2.Pawn("White", 'P', 7), new cescacs_piece_2.Pawn("White", 'T', 8), new cescacs_piece_2.Pawn("White", 'X', 8), new cescacs_piece_2.Pawn("White", 'Z', 7));
            pieces.push(new cescacs_piece_2.Almogaver("White", 'C', 7), new cescacs_piece_2.Almogaver("White", 'A', 7), new cescacs_piece_2.Almogaver("White", 'L', 7), new cescacs_piece_2.Almogaver("White", 'I', 7));
        }
        else {
            pieces.push(new cescacs_piece_2.Pawn("White", 'B', 4), new cescacs_piece_2.Rook("White", 'C', 3), new cescacs_piece_2.Rook("White", 'I', 3), new cescacs_piece_2.Pawn("White", 'K', 4));
        }
        pieces.push(new cescacs_piece_2.Knight("White", 'E', 3), new cescacs_piece_2.Knight("White", 'G', 3));
        pieces.push(new cescacs_piece_2.Elephant("White", 'D', 4), new cescacs_piece_2.Bishop("White", 'F', 4), new cescacs_piece_2.Elephant("White", 'H', 4));
        pieces.push(new cescacs_piece_2.Pawn("White", 'A', 5), new cescacs_piece_2.Pawn("White", 'C', 5), new cescacs_piece_2.Elephant("White", 'E', 5), new cescacs_piece_2.Elephant("White", 'G', 5), new cescacs_piece_2.Pawn("White", 'I', 5), new cescacs_piece_2.Pawn("White", 'L', 5));
        pieces.push(new cescacs_piece_2.Pawn("White", 'D', 6), new cescacs_piece_2.Bishop("White", 'F', 6), new cescacs_piece_2.Pawn("White", 'H', 6));
        pieces.push(new cescacs_piece_2.Pawn("White", 'E', 7), new cescacs_piece_2.Pawn("White", 'F', 8), new cescacs_piece_2.Pawn("White", 'G', 7));
        pieces.push(new cescacs_piece_2.Queen("Black", 'E', 27), new cescacs_piece_2.Wyvern("Black", 'F', 28));
        pieces.push(new cescacs_piece_2.Pegasus("Black", 'D', 26), new cescacs_piece_2.Bishop("Black", 'F', 26), new cescacs_piece_2.Pegasus("Black", 'H', 26));
        if (grand) {
            pieces.push(new cescacs_piece_2.Pawn("Black", 'B', 22), new cescacs_piece_2.Rook("Black", 'B', 24), new cescacs_piece_2.Knight("Black", 'C', 25));
            pieces.push(new cescacs_piece_2.Knight("Black", 'I', 25), new cescacs_piece_2.Rook("Black", 'K', 24), new cescacs_piece_2.Pawn("Black", 'K', 22));
            pieces.push(new cescacs_piece_2.Pawn("Black", 'P', 21), new cescacs_piece_2.Pawn("Black", 'T', 20), new cescacs_piece_2.Pawn("Black", 'X', 20), new cescacs_piece_2.Pawn("Black", 'Z', 21));
            pieces.push(new cescacs_piece_2.Almogaver("Black", 'C', 21), new cescacs_piece_2.Almogaver("Black", 'A', 21), new cescacs_piece_2.Almogaver("Black", 'I', 21), new cescacs_piece_2.Almogaver("Black", 'L', 21));
        }
        else {
            pieces.push(new cescacs_piece_2.Pawn("Black", 'B', 24), new cescacs_piece_2.Rook("Black", 'C', 25), new cescacs_piece_2.Rook("Black", 'I', 25), new cescacs_piece_2.Pawn("Black", 'K', 24));
        }
        pieces.push(new cescacs_piece_2.Knight("Black", 'E', 25), new cescacs_piece_2.Knight("Black", 'G', 25));
        pieces.push(new cescacs_piece_2.Elephant("Black", 'D', 24), new cescacs_piece_2.Bishop("Black", 'F', 24), new cescacs_piece_2.Elephant("Black", 'H', 24));
        pieces.push(new cescacs_piece_2.Pawn("Black", 'A', 23), new cescacs_piece_2.Pawn("Black", 'C', 23), new cescacs_piece_2.Elephant("Black", 'E', 23), new cescacs_piece_2.Elephant("Black", 'G', 23), new cescacs_piece_2.Pawn("Black", 'I', 23), new cescacs_piece_2.Pawn("Black", 'L', 23));
        pieces.push(new cescacs_piece_2.Pawn("Black", 'D', 22), new cescacs_piece_2.Bishop("Black", 'F', 22), new cescacs_piece_2.Pawn("Black", 'H', 22));
        pieces.push(new cescacs_piece_2.Pawn("Black", 'E', 21), new cescacs_piece_2.Pawn("Black", 'F', 20), new cescacs_piece_2.Pawn("Black", 'G', 21));
        return pieces;
    }
    ;
    static rookCastleMove(kingDestinationColumn, rookDestinationColumn, color, side, grand) {
        if (side == 'K') {
            if (rookDestinationColumn == 'K')
                return grand ? (color == 'White' ? "ColumnUp" : "ColumnDown") : color == 'White' ? "FileUp" : "FileDown";
            else if (rookDestinationColumn == 'I')
                return grand ? (color == 'White' ? "FileInvDown" : "FileInvUp") : color == 'White' ? "ColumnUp" : "ColumnDown";
            else
                return color == 'White' ? "FileInvUp" : "FileInvDown";
        }
        else {
            if (rookDestinationColumn == 'E' && kingDestinationColumn == 'D')
                return color == 'White' ? "FileDown" : "FileUp";
            else
                return color == 'White' ? "FileUp" : "FileDown";
        }
    }
    get gameEnd() { return this._mate || this._resigned || this._stalemate || this._draw; }
    get mate() { return this._mate; }
    get stalemate() { return this._stalemate; }
    set draw(value) { this._draw = value; }
    get draw() { return this._draw; }
    set resign(value) { this._resigned = value; }
    get resigned() { return this._resigned; }
    get lastMove() { return this._lastMove; }
    get currentHeuristic() { return this._currentHeuristic; }
    get enPassantCaptureCoordString() {
        return this._enpassantCaptureCoordString;
    }
    get resultString() {
        if (this.gameEnd) {
            if (this._mate || this._resigned)
                return this.turn == 'w' ? "0 - 3" : "3 - 0";
            else if (this._stalemate)
                return this.turn == 'w' ? "1 - 2" : "2 - 1";
            else if (this._draw)
                return "1 - 1";
            else
                throw new Error("End game exhaustiveCheck fail");
        }
        else
            return null;
    }
    set resultString(value) {
        if (value != null && value.length > 0) {
            if (this.gameEnd) {
                if (value != this.resultString)
                    throw new Error(`Incorrect end game value issued: ${value} correct value ${this.resultString}`);
            }
            else {
                switch (value) {
                    case "0 - 3": {
                        if (this.turn == 'w')
                            this.resign = true;
                        else
                            throw new Error(`Incorrect resign turn: ${value}`);
                        break;
                    }
                    case "3 - 0": {
                        if (this.turn == 'b')
                            this.resign = true;
                        else
                            throw new Error(`Incorrect resign turn: ${value}`);
                        break;
                    }
                    case "1 - 1": {
                        this.draw = true;
                        break;
                    }
                    case "null": break;
                    default: throw new Error(`Incorrect end game value issued: ${value}`);
                }
            }
        }
    }
    setLastMove(symbolPrefix, fromHex, movement, toHex, promotionPostfix) {
        this._lastMove = (symbolPrefix !== null && symbolPrefix !== void 0 ? symbolPrefix : "") + fromHex + movement + toHex;
        if (promotionPostfix !== undefined)
            this._lastMove += "=" + promotionPostfix;
    }
    //current player heuristic
    get preMoveHeuristic() {
        return this._currentHeuristic;
    }
    doMove(fromHex, toHex) {
        try {
            const moveFrom = cescacs_positionHelper_1.PositionHelper.parse(fromHex);
            const moveTo = cescacs_positionHelper_1.PositionHelper.parse(toHex);
            const piece = this.getPiece(moveFrom);
            if (piece != null) {
                const movementText = this.movePieceTo(piece, moveTo);
                const symbolPrefix = piece.symbol !== 'P' ? piece.symbol : undefined;
                this.setLastMove(symbolPrefix, fromHex, movementText, toHex);
                this.forwardingTurn();
            }
            else {
                console.log("empty piece at " + cescacs_positionHelper_1.PositionHelper.toString(moveFrom));
                this._lastMove = "";
            }
        }
        catch (e) {
            console.log(e);
        }
    }
    doPromotePawn(fromHex, toHex, promoteTo) {
        try {
            const moveFrom = cescacs_positionHelper_1.PositionHelper.parse(fromHex);
            const moveTo = cescacs_positionHelper_1.PositionHelper.parse(toHex);
            const pawn = this.getPiece(moveFrom);
            if (pawn != null && cescacs_piece_1.csPieceTypes.isPawn(pawn)) {
                (0, ts_general_1.assertCondition)(cescacs_positionHelper_1.PositionHelper.isPromotionHex(moveTo, pawn.color), "Promotion hex");
                const hexesColor = cescacs_positionHelper_1.PositionHelper.hexColor(moveTo);
                const piece = this.currentRegainablePieces(hexesColor).find(x => x.symbol == promoteTo && (!cescacs_piece_1.csPieceTypes.isBishop(x) || x.hexesColor == hexesColor));
                (0, ts_general_1.assertNonNullish)(piece, "promotion piece");
                if (cescacs_positionHelper_1.PositionHelper.equals(moveFrom, moveTo)) {
                    this.pieceCaptured = false;
                    this.pawnMoved = true;
                    this._lastMove = cescacs_positionHelper_1.PositionHelper.toString(moveTo) + "=" + promoteTo;
                }
                else {
                    const movementText = this.movePieceTo(pawn, moveTo);
                    this.setLastMove(undefined, fromHex, movementText, toHex, promoteTo);
                }
                super.promotePawn(pawn, piece);
                this.forwardingTurn();
            }
            else {
                console.log("empty piece or invalid for promotion at " + cescacs_positionHelper_1.PositionHelper.toString(moveFrom));
                this._lastMove = "";
            }
        }
        catch (e) {
            console.log(e);
        }
    }
    doCastling(castlingMove, assertions = false) {
        if (assertions) {
            (0, ts_general_1.assertCondition)(castlingMove.length >= 6 && castlingMove.length <= 8, "castling move string length");
            (0, ts_general_1.assertCondition)(castlingMove[0] == 'K' && castlingMove[1] == 'R', "castling move string prefix");
        }
        const currentColor = this.turn == 'w' ? 'White' : 'Black';
        const currentKing = this.turn == 'w' ? this.wKing : this.bKing;
        const cmove = castlingMove.split("-");
        const side = cmove[0][2] == 'R' ? 'K' : cmove[0][2];
        const kCol = cmove[1][0];
        const rCol = cmove[1][1];
        const rCol2 = cmove[1].length == 3 && cmove[1][2] != 'O' ? cmove[1][2] : undefined;
        const singleStep = cmove[1].length > 3 ? false : cmove[1].length == 3 && cmove[1][2] == 'O' ? true : undefined;
        (0, ts_general_1.assertCondition)(side == 'K' || side == 'D', `${side} must be King (K) side or Queen (D) side`);
        if (assertions) {
            (0, ts_general_1.assertCondition)(cescacs_types_1.csTypes.iscastlingColumn(kCol), `${kCol} must be a king castling column name`);
            (0, ts_general_1.assertCondition)(cescacs_types_1.csTypes.isColumn(rCol), `${rCol} must be a column name`);
        }
        const kPos = this.castlingKingPosition(kCol);
        const rPos = this.castlingRookPosition(kCol, rCol, side, singleStep);
        const rook = this.getPiece(side == 'K' ? cescacs_positionHelper_1.PositionHelper.initialKingSideRookPosition(currentColor, this.isGrand)
            : cescacs_positionHelper_1.PositionHelper.initialQueenSideRookPosition(currentColor, this.isGrand));
        (0, ts_general_1.assertNonNullish)(kPos, "king castling position");
        (0, ts_general_1.assertNonNullish)(rook, "castling rook piece");
        (0, ts_general_1.assertCondition)(cescacs_piece_1.csPieceTypes.isRook(rook) && !rook.moved, "castling rook hasn't been moved");
        if (assertions)
            (0, ts_general_1.assertCondition)(rook.canMoveTo(this, rPos, false));
        if (rCol2 !== undefined) {
            const r2Pos = this.castlingRookPosition(kCol, rCol2, 'D', singleStep);
            const rook2 = this.getPiece(cescacs_positionHelper_1.PositionHelper.initialQueenSideRookPosition(currentColor, this.isGrand));
            (0, ts_general_1.assertNonNullish)(rook2, "double castling queen side rook");
            (0, ts_general_1.assertCondition)(cescacs_piece_1.csPieceTypes.isRook(rook2) && !rook2.moved, "castling queen rook hasn't been moved");
            if (assertions)
                (0, ts_general_1.assertCondition)(rook2.canMoveTo(this, r2Pos, false));
            super.movePiece(rook2, r2Pos[0], r2Pos[1]);
        }
        super.movePiece(currentKing, kPos[0], kPos[1]);
        super.movePiece(rook, rPos[0], rPos[1]);
        this._enpassantCaptureCoordString = null;
        this.pieceCaptured = false;
        this.pawnMoved = false;
        this._lastMove = castlingMove;
        this.forwardingTurn();
    }
    *pieceList() {
        for (const p of this.whitePieces())
            yield p.uncapitalizedSymbolPositionString;
        for (const p of this.blackPieces())
            yield p.uncapitalizedSymbolPositionString;
    }
    *threatedPieceStringPositions() {
        const piecePositionsGenerator = this.turn == 'w' ? this.whitePiecePositions() : this.blackPiecePositions();
        const color = this.turn == 'w' ? 'White' : 'Black';
        for (const pos of piecePositionsGenerator) {
            if (this.isThreated(pos, color))
                yield cescacs_positionHelper_1.PositionHelper.toString(pos);
        }
    }
    *ownThreatedPieceStringPositions() {
        const piecePositionsGenerator = this.turn == 'w' ? this.blackPiecePositions() : this.whitePiecePositions();
        const color = this.turn == 'w' ? 'Black' : 'White';
        for (const pos of piecePositionsGenerator) {
            if (this.isThreated(pos, color))
                yield cescacs_positionHelper_1.PositionHelper.toString(pos);
        }
    }
    castlingKingPosition(column) {
        const currentKing = this.turn == 'w' ? this.wKing : this.bKing;
        (0, ts_general_1.assertCondition)(cescacs_types_1.csTypes.iscastlingColumn(column), `Column: ${column} has to be a king castling column`);
        if (currentKing.moved)
            return null;
        else {
            const pos = Game.kingCastlingPosition(currentKing.color, column);
            if (this.hasPiece(pos) == null && !this.isThreated(pos, currentKing.color))
                return pos;
            else
                return null;
        }
    }
    castlingRookPosition(kingColumn, rookColumn, side, singleStep) {
        const currentColor = this.turn == 'w' ? 'White' : 'Black';
        const rookPos = side == 'K' ? cescacs_positionHelper_1.PositionHelper.initialKingSideRookPosition(currentColor, this.isGrand)
            : cescacs_positionHelper_1.PositionHelper.initialQueenSideRookPosition(currentColor, this.isGrand);
        (0, ts_general_1.assertCondition)(cescacs_types_1.csTypes.iscastlingColumn(kingColumn), `King column: ${kingColumn} has to be a king castling column`);
        const dir = Game.rookCastleMove(kingColumn, rookColumn, currentColor, side, this.isGrand);
        let pos = cescacs_positionHelper_1.PositionHelper.orthogonalStep(rookPos, dir);
        if (dir == "ColumnUp" || dir == "ColumnDown") {
            if (singleStep === undefined && !this.isGrand || singleStep !== undefined && !singleStep) {
                pos = cescacs_positionHelper_1.PositionHelper.orthogonalStep(pos, dir);
            }
            return pos;
        }
        else {
            const rookColumnIndex = cescacs_types_1.csConvert.toColumnIndex(rookColumn);
            while (pos[0] != rookColumnIndex) {
                pos = cescacs_positionHelper_1.PositionHelper.orthogonalStep(pos, dir);
            }
            return pos;
        }
    }
    *castlingMoves(color, kingFinalPos) {
        const qRookPos = cescacs_positionHelper_1.PositionHelper.initialQueenSideRookPosition(color, this.isGrand);
        const kRookPos = cescacs_positionHelper_1.PositionHelper.initialKingSideRookPosition(color, this.isGrand);
        const qRook = this.getPiece(qRookPos);
        const kRook = this.getPiece(kRookPos);
        if (kRook != null && !kRook.moved) {
            for (const d of cescacs_types_1.csConvert.orthogonalDirections()) {
                const destPos = cescacs_positionHelper_1.PositionHelper.orthogonalStep(kingFinalPos, d);
                if (destPos != null && kRook.canMoveTo(this, destPos, false)) {
                    let str = "KRK-" + cescacs_types_1.csConvert.columnFromIndex(kingFinalPos[0]) + cescacs_types_1.csConvert.columnFromIndex(destPos[0]);
                    //specific case
                    if (kingFinalPos[0] == 9 && destPos[0] == 10) {
                        const rookDesp = destPos[1] - kRookPos[1];
                        str += rookDesp == 2 || rookDesp == -2 ? "O" : "OO";
                    }
                    yield (str);
                    //double castling
                    if (qRook != null && !qRook.moved) {
                        let c;
                        let l;
                        if (kingFinalPos[0] == destPos[0]) {
                            c = destPos[0] + 1;
                            l = (kingFinalPos[1] > destPos[1] ? destPos[1] + 1 : kingFinalPos[1] + 1);
                            const rrPos = [c, l];
                            //only one of this positions is possible for a double castling, as are different files
                            let canMove;
                            canMove = qRook.canMoveTo(this, rrPos, false);
                            if (!canMove) {
                                rrPos[0] = destPos[0] - 1;
                                canMove = qRook.canMoveTo(this, rrPos, false);
                            }
                            if (canMove) {
                                str = "KRR-" +
                                    cescacs_types_1.csConvert.columnFromIndex(kingFinalPos[0]) +
                                    cescacs_types_1.csConvert.columnFromIndex(destPos[0]) +
                                    cescacs_types_1.csConvert.columnFromIndex(rrPos[0]);
                                yield str;
                            }
                        }
                        else {
                            c = destPos[0];
                            l = (kingFinalPos[1] > destPos[1] ? destPos[1] + 2 : destPos[1] - 2);
                            const rrPos = [c, l];
                            if (qRook.canMoveTo(this, rrPos, false)) {
                                str = "KRR-" +
                                    cescacs_types_1.csConvert.columnFromIndex(kingFinalPos[0]) +
                                    cescacs_types_1.csConvert.columnFromIndex(destPos[0]) +
                                    cescacs_types_1.csConvert.columnFromIndex(rrPos[0]);
                                yield str;
                            }
                            rrPos[0] = kingFinalPos[0];
                            rrPos[1] = (kingFinalPos[1] > destPos[1] ? kingFinalPos[1] - 2 : kingFinalPos[1] + 2);
                            if (qRook.canMoveTo(this, rrPos, false)) {
                                str = "KRR-" +
                                    cescacs_types_1.csConvert.columnFromIndex(kingFinalPos[0]) +
                                    cescacs_types_1.csConvert.columnFromIndex(destPos[0]) +
                                    cescacs_types_1.csConvert.columnFromIndex(rrPos[0]);
                                yield str;
                            }
                        }
                    }
                }
            }
        }
        if (qRook != null && !qRook.moved) {
            for (const d of cescacs_types_1.csConvert.orthogonalDirections()) {
                const destPos = cescacs_positionHelper_1.PositionHelper.orthogonalStep(kingFinalPos, d);
                if (destPos != null && qRook.canMoveTo(this, destPos, false)) {
                    yield ("KRD-" + cescacs_types_1.csConvert.columnFromIndex(kingFinalPos[0]) + cescacs_types_1.csConvert.columnFromIndex(destPos[0]));
                }
            }
        }
    }
    get valueTLPD() {
        var _a, _b;
        return this.piecePositions + " " + this.turn + " " + this.castlingStatus
            + " " + ((_b = (_a = this.specialPawnCapture) === null || _a === void 0 ? void 0 : _a.toString()) !== null && _b !== void 0 ? _b : "-")
            + " " + this.halfmoveClock.toString() + " " + this.moveNumber.toString();
    }
    get piecePositions() {
        let r = "/";
        for (let i = 28; i >= 0; i--) {
            const isEven = i % 2 == 0;
            const firstColumnIndex = i <= 5 ? 7 - i : (i >= 23 ? i - 21 : isEven ? 1 : 0);
            const lastColumnIndex = i <= 5 ? i + 7 : (i >= 23 ? 35 - i : isEven ? 13 : 14);
            let kStr = "";
            let e = 0;
            for (let k = firstColumnIndex; k <= lastColumnIndex; k += 2) {
                const piece = this.getPiece([k, i]);
                if (piece != null) {
                    if (e > 0)
                        kStr += e.toString();
                    kStr += piece.uncapitalizedSymbol;
                    e = 0;
                }
                else
                    e++;
            }
            if (kStr.length > 0) {
                r += i.toString() + ":" + kStr;
                if (e > 0)
                    r += e.toString();
                r += "/";
            }
        }
        return r;
    }
    get castlingStatus() {
        const w = this.wKing.getCastlingStatus(this);
        const b = this.bKing.getCastlingStatus(this).toLowerCase();
        if (w == "-" && b == "-")
            return "-";
        else if (w == "-")
            return b;
        else if (b == "-")
            return w;
        else
            return w + b;
    }
    playerCastlingStatus() {
        const currentKing = this.turn == 'w' ? this.wKing : this.bKing;
        return currentKing.getCastlingStatus(this);
    }
    playerCastlingPositionStatus(column) {
        const currentKing = this.turn == 'w' ? this.wKing : this.bKing;
        (0, ts_general_1.assertCondition)(cescacs_types_1.csTypes.iscastlingColumn(column), `Column: ${column} has to be a king castling column`);
        if (currentKing.moved)
            return null;
        else {
            const kingCastleMove = (this.turn == 'w' ? Game.whiteKingCastleMove : Game.blackKingCastleMove)[column];
            const pos = cescacs_positionHelper_1.PositionHelper.knightJump(currentKing.position, kingCastleMove);
            return [pos,
                this.hasPiece(pos) != null ? 'occupied' : this.isThreated(pos, currentKing.color) ? 'threated' : ""];
        }
    }
    loadTLPD(restoreStatusTLPD) {
        if (restoreStatusTLPD == null || restoreStatusTLPD.trim().length <= 10)
            return false;
        else
            try {
                const restoreStatus = restoreStatusTLPD.split(" ");
                if (restoreStatus.length >= 2 && (restoreStatus[1] == 'w' || restoreStatus[1] == 'b')) {
                    const turn = restoreStatus[1];
                    super.resetGame(turn);
                    const [wCastlingStatus, bCastlingStatus] = Game.splitCastlingStatus(restoreStatus[2]);
                    this.restorePositions(restoreStatus[0], wCastlingStatus, bCastlingStatus);
                    this.halfmoveClock = cescacs_types_1.csTypes.isNumber(Number(restoreStatus[4])) ? Number(restoreStatus[4]) : 0;
                    if (isNaN(Number(restoreStatus[4]))) {
                        if (restoreStatus[4] != null && restoreStatus[4] !== "-")
                            throw new TypeError("Invalid halfmove clock value");
                    }
                    this.moveNumber = cescacs_types_1.csTypes.isNumber(Number(restoreStatus[5])) ? Number(restoreStatus[5]) : 1;
                    if (isNaN(Number(restoreStatus[5]))) {
                        if (restoreStatus[5] != null && restoreStatus[5] !== "-")
                            throw new TypeError("Invalid move number");
                    }
                    super.specialPawnCapture = PawnSpecialCaptureStatus.parse(this, restoreStatus[3]);
                    this.initGame();
                    return true;
                }
                else
                    return false;
            }
            catch (error) {
                console.log(error);
                return false;
            }
    }
    restorePositions(positions, wCastlingStatus, bCastlingStatus) {
        if (positions.length >= 10 && positions[0] == '/' && positions[positions.length - 1] == '/') {
            const rooks = [];
            const wPiece = [];
            const bPiece = [];
            const piecePos = positions.split("/");
            this.wKing.captured();
            this.bKing.captured();
            for (let lineContent of piecePos) {
                if (lineContent.length > 0) {
                    if (!lineContent.startsWith(':') && !lineContent.endsWith(':') && (lineContent.match(/:/g) || []).length == 1) {
                        const [strActualLine, content] = lineContent.split(":");
                        const actualLine = Number(strActualLine);
                        if (!isNaN(actualLine) && actualLine >= 0 && actualLine <= 28) {
                            const initialColumnIndex = (actualLine >= 0 && actualLine < 6) ?
                                7 - actualLine : actualLine <= 22 ? (actualLine % 2 == 0 ? 1 : 0) : actualLine - 21;
                            const finalColumnIndex = (actualLine >= 0 && actualLine < 6) ?
                                7 + actualLine : actualLine <= 22 ? (actualLine % 2 == 0 ? 13 : 14) : 35 - actualLine;
                            let actualColumnIndex = initialColumnIndex;
                            for (const pieceName of content) {
                                if (actualColumnIndex > finalColumnIndex)
                                    throw new Error("Incorrect TLPD line content");
                                else {
                                    const value = Number(pieceName);
                                    if (isNaN(value)) {
                                        const pieceSymbol = cescacs_types_1.csTypes.isPieceName(pieceName) ? pieceName : Game.convertPieceAliases(pieceName.toUpperCase());
                                        const color = pieceName.toUpperCase() == pieceName ? "White" : "Black";
                                        if (pieceSymbol == 'K') {
                                            if (color == 'White') {
                                                if (this.wKing.position != null)
                                                    throw new Error("Can't place two White Kings");
                                                else
                                                    this.wKing.setPositionTo([actualColumnIndex, actualLine]);
                                                if (this.hasPiece(this.wKing.position) == null)
                                                    this.addPiece(this.wKing);
                                                else
                                                    throw new Error("Can't place White King on the place used by another piece");
                                            }
                                            else {
                                                if (this.bKing.position != null)
                                                    throw new Error("Can't place two Black Kings");
                                                else
                                                    this.bKing.setPositionTo([actualColumnIndex, actualLine]);
                                                if (this.hasPiece(this.bKing.position) == null)
                                                    this.addPiece(this.bKing);
                                                else
                                                    throw new Error("Can't place Black King on the place used by another piece");
                                            }
                                        }
                                        else {
                                            const newPiece = Game.createPiece(pieceSymbol, color, actualColumnIndex, actualLine);
                                            if (cescacs_piece_1.csPieceTypes.isRook(newPiece))
                                                rooks.push(newPiece);
                                            if (cescacs_piece_1.csPieceTypes.isPawn(newPiece) && newPiece.isAwaitingPromotion)
                                                super.isAwaitingPromotion = true;
                                            if (this.hasPiece(newPiece.position) == null) {
                                                const pieceSet = (color == 'White' ? wPiece : bPiece);
                                                this.addPiece(newPiece);
                                                pieceSet.push(newPiece);
                                            }
                                            else
                                                throw new Error(`You cannot put a ${color} ${pieceSymbol} there` +
                                                    ", because the hex is already in use; There may be a repeated line in the TLPD");
                                        }
                                        actualColumnIndex += 2;
                                    }
                                    else
                                        actualColumnIndex += value << 1;
                                }
                            }
                        }
                        else
                            throw new Error(`Incorrect line issued: ${strActualLine}`);
                    }
                    else
                        throw new Error(`Incorrect line number issued: ${lineContent}`);
                }
            }
            if (this.wKing.position == null)
                throw new Error("There must be a White King");
            if (this.bKing.position == null)
                throw new Error("There must be a Black King");
            {
                const countOccurrences = (arr, val) => arr.reduce((n, v) => (v.symbol === val ? n + 1 : n), 0);
                for (let color of ['White', 'Black']) {
                    const pieceSet = (color == 'White' ? wPiece : bPiece);
                    let n = countOccurrences(pieceSet, 'D');
                    if (n > 1)
                        throw new Error(`Too many ${color} Queens`);
                    else if (n == 0)
                        this.addRegainablePiece(Game.createPiece("D", color));
                    n = countOccurrences(pieceSet, 'V');
                    if (n > 1)
                        throw new Error(`Too many ${color} Wyverns`);
                    else if (n == 0)
                        this.addRegainablePiece(Game.createPiece("V", color));
                    n = countOccurrences(pieceSet, 'R');
                    if (n > 2)
                        throw new Error(`Too many ${color} Rooks`);
                    else {
                        while (n < 2) {
                            this.addRegainablePiece(Game.createPiece("R", color));
                            n++;
                        }
                    }
                    n = countOccurrences(pieceSet, 'G');
                    if (n > 2)
                        throw new Error(`Too many ${color} Pegasus`);
                    else {
                        while (n < 2) {
                            this.addRegainablePiece(Game.createPiece("G", color));
                            n++;
                        }
                    }
                    n = countOccurrences(pieceSet, 'N');
                    if (n > 2)
                        throw new Error(`Too many ${color} Knights`);
                    else {
                        while (n < 2) {
                            this.addRegainablePiece(Game.createPiece("N", color));
                            n++;
                        }
                    }
                    n = countOccurrences(pieceSet, 'J');
                    if (n > 3)
                        throw new Error(`Too many ${color} Bishops`);
                    else {
                        let count = { "White": 0, "Black": 0, "Color": 0 };
                        for (const element of pieceSet.filter((value) => cescacs_piece_1.csPieceTypes.isBishop(value))) {
                            count[element.hexesColor] += 1;
                        }
                        if (count.White > 1 || count.Black > 1 || count.Color > 1)
                            throw new Error(`Too many ${color} Bishops on same color hexes`);
                        else {
                            if (count.White == 0)
                                this.addRegainablePiece(new cescacs_piece_2.Bishop(color, "White"));
                            if (count.Black == 0)
                                this.addRegainablePiece(new cescacs_piece_2.Bishop(color, "Black"));
                            if (count.Color == 0)
                                this.addRegainablePiece(new cescacs_piece_2.Bishop(color, "Color"));
                        }
                    }
                }
            }
            this.wKing.castlingStatus = wCastlingStatus;
            this.bKing.castlingStatus = bCastlingStatus;
            for (const r of rooks) {
                r.setCastlingStatus(r.color == "White" ? wCastlingStatus : bCastlingStatus, this.isGrand);
            }
        }
        else
            throw new TypeError(`Invalid TLPD string positions: ${positions}`);
    }
    // STATUS STACK (turn + castling + hecacPawnCapture + halfmoveClock + move)
    movePieceTo(piece, pos) {
        var _a, _b, _c;
        const isEnPassantCapture = cescacs_piece_1.csPieceTypes.isPawn(piece) && this.specialPawnCapture != null &&
            this.specialPawnCapture.isEnPassantCapturable() && this.specialPawnCapture.isEnPassantCapture(pos, piece);
        const capturedPiece = (_a = this.getPiece(pos)) !== null && _a !== void 0 ? _a : (isEnPassantCapture ? this.specialPawnCapture.capturablePawn : null);
        const isScornfulCapture = capturedPiece != null && cescacs_piece_1.csPieceTypes.isPawn(piece) && this.specialPawnCapture != null &&
            this.specialPawnCapture.isScornfulCapturable() && this.specialPawnCapture.isScorned(piece, pos);
        const isLongEnPassant = isEnPassantCapture && Math.abs(capturedPiece.position[1] - pos[1]) > 2;
        this._enpassantCaptureCoordString = null;
        (0, ts_general_1.assertCondition)(piece.canMoveTo(this, pos), `Piece ${piece.symbol} at ${(_b = piece.position) === null || _b === void 0 ? void 0 : _b.toString()} move to ${pos.toString()}`);
        if (capturedPiece != null) {
            (0, ts_general_1.assertCondition)(piece.color != capturedPiece.color && piece.canCaptureOn(this, pos), `Piece ${piece.symbol} at ${(_c = piece.position) === null || _c === void 0 ? void 0 : _c.toString()} capture on ${pos.toString()}`);
            if (isEnPassantCapture) {
                this._enpassantCaptureCoordString = cescacs_types_1.csConvert.columnFromIndex(capturedPiece.position[0]) + capturedPiece.position[1].toString();
            }
            super.capturePiece(capturedPiece);
        }
        const moveSymbol = capturedPiece == null ? "-" : (capturedPiece.symbol == 'P' ?
            (isLongEnPassant ? "@@" : (isEnPassantCapture || isScornfulCapture) ? "@" : "x")
            : isScornfulCapture ? "@" : "x") + capturedPiece.symbol;
        super.movePiece(piece, pos[0], pos[1]);
        this.pieceCaptured = capturedPiece != null;
        this.pawnMoved = piece.symbol == 'P';
        return moveSymbol;
    }
    forwardingTurn() {
        super.nextTurn();
        if (this.turn === 'w')
            this.moveNumber++;
        if (this.pawnMoved || this.pieceCaptured)
            this.halfmoveClock = 0;
        else
            this.halfmoveClock++;
        super.prepareCurrentTurn();
        if (!super.anyMove) {
            if (this.checked)
                this._mate = true;
            else
                this._stalemate = true;
        }
        else if (this.halfmoveClock >= 100)
            this._draw = true;
        if (this.checked) {
            if (this._mate)
                this._lastMove += "#";
            else if (this.isKnightOrCloseCheck)
                this._lastMove += "^+";
            else if (this.isSingleCheck)
                this._lastMove += "+";
            else if (this.isDoubleCheck)
                this._lastMove += "++";
            else
                throw new Error("never: exhaused check options");
        }
        super.computeHeuristic(this.turn, this._currentHeuristic);
    }
    initGame() {
        super.prepareGame();
        this._mate = false;
        this._stalemate = false;
        this._resigned = false;
        this._draw = false;
        if (!this.anyMove) {
            if (this.checked)
                this._mate = true;
            else
                this._stalemate = true;
        }
        else if (this.halfmoveClock >= 100)
            this._draw = true;
        this._lastMove = "";
        this._currentHeuristic = super.computeHeuristic(this.turn, this._currentHeuristic);
    }
}
exports.Game = Game;
Game.whiteKingCastleMove = {
    'I': "LineUp-FileUp",
    'H': "LineUp-ColumnUp",
    'F': "LineInvUp-ColumnUp",
    'E': "LineInvUp-FileInvUp",
    'D': "TransversalLineDec-FileInvUp"
};
Game.blackKingCastleMove = {
    'I': "LineDown-FileDown",
    'H': "LineDown-ColumnDown",
    'F': "LineInvDown-ColumnDown",
    'E': "LineInvDown-FileInvDown",
    'D': "TransversalLineDec-FileInvDown"
};
