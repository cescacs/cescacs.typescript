(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.cescacs = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = exports.Board = exports.EnPassantCapturable = exports.ScornfulCapturable = exports.PawnSpecialCaptureStatus = exports.round2hundredths = exports.csmv = exports.cspty = exports.PositionHelper = void 0;
const ts_general_1 = require("./ts.general");
Object.defineProperty(exports, "round2hundredths", { enumerable: true, get: function () { return ts_general_1.round2hundredths; } });
const cescacs_types_1 = require("./cescacs.types");
const cescacs_positionHelper_1 = require("./cescacs.positionHelper");
Object.defineProperty(exports, "PositionHelper", { enumerable: true, get: function () { return cescacs_positionHelper_1.PositionHelper; } });
const cescacs_piece_1 = require("./cescacs.piece");
Object.defineProperty(exports, "cspty", { enumerable: true, get: function () { return cescacs_piece_1.csPieceTypes; } });
const cescacs_piece_2 = require("./cescacs.piece");
const cescacs_moves_1 = require("./cescacs.moves");
Object.defineProperty(exports, "csmv", { enumerable: true, get: function () { return cescacs_moves_1.csMoves; } });
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
        this._currentHeuristic = Board.newHeuristic();
        this._wAwaitingPromotion = false;
        this._bAwaitingPromotion = false;
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
    get checked() { return this.currentKing.checked; }
    get isKnightOrCloseCheck() { return this.currentKing.isKnightOrCloseCheck(); }
    get isSingleCheck() { return this.currentKing.isSingleCheck(); }
    get isDoubleCheck() { return this.currentKing.isDoubleCheck(); }
    get currentHeuristic() { return this._currentHeuristic; }
    *whitePieces() { for (const p of this.wPieces.values())
        yield p; }
    *blackPieces() { for (const p of this.bPieces.values())
        yield p; }
    *whitePiecesFulfil(cond) { for (const p of this.wPieces.values())
        if (cond(p))
            yield p; }
    *blackPiecesFulfil(cond) { for (const p of this.bPieces.values())
        if (cond(p))
            yield p; }
    *whitePiecePositions() { for (const p of this.wPieces.values())
        yield p.position; }
    *blackPiecePositions() { for (const p of this.bPieces.values())
        yield p.position; }
    get currentKing() { return (this.turn === 'w' ? this.wKing : this.bKing); }
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
    //Game
    getHexPiece(pos) {
        const p = cescacs_positionHelper_1.PositionHelper.parse(pos);
        if (p == null)
            return null;
        else
            return this.getPiece(p);
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
    hasRegainablePieces(hexColor) {
        const currentColor = this._turn == 'w' ? 'White' : 'Black';
        return this._regainablePieces.reduce((found, x) => found || x.color == currentColor && (!cescacs_piece_1.csPieceTypes.isBishop(x) || x.hexesColor == hexColor), false);
    }
    getHeuristicValue(h) {
        return (0, ts_general_1.round2hundredths)(h.pieces[0] - h.pieces[1] + h.space[0] - h.space[1] + h.positioning + h.mobility + h.king);
    }
    maxRegainablePiecesValue(hexColor) {
        const currentColor = this._turn == 'w' ? 'White' : 'Black';
        return this._regainablePieces.reduce((acc, x) => x.value > acc && x.color == currentColor && (!cescacs_piece_1.csPieceTypes.isBishop(x) || x.hexesColor == hexColor) ? x.value : acc, 0);
    }
    currentRegainablePieceNames(hexColor) {
        const currentColor = this._turn == 'w' ? 'White' : 'Black';
        return this._regainablePieces.reduce((s, x) => x.color == currentColor && (!cescacs_piece_1.csPieceTypes.isBishop(x) || x.hexesColor == hexColor) ? s.add(x.symbol) : s, new Set());
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
    undoCapturePiece(piece, colIndex, line) {
        if (cescacs_piece_2.Piece.isRegainablePiece(piece.symbol)) {
            const pix = this._regainablePieces.indexOf(piece);
            (0, ts_general_1.assertCondition)(pix >= 0, "Captured piece found in the regainable pieces bag");
            this._regainablePieces.splice(pix, 1);
        }
        piece.setPositionTo([colIndex, line]);
        this.addPiece(piece);
    }
    movePiece(piece, toColumnIndex, toLine) {
        (0, ts_general_1.assertNonNullish)(piece.position, `${piece.symbol} position`);
        const piecePos = piece.position;
        const fromPosCol = (piecePos[0] + 1) >>> 1;
        const fromPosLineMask = Board.lineMask(piecePos[1]);
        const pieces = (piece.color == "White" ? this.wPieces : this.bPieces);
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
                if (piece.color == 'White')
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
        const positions = (piece.color == "White" ? this.wPositions : this.bPositions);
        positions[fromPosCol] &= ~fromPosLineMask;
        positions[toPosCol] |= toPosLineMask;
    }
    undoPieceMove(piece, fromColumnIndex, fromLine) {
        const pieces = (piece.color == "White" ? this.wPieces : this.bPieces);
        const piecePos = piece.position;
        const actualPosCol = (piecePos[0] + 1) >>> 1;
        const actualPosLineMask = Board.lineMask(piecePos[1]);
        pieces.delete(cescacs_positionHelper_1.PositionHelper.positionKey(piecePos));
        piece.moveTo(fromColumnIndex, fromLine); //piecePos updated
        pieces.set(cescacs_positionHelper_1.PositionHelper.positionKey(piecePos), piece);
        const fromPosCol = (piecePos[0] + 1) >>> 1;
        const fromPosLineMask = Board.lineMask(piecePos[1]);
        const positions = (piece.color == "White" ? this.wPositions : this.bPositions);
        positions[actualPosCol] &= ~actualPosLineMask;
        positions[fromPosCol] |= fromPosLineMask;
    }
    promotePawn(pawn, piece) {
        if (this._regainablePieces.includes(piece)) {
            const pieces = (piece.color == "White" ? this.wPieces : this.bPieces);
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
        }
    }
    undoPromotePawn(pawn, piece) {
        const pieces = (piece.color == "White" ? this.wPieces : this.bPieces);
        pieces.delete(cescacs_positionHelper_1.PositionHelper.positionKey(piece.position));
        pawn.setPositionTo([piece.position[0], piece.position[1]]);
        piece.captured();
        this._regainablePieces.push(piece);
        pieces.set(cescacs_positionHelper_1.PositionHelper.positionKey(pawn.position), pawn);
    }
    addRegainablePiece(piece) {
        if (piece.position == null)
            this._regainablePieces.push(piece);
    }
    currentRegainablePieces(hexColor) {
        const currentColor = this._turn == 'w' ? 'White' : 'Black';
        const regainables = this._regainablePieces;
        return regainables.filter((x, index) => x.color == currentColor && (!cescacs_piece_1.csPieceTypes.isBishop(x) || x.hexesColor == hexColor)
            && index == regainables.findIndex(p => p.color == currentColor && p.symbol == x.symbol && (!cescacs_piece_1.csPieceTypes.isBishop(p) || p.hexesColor == hexColor)));
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
        // this.clearThreats(this._turn === 'w' ? 'Black' : 'White');
        // this.clearPins(this._turn === 'w' ? 'White' : 'Black');
    }
    prepareCurrentTurn() {
        this.prepareTurn(this.currentKing);
    }
    prepareTurn(currentKing) {
        const color = currentKing.color;
        const threats = (color == "White" ? this.bThreats : this.wThreats);
        for (let i = 0; i <= 7; i++)
            threats[i] = 0;
        {
            const threatingPieces = (color == 'White' ? this.bPieces.values() : this.wPieces.values());
            for (const piece of threatingPieces)
                piece.markThreats(this);
        }
        {
            const ownPieces = (color == "White" ? this.wPieces.values() : this.bPieces.values());
            for (const piece of ownPieces)
                piece.pin = null;
        }
        currentKing.computeCheckAndPins(this);
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
        const currentKing = turn === 'w' ? this.wKing : this.bKing;
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
            const color = (turn == 'w' ? 'White' : 'Black');
            result.king = 0;
            if (currentKing.checked) {
                if (currentKing.isDoubleCheck())
                    result.king -= 30;
                else if (currentKing.isKnightOrCloseCheck())
                    result.king -= 20;
                else
                    result.king -= 15;
            }
            else if (!currentKing.moved)
                result.king += 0.1;
            for (const pos of currentKing.attemptMoves(this, true)) {
                const pieceColor = this.hasPiece(pos);
                if (currentKing.checked) {
                    if (this.isThreated(pos, color))
                        result.king -= 2;
                    else if (pieceColor == null)
                        result.king += 0.5;
                    else if (pieceColor == color)
                        result.king -= 0.5;
                }
                else {
                    if (this.isThreated(pos, color)) {
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
                for (const piece of pieces.values()) {
                    piece.markThreats(this);
                }
            }
            let development = 0;
            let troupCount = 0;
            let troupDeveloped = 0;
            let pieceDeveloped = 0;
            let advancedPawn = 0;
            const isTroupDeveloped = (pos, color) => color == 'White' ? pos[1] > 8 : pos[1] < 20;
            const isPieceDeveloped = (pos, color) => color == 'White' ? pos[1] > (pos[0] == 7 ? 6 : 3) : pos[1] < (pos[0] == 7 ? 22 : 25);
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
        this._moves = [];
        this.pawnMoved = false;
        this.pieceCaptured = false;
        this._mate = false;
        this._stalemate = false;
        this._draw = false;
        this._resigned = false;
        this._enpassantCaptureCoordString = null;
        this._lastMove = "";
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
    get gameEnd() { return this._mate || this._stalemate || this._draw || this._resigned; }
    get mate() { return this._mate; }
    get stalemate() { return this._stalemate; }
    set draw(value) { this._draw = value; }
    get draw() { return this._draw; }
    set resign(value) { this._resigned = value; }
    get resigned() { return this._resigned; }
    moves(fromMove) { return Object.freeze(this._moves.slice(fromMove)); }
    strMoves() {
        let result = [];
        for (let i = 0; i < this._moves.length; i += 2) {
            let move = cescacs_moves_1.csMoves.fullMoveNotation(this._moves[i]);
            if (i < this._moves.length - 1) {
                move += ", " + cescacs_moves_1.csMoves.fullMoveNotation(this._moves[i + 1]);
            }
            result.push(move);
        }
        return result.join("\n");
    }
    get lastMove() { return this._lastMove; }
    get preMoveHeuristic() { return this.currentHeuristic; }
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
    get movesJSON() {
        return JSON.stringify(this._moves);
    }
    restoreMovesJSON(moves) {
        this._moves = JSON.parse(moves);
    }
    // public doMove(fromHex: string, toHex: string, pieceName?: PieceName): void {
    //     try {
    //         const moveFrom = PositionHelper.parse(fromHex);
    //         const moveTo = PositionHelper.parse(toHex);
    //         const piece = this.getPiece(moveFrom);
    //         if (piece != null && (pieceName == undefined || piece.symbol == pieceName)) {
    //             const movementText = this.movePieceTo(piece, moveTo);
    //             const symbolPrefix = piece.symbol !== 'P' ? piece.symbol : undefined;
    //             this.setLastMove(symbolPrefix, fromHex, movementText, toHex);
    //             this.forwardingTurn();
    //         } else {
    //             console.log("empty piece at " + PositionHelper.toString(moveFrom));
    //             this._lastMove = "";
    //         }
    //     }
    //     catch (e) {
    //         console.log(e);
    //     }
    // }
    doMove(fromHex, toHex, pieceName) {
        var _a, _b;
        try {
            const moveFrom = cescacs_positionHelper_1.PositionHelper.parse(fromHex);
            const moveTo = cescacs_positionHelper_1.PositionHelper.parse(toHex);
            const piece = this.getPiece(moveFrom);
            if (piece != null && (pieceName == undefined || piece.symbol == pieceName)) {
                (0, ts_general_1.assertCondition)(piece.canMoveTo(this, moveTo), `Piece ${piece.symbol} at ${(_a = piece.position) === null || _a === void 0 ? void 0 : _a.toString()} move to ${moveTo.toString()}`);
                const move = {
                    piece: piece,
                    pos: moveFrom,
                    moveTo: moveTo
                };
                const capturedPiece = this.getPiece(moveTo);
                if (capturedPiece != null) {
                    (0, ts_general_1.assertCondition)(piece.color != capturedPiece.color && piece.canCaptureOn(this, moveTo), `Piece ${piece.symbol} at ${(_b = piece.position) === null || _b === void 0 ? void 0 : _b.toString()} capture on ${moveTo.toString()}`);
                    const isScornfulCapture = cescacs_piece_1.csPieceTypes.isPawn(piece) && this.specialPawnCapture != null &&
                        this.specialPawnCapture.isScornfulCapturable() && this.specialPawnCapture.isScorned(piece, moveTo);
                    move.captured = capturedPiece;
                    move.special = isScornfulCapture ? moveTo : undefined;
                    this._enpassantCaptureCoordString = null;
                    this.pieceCaptured = true;
                }
                else if (cescacs_piece_1.csPieceTypes.isPawn(piece) && this.specialPawnCapture != null
                    && this.specialPawnCapture.isEnPassantCapturable()
                    && this.specialPawnCapture.isEnPassantCapture(moveTo, piece)) {
                    const enPassantCapture = this.specialPawnCapture.capturablePiece;
                    move.captured = enPassantCapture;
                    move.special = [enPassantCapture.position[0], enPassantCapture.position[1]];
                    this._enpassantCaptureCoordString = cescacs_types_1.csConvert.columnFromIndex(enPassantCapture.position[0]) + enPassantCapture.position[1].toString();
                    this.pieceCaptured = true;
                }
                else {
                    this._enpassantCaptureCoordString = null;
                    this.pieceCaptured = false;
                }
                this.pawnMoved = piece.symbol == 'P';
                this.pushMove(move);
            }
            else {
                console.log("empty piece at " + cescacs_positionHelper_1.PositionHelper.toString(moveFrom));
                this._lastMove = "";
            }
        }
        catch (e) {
            console.log(fromHex, toHex, e);
        }
    }
    doPromotePawn(fromHex, toHex, promoteTo) {
        try {
            const moveFrom = typeof (fromHex) === "string" ? cescacs_positionHelper_1.PositionHelper.parse(fromHex) : fromHex;
            const moveTo = typeof (toHex) === "string" ? cescacs_positionHelper_1.PositionHelper.parse(toHex) : toHex;
            const pawn = this.getPiece(moveFrom);
            if (pawn != null && cescacs_piece_1.csPieceTypes.isPawn(pawn)) {
                let piece;
                if (typeof (promoteTo) === "string") {
                    (0, ts_general_1.assertCondition)(cescacs_positionHelper_1.PositionHelper.isPromotionHex(moveTo, pawn.color), "Promotion hex");
                    const hexesColor = cescacs_positionHelper_1.PositionHelper.hexColor(moveTo);
                    piece = this.currentRegainablePieces(hexesColor).find(x => x.symbol == promoteTo && (!cescacs_piece_1.csPieceTypes.isBishop(x) || x.hexesColor == hexesColor));
                    (0, ts_general_1.assertNonNullish)(piece, "promotion piece");
                }
                else
                    piece = promoteTo;
                if (cescacs_positionHelper_1.PositionHelper.equals(moveFrom, moveTo)) {
                    this.pieceCaptured = false;
                    this.pawnMoved = true;
                    this._lastMove = cescacs_positionHelper_1.PositionHelper.toString(moveTo) + "=" + promoteTo;
                }
                else {
                    const movementText = this.movePieceTo(pawn, moveTo);
                    const fromHexString = typeof (fromHex) === "string" ? fromHex : cescacs_positionHelper_1.PositionHelper.toString(moveFrom);
                    const toHexString = typeof (toHex) === "string" ? toHex : cescacs_positionHelper_1.PositionHelper.toString(moveTo);
                    this.setLastMove(undefined, fromHexString, movementText, toHexString, piece.symbol);
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
    movePieceTo(piece, pos) {
        var _a, _b, _c;
        const isEnPassantCapture = cescacs_piece_1.csPieceTypes.isPawn(piece) && this.specialPawnCapture != null &&
            this.specialPawnCapture.isEnPassantCapturable() && this.specialPawnCapture.isEnPassantCapture(pos, piece);
        const capturedPiece = (_a = this.getPiece(pos)) !== null && _a !== void 0 ? _a : (isEnPassantCapture ? this.specialPawnCapture.capturablePiece : null);
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
    castling(currentKing, kPos, rook, rPos, rook2, r2Pos) {
        super.movePiece(currentKing, kPos[0], kPos[1]);
        super.movePiece(rook, rPos[0], rPos[1]);
        if (rook2 !== undefined && r2Pos != undefined) {
            super.movePiece(rook2, r2Pos[0], r2Pos[1]);
        }
        this.pieceCaptured = false;
        this.pawnMoved = false;
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
        (0, ts_general_1.assertCondition)(cescacs_piece_1.csPieceTypes.isRook(rook), "castling king rook");
        if (assertions) {
            (0, ts_general_1.assertCondition)(!rook.moved && rook.canMoveTo(this, rPos, false), "castling king rook move");
        }
        if (rCol2 !== undefined) {
            const r2Pos = this.castlingRookPosition(kCol, rCol2, 'D', singleStep);
            const rook2 = this.getPiece(cescacs_positionHelper_1.PositionHelper.initialQueenSideRookPosition(currentColor, this.isGrand));
            (0, ts_general_1.assertNonNullish)(rook2, "double castling queen side rook");
            (0, ts_general_1.assertCondition)(cescacs_piece_1.csPieceTypes.isRook(rook2), "castling queen rook");
            if (assertions) {
                (0, ts_general_1.assertCondition)(!rook2.moved && rook2.canMoveTo(this, r2Pos, false), "castling queen rook move");
            }
            super.movePiece(rook2, r2Pos[0], r2Pos[1]);
        }
        super.movePiece(currentKing, kPos[0], kPos[1]);
        super.movePiece(rook, rPos[0], rPos[1]);
        this.pieceCaptured = false;
        this.pawnMoved = false;
        this._enpassantCaptureCoordString = null;
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
    *castlingMoves(color, kingFinalPos) {
        //TODO
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
    get valueTLPD() {
        var _a, _b;
        return this.piecePositionsTLPD + " " + this.turn + " " + this.castlingStatus
            + " " + ((_b = (_a = this.specialPawnCapture) === null || _a === void 0 ? void 0 : _a.toString()) !== null && _b !== void 0 ? _b : "-")
            + " " + this.halfmoveClock.toString() + " " + this.moveNumber.toString();
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
        if (restoreStatusTLPD == null || restoreStatusTLPD.trim().length <= 10)
            return false;
        else
            try {
                const restoreStatus = restoreStatusTLPD.split(" ");
                if (restoreStatus.length >= 2 && restoreStatus[0].length >= 10 && cescacs_types_1.csTypes.isTurn(restoreStatus[1])) {
                    const turn = restoreStatus[1];
                    super.resetGame(turn);
                    this._moves.length = 0;
                    const [wCastlingStatus, bCastlingStatus] = Board.splitCastlingStatus(restoreStatus[2]);
                    this.restoreTLPDPositions(restoreStatus[0], wCastlingStatus, bCastlingStatus);
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
    restoreTLPDPositions(positions, wCastlingStatus, bCastlingStatus) {
        (0, ts_general_1.assertCondition)(positions.length >= 10 && positions[0] == '/' && positions[positions.length - 1] == '/', `Valid TLPD string positions: ${positions}`);
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
    setLastMove(symbolPrefix, fromHex, movement, toHex, promotionPostfix) {
        this._lastMove = (symbolPrefix !== null && symbolPrefix !== void 0 ? symbolPrefix : "") + fromHex + movement + toHex;
        if (promotionPostfix !== undefined)
            this._lastMove += "=" + promotionPostfix;
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
        const anyMove = super.isMoveableTurn();
        if (!anyMove) {
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
        super.computeHeuristic(this.turn, this.moveNumber, anyMove, this.currentHeuristic);
    }
    backwardingTurn(turnInfo) {
        if (this.moveNumber > 0) {
            super.nextTurn(); //works anyway
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
        this._lastMove = "";
        super.computeHeuristic(this.turn, this.moveNumber, anyMove, this.currentHeuristic);
    }
    //Draft
    //////////////////////////////////////////////////////
    pushMove(move) {
        const turnInfo = {
            n: this.moveNumber,
            turn: this.turn,
            move: move,
            initHalfMoveClock: this.halfmoveClock == 0 ? 1 : undefined,
            specialPawnCapture: this.specialPawnCapture == null ? undefined : this.specialPawnCapture.toString(),
            castlingStatus: (cescacs_moves_1.csMoves.isMoveInfo(move) && ['K', 'R'].indexOf(move.piece.symbol) >= 0) ?
                this.playerCastlingStatus() : undefined,
            end: undefined,
            check: undefined
        };
        this.applyMove(move);
        super.nextTurn();
        if (this.turn === 'w')
            this.moveNumber++;
        if (cescacs_moves_1.csMoves.isMoveInfo(move) && move.piece.symbol == 'P' || cescacs_moves_1.csMoves.isCaptureInfo(move) || cescacs_moves_1.csMoves.isPromotionInfo(move))
            this.halfmoveClock = 0;
        else
            this.halfmoveClock++;
        super.prepareCurrentTurn();
        const anyMove = super.isMoveableTurn();
        if (!anyMove) {
            if (this.checked) {
                this._mate = true;
                turnInfo.end = "mate";
            }
            else {
                this._stalemate = true;
                turnInfo.end = "stalemate";
            }
        }
        else if (this.halfmoveClock >= 100) {
            this._draw = true;
            turnInfo.end = "draw";
        }
        else if (this.checked) {
            if (this.isKnightOrCloseCheck)
                turnInfo.check = "^+";
            else if (this.isSingleCheck)
                turnInfo.check = "+";
            else if (this.isDoubleCheck)
                turnInfo.check += "++";
            else
                throw new Error("never: exhaused check options");
        }
        this._moves.push(turnInfo);
        super.computeHeuristic(this.turn, this.moveNumber, anyMove, this.currentHeuristic);
        this._lastMove = cescacs_moves_1.csMoves.moveNotation(move);
    }
    popMove() {
        if (this._moves.length > 0) {
            const turnInfo = this._moves.pop();
            super.nextTurn(); //works anyway
            this._draw = false;
            this._resigned = false;
            this._mate = false;
            this._stalemate = false;
            this.undoMove(turnInfo.move, this.turn == 'w' ? 'White' : 'Black');
            if (turnInfo.castlingStatus != undefined && cescacs_moves_1.csMoves.isMoveInfo(turnInfo.move)) {
                if (turnInfo.move.piece.symbol == 'R')
                    turnInfo.move.piece.setCastlingStatus(turnInfo.castlingStatus, this.isGrand);
                else if (turnInfo.move.piece.symbol == 'K')
                    turnInfo.move.piece.castlingStatus = turnInfo.castlingStatus;
            }
            if (turnInfo.specialPawnCapture === undefined)
                this.specialPawnCapture = null;
            else
                this.specialPawnCapture = PawnSpecialCaptureStatus.parse(this, turnInfo.specialPawnCapture);
            //backwarding turn
            if (this.turn === 'b')
                this.moveNumber--;
            if (turnInfo.initHalfMoveClock === undefined)
                this.halfmoveClock--;
            else
                this.halfmoveClock = 0;
            super.prepareCurrentTurn();
            super.computeHeuristic(this.turn, this.moveNumber, true, this.currentHeuristic);
            this._lastMove = cescacs_moves_1.csMoves.moveNotation(turnInfo.move);
        }
    }
    applyMove(move) {
        if (cescacs_moves_1.csMoves.isCastlingInfo(move))
            this.doCastling(cescacs_moves_1.csMoves.moveNotation(move));
        else {
            const piece = move.piece;
            const pos = piece.position;
            if (cescacs_moves_1.csMoves.isMoveInfo(move)) {
                const dest = move.moveTo;
                if (cescacs_moves_1.csMoves.isCaptureInfo(move)) {
                    super.capturePiece(move.captured);
                }
                super.movePiece(piece, dest[0], dest[1]);
                if (cescacs_moves_1.csMoves.isPromotionInfo(move)) {
                    super.promotePawn(piece, move.promoted);
                }
            }
            else {
                super.promotePawn(piece, move.promoted);
                this.pieceCaptured = false;
                this.pawnMoved = true;
            }
        }
    }
    undoMove(move, moveTurn) {
        if (cescacs_moves_1.csMoves.isCastlingInfo(move))
            this.undoCastling(cescacs_moves_1.csMoves.moveNotation(move), moveTurn);
        else if (cescacs_moves_1.csMoves.isMoveInfo(move)) {
            if (cescacs_moves_1.csMoves.isPromotionInfo(move))
                super.undoPromotePawn(move.piece, move.promoted);
            super.undoPieceMove(move.piece, move.moveTo[0], move.moveTo[1]);
            if (cescacs_moves_1.csMoves.isCaptureInfo(move)) {
                const pos = move.special === undefined ? move.moveTo : move.special;
                super.undoCapturePiece(move.captured, pos[0], pos[1]);
            }
        }
        else
            super.undoPromotePawn(move.piece, move.promoted);
    }
    undoCastling(castling, color) {
        const firstValue = (gen) => {
            for (const p of gen)
                return p;
        };
        const isGrand = this.isGrand;
        const side = castling[2];
        const column = castling[4];
        const rColumn = cescacs_types_1.csConvert.toColumnIndex(castling[5]);
        const currentKing = color == 'White' ? this.wKing : this.bKing;
        const kingInitialPos = color == 'White' ? cescacs_positionHelper_1.PositionHelper.whiteKingInitPosition : cescacs_positionHelper_1.PositionHelper.blackKingInitPosition;
        const rookInitialPos = side == 'D' ?
            cescacs_positionHelper_1.PositionHelper.initialQueenSideRookPosition(color, isGrand)
            : cescacs_positionHelper_1.PositionHelper.initialKingSideRookPosition(color, isGrand);
        const pieces = color == 'White' ? this.whitePiecesFulfil : this.blackPiecesFulfil;
        const rook = firstValue(pieces(p => cescacs_piece_1.csPieceTypes.isRook(p) && p.position != null && p.position[0] == rColumn
            && cescacs_positionHelper_1.PositionHelper.isOrthogonally(p.position, rookInitialPos) != null));
        super.undoPieceMove(currentKing, kingInitialPos[0], kingInitialPos[1]);
        super.undoPieceMove(rook, rookInitialPos[0], rookInitialPos[1]);
        currentKing.castlingStatus = "RKR";
        rook.setCastlingStatus("RKR", isGrand);
        if (side == 'R') {
            const r2Column = cescacs_types_1.csConvert.toColumnIndex(castling[6]);
            const r2InitialPos = cescacs_positionHelper_1.PositionHelper.initialQueenSideRookPosition(color, isGrand);
            const rook2 = firstValue(pieces(p => cescacs_piece_1.csPieceTypes.isRook(p) && p.position != null && p.position[0] == r2Column
                && cescacs_positionHelper_1.PositionHelper.isOrthogonally(p.position, r2InitialPos) != null));
            super.undoPieceMove(rook2, r2InitialPos[0], r2InitialPos[1]);
            rook2.setCastlingStatus("RKR", isGrand);
        }
    }
    applyMoveSq(sq) {
        const lines = sq.split(/\r?\n/);
        for (let i = 0; i < lines.length; i++) {
            const parts = lines[i].split(/[.,]\s?/);
            (0, ts_general_1.assertCondition)(parts.length > 1, "numbered plays");
            console.log(parts[1], parts[2]);
            this.applyStringMove(parts[1]);
            if (i < lines.length - 1) {
                (0, ts_general_1.assertCondition)(parts.length == 3, "both players on each numbered play");
                this.applyStringMove(parts[2]);
            }
            else if (parts.length == 3) {
                this.applyStringMove(parts[2]);
            }
        }
    }
    applyStringMove(mov, assertions = false) {
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
        if (assertions)
            (0, ts_general_1.assertCondition)(mov.length >= 4, "Moviment length must be at least of 4 chars");
        if (mov.startsWith("KR") && (mov[3] == '-' || mov[3] == '–')) {
            const castlingString = mov[3] == '–' ? mov.replace('–', '-') : mov;
            if (!assertions
                || !this.isGrand && cescacs_types_1.csTypes.isCastlingString(castlingString)
                || this.isGrand && cescacs_types_1.csTypes.isGrandCastlingString(castlingString)) {
                this.doCastling(castlingString, assertions);
            }
            else
                throw new Error(`never: incorrect castling move: ${castlingString}`);
        }
        else {
            const sepIx = separatorIndex(mov);
            const movePiece = cescacs_types_1.csTypes.isPieceName(mov[0]) && cescacs_types_1.csTypes.isColumn(mov[1]) ? mov[0] : 'P';
            const fromHexPos = mov.slice(movePiece == 'P' ? 0 : 1, sepIx);
            if (assertions) {
                (0, ts_general_1.assertCondition)(sepIx < mov.length - 1, "Moviment divided into parts");
                (0, ts_general_1.assertCondition)(isHexPosition(fromHexPos), "Initial hex");
            }
            const separator = mov.charAt(sepIx) == '@' && mov.charAt(sepIx + 1) == '@' ? '@@' : mov.charAt(sepIx);
            if (separator == '=') {
                const promotionPiece = mov[sepIx + 1];
                if (assertions)
                    (0, ts_general_1.assertCondition)(movePiece == 'P', "Promoting a pawn");
                this.doPromotePawn(fromHexPos, fromHexPos, promotionPiece);
            }
            else {
                if (assertions) {
                    (0, ts_general_1.assertCondition)(sepIx < mov.length - 2, "Movement destination");
                }
                const toIx = sepIx + separator.length;
                const toEndIx = separatorIndex(mov, toIx);
                const capturedPiece = cescacs_types_1.csTypes.isPieceName(mov[toIx]) && cescacs_types_1.csTypes.isColumn(mov[toIx + 1]) ? mov[toIx] : undefined;
                const toHexPos = mov.slice(capturedPiece === undefined ? toIx : toIx + 1, toEndIx);
                if (assertions) {
                    (0, ts_general_1.assertCondition)(isHexPosition(toHexPos), "Destination hex");
                    (0, ts_general_1.assertCondition)(capturedPiece === undefined || (separator != '-' && separator != '–'), "Captured piece");
                }
                if (toEndIx < mov.length && mov[toEndIx] == '=') {
                    const promotionPiece = mov[toEndIx + 1];
                    if (assertions)
                        (0, ts_general_1.assertCondition)(movePiece == 'P', "Promoting a pawn");
                    this.doPromotePawn(fromHexPos, toHexPos, promotionPiece);
                }
                else
                    this.doMove(fromHexPos, toHexPos, movePiece);
            }
        }
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

},{"./cescacs.moves":2,"./cescacs.piece":3,"./cescacs.positionHelper":4,"./cescacs.types":5,"./ts.general":6}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.csMoves = void 0;
const cescacs_types_1 = require("./cescacs.types");
const cescacs_positionHelper_1 = require("./cescacs.positionHelper");
var csMoves;
(function (csMoves) {
    function isCastlingInfo(mov) {
        return mov.side !== undefined && mov.col !== undefined && mov.rPos !== undefined &&
            (mov.kRook !== undefined || mov.qRook !== undefined) &&
            (mov.side != 'R' || mov.r2Pos === undefined);
    }
    csMoves.isCastlingInfo = isCastlingInfo;
    function isPromotionInfo(mov) {
        return mov.piece !== undefined && mov.prPos !== undefined && mov.promoted !== undefined;
    }
    csMoves.isPromotionInfo = isPromotionInfo;
    function isMoveInfo(mov) {
        return mov.piece !== undefined && mov.pos !== undefined && mov.moveTo !== undefined;
    }
    csMoves.isMoveInfo = isMoveInfo;
    function isCaptureInfo(mov) {
        return mov.captured !== undefined;
    }
    csMoves.isCaptureInfo = isCaptureInfo;
    function fullMoveNotation(info) {
        var _a;
        const postStr = (_a = info.check) !== null && _a !== void 0 ? _a : (info.end == "mate" ? "#" : "");
        const preStr = info.turn == 'w' ? info.n + '. ' : "";
        return preStr + moveNotation(info.move) + postStr;
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
    function moveNotation(info) {
        if (isCastlingInfo(info)) {
            const tail = info.r2Pos !== undefined ? cescacs_types_1.csConvert.columnFromIndex(info.r2Pos[0])
                : (info.side == 'K' && info.col == 'H' && info.rPos[0] == 10) ?
                    (info.rPos[1] == 5 || info.rPos[1] == 23 ? 'O' : info.rPos[1] == 7 || info.rPos[1] == 21 ? 'OO' : "")
                    : "";
            return "KR" + info.side + "-" + info.col + cescacs_types_1.csConvert.columnFromIndex(info.rPos[0]) + tail;
        }
        else if (isMoveInfo(info)) {
            const pre = (info.piece.symbol == 'P' ? "" : info.piece.symbol) + cescacs_positionHelper_1.PositionHelper.toString(info.pos);
            const post = isPromotionInfo(info) ? "=" + info.promoted.symbol : "";
            let sep;
            if (isCaptureInfo(info)) {
                if (info.special !== undefined) {
                    sep = cescacs_positionHelper_1.PositionHelper.equals(info.moveTo, info.special)
                        || Math.abs(info.special[1] - info.moveTo[1]) == 2 ? "@" : "@@";
                }
                else {
                    sep = info.captured.symbol == 'P' ? "×" : "×" + info.captured.symbol;
                }
            }
            else
                sep = "-";
            return pre + sep + cescacs_positionHelper_1.PositionHelper.toString(info.moveTo) + post;
        }
        else if (isPromotionInfo(info)) {
            return cescacs_positionHelper_1.PositionHelper.toString(info.prPos) + "=" + info.promoted.symbol;
        }
        else
            throw new TypeError("must be a move notation");
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
class Piece {
    constructor(color, column, line) {
        this.color = color;
        if (column == undefined)
            this._position = null;
        else if (line == undefined)
            throw new TypeError("Line shoud be defined when column is");
        else
            this._position = cescacs_positionHelper_1.PositionHelper.fromBoardPosition(column, line);
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
        var _a;
        return this.uncapitalizedSymbol + ((_a = this.position) === null || _a === void 0 ? void 0 : _a.toString());
    }
    get uncapitalizedSymbol() {
        return (this.color == "White" ? this.symbol : this.symbol.toLowerCase());
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
            for (const direction of (orientation !== null && orientation !== void 0 ? orientation : cescacs_types_1.csConvert.orthogonalDirections())) {
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
            for (const direction of (orientation !== null && orientation !== void 0 ? orientation : cescacs_types_1.csConvert.diagonalDirections())) {
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
        if (this.checked && this.position != null) {
            for (const direction of cescacs_types_1.csConvert.orthogonalDirections()) {
                if (this.pin == null || !(this.pin.includes(direction))) {
                    if (!cescacs_types_1.csTypes.hasDoubleCheckPin(this.checkPosition) || !(this.checkPosition[2].includes(direction))) {
                        const pos = cescacs_positionHelper_1.PositionHelper.orthogonalStep(this.position, direction);
                        if (pos != undefined) {
                            const pieceColor = board.hasPiece(pos);
                            if ((pieceColor == null || pieceColor !== this.color) && !board.isThreated(pos, this.color))
                                yield pos;
                        }
                    }
                }
            }
            for (const direction of cescacs_types_1.csConvert.diagonalDirections()) {
                if (this.pin == null || !(this.pin.includes(direction))) {
                    if (!cescacs_types_1.csTypes.hasDoubleCheckPin(this.checkPosition) || !(this.checkPosition[2].includes(direction))) {
                        const pos = cescacs_positionHelper_1.PositionHelper.diagonalStep(this.position, direction);
                        if (pos != undefined) {
                            const pieceColor = board.hasPiece(pos);
                            if ((pieceColor == null || pieceColor !== this.color) && !board.isThreated(pos, this.color))
                                yield pos;
                        }
                    }
                }
            }
        }
        else {
            for (const m of this.attemptMoves(board)) {
                if (!board.isThreated(m, this.color))
                    yield m;
            }
        }
    }
    markThreats(board) {
        for (const p of this.attemptMoves(board, true)) {
            if (!board.hasThreat(p, this.color))
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
        if (this.position != null && cescacs_types_1.csTypes.isSingleCheck(this.checkPosition)) {
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
    // public * castlings(board: IBoard): Generator<[Nullable<Position>, Position, Nullable<Position>], void, void> {
    //     //TODO: Those are "attempt castlings". Must be checked the moves are possible
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
        if (this.position != null) {
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
    }
    *diagonalStepList(board, defends) {
        if (this.position != null) {
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
    }
    *attemptMoves(board, defends = false) {
        yield* this.orthogonalStepList(board, defends);
        yield* this.diagonalStepList(board, defends);
        if (!this._moved && !this.checked) {
            yield* this.knightMoves(board);
        }
    }
    get initialPosiition() {
        return this.color == "White" ? cescacs_positionHelper_1.PositionHelper.whiteKingInitPosition : cescacs_positionHelper_1.PositionHelper.blackKingInitPosition;
    }
    get isInitialPosition() {
        if (this.position == null)
            return false;
        else
            return this.position[0] == 8
                && (this.color == "White" && this.position[1] == 1 || this.color == "Black" && this.position[1] == 27);
    }
}
exports.King = King;
class Queen extends Piece {
    constructor() {
        super(...arguments);
        this.symbol = "D";
        this.value = 15;
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
    constructor() {
        super(...arguments);
        this.symbol = "V";
        this.value = 14;
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
    constructor(color, column, line) {
        super(color);
        this.symbol = "R";
        this.value = 11;
        if (column != undefined && line != undefined) {
            super.setPositionTo([cescacs_types_1.csConvert.toColumnIndex(column), line]);
            this._moved = this.defaultMoveInitialitzation();
        }
        else
            this._moved = false;
    }
    setPositionTo(pos) {
        super.setPositionTo(pos);
        this._moved = this.defaultMoveInitialitzation();
    }
    isQueenSide(grand) {
        if (this.position == null)
            return false;
        else if (grand)
            return this.position[0] == 3 && (this.color == "White" ? this.position[1] == 4 : this.position[1] == 24);
        else
            return this.position[0] == 4 && (this.color == "White" ? this.position[1] == 3 : this.position[1] == 25);
    }
    isKingSide(grand) {
        if (this.position == null)
            return false;
        else if (grand)
            return this.position[0] == 11 && (this.color == "White" ? this.position[1] == 4 : this.position[1] == 24);
        else
            return this.position[0] == 10 && (this.color == "White" ? this.position[1] == 3 : this.position[1] == 25);
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
    defaultMoveInitialitzation() {
        // first heuristic aprox; but needs castlingStatus
        return !(this.isQueenSide(false) || this.isKingSide(false) || this.isQueenSide(true) || this.isKingSide(true));
    }
}
exports.Rook = Rook;
class Pegasus extends Piece {
    constructor() {
        super(...arguments);
        this.symbol = "G";
        this.value = 8;
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
    constructor() {
        super(...arguments);
        this.symbol = "N";
        this.value = 4;
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
        if (cescacs_types_1.csTypes.isColumn(columnOrHexcolor) && line != undefined) {
            super.setPositionTo([cescacs_types_1.csConvert.toColumnIndex(columnOrHexcolor), line]);
            this.hexesColor = cescacs_positionHelper_1.PositionHelper.hexColor(this.position);
        }
        else if (cescacs_types_1.csTypes.isHexColor(columnOrHexcolor)) {
            this.hexesColor = columnOrHexcolor;
        }
        else
            throw new TypeError("Bishop constructor error");
    }
    *moves(board) {
        yield* this.diagonalMoves(board);
    }
    canMoveTo(board, p) {
        return super.canMoveDiagonallyTo(board, p);
    }
    markThreats(board) {
        for (const p of this.diagonalMoves(board, true)) {
            board.setThreat(p, this.color);
        }
    }
}
exports.Bishop = Bishop;
class Elephant extends Piece {
    constructor() {
        super(...arguments);
        this.symbol = "E";
        this.value = 2;
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
                    else if (defend || pieceColor != this.color)
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
        return this.color === 'White' ? "ColumnUp" : "ColumnDown";
    }
}
exports.Elephant = Elephant;
class Almogaver extends Piece {
    constructor() {
        super(...arguments);
        this.symbol = "M";
        this.value = 2;
    }
    *moves(board, onlyCaptures = false, defends = false) {
        const piecePos = this.position;
        if (piecePos != null) {
            const pin = this.pin;
            if (!onlyCaptures) {
                for (const direction of cescacs_types_1.csConvert.orthogonalDirections()) {
                    if (pin == null || pin.includes(direction)) {
                        const pos = cescacs_positionHelper_1.PositionHelper.orthogonalStep(piecePos, direction);
                        if (pos != undefined && board.hasPiece(pos) == null) {
                            const pos2 = cescacs_positionHelper_1.PositionHelper.orthogonalStep(pos, direction);
                            if (pos2 != undefined && board.hasPiece(pos2) == null)
                                yield pos2;
                        }
                    }
                }
            }
            for (const direction of cescacs_types_1.csConvert.diagonalDirections()) {
                if (pin == null || pin.includes(direction)) {
                    const pos = cescacs_positionHelper_1.PositionHelper.diagonalStep(piecePos, direction);
                    if (pos != undefined) {
                        const pieceColor = board.hasPiece(pos);
                        if (pieceColor != null) {
                            if (pieceColor !== this.color || defends)
                                yield pos;
                        }
                    }
                }
            }
        }
    }
    canCaptureOn(board, p) {
        return cescacs_positionHelper_1.PositionHelper.positionIteratorIncludes(this.moves(board, true, false), p);
    }
    markThreats(board) {
        for (const p of this.moves(board, true, true)) {
            board.setThreat(p, this.color);
        }
    }
}
exports.Almogaver = Almogaver;
class Pawn extends Piece {
    constructor() {
        super(...arguments);
        this.symbol = "P";
        this.value = 1;
    }
    *moves(board, onlyCaptures = false, defend = false) {
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
                            if (defend || pieceColor != this.color)
                                yield p;
                        }
                        else if (specialCapture != null && specialCapture.isEnPassantCapturable() && specialCapture.isEnPassantCapture(p))
                            yield p;
                    }
                }
            }
        }
    }
    promoteTo(piece) {
        (0, ts_general_1.assertNonNullish)(this.position, "Pawn to promote is not captured");
        (0, ts_general_1.assertCondition)(cescacs_positionHelper_1.PositionHelper.isPromotionHex(this.position, this.color), `Promotion hex ${cescacs_positionHelper_1.PositionHelper.toString(this.position)}`);
        piece.setPositionTo(this.position);
        this.captured();
    }
    get isAwaitingPromotion() {
        if (this.position != null)
            return cescacs_positionHelper_1.PositionHelper.isPromotionHex(this.position, this.color);
        else
            return false;
    }
    canCaptureOn(board, p) {
        return cescacs_positionHelper_1.PositionHelper.positionIteratorIncludes(this.moves(board, true, false), p);
    }
    markThreats(board) {
        for (const p of this.moves(board, true, true)) {
            board.setThreat(p, this.color);
        }
    }
    hasTripleStep(grand) {
        const p = this.position;
        if (p != null) {
            const c = p[0];
            if (c > 3 && c < 7 || c == 3 && !grand) {
                return p[1] == (this.color == "White" ? c + 1 : 27 - c);
            }
            else if (c > 7 && c < 11 || c == 11 && !grand) {
                return p[1] == (this.color == "White" ? 15 - c : 13 + c);
            }
            else if (grand) {
                if (c == 2 || c == 12)
                    return p[1] == (this.color == "White" ? 5 : 23);
                else if (c == 3 || c == 11)
                    return p[1] == (this.color == "White" ? 6 : 22);
                else
                    return false;
            }
            else
                return false;
        }
        else
            return false;
    }
    get ownOrthogonalStraightDirection() {
        return this.color === 'White' ? "ColumnUp" : "ColumnDown";
    }
    get ownOrthogonalAlternateDirections() {
        return this.color === 'White' ? ["FileUp", "FileInvUp"] : ["FileDown", "FileInvDown"];
    }
    get ownCaptureDirections() {
        return this.color == 'White' ? ["LineUp", "LineInvUp"] : ["LineDown", "LineInvDown"];
    }
}
exports.Pawn = Pawn;
var csPieceTypes;
(function (csPieceTypes) {
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

},{"./cescacs.positionHelper":4,"./cescacs.types":5,"./ts.general":6}],4:[function(require,module,exports){
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
            return color == "White" ? [3, 4] : [3, 24];
        else
            return color == "White" ? [4, 3] : [4, 25];
    }
    static initialKingSideRookPosition(color, grand) {
        if (grand)
            return color == "White" ? [11, 4] : [11, 24];
        else
            return color == "White" ? [10, 3] : [10, 25];
    }
    static isPromotionPos(c, l, color) {
        return l == (c <= 7 ? (color == "White" ? 21 + c : 7 - c) : (color == "White" ? 35 - c : c - 7));
    }
    static isPromotionHex(pos, color) {
        const c = pos[0];
        return pos[1] == (c <= 7 ? (color == "White" ? 21 + c : 7 - c) : (color == "White" ? 35 - c : c - 7));
    }
    static promotionDistance(pos, color) {
        const c = pos[0];
        if (color == 'White')
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
    csTypes.iscastlingColumn = (x) => _castlingColumn.includes(x);
    csTypes.isDirectionMoveRange = (x) => csTypes.isNumber(x) && Number.isInteger(x) && x >= 0 && x <= 5;
    csTypes.isDirectionFullMoveRange = (x) => csTypes.isNumber(x) && Number.isInteger(x) && x >= 0 && x <= 11;
    csTypes.isOrthogonalOrientation = (x) => Array.isArray(x) && _orthogonalOrientation.some(y => y[0] == x[0] && y[1] == x[1]);
    csTypes.isDiagonalOrientation = (x) => Array.isArray(x) && _diagonalOrientation.some(y => y[0] == x[0] && y[1] == x[1]);
    csTypes.isHexColor = (x) => _hexColor.includes(x);
    csTypes.isPieceName = (x) => _pieceName.includes(x);
    csTypes.isTurn = (x) => _turn.includes(x);
    csTypes.isCastlingStatus = (x) => _castlingStatus.includes(x);
    csTypes.isCastlingString = (x) => _castlingString.includes(x);
    csTypes.isGrandCastlingString = (x) => _grandCastlingString.includes(x);
    csTypes.isSingleCheck = (x) => Object.prototype.hasOwnProperty.call(x, "d") && Object.prototype.hasOwnProperty.call(x, "p");
    csTypes.isDoubleCheck = (x) => Array.isArray(x) && length == 3 && csTypes.isPosition(x[0]) && csTypes.isPosition(x[1]) &&
        (x[2] == null || csTypes.isOrthogonalOrientation(x[2]) || csTypes.isDiagonalOrientation(x[2]));
    csTypes.hasDoubleCheckPin = (x) => Array.isArray(x) && length == 3 && csTypes.isPosition(x[0]) && csTypes.isPosition(x[1]) &&
        x[2] != null && (csTypes.isOrthogonalOrientation(x[2]) || csTypes.isDiagonalOrientation(x[2]));
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

},{}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.round2hundredths = exports.assertCondition = exports.assertNonNullish = void 0;
function assertNonNullish(value, valueDescription) {
    if (value === null || value === undefined) {
        debugger;
        throw new TypeError(`Unexpected ${value} value` + valueDescription == undefined ? '' : ": " + valueDescription);
    }
}
exports.assertNonNullish = assertNonNullish;
function assertCondition(condition, conditionDescription) {
    if (!condition) {
        debugger;
        throw new Error('Assertion does not hold' + conditionDescription == undefined ? '' : ": " + conditionDescription);
    }
}
exports.assertCondition = assertCondition;
function round2hundredths(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}
exports.round2hundredths = round2hundredths;

},{}]},{},[1])(1)
});
