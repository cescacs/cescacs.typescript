(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.cescacs = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = exports.Board = exports.EnPassantCapturable = exports.ScornfulCapturable = exports.PawnSpecialCaptureStatus = exports.round2hundredths = exports.csmv = exports.cspty = exports.PositionHelper = void 0;
const ts_general_1 = require("./ts.general");
Object.defineProperty(exports, "round2hundredths", { enumerable: true, get: function () { return ts_general_1.round2hundredths; } });
const cescacs_types_1 = require("./cescacs.types");
const cescacs_piece_1 = require("./cescacs.piece");
Object.defineProperty(exports, "cspty", { enumerable: true, get: function () { return cescacs_piece_1.csPieceTypes; } });
const cescacs_positionHelper_1 = require("./cescacs.positionHelper");
Object.defineProperty(exports, "PositionHelper", { enumerable: true, get: function () { return cescacs_positionHelper_1.PositionHelper; } });
const cescacs_piece_2 = require("./cescacs.piece");
const cescacs_moves_1 = require("./cescacs.moves");
Object.defineProperty(exports, "csmv", { enumerable: true, get: function () { return cescacs_moves_1.csMoves; } });
//#region PawnSpecialCapture classes
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
                        if (piece != null) {
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
                        if (piece != null)
                            return new ScornfulCapturable(piece, p0);
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
    get capturablePiece() { return this._capturablePiece; }
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
    isScorned(pawn, pos) {
        const result = pawn.position != null && cescacs_positionHelper_1.PositionHelper.equals(pawn.position, this._capturerPawnPos);
        if (pos == null)
            return result;
        else
            return result && cescacs_positionHelper_1.PositionHelper.equals(pos, this.capturablePiece.position);
    }
    get scornfulCaptureDirection() {
        const capturerColumnIndex = this._capturerPawnPos[0];
        const capturablePawnPos = this.capturablePiece.position;
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
    static promoteCapturablePawn(enpassantCapturable, capturablePiece) {
        return new EnPassantCapturable(capturablePiece, enpassantCapturable._captureTo);
    }
    isEnPassantCapture(pos, capturerPawn) {
        const isEnPassantCapturePos = this._captureTo.some(x => cescacs_positionHelper_1.PositionHelper.equals(x, pos));
        if (capturerPawn == null)
            return isEnPassantCapturePos;
        else if (isEnPassantCapturePos && capturerPawn.position != null) {
            const capturerPos = capturerPawn.position;
            if (cescacs_piece_1.csPieceTypes.isPawn(capturerPawn)) {
                if (Math.abs(pos[0] - capturerPos[0]) == 1) {
                    if (capturerPawn.color == 'w')
                        return pos[1] - capturerPos[1] == 3;
                    else
                        return capturerPos[1] - pos[1] == 3;
                }
                else
                    return false;
            }
            else
                return cescacs_positionHelper_1.PositionHelper.isDiagonally(pos, capturerPos) != null;
        }
        else
            return false;
    }
    toString() {
        return cescacs_positionHelper_1.PositionHelper.toString(this.capturablePiece.position) + "@" + this.captureLines();
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
//#endregion
class Board {
    constructor(isGrand, turn) {
        this.isGrand = isGrand;
        this.wPositions = [0, 0, 0, 0, 0, 0, 0, 0];
        this.bPositions = [0, 0, 0, 0, 0, 0, 0, 0];
        this.wThreats = [0, 0, 0, 0, 0, 0, 0, 0];
        this.bThreats = [0, 0, 0, 0, 0, 0, 0, 0];
        this.pieces = new Map();
        this.wPieces = new Map();
        this.bPieces = new Map();
        this._regainablePieces = [];
        this.wKing = new cescacs_piece_2.King('w');
        this.bKing = new cescacs_piece_2.King('b');
        this._specialPawnCapture = null;
        this._currentHeuristic = Board.newHeuristic();
        this._wAwaitingPromotion = false;
        this._bAwaitingPromotion = false;
        this._turn = turn ?? 'w';
        this.pieces.set(this.wKing.key, this.wKing);
        this.pieces.set(this.bKing.key, this.bKing);
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
    get turn() { return this._turn; }
    get turnKing() { return (this.turn === 'w' ? this.wKing : this.bKing); }
    get checked() { return this.turnKing.checked; }
    get isKnightOrCloseCheck() { return this.turnKing.isKnightOrCloseCheck(); }
    get isSingleCheck() { return this.turnKing.isSingleCheck(); }
    get isDoubleCheck() { return this.turnKing.isDoubleCheck(); }
    pieceByKey(key) {
        const piece = this.pieces.get(key);
        (0, ts_general_1.assertNonNullish)(piece, "piece from unique key");
        return piece;
    }
    get specialPawnCapture() { return this._specialPawnCapture; }
    set specialPawnCapture(value) { this._specialPawnCapture = value; }
    get isAwaitingPromotion() { return this._turn == 'w' ? this._wAwaitingPromotion : this._bAwaitingPromotion; }
    setAwaitingPromotion(color) {
        if (color == 'w')
            this._wAwaitingPromotion = true;
        else
            this._bAwaitingPromotion = true;
    }
    computeAwaitingPromotion(color) {
        let value = false;
        for (const piece of (color == 'w' ? this.wPieces : this.bPieces).values()) {
            if (cescacs_piece_1.csPieceTypes.isPawn(piece) && piece.awaitingPromotion) {
                value = true;
                break;
            }
        }
        if (color == 'w')
            this._wAwaitingPromotion = value;
        else
            this._bAwaitingPromotion = value;
    }
    get currentHeuristic() { return this._currentHeuristic; }
    getHeuristicValue(h) {
        return (0, ts_general_1.round2hundredths)(h.pieces[0] - h.pieces[1] + h.space[0] - h.space[1] + h.positioning + h.mobility + h.king);
    }
    createPiece(pieceName, color, column, line) {
        let piece;
        switch (pieceName) {
            //TODO: correct King creation exception?
            case "K": throw new Error("King must be created before setting it on the board");
            case "D":
                piece = new cescacs_piece_2.Queen(color, column, line);
                break;
            case "V":
                piece = new cescacs_piece_2.Wyvern(color, column, line);
                break;
            case "R":
                piece = new cescacs_piece_2.Rook(color, this.isGrand, column, line);
                break;
            case "G":
                piece = new cescacs_piece_2.Pegasus(color, column, line);
                break;
            case "N":
                piece = new cescacs_piece_2.Knight(color, column, line);
                break;
            case "J":
                piece = new cescacs_piece_2.Bishop(color, column, line);
                break;
            case "E":
                piece = new cescacs_piece_2.Elephant(color, column, line);
                break;
            case "M":
                piece = new cescacs_piece_2.Almogaver(color, column, line);
                break;
            case "P":
                piece = new cescacs_piece_2.Pawn(color, column, line);
                break;
            default: {
                const exhaustiveCheck = pieceName;
                throw new Error(exhaustiveCheck);
            }
        }
        if (this.hasPiece(piece.position) == null) {
            this.pieces.set(piece.key, piece);
            this.addPiece(piece);
        }
        else
            throw new Error(`You cannot put a ${color} ${piece.symbol} there` +
                ", because the hex is already in use; There may be a repeated line in the TLPD");
        return piece;
    }
    addPiece(piece) {
        (0, ts_general_1.assertNonNullish)(piece.position, `${piece.symbol} position`);
        const toPos = piece.position;
        const pieces = (piece.color == "w" ? this.wPieces : this.bPieces);
        pieces.set(cescacs_positionHelper_1.PositionHelper.positionKey(toPos), piece);
        const posCol = (toPos[0] + 1) >>> 1;
        const posLineMask = Board.lineMask(toPos[1]);
        const positions = (piece.color == "w" ? this.wPositions : this.bPositions);
        positions[posCol] |= posLineMask;
    }
    hasPiece(pos) {
        const posCol = (pos[0] + 1) >>> 1;
        const posLineMask = Board.lineMask(pos[1]);
        if ((this.wPositions[posCol] & posLineMask) != 0) {
            return 'w';
        }
        else if ((this.bPositions[posCol] & posLineMask) != 0) {
            return 'b';
        }
        else
            return null;
    }
    getPiece(pos) {
        const color = this.hasPiece(pos);
        if (color == null)
            return null;
        else if (color == 'w') {
            return this.wPieces.get(cescacs_positionHelper_1.PositionHelper.positionKey(pos));
        }
        else {
            return this.bPieces.get(cescacs_positionHelper_1.PositionHelper.positionKey(pos));
        }
    }
    hasThreat(pos, color) {
        const posCol = (pos[0] + 1) >>> 1;
        return ((color == "w" ? this.wThreats : this.bThreats)[posCol] & Board.lineMask(pos[1])) != 0;
    }
    isThreatened(pos, color) {
        const posCol = (pos[0] + 1) >>> 1;
        return ((color == "w" ? this.bThreats : this.wThreats)[posCol] & Board.lineMask(pos[1])) != 0;
    }
    setThreat(pos, color) {
        const posCol = (pos[0] + 1) >>> 1;
        (color == "w" ? this.wThreats : this.bThreats)[posCol] |= Board.lineMask(pos[1]);
    }
    //#region Regainable pieces
    addRegainablePiece(piece) {
        if (piece.position == null) {
            this._regainablePieces.push(piece);
            this.pieces.set(piece.key, piece);
        }
    }
    hasRegainablePieces(hexColor) {
        const currentColor = this._turn;
        return this._regainablePieces.reduce((found, p) => found || p.color == currentColor && (!cescacs_piece_1.csPieceTypes.isBishop(p) || p.hexesColor == hexColor), false);
    }
    hasAwaitingRegainablePieces() {
        const currentColor = this._turn;
        if (this._regainablePieces.reduce((found, p) => found || p.color == currentColor && p.symbol != 'J', false))
            return true;
        else {
            const bishops = this._regainablePieces.filter(p => p.color == currentColor && p.symbol == 'J');
            if (bishops.length == 0)
                return false;
            else {
                const pieces = this._turn == 'w' ? this.wPieces : this.bPieces;
                for (const piece of pieces.values()) {
                    if (cescacs_piece_1.csPieceTypes.isPawn(piece)) {
                        const awaitingPromotion = piece.awaitingPromotion;
                        if (awaitingPromotion != null && bishops.some(b => b.hexesColor == awaitingPromotion))
                            return true;
                    }
                }
                return false;
            }
        }
    }
    findRegeinablePiece(color, promoteTo, hexColor) {
        const piece = this._regainablePieces.find(p => p.color == color && p.symbol == promoteTo && (!cescacs_piece_1.csPieceTypes.isBishop(p) || p.hexesColor == hexColor));
        (0, ts_general_1.assertNonNullish)(piece, "retrieve the promoted piece");
        return piece;
    }
    currentRegainablePieceNames(hexColor) {
        const currentColor = this._turn;
        return this._regainablePieces.reduce((s, x) => x.color == currentColor && (!cescacs_piece_1.csPieceTypes.isBishop(x) || x.hexesColor == hexColor) ? s.add(x.symbol) : s, new Set());
    }
    maxRegainablePiecesValue(hexColor) {
        const currentColor = this._turn;
        return this._regainablePieces.reduce((acc, x) => x.value > acc && x.color == currentColor && (!cescacs_piece_1.csPieceTypes.isBishop(x) || x.hexesColor == hexColor) ? x.value : acc, 0);
    }
    //#endregion
    *whitePieces() { for (const p of this.wPieces.values())
        yield p; }
    *blackPieces() { for (const p of this.bPieces.values())
        yield p; }
    *whitePiecePositions() { for (const p of this.wPieces.values())
        yield p.position; }
    *blackPiecePositions() { for (const p of this.bPieces.values())
        yield p.position; }
    *pieceMoves(piece) {
        const currentKing = this.turnKing;
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
    movePiece(piece, toColumnIndex, toLine) {
        (0, ts_general_1.assertNonNullish)(piece.position, `${piece.symbol} position`);
        const piecePos = piece.position;
        const fromPosCol = (piecePos[0] + 1) >>> 1;
        const fromPosLineMask = Board.lineMask(piecePos[1]);
        const pieces = (piece.color == "w" ? this.wPieces : this.bPieces);
        if (cescacs_piece_1.csPieceTypes.isPawn(piece)) {
            let scornedPawn = null;
            let multipleStep = null;
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
            if (scornedPawn != null) {
                this._specialPawnCapture = new ScornfulCapturable(piece, scornedPawn.position);
            }
            else if (multipleStep != null) {
                this._specialPawnCapture = new EnPassantCapturable(piece, multipleStep);
            }
            else {
                this._specialPawnCapture = null;
            }
            if (cescacs_positionHelper_1.PositionHelper.isPromotionPos(toColumnIndex, toLine, piece.color)) {
                if (piece.color == 'w')
                    this._wAwaitingPromotion = true;
                else
                    this._bAwaitingPromotion = true;
            }
        }
        else {
            this._specialPawnCapture = null;
        }
        pieces.delete(cescacs_positionHelper_1.PositionHelper.positionKey(piecePos));
        piece.moveTo(toColumnIndex, toLine); //piecePos updated
        pieces.set(cescacs_positionHelper_1.PositionHelper.positionKey(piecePos), piece);
        const toPosCol = (piecePos[0] + 1) >>> 1;
        const toPosLineMask = Board.lineMask(piecePos[1]);
        const positions = (piece.color == "w" ? this.wPositions : this.bPositions);
        positions[fromPosCol] &= ~fromPosLineMask;
        positions[toPosCol] |= toPosLineMask;
    }
    undoPieceMove(piece, fromColumnIndex, fromLine) {
        const pieces = (piece.color == "w" ? this.wPieces : this.bPieces);
        const piecePos = piece.position;
        const actualPosCol = (piecePos[0] + 1) >>> 1;
        const actualPosLineMask = Board.lineMask(piecePos[1]);
        pieces.delete(cescacs_positionHelper_1.PositionHelper.positionKey(piecePos));
        piece.moveTo(fromColumnIndex, fromLine); //piecePos updated
        pieces.set(cescacs_positionHelper_1.PositionHelper.positionKey(piecePos), piece);
        const fromPosCol = (piecePos[0] + 1) >>> 1;
        const fromPosLineMask = Board.lineMask(piecePos[1]);
        const positions = (piece.color == "w" ? this.wPositions : this.bPositions);
        positions[actualPosCol] &= ~actualPosLineMask;
        positions[fromPosCol] |= fromPosLineMask;
    }
    capturePiece(piece) {
        (0, ts_general_1.assertNonNullish)(piece.position, `${piece.symbol} position`);
        const fromPos = piece.position;
        const posCol = (fromPos[0] + 1) >>> 1;
        const posLineMask = Board.lineMask(fromPos[1]);
        const positions = (piece.color == "w" ? this.wPositions : this.bPositions);
        positions[posCol] &= ~posLineMask;
        const pieces = (piece.color == "w" ? this.wPieces : this.bPieces);
        pieces.delete(cescacs_positionHelper_1.PositionHelper.positionKey(fromPos));
        piece.captured();
        if (piece.isRegainable)
            this._regainablePieces.push(piece);
    }
    undoCapturePiece(piece, colIndex, line) {
        if (cescacs_piece_2.Piece.isRegainablePiece(piece.symbol)) {
            const pix = this._regainablePieces.indexOf(piece);
            (0, ts_general_1.assertCondition)(pix >= 0, "Captured piece found in the regainable pieces bag");
            this._regainablePieces.splice(pix, 1);
        }
        piece.setPositionTo([colIndex, line]);
        this.addPiece(piece);
    }
    promotePawn(pawn, piece) {
        if (this._regainablePieces.includes(piece)) {
            const pieces = (piece.color == "w" ? this.wPieces : this.bPieces);
            pieces.delete(cescacs_positionHelper_1.PositionHelper.positionKey(pawn.position));
            pawn.promoteTo(piece);
            pieces.set(cescacs_positionHelper_1.PositionHelper.positionKey(piece.position), piece);
            if (this._specialPawnCapture != null && this._specialPawnCapture.capturablePawn == pawn) {
                if (this._specialPawnCapture.isScornfulCapturable()) {
                    this._specialPawnCapture = ScornfulCapturable.promoteCapturablePawn(this._specialPawnCapture, piece);
                }
                else if (this._specialPawnCapture.isEnPassantCapturable()) {
                    this._specialPawnCapture = EnPassantCapturable.promoteCapturablePawn(this._specialPawnCapture, piece);
                }
            }
            const pos = this._regainablePieces.indexOf(piece);
            this._regainablePieces.splice(pos, 1);
            if (piece.color == 'w')
                this._wAwaitingPromotion = false;
            else
                this._bAwaitingPromotion = false;
        }
    }
    undoPromotePawn(pawn, piece) {
        const pieces = (piece.color == "w" ? this.wPieces : this.bPieces);
        pieces.delete(cescacs_positionHelper_1.PositionHelper.positionKey(piece.position));
        pawn.setPositionTo([piece.position[0], piece.position[1]]);
        piece.captured();
        this._regainablePieces.push(piece);
        pieces.set(cescacs_positionHelper_1.PositionHelper.positionKey(pawn.position), pawn);
    }
    nextTurn() {
        this._turn = this._turn === 'w' ? 'b' : 'w';
    }
    prepareTurn(currentKing) {
        const color = currentKing.color;
        {
            const threats = (color == "w" ? this.bThreats : this.wThreats);
            for (let i = 0; i <= 7; i++)
                threats[i] = 0;
        }
        {
            const threatingPieces = (color == 'w' ? this.bPieces.values() : this.wPieces.values());
            for (const piece of threatingPieces)
                piece.markThreats(this);
        }
        {
            const ownPieces = (color == "w" ? this.wPieces.values() : this.bPieces.values());
            for (const piece of ownPieces)
                piece.pin = null;
        }
        currentKing.computeCheckAndPins(this);
    }
    prepareCurrentTurn() {
        this.prepareTurn(this.turnKing);
    }
    isMoveableTurn() {
        const movingPieces = (this.turn === 'w' ? this.wPieces.values() : this.bPieces.values());
        for (const piece of movingPieces) {
            const it = this.pieceMoves(piece);
            if (!it.next().done)
                return true;
        }
        return false;
    }
    prepareGame() {
        if (this._turn == 'w')
            this.prepareTurn(this.bKing);
        else
            this.prepareTurn(this.wKing);
        this.prepareCurrentTurn();
    }
    resetGame(turn) {
        for (let i = 0; i < 8; i++) {
            this.wPositions[i] = 0;
            this.bPositions[i] = 0;
            this.wThreats[i] = 0;
            this.bThreats[i] = 0;
        }
        this.pieces.clear();
        this.wPieces.clear();
        this.bPieces.clear();
        if (this.wKing.position != null)
            this.wKing.captured();
        if (this.bKing.position != null)
            this.bKing.captured();
        this._regainablePieces.length = 0;
        this._specialPawnCapture = null;
        this._turn = turn;
        this.pieces.set(this.wKing.key, this.wKing);
        this.pieces.set(this.bKing.key, this.bKing);
    }
    computeHeuristic(turn, moveCount, anyMove, result) {
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
        const currentKing = this.turnKing;
        result.pieces[0] = 0;
        result.pieces[1] = 0;
        result.positioning = 0;
        result.mobility = 0;
        if (!anyMove) {
            if (currentKing.checked)
                result.king = -120;
            else
                result.king = -6;
            result.space[0] = 0;
            result.space[0] = 0;
        }
        else {
            const color = turn;
            if (currentKing.checked) {
                if (currentKing.isDoubleCheck())
                    result.king = -15;
                else if (currentKing.isKnightOrCloseCheck())
                    result.king = -12;
                else
                    result.king = -10;
            }
            else if (!currentKing.moved)
                result.king = 0.1;
            else
                result.king = 0;
            for (const pos of currentKing.attemptMoves(this, true)) {
                const pieceColor = this.hasPiece(pos);
                if (currentKing.checked) {
                    if (this.isThreatened(pos, color))
                        result.king -= 2;
                    else if (pieceColor == null)
                        result.king += 0.5;
                    else if (pieceColor == color)
                        result.king -= 0.5;
                }
                else {
                    if (this.isThreatened(pos, color)) {
                        result.king -= this.hasThreat(pos, color) ? 0.25 : 0.5;
                    }
                    else if (pieceColor == null)
                        result.king -= 0.01;
                    else if (pieceColor == color)
                        result.king += 0.05;
                }
            }
            const pieces = turn == 'w' ? this.wPieces : this.bPieces;
            const oponentPieces = turn == 'w' ? this.bPieces : this.wPieces;
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
            {
                // reverse threats are already computed prepareCurrentTurn
                const threats = (color == "w" ? this.wThreats : this.bThreats);
                for (let i = 0; i <= 7; i++)
                    threats[i] = 0;
                for (const piece of pieces.values()) {
                    piece.markThreats(this);
                }
            }
            let development = 0;
            let troupCount = 0;
            let troupDeveloped = 0;
            let pieceDeveloped = 0;
            let advancedPawn = 0;
            const isTroupDeveloped = (pos, color) => color == 'w' ? pos[1] > 8 : pos[1] < 20;
            const isPieceDeveloped = (pos, color) => color == 'w' ? pos[1] > (pos[0] == 7 ? 6 : 3) : pos[1] < (pos[0] == 7 ? 22 : 25);
            for (const piece of pieces.values()) {
                if (piece.position != null) {
                    const defended = this.hasThreat(piece.position, color);
                    result.pieces[0] += piece.value;
                    if (piece.symbol === 'J')
                        nOwnBishops++;
                    if (this.isThreatened(piece.position, color)) {
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
                            if (isPieceDeveloped(piece.position, color))
                                pieceDeveloped += piece.value;
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
                            if (isPieceDeveloped(piece.position, color))
                                pieceDeveloped += piece.value;
                        }
                        else if (cescacs_piece_1.csPieceTypes.isElephant(piece) || cescacs_piece_1.csPieceTypes.isAlmogaver(piece)) {
                            troupCount += piece.value;
                            if (isTroupDeveloped(piece.position, color))
                                troupDeveloped += piece.value;
                        }
                        else if (cescacs_piece_1.csPieceTypes.isPawn(piece)) {
                            troupCount += piece.value;
                            if (piece.hasTripleStep(this.isGrand))
                                result.mobility += 0.01;
                            else if (isTroupDeveloped(piece.position, color)) {
                                troupDeveloped++;
                                if (defended) {
                                    troupDeveloped++;
                                    const pd = cescacs_positionHelper_1.PositionHelper.promotionDistance(piece.position, color);
                                    if (pd < 14) {
                                        advancedPawn += (14 - cescacs_positionHelper_1.PositionHelper.promotionDistance(piece.position, color)) << 1;
                                    }
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
            if (moveCount <= 12) {
                if (((troupCount - troupDeveloped) >> 1) > troupDeveloped) {
                    development = troupDeveloped - pieceDeveloped;
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
            if (nOwnBishops >= 2)
                result.pieces[0] += nOwnBishops == 3 ? 1 : 0.5;
            if (nOponentBishops >= 2)
                result.pieces[1] += nOponentBishops == 3 ? 1 : 0.5;
            result.space[0] = ownTotalHexes * 0.01;
            result.space[1] = oponentTotalHexes * 0.01;
            result.positioning = (ownCentralHexes - oponentCentralHexes + threats + pin + development + advancedPawn) * 0.01 + enpriseTotal * 0.125;
        }
        return result;
    }
}
exports.Board = Board;
class Game extends Board {
    constructor(grand = false, restoreStatusTLPD) {
        const restoreStatus = restoreStatusTLPD?.split(" ");
        const turn = restoreStatus?.[1] != null && (restoreStatus[1] == 'w' || restoreStatus[1] == 'b') ? restoreStatus[1] : 'w';
        super(grand, turn);
        //#endregion
        this._moves = [];
        this._top = -1;
        this.fixedNumbering = true;
        this._mate = false;
        this._stalemate = false;
        this._draw = false;
        this._resigned = false;
        this._enpassantCaptureCoordString = null;
        if (restoreStatusTLPD === undefined) {
            this.fillDefaultPositions();
            this.halfmoveClock = 0;
            this.moveNumber = 1;
            this.fixedNumbering = true;
        }
        else if (restoreStatus != null && restoreStatus.length >= 2 && cescacs_types_1.csTypes.isTurn(restoreStatus[1])) {
            const [wCastlingStatus, bCastlingStatus] = Board.splitCastlingStatus(restoreStatus[2]);
            this.restoreTLPDPositions(restoreStatus[0], wCastlingStatus, bCastlingStatus);
            this.halfmoveClock = cescacs_types_1.csTypes.isNumber(Number(restoreStatus[4])) ? Number(restoreStatus[4]) : 0;
            if (isNaN(Number(restoreStatus[4]))) {
                if (restoreStatus[4] != null && restoreStatus[4] !== "-")
                    throw new TypeError("Invalid halfmove clock value");
            }
            this.moveNumber = cescacs_types_1.csTypes.isNumber(Number(restoreStatus[5])) ? Number(restoreStatus[5]) : 1;
            if (isNaN(Number(restoreStatus[5]))) {
                if (restoreStatus[5] == null || restoreStatus[5] == "-")
                    this.fixedNumbering = false;
                else
                    throw new TypeError("Invalid move number");
            }
            else
                this.fixedNumbering = true;
            super.specialPawnCapture = PawnSpecialCaptureStatus.parse(this, restoreStatus[3]);
        }
        else
            throw new Error("Piece positions and turn are mandatory parts of the TLPD string");
        this.initGame();
    }
    static kingCastlingPosition(color, column) {
        const kingPosition = (color == 'w' ? cescacs_positionHelper_1.PositionHelper.whiteKingInitPosition : cescacs_positionHelper_1.PositionHelper.blackKingInitPosition);
        const kingCastleMove = (color == 'w' ? Game.whiteKingCastlingMove : Game.blackKingCastlingMove)[column];
        return cescacs_positionHelper_1.PositionHelper.knightJump(kingPosition, kingCastleMove);
    }
    //#region PRIVATE STATIC
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
    static rookCastleMove(kingDestinationColumn, rookDestinationColumn, color, side, grand) {
        if (side == 'K') {
            if (rookDestinationColumn == 'K')
                return grand ? (color == 'w' ? "ColumnUp" : "ColumnDown") : color == 'w' ? "FileUp" : "FileDown";
            else if (rookDestinationColumn == 'I')
                return grand ? (color == 'w' ? "FileInvDown" : "FileInvUp") : color == 'w' ? "ColumnUp" : "ColumnDown";
            else
                return color == 'w' ? "FileInvUp" : "FileInvDown";
        }
        else {
            if (rookDestinationColumn == 'E' && kingDestinationColumn == 'D')
                return color == 'w' ? "FileDown" : "FileUp";
            else
                return color == 'w' ? "FileUp" : "FileDown";
        }
    }
    get gameEnd() { return this._mate || this._stalemate || this._draw || this._resigned; }
    get mate() { return this._mate; }
    get stalemate() { return this._stalemate; }
    set draw(value) { this._draw = value; }
    get draw() { return this._draw; }
    set resign(value) { this._resigned = value; }
    get resigned() { return this._resigned; }
    getHexPiece(pos) {
        const p = cescacs_positionHelper_1.PositionHelper.parse(pos);
        if (p == null || !cescacs_positionHelper_1.PositionHelper.isValidPosition(p))
            return null;
        else
            return this.getPiece(p);
    }
    get lastMove() {
        if (this._top >= 0)
            return cescacs_moves_1.csMoves.fullMoveNotation(this._moves[this._top], false);
        else
            return null;
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
    get enPassantCaptureCoordString() {
        return this._enpassantCaptureCoordString;
    }
    get preMoveHeuristic() { return this.currentHeuristic; }
    doMove(fromHex, toHex, pieceName) {
        try {
            (0, ts_general_1.assertCondition)(this._top == this._moves.length - 1, "push the moves over the last one");
            const moveFrom = cescacs_positionHelper_1.PositionHelper.parse(fromHex);
            const moveTo = cescacs_positionHelper_1.PositionHelper.parse(toHex);
            const piece = this.getPiece(moveFrom);
            (0, ts_general_1.assertCondition)(piece != null, `piece on ${fromHex} position`);
            (0, ts_general_1.assertCondition)(pieceName == undefined || piece.symbol == pieceName, `${pieceName} is the piece on ${moveFrom}`);
            (0, ts_general_1.assertCondition)(piece.canMoveTo(this, moveTo), `Piece ${piece.symbol} at ${piece.position?.toString()} move to ${moveTo.toString()}`);
            const move = {
                piece: piece.key,
                pos: moveFrom,
                moveTo: moveTo
            };
            const capturedPiece = this.getPiece(moveTo);
            if (capturedPiece != null) {
                (0, ts_general_1.assertCondition)(piece.color != capturedPiece.color && piece.canCaptureOn(this, moveTo), `Piece ${piece.symbol} at ${piece.position?.toString()} capture on ${moveTo.toString()}`);
                const isScornfulCapture = cescacs_piece_1.csPieceTypes.isPawn(piece) && this.specialPawnCapture != null &&
                    this.specialPawnCapture.isScornfulCapturable() && this.specialPawnCapture.isScorned(piece, moveTo);
                move.captured = capturedPiece.key;
                move.special = isScornfulCapture ? moveTo : undefined;
                this._enpassantCaptureCoordString = null;
            }
            else if (this.specialPawnCapture != null && (cescacs_piece_1.csPieceTypes.isPawn(piece) || cescacs_piece_1.csPieceTypes.isAlmogaver(piece))
                && this.specialPawnCapture.isEnPassantCapturable()
                && this.specialPawnCapture.isEnPassantCapture(moveTo, piece)) {
                const enPassantCapture = this.specialPawnCapture.capturablePiece;
                move.captured = enPassantCapture.key;
                move.special = [enPassantCapture.position[0], enPassantCapture.position[1]];
                this._enpassantCaptureCoordString = cescacs_positionHelper_1.PositionHelper.toString(move.special);
            }
            else {
                this._enpassantCaptureCoordString = null;
            }
            this.pushMove(move);
        }
        catch (e) {
            if (e instanceof Error && e.name == 'Error')
                e.name = 'DoMove';
            throw e;
        }
    }
    doPromotePawn(fromHex, toHex, promoteTo) {
        try {
            (0, ts_general_1.assertCondition)(this._top == this._moves.length - 1, "push the moves over the last one");
            const moveFrom = cescacs_positionHelper_1.PositionHelper.parse(fromHex);
            const moveTo = cescacs_positionHelper_1.PositionHelper.parse(toHex);
            const pawn = this.getPiece(moveFrom);
            (0, ts_general_1.assertCondition)(pawn != null && cescacs_piece_1.csPieceTypes.isPawn(pawn), `pawn on ${fromHex} position`);
            (0, ts_general_1.assertCondition)(cescacs_positionHelper_1.PositionHelper.isPromotionHex(moveTo, pawn.color), "Promotion hex");
            const hexesColor = cescacs_positionHelper_1.PositionHelper.hexColor(moveTo);
            const piece = super.findRegeinablePiece(pawn.color, promoteTo, hexesColor);
            const promotion = {
                piece: pawn.key,
                prPos: moveTo,
                promoted: piece
            };
            if (!cescacs_positionHelper_1.PositionHelper.equals(moveFrom, moveTo)) {
                promotion.pos = moveFrom;
                promotion.moveTo = moveTo;
                const capturedPiece = this.getPiece(moveTo);
                if (capturedPiece != null) {
                    (0, ts_general_1.assertCondition)(pawn.color != capturedPiece.color && pawn.canCaptureOn(this, moveTo), `Pawn at ${piece.position?.toString()} capture on ${moveTo.toString()}`);
                    const isScornfulCapture = cescacs_piece_1.csPieceTypes.isPawn(piece) && this.specialPawnCapture != null &&
                        this.specialPawnCapture.isScornfulCapturable() && this.specialPawnCapture.isScorned(piece, moveTo);
                    promotion.captured = capturedPiece.key;
                    promotion.special = isScornfulCapture ? moveTo : undefined;
                    this._enpassantCaptureCoordString = null;
                }
                else if (this.specialPawnCapture != null && this.specialPawnCapture.isEnPassantCapturable()
                    && this.specialPawnCapture.isEnPassantCapture(moveTo, pawn)) {
                    const enPassantCapture = this.specialPawnCapture.capturablePiece;
                    promotion.captured = enPassantCapture.key;
                    promotion.special = [enPassantCapture.position[0], enPassantCapture.position[1]];
                    this._enpassantCaptureCoordString = cescacs_positionHelper_1.PositionHelper.toString(promotion.special);
                }
                else {
                    this._enpassantCaptureCoordString = null;
                }
            }
            this.pushMove(promotion);
        }
        catch (e) {
            if (e instanceof Error && e.name == 'Error')
                e.name = 'DoPromotePawn';
            throw e;
        }
    }
    doCastling(strMove) {
        try {
            if (this.isGrand)
                (0, ts_general_1.assertCondition)(cescacs_types_1.csTypes.isGrandCastlingString(strMove), "castling move string");
            else
                (0, ts_general_1.assertCondition)(cescacs_types_1.csTypes.isCastlingString(strMove), "castling move string");
            const currentKing = super.turnKing;
            const currentColor = this.turn;
            const cmove = strMove.split("-");
            const side = cmove[0][2] == 'R' ? 'K' : cmove[0][2];
            const kCol = cmove[1][0];
            const rCol = cmove[1][1];
            const rCol2 = cmove[1].length == 3 && cmove[1][2] != 'O' ? cmove[1][2] : undefined;
            const singleStep = cmove[1].length > 3 ? false : cmove[1].length == 3 && cmove[1][2] == 'O' ? true : undefined; //KRK-HIO i KRK-HIOO
            const kPos = Game.kingCastlingPosition(currentKing.color, kCol);
            (0, ts_general_1.assertCondition)(side == 'K' || side == 'D', `${side} must be King (K) side or Queen (D) side`);
            const rPos = this.castlingRookPosition(kCol, rCol, side, singleStep);
            const rook = this.getPiece(side == 'K' ? cescacs_positionHelper_1.PositionHelper.initialKingSideRookPosition(currentColor, this.isGrand)
                : cescacs_positionHelper_1.PositionHelper.initialQueenSideRookPosition(currentColor, this.isGrand));
            (0, ts_general_1.assertCondition)(!currentKing.moved, "King hasn't been moved");
            (0, ts_general_1.assertNonNullish)(kPos, "king destination hex");
            (0, ts_general_1.assertCondition)(this.hasPiece(kPos) == null, "empty king destination hex");
            (0, ts_general_1.assertCondition)(!this.isThreatened(kPos, currentKing.color), "Not threated king destination hex");
            (0, ts_general_1.assertNonNullish)(rook, "castling rook piece");
            (0, ts_general_1.assertCondition)(cescacs_piece_1.csPieceTypes.isRook(rook), "castling rook");
            (0, ts_general_1.assertCondition)(!rook.moved, "castling rook's not been moved");
            (0, ts_general_1.assertCondition)(rook.canMoveTo(this, rPos, false), "castling rook movement");
            const castlingMove = {
                side: cmove[0][2],
                col: kCol,
                rPos: rPos,
                kRook: side == 'K' ? rook.key : undefined,
                qRook: side == 'D' ? rook.key : undefined
            };
            if (rCol2 !== undefined) {
                const r2Pos = this.castlingRookPosition(kCol, rCol2, 'D', singleStep);
                const rook2 = this.getPiece(cescacs_positionHelper_1.PositionHelper.initialQueenSideRookPosition(currentColor, this.isGrand));
                (0, ts_general_1.assertNonNullish)(rook2, "double castling queen side rook");
                (0, ts_general_1.assertCondition)(cescacs_piece_1.csPieceTypes.isRook(rook2), "castling queen rook");
                (0, ts_general_1.assertCondition)(!rook2.moved, "castling queen rook's not been moved");
                (0, ts_general_1.assertCondition)(rook2.canMoveTo(this, r2Pos, false), "castling queen rook movement");
                castlingMove["r2Pos"] = r2Pos;
                castlingMove["qRook"] = rook2.key;
            }
            this._enpassantCaptureCoordString = null;
            this.pushMove(castlingMove);
        }
        catch (e) {
            if (e instanceof Error && e.name == 'Error')
                e.name = 'doCastling';
            throw e;
        }
    }
    popMove() {
        if (this._moves.length > 1 || this._top == 0 && this._moves[0].move != '\u2026') {
            (0, ts_general_1.assertCondition)(this._moves[this._top].move != '\u2026');
            this._top--;
            const turnInfo = this._moves.pop();
            (0, ts_general_1.assertCondition)(turnInfo.move != '\u2026');
            super.nextTurn(); //works anyway
            this._draw = false;
            this._resigned = false;
            this._mate = false;
            this._stalemate = false;
            this.undoMove(turnInfo.move, turnInfo.turn);
            if (turnInfo.castlingStatus !== undefined && cescacs_moves_1.csMoves.isMoveInfo(turnInfo.move)) {
                const symbol = cescacs_types_1.csConvert.getPieceKeyName(turnInfo.move.piece);
                if (symbol === 'R' || symbol === 'K') {
                    const piece = this.pieceByKey(turnInfo.move.piece);
                    switch (symbol) {
                        case 'R':
                            piece.setCastlingStatus(turnInfo.castlingStatus, this.isGrand);
                            break;
                        case 'K':
                            piece.castlingStatus = turnInfo.castlingStatus;
                            break;
                    }
                }
            }
            if (turnInfo.specialPawnCapture === undefined)
                this.specialPawnCapture = null;
            else
                this.specialPawnCapture = PawnSpecialCaptureStatus.parse(this, turnInfo.specialPawnCapture);
            if (this.isAwaitingPromotion) {
                if (cescacs_moves_1.csMoves.isMoveInfo(turnInfo.move) && cescacs_types_1.csConvert.getPieceKeyName(turnInfo.move.piece) == 'P'
                    || cescacs_moves_1.csMoves.isPromotionInfo(turnInfo.move)) {
                    this.computeAwaitingPromotion(turnInfo.turn == 'b' ? 'w' : 'b');
                }
            }
            if (this.turn === 'b')
                this.moveNumber--;
            if (turnInfo.initHalfMoveClock === undefined)
                this.halfmoveClock--;
            else
                this.halfmoveClock = 0;
            super.prepareCurrentTurn();
            super.computeHeuristic(this.turn, this.moveNumber, true, this.currentHeuristic);
        }
    }
    //#region CASTLING
    *castlingMoves(color, kingFinalPos) {
        //TODO castlingMoves without string (useful to generate moves for minimax)
    }
    *castlingStrMoves(color, kingFinalPos) {
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
    castlingKingPosition(column) {
        (0, ts_general_1.assertCondition)(cescacs_types_1.csTypes.isCastlingColumn(column), `Column: ${column} has to be a king castling column`);
        const currentKing = super.turnKing;
        if (currentKing.moved)
            return null;
        else {
            const pos = Game.kingCastlingPosition(currentKing.color, column);
            if (this.hasPiece(pos) == null && !this.isThreatened(pos, currentKing.color))
                return pos;
            else
                return null;
        }
    }
    castlingRookPosition(kingColumn, rookColumn, side, singleStep) {
        const currentColor = this.turn;
        const rookPos = side == 'K' ? cescacs_positionHelper_1.PositionHelper.initialKingSideRookPosition(currentColor, this.isGrand)
            : cescacs_positionHelper_1.PositionHelper.initialQueenSideRookPosition(currentColor, this.isGrand);
        (0, ts_general_1.assertCondition)(cescacs_types_1.csTypes.isCastlingColumn(kingColumn), `King column: ${kingColumn} has to be a king castling column`);
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
    playerCastlingPositionStatus(column) {
        const currentKing = super.turnKing;
        (0, ts_general_1.assertCondition)(cescacs_types_1.csTypes.isCastlingColumn(column), `Column: ${column} has to be a king castling column`);
        if (currentKing.moved)
            return null;
        else {
            const kingCastleMove = (this.turn == 'w' ? Game.whiteKingCastlingMove : Game.blackKingCastlingMove)[column];
            const pos = cescacs_positionHelper_1.PositionHelper.knightJump(currentKing.position, kingCastleMove);
            return [pos,
                this.hasPiece(pos) != null ? 'occupied' : this.isThreatened(pos, currentKing.color) ? 'threated' : ""];
        }
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
        return super.turnKing.getCastlingStatus(this);
    }
    //#endregion
    //#region STORED MOVES
    moves(fromMove) { return Object.freeze(this._moves.slice(fromMove)); }
    strMoves() {
        let result = [];
        if (this._moves.length > 0) {
            let ini;
            if (this._moves[0].turn == 'b') {
                result.push(this._moves[0].n + ". \u2026, " + cescacs_moves_1.csMoves.fullMoveNotation(this._moves[0]));
                ini = 1;
            }
            else
                ini = 0;
            for (let i = ini; i <= this._top; i += 2) {
                let move = cescacs_moves_1.csMoves.fullMoveNotation(this._moves[i]);
                if (i < this._top) {
                    move += ", " + cescacs_moves_1.csMoves.fullMoveNotation(this._moves[i + 1]);
                }
                result.push(move);
            }
        }
        return result.join("\n");
    }
    moveBottom() {
        while (this._top > 1 || this._top == 1 && this._moves[0].move != '\u2026') {
            const moveInfo = this._moves[this._top--];
            (0, ts_general_1.assertCondition)(moveInfo.move != '\u2026');
            this.undoMove(moveInfo.move, moveInfo.turn);
        }
    }
    moveBackward() {
        if (this._top > 1 || this._top == 1 && this._moves[0].move != '\u2026') {
            const moveInfo = this._moves[this._top--];
            (0, ts_general_1.assertCondition)(moveInfo.move != '\u2026');
            this.undoMove(moveInfo.move, moveInfo.turn);
        }
    }
    moveForward() {
        if (this._top < this._moves.length - 1) {
            const moveInfo = this._moves[++this._top];
            (0, ts_general_1.assertCondition)(moveInfo.move != '\u2026');
            this.applyMove(moveInfo.move, moveInfo.turn);
        }
    }
    moveTop() {
        while (this._top < this._moves.length - 1) {
            const moveInfo = this._moves[++this._top];
            (0, ts_general_1.assertCondition)(moveInfo.move != '\u2026');
            this.applyMove(moveInfo.move, moveInfo.turn);
        }
    }
    get topMoveId() {
        return this._top >= 0 ? cescacs_moves_1.csMoves.undoStatusId(this._moves[this._top]) : "";
    }
    get movesJSON() {
        return JSON.stringify(this._moves);
    }
    restoreMovesJSON(moves) {
        this._moves = JSON.parse(moves);
        this._top = this._moves.length - 1;
    }
    //#endregion
    //#region TLPD
    get valueTLPD() {
        return this.piecePositionsTLPD + " " + this.turn + " " + this.castlingStatus
            + " " + (this.specialPawnCapture?.toString() ?? "-")
            + " " + this.halfmoveClock.toString() + " " + (this.fixedNumbering ? this.moveNumber.toString() : "-");
    }
    get piecePositionsTLPD() {
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
    loadTLPD(restoreStatusTLPD) {
        try {
            (0, ts_general_1.assertCondition)(restoreStatusTLPD != null, "Not empty TLPD");
            (0, ts_general_1.assertCondition)(restoreStatusTLPD.trim().length > 12, "Enough TLPD length");
            const restoreStatus = restoreStatusTLPD.split(" ");
            (0, ts_general_1.assertCondition)(restoreStatus.length >= 2, "Piece positions and turn are mandatory");
            (0, ts_general_1.assertCondition)(restoreStatus[0].length >= 10, "Piece positions string");
            (0, ts_general_1.assertCondition)(cescacs_types_1.csTypes.isTurn(restoreStatus[1]), "Correct turn");
            const turn = restoreStatus[1];
            super.resetGame(turn);
            this._moves.length = 0;
            this._top = -1;
            const [wCastlingStatus, bCastlingStatus] = Board.splitCastlingStatus(restoreStatus[2]);
            this.restoreTLPDPositions(restoreStatus[0], wCastlingStatus, bCastlingStatus);
            this.halfmoveClock = cescacs_types_1.csTypes.isNumber(Number(restoreStatus[4])) ? Number(restoreStatus[4]) : 0;
            if (isNaN(Number(restoreStatus[4]))) {
                if (restoreStatus[4] != null && restoreStatus[4] !== "-")
                    throw new TypeError("Invalid halfmove clock value");
            }
            this.moveNumber = cescacs_types_1.csTypes.isNumber(Number(restoreStatus[5])) ? Number(restoreStatus[5]) : 1;
            if (isNaN(Number(restoreStatus[5]))) {
                if (restoreStatus[5] == null || restoreStatus[5] == "-")
                    this.fixedNumbering = false;
                else
                    throw new TypeError("Invalid move number");
            }
            else
                this.fixedNumbering = true;
            super.specialPawnCapture = PawnSpecialCaptureStatus.parse(this, restoreStatus[3]);
            this.initGame();
        }
        catch (e) {
            if (e instanceof Error && e.name == 'Error')
                e.name = 'TLPD';
            throw e;
        }
    }
    restoreTLPDPositions(positions, wCastlingStatus, bCastlingStatus) {
        (0, ts_general_1.assertCondition)(positions.length >= 10 && positions[0] == '/' && positions[positions.length - 1] == '/', `Valid TLPD string positions: ${positions}`);
        const rooks = [];
        const wPiece = [];
        const bPiece = [];
        const piecePos = positions.split("/");
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
                                    const color = pieceName.toUpperCase() == pieceName ? "w" : "b";
                                    if (pieceSymbol == 'K') {
                                        if (color == 'w') {
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
                                        const newPiece = super.createPiece(pieceSymbol, color, cescacs_types_1.csConvert.columnFromIndex(actualColumnIndex), actualLine);
                                        if (cescacs_piece_1.csPieceTypes.isRook(newPiece))
                                            rooks.push(newPiece);
                                        else if (cescacs_piece_1.csPieceTypes.isPawn(newPiece) && newPiece.awaitingPromotion != null)
                                            super.setAwaitingPromotion(newPiece.color);
                                        (color == 'w' ? wPiece : bPiece).push(newPiece);
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
            for (let color of ['w', 'b']) {
                const pieceSet = (color == 'w' ? wPiece : bPiece);
                let n = countOccurrences(pieceSet, 'D');
                if (n > 1)
                    throw new Error(`Too many ${color} Queens`);
                else if (n == 0)
                    this.addRegainablePiece(new cescacs_piece_2.Queen(color));
                n = countOccurrences(pieceSet, 'V');
                if (n > 1)
                    throw new Error(`Too many ${color} Wyverns`);
                else if (n == 0)
                    this.addRegainablePiece(new cescacs_piece_2.Wyvern(color));
                n = countOccurrences(pieceSet, 'R');
                if (n > 2)
                    throw new Error(`Too many ${color} Rooks`);
                else {
                    while (n < 2) {
                        this.addRegainablePiece(new cescacs_piece_2.Rook(color, this.isGrand, n));
                        n++;
                    }
                }
                n = countOccurrences(pieceSet, 'G');
                if (n > 2)
                    throw new Error(`Too many ${color} Pegasus`);
                else {
                    while (n < 2) {
                        this.addRegainablePiece(new cescacs_piece_2.Pegasus(color, n));
                        n++;
                    }
                }
                n = countOccurrences(pieceSet, 'N');
                if (!this.isGrand && n > 2 || this.isGrand && n > 4)
                    throw new Error(`Too many ${color} Knights`);
                else {
                    while (n < 2) {
                        this.addRegainablePiece(new cescacs_piece_2.Knight(color, n));
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
            r.setCastlingStatus(r.color == "w" ? wCastlingStatus : bCastlingStatus, this.isGrand);
        }
    }
    //#endregion
    //#region ADD STORED MOVES
    applyMoveSq(sq) {
        try {
            (0, ts_general_1.assertCondition)(this._top == this._moves.length - 1, "push the moves over the last one");
            sq = sq.replaceAll(' ', '').replace(/\n\n+/g, '\n').replace(/^[\s\n]+|[\s\n]+$/gm, '');
            const fixedNumbering = (sq[0] != '1' || sq[1] != '?');
            sq = sq.replace(/^1\?/, '1.').replace(/^1....,/, '1.\u2026');
            const regExp = new RegExp(/^(\d+\..*\n)+\d+\..*$/);
            (0, ts_general_1.assertCondition)(regExp.test(sq), "numbered lines");
            const lines = sq.split(/\r?\n/);
            const firstLine = this.moveNumber;
            this.fixedNumbering = (this.fixedNumbering && firstLine != 1) || fixedNumbering;
            for (let i = 0; i < lines.length; i++) {
                const parts = lines[i].split(/[.,]\s?/);
                const nMove = parseInt(parts[0]);
                (0, ts_general_1.assertCondition)(nMove.toString() == parts[0], `Line number of "${lines[i]}"`);
                (0, ts_general_1.assertCondition)(this.moveNumber == (fixedNumbering ? nMove : firstLine + nMove - 1), `Expected move number ${this.moveNumber} on move ${i}`);
                if (nMove == 1) {
                    (0, ts_general_1.assertCondition)(parts.length == 3, `first move must be a numbered pair of moves; white move can be an ellipsis: ${lines[0]}`);
                    if (parts[1] == '\u2026') {
                        (0, ts_general_1.assertCondition)(this.turn == 'b', "It begins on black's turn");
                        this.applyStringMove(parts[2]);
                    }
                    else {
                        (0, ts_general_1.assertCondition)(this.turn == 'w', "It begins on white's turn");
                        this.applyStringMove(parts[1]);
                        this.applyStringMove(parts[2]);
                    }
                }
                else if (i == lines.length - 1) {
                    (0, ts_general_1.assertCondition)(parts.length >= 2 && parts.length <= 3, `last move ${lines[i]}`);
                    this.applyStringMove(parts[1]);
                    if (parts.length == 3)
                        this.applyStringMove(parts[2]);
                }
                else {
                    (0, ts_general_1.assertCondition)(parts.length == 3, `numbered pair of moves: ${lines[i]}`);
                    this.applyStringMove(parts[1]);
                    this.applyStringMove(parts[2]);
                }
            }
        }
        catch (e) {
            if (e instanceof Error && e.name == 'Error')
                e.name = 'Move seq';
            throw e;
        }
    }
    applyStringMove(mov) {
        const separatorIndex = (mov, ini = 0) => {
            let i = ini;
            while (i < mov.length) {
                const code = mov.charCodeAt(i);
                if (code >= 48 && code < 58 || code >= 65 && code < 91 || code >= 97 && code < 123)
                    i++;
                else
                    return i;
            }
            return i;
        };
        const isHexPosition = (hex) => {
            return cescacs_positionHelper_1.PositionHelper.isValidPosition(cescacs_positionHelper_1.PositionHelper.parse(hex));
        };
        (0, ts_general_1.assertCondition)(this._top == this._moves.length - 1, "push the move over the last one");
        (0, ts_general_1.assertCondition)(mov.length >= 4, "Moviment length must be at least of 4 chars");
        if (mov.startsWith("KR") && mov[3] == '-' || mov[3] == '\u2013') {
            const castlingString = mov[3] == '\u2013' ? mov.replace('\u2013', '-') : mov;
            if (this.isGrand)
                (0, ts_general_1.assertCondition)(cescacs_types_1.csTypes.isGrandCastlingString(castlingString), `grand castling move: ${castlingString}`);
            else
                (0, ts_general_1.assertCondition)(cescacs_types_1.csTypes.isCastlingString(castlingString), `castling move: ${castlingString}`);
            this.doCastling(castlingString);
        }
        else {
            mov = mov.replace('x', '\u00D7');
            const sepIx = separatorIndex(mov);
            const movePiece = cescacs_types_1.csTypes.isPieceName(mov[0]) && cescacs_types_1.csTypes.isColumn(mov[1]) ? mov[0] : 'P';
            const fromHexPos = mov.slice(movePiece == 'P' ? 0 : 1, sepIx);
            (0, ts_general_1.assertCondition)(sepIx < mov.length - 1, "Moviment divided into parts");
            (0, ts_general_1.assertCondition)(isHexPosition(fromHexPos), "Initial hex");
            const separator = mov.charAt(sepIx) == '@' && mov.charAt(sepIx + 1) == '@' ? '@@' : mov.charAt(sepIx);
            (0, ts_general_1.assertCondition)(['-', '\u2013', '\u00D7', '@', '@@', '='].includes(separator), `valid origin&destiny separator "${separator}"`);
            if (separator == '=') {
                const promotionPiece = mov[sepIx + 1];
                (0, ts_general_1.assertCondition)(movePiece == 'P', "Promoting a pawn");
                this.doPromotePawn(fromHexPos, fromHexPos, promotionPiece);
            }
            else {
                (0, ts_general_1.assertCondition)(sepIx < mov.length - 2, "Movement destination");
                const toIx = sepIx + separator.length;
                const toEndIx = separatorIndex(mov, toIx);
                const capturedPiece = cescacs_types_1.csTypes.isPieceName(mov[toIx]) && cescacs_types_1.csTypes.isColumn(mov[toIx + 1]) ? mov[toIx] : undefined;
                const toHexPos = mov.slice(capturedPiece === undefined ? toIx : toIx + 1, toEndIx);
                (0, ts_general_1.assertCondition)(isHexPosition(toHexPos), "Destination hex");
                (0, ts_general_1.assertCondition)(capturedPiece === undefined || (separator != '-' && separator != '\u2013'), "Captured piece");
                if (toEndIx < mov.length && mov[toEndIx] == '=') {
                    const promotionPiece = mov[toEndIx + 1];
                    (0, ts_general_1.assertCondition)(movePiece == 'P', "Promoting a pawn");
                    this.doPromotePawn(fromHexPos, toHexPos, promotionPiece);
                }
                else
                    this.doMove(fromHexPos, toHexPos, movePiece);
            }
        }
    }
    //#endregion
    *pieceList() {
        for (const p of this.whitePieces())
            yield p.uncapitalizedSymbolPositionString;
        for (const p of this.blackPieces())
            yield p.uncapitalizedSymbolPositionString;
    }
    *threatenedPieceStringPositions() {
        const piecePositionsGenerator = this.turn == 'w' ? this.whitePiecePositions() : this.blackPiecePositions();
        const color = this.turn;
        for (const pos of piecePositionsGenerator) {
            if (this.isThreatened(pos, color))
                yield cescacs_positionHelper_1.PositionHelper.toString(pos);
        }
    }
    *ownThreatsPieceStringPositions() {
        const piecePositionsGenerator = this.turn == 'w' ? this.blackPiecePositions() : this.whitePiecePositions();
        const color = this.turn;
        for (const pos of piecePositionsGenerator) {
            if (this.hasThreat(pos, color))
                yield cescacs_positionHelper_1.PositionHelper.toString(pos);
        }
        const specialPawnCapture = this.specialPawnCapture;
        if (specialPawnCapture != null) {
            if (specialPawnCapture.isScornfulCapturable())
                yield cescacs_positionHelper_1.PositionHelper.toString(specialPawnCapture.capturablePiece.position);
            else if (specialPawnCapture.isEnPassantCapturable()) {
                const enPassantPos = specialPawnCapture.capturablePiece.position;
                if (this.isThreatened(enPassantPos, color))
                    yield cescacs_positionHelper_1.PositionHelper.toString(enPassantPos);
            }
        }
    }
    pushMove(move) {
        const turnInfo = {
            n: this.moveNumber,
            turn: this.turn,
            move: move,
            fixedNumbering: this.moveNumber == 1 && !this.fixedNumbering ? '?' : undefined,
            initHalfMoveClock: this.halfmoveClock == 0 ? '1' : undefined,
            specialPawnCapture: this.specialPawnCapture == null ? undefined : this.specialPawnCapture.toString(),
            castlingStatus: (cescacs_moves_1.csMoves.isMoveInfo(move) && ['K', 'R'].indexOf(cescacs_types_1.csConvert.getPieceKeyName(move.piece)) >= 0) ?
                this.playerCastlingStatus() : undefined
        };
        this.applyMove(move, this.turn);
        super.nextTurn();
        if (this.turn === 'w')
            this.moveNumber++;
        if (cescacs_moves_1.csMoves.isMoveInfo(move) && cescacs_types_1.csConvert.getPieceKeyName(move.piece) == 'P'
            || cescacs_moves_1.csMoves.isCaptureInfo(move)
            || cescacs_moves_1.csMoves.isPromotionInfo(move))
            this.halfmoveClock = 0;
        else
            this.halfmoveClock++;
        super.prepareCurrentTurn();
        const anyMove = super.isMoveableTurn();
        let endGame = undefined;
        let check = undefined;
        if (!anyMove) {
            if (this.checked) {
                this._mate = true;
                endGame = "mate";
            }
            else {
                this._stalemate = true;
                endGame = "stalemate";
            }
        }
        else if (this.halfmoveClock >= 200) {
            this._draw = true;
            endGame = "draw";
        }
        else if (this.checked) {
            if (this.isKnightOrCloseCheck)
                check = "^+";
            else if (this.isSingleCheck)
                check = "+";
            else if (this.isDoubleCheck)
                check = "++";
            else
                throw new Error("never: exhaused check options");
        }
        if (this._top < 0 && turnInfo.turn == 'b') {
            this._moves.push({ n: turnInfo.n, turn: 'w', move: '\u2026' });
            this._top++;
        }
        const turnInfoEnriched = cescacs_moves_1.csMoves.promoteUndoStatus(turnInfo, endGame, check);
        this._moves.push(turnInfoEnriched);
        this._top++;
        super.computeHeuristic(this.turn, this.moveNumber, anyMove, this.currentHeuristic);
    }
    applyMove(move, turn) {
        if (cescacs_moves_1.csMoves.isCastlingInfo(move))
            this.applyCastling(move, turn);
        else {
            const piece = this.pieceByKey(move.piece);
            if (cescacs_moves_1.csMoves.isMoveInfo(move)) {
                const dest = move.moveTo;
                if (cescacs_moves_1.csMoves.isCaptureInfo(move)) {
                    super.capturePiece(this.pieceByKey(move.captured));
                }
                super.movePiece(piece, dest[0], dest[1]);
                if (cescacs_moves_1.csMoves.isPromotionInfo(move)) {
                    super.promotePawn(piece, this.pieceByKey(move.promoted));
                }
            }
            else {
                super.promotePawn(piece, this.pieceByKey(move.promoted));
            }
        }
    }
    applyCastling(mov, color) {
        const currentKing = color == 'w' ? this.wKing : this.bKing;
        const kpos = Game.kingCastlingPosition(currentKing.color, mov.col);
        switch (mov.side) {
            case 'K':
                super.movePiece(this.pieceByKey(mov.kRook), mov.rPos[0], mov.rPos[1]);
                break;
            case 'D':
                super.movePiece(this.pieceByKey(mov.qRook), mov.rPos[0], mov.rPos[1]);
                break;
            case 'R':
                super.movePiece(this.pieceByKey(mov.kRook), mov.rPos[0], mov.rPos[1]);
                super.movePiece(this.pieceByKey(mov.qRook), mov.r2Pos[0], mov.r2Pos[1]);
        }
        super.movePiece(currentKing, kpos[0], kpos[1]);
    }
    undoMove(move, turn) {
        if (cescacs_moves_1.csMoves.isCastlingInfo(move))
            this.undoCastling(move, turn);
        else {
            const piece = this.pieceByKey(move.piece);
            if (cescacs_moves_1.csMoves.isMoveInfo(move)) {
                if (cescacs_moves_1.csMoves.isPromotionInfo(move))
                    super.undoPromotePawn(piece, this.pieceByKey(move.promoted));
                super.undoPieceMove(piece, move.pos[0], move.pos[1]);
                if (cescacs_moves_1.csMoves.isCaptureInfo(move)) {
                    const capPos = move.special === undefined ? move.moveTo : move.special;
                    super.undoCapturePiece(this.pieceByKey(move.captured), capPos[0], capPos[1]);
                }
            }
            else
                super.undoPromotePawn(piece, this.pieceByKey(move.promoted));
        }
    }
    undoCastling(castling, color) {
        const isGrand = this.isGrand;
        const currentKing = color == 'w' ? this.wKing : this.bKing;
        const kingInitialPos = color == 'w' ? cescacs_positionHelper_1.PositionHelper.whiteKingInitPosition : cescacs_positionHelper_1.PositionHelper.blackKingInitPosition;
        const rookInitialPos = castling.side == 'D' ?
            cescacs_positionHelper_1.PositionHelper.initialQueenSideRookPosition(color, isGrand)
            : cescacs_positionHelper_1.PositionHelper.initialKingSideRookPosition(color, isGrand);
        const rook = this.pieceByKey(castling.side == 'D' ? castling.qRook : castling.kRook);
        console.log(castling);
        (0, ts_general_1.assertNonNullish)(rook);
        super.undoPieceMove(currentKing, kingInitialPos[0], kingInitialPos[1]);
        super.undoPieceMove(rook, rookInitialPos[0], rookInitialPos[1]);
        currentKing.castlingStatus = "RKR";
        rook.setCastlingStatus("RKR", isGrand);
        if (castling.side == 'R') {
            const qRook = this.pieceByKey(castling.qRook);
            const r2InitialPos = cescacs_positionHelper_1.PositionHelper.initialQueenSideRookPosition(color, isGrand);
            super.undoPieceMove(qRook, r2InitialPos[0], r2InitialPos[1]);
            qRook.setCastlingStatus("RKR", isGrand);
        }
    }
    fillDefaultPositions() {
        this.wKing.setToInitialPosition();
        this.addPiece(this.wKing);
        this.bKing.setToInitialPosition();
        this.addPiece(this.bKing);
        //whites
        super.createPiece('D', 'w', 'E', 1);
        super.createPiece('V', "w", 'F', 0);
        super.createPiece('G', "w", 'D', 2);
        super.createPiece('J', "w", 'F', 2);
        super.createPiece('G', "w", 'H', 2);
        if (this.isGrand) {
            super.createPiece('P', "w", 'B', 6);
            super.createPiece('R', "w", 'B', 4);
            super.createPiece('N', "w", 'C', 3);
            super.createPiece('N', "w", 'I', 3);
            super.createPiece('R', "w", 'K', 4);
            super.createPiece('P', "w", 'K', 6);
            super.createPiece('P', "w", 'P', 7);
            super.createPiece('P', "w", 'T', 8);
            super.createPiece('P', "w", 'X', 8);
            super.createPiece('P', "w", 'Z', 7);
            super.createPiece('M', "w", 'C', 7);
            super.createPiece('M', "w", 'A', 7);
            super.createPiece('M', "w", 'L', 7);
            super.createPiece('M', "w", 'I', 7);
        }
        else {
            super.createPiece('P', "w", 'B', 4);
            super.createPiece('R', "w", 'C', 3),
                super.createPiece('R', "w", 'I', 3);
            super.createPiece('P', "w", 'K', 4);
        }
        super.createPiece('N', "w", 'E', 3);
        super.createPiece('N', "w", 'G', 3);
        super.createPiece('E', "w", 'D', 4);
        super.createPiece('J', "w", 'F', 4);
        super.createPiece('E', "w", 'H', 4);
        super.createPiece('P', "w", 'A', 5);
        super.createPiece('P', "w", 'C', 5);
        super.createPiece('E', "w", 'E', 5);
        super.createPiece('E', "w", 'G', 5);
        super.createPiece('P', "w", 'I', 5);
        super.createPiece('P', "w", 'L', 5);
        super.createPiece('P', "w", 'D', 6);
        super.createPiece('J', "w", 'F', 6);
        super.createPiece('P', "w", 'H', 6);
        super.createPiece('P', "w", 'E', 7);
        super.createPiece('P', "w", 'F', 8);
        super.createPiece('P', "w", 'G', 7);
        //blacks
        super.createPiece('D', "b", 'E', 27);
        super.createPiece('V', "b", 'F', 28);
        super.createPiece('G', "b", 'D', 26);
        super.createPiece('J', "b", 'F', 26);
        super.createPiece('G', "b", 'H', 26);
        if (this.isGrand) {
            super.createPiece('P', "b", 'B', 22);
            super.createPiece('R', "b", 'B', 24);
            super.createPiece('N', "b", 'C', 25);
            super.createPiece('N', "b", 'I', 25);
            super.createPiece('R', "b", 'K', 24);
            super.createPiece('P', "b", 'K', 22);
            super.createPiece('P', "b", 'P', 21);
            super.createPiece('P', "b", 'T', 20);
            super.createPiece('P', "b", 'X', 20);
            super.createPiece('P', "b", 'Z', 21);
            super.createPiece('M', "b", 'C', 21);
            super.createPiece('M', "b", 'A', 21);
            super.createPiece('M', "b", 'I', 21);
            super.createPiece('M', "b", 'L', 21);
        }
        else {
            super.createPiece('P', "b", 'B', 24);
            super.createPiece('R', "b", 'C', 25);
            super.createPiece('R', "b", 'I', 25);
            super.createPiece('P', "b", 'K', 24);
        }
        super.createPiece('N', "b", 'E', 25);
        super.createPiece('N', "b", 'G', 25);
        super.createPiece('E', "b", 'D', 24);
        super.createPiece('J', "b", 'F', 24);
        super.createPiece('E', "b", 'H', 24);
        super.createPiece('P', "b", 'A', 23);
        super.createPiece('P', "b", 'C', 23);
        super.createPiece('E', "b", 'E', 23);
        super.createPiece('E', "b", 'G', 23);
        super.createPiece('P', "b", 'I', 23);
        super.createPiece('P', "b", 'L', 23);
        super.createPiece('P', "b", 'D', 22);
        super.createPiece('J', "b", 'F', 22);
        super.createPiece('P', "b", 'H', 22);
        super.createPiece('P', "b", 'E', 21);
        super.createPiece('P', "b", 'F', 20);
        super.createPiece('P', "b", 'G', 21);
    }
    ;
    initGame() {
        super.prepareGame();
        this._mate = false;
        this._stalemate = false;
        this._resigned = false;
        this._draw = false;
        const anyMove = super.isMoveableTurn();
        if (!anyMove) {
            if (this.checked)
                this._mate = true;
            else
                this._stalemate = true;
        }
        else if (this.halfmoveClock >= 100)
            this._draw = true;
        super.computeHeuristic(this.turn, this.moveNumber, anyMove, this.currentHeuristic);
    }
}
exports.Game = Game;
Game.whiteKingCastlingMove = {
    'I': "LineUp-FileUp",
    'H': "LineUp-ColumnUp",
    'F': "LineInvUp-ColumnUp",
    'E': "LineInvUp-FileInvUp",
    'D': "TransversalLineDec-FileInvUp"
};
Game.blackKingCastlingMove = {
    'I': "LineDown-FileDown",
    'H': "LineDown-ColumnDown",
    'F': "LineInvDown-ColumnDown",
    'E': "LineInvDown-FileInvDown",
    'D': "TransversalLineDec-FileInvDown"
};

},{"./cescacs.moves":2,"./cescacs.piece":3,"./cescacs.positionHelper":4,"./cescacs.types":5,"./ts.general":6}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.csMoves = void 0;
const cescacs_types_1 = require("./cescacs.types");
const cescacs_positionHelper_1 = require("./cescacs.positionHelper");
var csMoves;
(function (csMoves) {
    function promoteUndoStatus(value, end, check) {
        const untypedValue = value;
        if (end !== undefined)
            untypedValue["end"] = end;
        if (check !== undefined)
            untypedValue["check"] = check;
        return untypedValue;
    }
    csMoves.promoteUndoStatus = promoteUndoStatus;
    function isCastlingSide(side) {
        return (typeof side === 'string') && (side === 'K' || side === 'D' || side === 'R');
    }
    csMoves.isCastlingSide = isCastlingSide;
    function isCastlingInfo(mov) {
        return mov.side !== undefined && isCastlingSide(mov.side)
            && mov.col !== undefined && cescacs_types_1.csTypes.isCastlingColumn(mov.col)
            && mov.rPos !== undefined && cescacs_types_1.csTypes.isPosition(mov.rPos)
            && (mov.side === 'D' || mov.kRook !== undefined && cescacs_types_1.csConvert.getPieceKeyName(mov.kRook) == 'R')
            && (mov.side === 'K' || mov.qRook !== undefined && cescacs_types_1.csConvert.getPieceKeyName(mov.qRook) == 'R')
            && (mov.side != 'R' || mov.r2Pos !== undefined && cescacs_types_1.csTypes.isPosition(mov.r2Pos));
    }
    csMoves.isCastlingInfo = isCastlingInfo;
    function isPromotionInfo(mov) {
        return mov.piece !== undefined
            && mov.prPos !== undefined && cescacs_types_1.csTypes.isPosition(mov.prPos)
            && mov.promoted !== undefined;
    }
    csMoves.isPromotionInfo = isPromotionInfo;
    function isMoveInfo(mov) {
        return mov.piece !== undefined
            && mov.pos !== undefined && cescacs_types_1.csTypes.isPosition(mov.pos)
            && mov.moveTo !== undefined && cescacs_types_1.csTypes.isPosition(mov.moveTo);
    }
    csMoves.isMoveInfo = isMoveInfo;
    function isCaptureInfo(mov) {
        return mov.captured !== undefined
            && (mov.special === undefined || cescacs_types_1.csTypes.isPosition(mov.special));
    }
    csMoves.isCaptureInfo = isCaptureInfo;
    function fullMoveNotation(info, mvNum = true) {
        const preStr = mvNum && info.turn == 'w' ? info.n + (info.fixedNumbering === undefined ? '. ' : '? ') : "";
        if (info.move == '\u2026')
            return preStr + '\u2026';
        else {
            const postStr = info.check ?? ((info.end == "mate") ? "#" : "");
            return preStr + csMoves.moveNotation(info.move) + postStr;
        }
    }
    csMoves.fullMoveNotation = fullMoveNotation;
    function endText(info, turn) {
        if (info.end === undefined)
            return "";
        else {
            switch (info.end) {
                case "mate":
                case "resigned": return turn == "b" ? "3 - 0" : "0 - 3";
                case "stalemate": return turn == "b" ? "2 - 1" : "1 - 2";
                case "draw": return "1 - 1";
                default: {
                    const exhaustiveCheck = info.end;
                    throw new Error(exhaustiveCheck);
                }
            }
        }
    }
    csMoves.endText = endText;
    function undoStatusId(info) {
        return info.move == '\u2026' ? "" : info.turn + info.n;
    }
    csMoves.undoStatusId = undoStatusId;
    function moveNotation(info) {
        if (csMoves.isCastlingInfo(info)) {
            const tail = info.r2Pos !== undefined ? cescacs_types_1.csConvert.columnFromIndex(info.r2Pos[0])
                : (info.side == 'K' && info.col == 'H' && info.rPos[0] == 10) ?
                    (info.rPos[1] == 5 || info.rPos[1] == 23 ? 'O' : info.rPos[1] == 7 || info.rPos[1] == 21 ? 'OO' : "")
                    : "";
            return "KR" + info.side + "-" + info.col + cescacs_types_1.csConvert.columnFromIndex(info.rPos[0]) + tail;
        }
        else if (csMoves.isMoveInfo(info)) {
            const symbol = cescacs_types_1.csConvert.getPieceKeyName(info.piece);
            const pre = (symbol == 'P' ? "" : symbol) + cescacs_positionHelper_1.PositionHelper.toString(info.pos);
            const post = isPromotionInfo(info) ? "=" + cescacs_types_1.csConvert.getPieceKeyName(info.promoted) : "";
            let sep;
            if (isCaptureInfo(info)) {
                if (info.special !== undefined) {
                    sep = cescacs_positionHelper_1.PositionHelper.equals(info.moveTo, info.special)
                        || Math.abs(info.special[1] - info.moveTo[1]) == 2 ? "@" : "@@";
                }
                else {
                    const capSymbol = cescacs_types_1.csConvert.getPieceKeyName(info.captured);
                    sep = capSymbol == 'P' ? "\u00D7" : "\u00D7" + capSymbol;
                }
            }
            else
                sep = "-";
            return pre + sep + cescacs_positionHelper_1.PositionHelper.toString(info.moveTo) + post;
        }
        else if (csMoves.isPromotionInfo(info)) {
            return cescacs_positionHelper_1.PositionHelper.toString(info.prPos) + "=" + cescacs_types_1.csConvert.getPieceKeyName(info.promoted);
        }
        else {
            throw new TypeError("must be a move notation");
        }
    }
    csMoves.moveNotation = moveNotation;
})(csMoves = exports.csMoves || (exports.csMoves = {}));

},{"./cescacs.positionHelper":4,"./cescacs.types":5}],3:[function(require,module,exports){
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
                        if (pieceColor != null) {
                            if (pieceColor !== this.color)
                                yield p;
                        }
                        else {
                            const specialCapture = board.specialPawnCapture;
                            if (specialCapture != null && specialCapture.isEnPassantCapturable() && specialCapture.isEnPassantCapture(p))
                                yield p;
                        }
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

},{"./cescacs":1,"./cescacs.positionHelper":4,"./cescacs.types":5,"./ts.general":6}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PositionHelper = void 0;
const cescacs_types_1 = require("./cescacs.types");
class PositionHelper {
    static equals(p1, p2) {
        return p1[0] === p2[0] && p1[1] === p2[1];
    }
    static toString(pos) {
        return cescacs_types_1.csConvert.columnFromIndex(pos[0]) + pos[1].toString();
    }
    static positionKey(k) {
        return k[0].toString() + "-" + k[1].toString(); // k.toString();
    }
    static parse(coord) {
        if (coord) {
            const strCoord = coord.trim().toUpperCase();
            const l = strCoord.length;
            if (l >= 2 && l <= 3) {
                const column = strCoord[0];
                if (cescacs_types_1.csTypes.isColumn(column)) {
                    const line = parseInt(strCoord.slice(1));
                    if (cescacs_types_1.csTypes.isLine(line)) {
                        return [cescacs_types_1.csConvert.toColumnIndex(column), line];
                    }
                    else
                        throw new RangeError(`Invalid line value: ${line}`);
                }
                else
                    throw new RangeError(`Invalid column: ${column}`);
            }
            else
                throw new RangeError(`Invalid coordinates leght: ${strCoord}`);
        }
        else
            throw new RangeError("Empty string for coordinates value");
    }
    static fromBoardPosition(column, line, check = false) {
        if (cescacs_types_1.csTypes.isColumn(column)) {
            column = cescacs_types_1.csConvert.toColumnIndex(column);
        }
        const pos = [column, line];
        if (check && !PositionHelper.isValidPosition(pos))
            throw new RangeError(`Invalid position: ${pos}`);
        else
            return pos;
    }
    static isValidPosition(p) {
        return cescacs_types_1.csTypes.isPosition(p)
            && PositionHelper.isEvenLinesColumnIndex(p[0]) == (p[1] % 2 == 0)
            && PositionHelper.isOnBoard(p[0], p[1]);
    }
    static get whiteKingInitPosition() { return [8, 1]; }
    static get blackKingInitPosition() { return [8, 27]; }
    static initialQueenSideRookPosition(color, grand) {
        if (grand)
            return color == "w" ? [3, 4] : [3, 24];
        else
            return color == "w" ? [4, 3] : [4, 25];
    }
    static initialKingSideRookPosition(color, grand) {
        if (grand)
            return color == "w" ? [11, 4] : [11, 24];
        else
            return color == "w" ? [10, 3] : [10, 25];
    }
    static isPromotionPos(c, l, color) {
        return l == (c <= 7 ? (color == "w" ? 21 + c : 7 - c) : (color == "w" ? 35 - c : c - 7));
    }
    static isPromotionHex(pos, color) {
        const c = pos[0];
        return pos[1] == (c <= 7 ? (color == "w" ? 21 + c : 7 - c) : (color == "w" ? 35 - c : c - 7));
    }
    static promotionDistance(pos, color) {
        const c = pos[0];
        if (color == 'w')
            return (c <= 7 ? 21 + c : 35 - c) - pos[1];
        else
            return pos[1] - (c <= 7 ? 7 - c : c - 7);
    }
    static hexColor(p) {
        return PositionHelper.lineHexColor(p[1]);
    }
    static lineHexColor(line) {
        switch (line % 3) {
            case 0: return "Black";
            case 1: return "White";
            case 2: return "Color";
            default: throw new Error();
        }
    }
    static isOrthogonally(from, to) {
        const dif = [to[0] - from[0], to[1] - from[1]];
        if (dif[0] == 0) {
            if (dif[1] == 0)
                return null;
            else if (dif[1] % 2 == 0)
                return dif[1] > 0 ? "ColumnUp" : "ColumnDown";
            else
                return null;
        }
        else if (dif[0] > 0) {
            if (dif[0] == dif[1])
                return "FileUp";
            else if (dif[0] == -dif[1])
                return "FileDown";
            else
                return null;
        }
        else {
            if (dif[0] == dif[1])
                return "FileInvDown";
            else if (dif[0] == -dif[1])
                return "FileInvUp";
            else
                return null;
        }
    }
    static isDiagonally(from, to) {
        const dif = [to[0] - from[0], to[1] - from[1]];
        if (dif[1] == 0) {
            if (dif[0] == 0)
                return null;
            else if (dif[0] % 2 == 0)
                return dif[0] > 0 ? "TransversalLineInc" : "TransversalLineDec";
            else
                return null;
        }
        else {
            const triple = (dif[0] << 1) + dif[0];
            if (dif[0] > 0) {
                if (triple == dif[1])
                    return "LineUp";
                else if (triple == -dif[1])
                    return "LineDown";
                else
                    return null;
            }
            else {
                if (triple == dif[1])
                    return "LineInvDown";
                else if (triple == -dif[1])
                    return "LineInvUp";
                else
                    return null;
            }
        }
    }
    static orthogonalStep(pos, d) {
        const offset = PositionHelper._ORTHOGONAL_MOVES[cescacs_types_1.csConvert.toOrthogonalDirectionIndex(d)];
        return PositionHelper.addOffset(pos, offset);
    }
    static diagonalStep(pos, d) {
        const offset = PositionHelper._DIAGONAL_MOVES[cescacs_types_1.csConvert.toDiagonalDirectionIndex(d)];
        return PositionHelper.addOffset(pos, offset);
    }
    static *orthogonalRide(pos, d) {
        const offset = PositionHelper._ORTHOGONAL_MOVES[cescacs_types_1.csConvert.toOrthogonalDirectionIndex(d)];
        let newPos = PositionHelper.addOffset(pos, offset);
        while (newPos != null) {
            yield newPos;
            newPos = PositionHelper.addOffset(newPos, offset);
        }
    }
    static *diagonalRide(pos, d) {
        const offset = PositionHelper._DIAGONAL_MOVES[cescacs_types_1.csConvert.toDiagonalDirectionIndex(d)];
        let newPos = PositionHelper.addOffset(pos, offset);
        while (newPos != null) {
            yield newPos;
            newPos = PositionHelper.addOffset(newPos, offset);
        }
    }
    static *orthogonalMoves(pos) {
        for (const offset of PositionHelper._ORTHOGONAL_MOVES) {
            let newPos = this.addOffset(pos, offset);
            while (newPos != null) {
                yield newPos;
                newPos = PositionHelper.addOffset(newPos, offset);
            }
        }
    }
    static *diagonalMoves(pos) {
        for (const offset of PositionHelper._DIAGONAL_MOVES) {
            let newPos = this.addOffset(pos, offset);
            while (newPos != null) {
                yield newPos;
                newPos = PositionHelper.addOffset(newPos, offset);
            }
        }
    }
    static knightJump(pos, d) {
        const offset = PositionHelper._KNIGHT_MOVES[cescacs_types_1.csConvert.toKnightDirectionIndex(d)];
        return PositionHelper.addOffset(pos, offset);
    }
    static *knightMoves(pos) {
        for (const offset of PositionHelper._KNIGHT_MOVES) {
            const newPos = this.addOffset(pos, offset);
            if (newPos != null)
                yield newPos;
        }
    }
    static positionIteratorIncludes(it, value) {
        for (const x of it) {
            if (x[0] === value[0] && x[1] === value[1])
                return true;
        }
        return false;
    }
    static *positionIteratorIntersection(it, positionsSet) {
        for (const x of it) {
            if (positionsSet.some(y => x[0] === y[0] && x[1] === y[1]))
                yield x;
        }
    }
    static isOnBoard(c, l) {
        return c >= 0 && c <= 14
            && (c <= 7 ? (l >= 7 - c && l <= 21 + c) : (l >= c - 7 && l <= 35 - c));
    }
    static addOffset(pos, offset) {
        const c = pos[0] + offset[0];
        const l = pos[1] + offset[1];
        if (PositionHelper.isOnBoard(c, l))
            return [c, l];
        else
            return null;
    }
}
exports.PositionHelper = PositionHelper;
PositionHelper._ORTHOGONAL_MOVES = [[0, 2], [0, -2], [1, 1], [1, -1], [-1, 1], [-1, -1]];
PositionHelper._DIAGONAL_MOVES = [[2, 0], [-2, 0], [1, 3], [1, -3], [-1, 3], [-1, -3]];
PositionHelper._KNIGHT_MOVES = [[3, 1], [3, -1], [-3, 1], [-3, -1],
    [2, 4], [1, 5], [2, -4], [1, -5],
    [-2, 4], [-1, 5], [-2, -4], [-1, -5]];
PositionHelper.isEvenLinesColumnIndex = (i) => i % 2 != 0;

},{"./cescacs.types":5}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.csConvert = exports.csTypes = void 0;
const ts_general_1 = require("./ts.general");
const _column = ['P', 'T', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'K', 'L', 'X', 'Z'];
const _castlingColumn = ['D', 'E', 'F', 'H', 'I'];
const _orthogonalDirection = ["ColumnUp", "ColumnDown", "FileUp", "FileDown", "FileInvUp", "FileInvDown"];
const _diagonalDirection = ["TransversalLineInc", "TransversalLineDec", "LineUp", "LineDown", "LineInvUp", "LineInvDown"];
const _knightDirection = ["TransversalLineInc-FileUp", "TransversalLineInc-FileDown", "TransversalLineDec-FileInvUp", "TransversalLineDec-FileInvDown",
    "LineUp-FileUp", "LineUp-ColumnUp", "LineDown-FileDown", "LineDown-ColumnDown",
    "LineInvUp-FileInvUp", "LineInvUp-ColumnUp", "LineInvDown-FileInvDown", "LineInvDown-ColumnDown"];
const _orthogonalOrientation = [["ColumnUp", "ColumnDown"], ["FileUp", "FileInvDown"], ["FileInvUp", "FileDown"]];
const _diagonalOrientation = [["TransversalLineInc", "TransversalLineDec"], ["LineUp", "LineInvDown"], ["LineInvUp", "LineDown"]];
const _hexColor = ["Black", "White", "Color"];
const _turn = ["w", "b"];
const _pieceName = ["K", "D", "V", "R", "G", "N", "J", "E", "M", "P"];
const _castlingStatus = ["RKR", "RK", "KR", "K", "-"];
const _castlingString = ["KRK-II", "KRK-IK", "KRK-IH", "KRK-HIO", "KRK-HIOO", "KRK-HH", "KRK-HG", "KRK-FG", "KRK-FE", "KRK-EF", "KRK-EE",
    "KRD-DD", "KRD-DE", "KRD-HH", "KRD-HG", "KRD-FG", "KRD-FE", "KRD-EF", "KRD-ED", "KRR-HIH", "KRR-HGG", "KRR-FGG", "KRR-FEE", "KRR-EEF"];
const _grandCastlingString = ["KRK-FF", "KRK-FG", "KRK-HG", "KRK-HI", "KRD-DE", "KRD-DC", "KRD-ED", "KRD-EE", "KRD-FE", "KRD-FF", "KRR-FFE", "KRR-FGF"];
;
// Type predicates
var csTypes;
(function (csTypes) {
    csTypes.isNumber = (x) => typeof x === "number" && !isNaN(x);
    csTypes.isColumn = (x) => _column.includes(x);
    csTypes.isColumnIndex = (x) => csTypes.isNumber(x) && Number.isInteger(x) && x >= 0 && x <= 14;
    csTypes.isLine = (x) => csTypes.isNumber(x) && Number.isInteger(x) && x >= 0 && x <= 28;
    csTypes.isPosition = (x) => Array.isArray(x) && x.length == 2 && csTypes.isColumnIndex(x[0]) && csTypes.isLine(x[1]);
    csTypes.isOrthogonalDirection = (x) => _orthogonalDirection.includes(x);
    csTypes.isDiagonalDirection = (x) => _diagonalDirection.includes(x);
    csTypes.isKnightDirection = (x) => _knightDirection.includes(x);
    csTypes.isCastlingColumn = (x) => _castlingColumn.includes(x);
    csTypes.isDirectionMoveRange = (x) => csTypes.isNumber(x) && Number.isInteger(x) && x >= 0 && x <= 5;
    csTypes.isDirectionFullMoveRange = (x) => csTypes.isNumber(x) && Number.isInteger(x) && x >= 0 && x <= 11;
    csTypes.isOrthogonalOrientation = (x) => Array.isArray(x) && _orthogonalOrientation.some(y => y[0] == x[0] && y[1] == x[1]);
    csTypes.isDiagonalOrientation = (x) => Array.isArray(x) && _diagonalOrientation.some(y => y[0] == x[0] && y[1] == x[1]);
    csTypes.isHexColor = (x) => _hexColor.includes(x);
    csTypes.isPieceName = (x) => _pieceName.includes(x);
    csTypes.isTurn = (x) => _turn.includes(x);
    csTypes.isSide = (x) => x === 'K' || x === 'D';
    csTypes.isCastlingStatus = (x) => _castlingStatus.includes(x);
    csTypes.isCastlingString = (x) => _castlingString.includes(x);
    csTypes.isGrandCastlingString = (x) => _grandCastlingString.includes(x);
    csTypes.isSingleCheck = (x) => Object.prototype.hasOwnProperty.call(x, "d") && Object.prototype.hasOwnProperty.call(x, "p");
    csTypes.isDoubleCheck = (x) => Array.isArray(x) && length == 3 && csTypes.isPosition(x[0]) && csTypes.isPosition(x[1]) &&
        (x[2] == null || csTypes.isOrthogonalOrientation(x[2]) || csTypes.isDiagonalOrientation(x[2]));
    csTypes.hasDoubleCheckPin = (x) => Array.isArray(x) && length == 3 && csTypes.isPosition(x[0]) && csTypes.isPosition(x[1]) &&
        x[2] != null && (csTypes.isOrthogonalOrientation(x[2]) || csTypes.isDiagonalOrientation(x[2]));
    csTypes.isCheckAttackPos = (checkPos, pos) => {
        return csTypes.isPosition(checkPos) ? pos[0] == checkPos[0] && pos[1] == checkPos[1]
            : csTypes.isSingleCheck(checkPos) ? checkPos.p[0] == pos[0] && checkPos.p[1] == pos[1]
                : checkPos[0][0] == pos[0] && checkPos[0][1] == pos[1] || checkPos[1][0] == pos[0] && checkPos[1][1] == pos[1];
    };
})(csTypes = exports.csTypes || (exports.csTypes = {}));
// Conversions
var csConvert;
(function (csConvert) {
    csConvert.columnFromIndex = (i) => _column[i];
    csConvert.toColumnIndex = (column) => _column.indexOf(column);
    csConvert.toOrthogonalDirectionIndex = (direction) => _orthogonalDirection.indexOf(direction);
    csConvert.orthogonalDirectionFromIndex = (i) => _orthogonalDirection[i];
    csConvert.toDiagonalDirectionIndex = (direction) => _diagonalDirection.indexOf(direction);
    csConvert.diagonalDirectionFromIndex = (i) => _diagonalDirection[i];
    csConvert.toKnightDirectionIndex = (direction) => _knightDirection.indexOf(direction);
    csConvert.knightDirectionFromIndex = (i) => _knightDirection[i];
    function getOrthogonalOrientation(d) {
        switch (d) {
            case "ColumnUp":
            case "ColumnDown": return ["ColumnUp", "ColumnDown"];
            case "FileUp":
            case "FileInvDown": return ["FileUp", "FileInvDown"];
            case "FileInvUp":
            case "FileDown": return ["FileInvUp", "FileDown"];
            default: {
                const exhaustiveCheck = d;
                throw new Error(exhaustiveCheck);
            }
        }
    }
    csConvert.getOrthogonalOrientation = getOrthogonalOrientation;
    function getDiagonalOrientation(d) {
        switch (d) {
            case "TransversalLineInc":
            case "TransversalLineDec": return ["TransversalLineInc", "TransversalLineDec"];
            case "LineUp":
            case "LineInvDown": return ["LineUp", "LineInvDown"];
            case "LineInvUp":
            case "LineDown": return ["LineInvUp", "LineDown"];
            default: {
                const exhaustiveCheck = d;
                throw new Error(exhaustiveCheck);
            }
        }
    }
    csConvert.getDiagonalOrientation = getDiagonalOrientation;
    function getPieceKeyColor(key) {
        (0, ts_general_1.assertCondition)(csTypes.isTurn(key[0]), `key 1st char must have piece color`);
        return key[0];
    }
    csConvert.getPieceKeyColor = getPieceKeyColor;
    function getPieceKeyName(key) {
        (0, ts_general_1.assertCondition)(csTypes.isPieceName(key[1]), `key 2nd char must be piece symbol ${key}`);
        return key[1];
    }
    csConvert.getPieceKeyName = getPieceKeyName;
    function getBishopKeyHexColor(key) {
        return key[1] !== 'J' ? null : key.slice(2);
    }
    csConvert.getBishopKeyHexColor = getBishopKeyHexColor;
    function getRookKeySide(key) {
        return key[1] !== 'R' ? null : csTypes.isSide(key[2]) ? key[2] : null;
    }
    csConvert.getRookKeySide = getRookKeySide;
    function* orthogonalDirections() { for (const d of _orthogonalDirection)
        yield d; }
    csConvert.orthogonalDirections = orthogonalDirections;
    function* diagonalDirections() { for (const d of _diagonalDirection)
        yield d; }
    csConvert.diagonalDirections = diagonalDirections;
    function* knightDirections() { for (const d of _knightDirection)
        yield d; }
    csConvert.knightDirections = knightDirections;
})(csConvert = exports.csConvert || (exports.csConvert = {}));

},{"./ts.general":6}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.round2hundredths = exports.isNotNullNorWhitespace = exports.isNotNullNorEmpty = exports.assertCondition = exports.assertNonNullish = void 0;
function assertNonNullish(value, valueDescription) {
    if (value === null || value === undefined) {
        console.log("NonNullish assertion fail: " + valueDescription ?? "-");
        throw new TypeError(`Unexpected ${value} value` + (valueDescription == undefined) ? '' : ": " + valueDescription);
    }
}
exports.assertNonNullish = assertNonNullish;
function assertCondition(condition, conditionDescription) {
    if (!condition) {
        console.log("Condition assertion fail: " + conditionDescription ?? "-");
        throw new Error('Assertion does not hold' + (conditionDescription == undefined) ? '' : ": " + conditionDescription);
    }
}
exports.assertCondition = assertCondition;
function isNotNullNorEmpty(str) {
    return str !== undefined && str !== null && str.length > 0;
}
exports.isNotNullNorEmpty = isNotNullNorEmpty;
function isNotNullNorWhitespace(str) {
    return str !== undefined && str !== null && str.length > 0 && str.trim().length > 0;
}
exports.isNotNullNorWhitespace = isNotNullNorWhitespace;
function round2hundredths(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}
exports.round2hundredths = round2hundredths;

},{}]},{},[1])(1)
});
