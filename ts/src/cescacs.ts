import { assertNonNullish, assertCondition, round2hundredths } from "./ts.general"
import {
    Nullable, Column, ColumnIndex, Line, Position,
    OrthogonalDirection, KnightDirection,
    ScornfulCaptureDirection,
    Turn, HexColor, PieceName, PieceColor, CastlingStatus,
    CastlingColumn,
    CastlingString,
    GrandCastlingString
} from "./cescacs.types";

import { csTypes as csty, csConvert as cscnv } from "./cescacs.types";
import { PositionHelper } from "./cescacs.positionHelper";
import { csPieceTypes as cspty } from "./cescacs.piece";
import {
    IBoard, Piece, IPawnSpecialCaptureStatus, IScornfulCapturable, IEnPassantCapturable,
    King, Queen, Wyvern, Rook, Pegasus, Knight, Bishop, Elephant, Almogaver, Pawn
} from "./cescacs.piece";

import { UndoStatus, MoveInfo, CastlingSide } from "./cescacs.moves";
import { csMoves as csmv } from "./cescacs.moves"

export { PositionHelper, cspty, csmv, round2hundredths };

export type Heuristic = {
    readonly pieces: [number, number],
    readonly space: [number, number],
    positioning: number,
    mobility: number,
    king: number
}

export abstract class PawnSpecialCaptureStatus implements IPawnSpecialCaptureStatus {

    public static parse(board: IBoard, value: Nullable<string>): Nullable<PawnSpecialCaptureStatus> {
        if (value != null && value.length > 0 && value != "-") {
            if (value.length >= 4) {
                const elements = value.split("@");
                if (elements.length = 2) {
                    const p0 = PositionHelper.parse(elements[0]);
                    if (elements[1].includes(",") || !isNaN(Number(elements[1]))) {
                        const piece = board.getPiece(p0);
                        if (piece != null) {
                            const values = elements[1].split(",");
                            if (values.length >= 1 && values.length <= 2) {
                                let captureTo: Position[] = [];
                                for (const s of values) {
                                    let l = Number(s);
                                    if (!isNaN(l) && csty.isLine(l)) {
                                        captureTo.push(PositionHelper.fromBoardPosition(p0[0], l, true));
                                    } else throw new TypeError("Invalid en passant capture line value");
                                }
                                return new EnPassantCapturable(piece, captureTo);
                            } else throw new TypeError("Missing or invalid en passant capture lines");
                        } else throw new Error(PositionHelper.toString(p0) + " doesn't have a pawn");
                    }
                    else {
                        const p1 = PositionHelper.parse(elements[1]);
                        const piece = board.getPiece(p1);
                        if (piece != null) return new ScornfulCapturable(piece, p0);
                        else throw new Error(PositionHelper.toString(p1) + " doesn't have a pawn");
                    }
                }
                else throw new TypeError("Invalid special pawn capture status string");
            } else throw new TypeError("Too short special pawn capture status string");
        } else return null;
    }

    public readonly abstract specialCaptureType: 'scornful' | 'enPassant';

    public isScornfulCapturable(): this is ScornfulCapturable {
        return this.specialCaptureType == 'scornful';
    }

    public isEnPassantCapturable(): this is EnPassantCapturable {
        return this.specialCaptureType == 'enPassant';
    }

    public abstract toString(): string;
    protected readonly _capturablePiece: Piece;

    constructor(capturablePawn: Piece) {
        this._capturablePiece = capturablePawn;
    }

    public get capturablePiece() { return this._capturablePiece; }

    public get capturablePawn() {
        assertCondition(cspty.isPawn(this._capturablePiece));
        return this._capturablePiece;
    }

}

export class ScornfulCapturable extends PawnSpecialCaptureStatus implements IScornfulCapturable {

    public static promoteCapturablePawn(scorfulCapturable: ScornfulCapturable, capturablePiece: Piece): ScornfulCapturable {
        return new ScornfulCapturable(capturablePiece, scorfulCapturable._capturerPawnPos)
    }

    public readonly specialCaptureType = 'scornful';
    private readonly _capturerPawnPos: Position;

    constructor(capturablePawn: Piece, scornedPawnPos: Position) {
        super(capturablePawn);
        this._capturerPawnPos = scornedPawnPos;
    }

    public isScorned(pawn: Pawn): boolean
    public isScorned(pawn: Pawn, pos: Position): boolean
    public isScorned(pawn: Pawn, pos?: Position): boolean {
        const result = pawn.position != null && PositionHelper.equals(pawn.position, this._capturerPawnPos);
        if (pos == null) return result;
        else return result && PositionHelper.equals(pos, this.capturablePiece.position!);
    }

    public get scornfulCaptureDirection(): ScornfulCaptureDirection {
        const capturerColumnIndex = this._capturerPawnPos[0];
        const capturablePawnPos = this.capturablePiece.position!;
        const capturableColumnIndex = capturablePawnPos[0];
        if (capturablePawnPos[1] > this._capturerPawnPos[1]) {
            return capturableColumnIndex > capturerColumnIndex ? "FileUp" : "FileInvUp";
        } else {
            return capturableColumnIndex > capturerColumnIndex ? "FileDown" : "FileInvDown";
        }
    }

    public toString(): string {
        return PositionHelper.toString(this._capturerPawnPos) + "@" + PositionHelper.toString(this.capturablePiece.position!);
    }
}

export class EnPassantCapturable extends PawnSpecialCaptureStatus implements IEnPassantCapturable {

    public static promoteCapturablePawn(enpassantCapturable: EnPassantCapturable, capturablePiece: Piece): EnPassantCapturable {
        return new EnPassantCapturable(capturablePiece, enpassantCapturable._captureTo)
    }

    public readonly specialCaptureType = 'enPassant';
    private readonly _captureTo: Position[];

    constructor(capturablePawn: Piece, captureTo: Position[]) {
        super(capturablePawn);
        this._captureTo = captureTo;
    }

    public isEnPassantCapture(pos: Position): boolean
    public isEnPassantCapture(pos: Position, capturerPawn: Pawn): boolean
    public isEnPassantCapture(pos: Position, capturerPawn?: Pawn): boolean {
        const isEnPassantCapturePos = this._captureTo.some(x => PositionHelper.equals(x, pos));
        if (capturerPawn == null) return isEnPassantCapturePos;
        else if (isEnPassantCapturePos && capturerPawn.position != null) {
            const capturerPos = capturerPawn.position;
            if (Math.abs(pos[0] - capturerPos[0]) == 1) {
                if (capturerPawn.color == 'White') return pos[1] - capturerPos[1] == 3;
                else return capturerPos[1] - pos[1] == 3;
            } else return false;
        } else return false;
    }

    public toString(): string {
        return PositionHelper.toString(this.capturablePiece.position!) + "@" + this.captureLines();
    }

    private captureLines(): string {
        const captureTo = this._captureTo;
        if (captureTo.length > 0 && captureTo.length <= 2) {
            let r = (captureTo[0][1]).toString();
            if (captureTo.length > 1) {
                r += "," + (captureTo[1][1]).toString();
            }
            return r;
        }
        else throw new Error("Invalid en passant capture positions set");
    }
}


export abstract class Board implements IBoard {

    protected static newHeuristic(): Heuristic {
        return { pieces: [0, 0], space: [0, 0], positioning: 0, mobility: 0, king: 0 }
    }

    protected static splitCastlingStatus(source: Nullable<string>): [CastlingStatus, CastlingStatus] {
        if (source != null && source.length > 0) {
            let wSrc: string;
            let bSrc: string;
            let i = 0;
            while (i < source.length && source[i].toUpperCase() == source[i]) i++;
            if (i == 0) { wSrc = "-"; bSrc = source; }
            else if (i == source.length) { wSrc = source; bSrc = "-"; }
            else {
                wSrc = source.slice(0, i);
                bSrc = source.slice(i);
            }
            bSrc = bSrc.toUpperCase();
            if (!csty.isCastlingStatus(wSrc) || !csty.isCastlingStatus(bSrc)) throw new TypeError(`Invalid TLPD issued castling status ${source}`);
            return [wSrc, bSrc];
        }
        else return ["RKR", "RKR"];
    }

    private static lineMask(l: Line) { return 1 << l; }

    private readonly wPositions: number[] = [0, 0, 0, 0, 0, 0, 0, 0];
    private readonly bPositions: number[] = [0, 0, 0, 0, 0, 0, 0, 0];
    private readonly wThreats: number[] = [0, 0, 0, 0, 0, 0, 0, 0];
    private readonly bThreats: number[] = [0, 0, 0, 0, 0, 0, 0, 0];
    private readonly wPieces = new Map<string, Piece>();
    private readonly bPieces = new Map<string, Piece>();
    private readonly _regainablePieces: Piece[] = [];
    private readonly _grand: boolean;
    public readonly wKing: King = new King('White');
    public readonly bKing: King = new King('Black');
    private _specialPawnCapture: Nullable<PawnSpecialCaptureStatus> = null;
    private _currentHeuristic: Heuristic = Board.newHeuristic();
    private _wAwaitingPromotion: boolean = false;
    private _bAwaitingPromotion: boolean = false;
    private _turn: Turn;

    constructor(grand: boolean)
    constructor(grand: boolean, turn: Turn)
    constructor(grand: boolean, turn?: Turn) {
        this._grand = grand;
        this._turn = turn ?? 'w';
    }

    public get isGrand() { return this._grand; }
    public get turn(): Turn { return this._turn; }

    public get isAwaitingPromotion() { return this._turn == 'w' ? this._wAwaitingPromotion : this._bAwaitingPromotion; }
    protected set isAwaitingPromotion(value) { if (this._turn == 'w') this._wAwaitingPromotion = value; else this._bAwaitingPromotion = value; }
    public get specialPawnCapture(): Nullable<PawnSpecialCaptureStatus> { return this._specialPawnCapture; }
    public set specialPawnCapture(value: Nullable<PawnSpecialCaptureStatus>) { this._specialPawnCapture = value; }

    protected get checked(): boolean { return this.currentKing.checked; }
    protected get isKnightOrCloseCheck(): boolean { return this.currentKing.isKnightOrCloseCheck(); }
    protected get isSingleCheck(): boolean { return this.currentKing.isSingleCheck(); }
    protected get isDoubleCheck(): boolean { return this.currentKing.isDoubleCheck(); }

    public get currentHeuristic() { return this._currentHeuristic; }

    public * whitePieces() { for (const p of this.wPieces.values()) yield p; }
    public * blackPieces() { for (const p of this.bPieces.values()) yield p; }

    public * whitePiecesFulfil(cond: (p: Piece) => boolean) { for (const p of this.wPieces.values()) if (cond(p)) yield p; }
    public * blackPiecesFulfil(cond: (p: Piece) => boolean) { for (const p of this.bPieces.values()) if (cond(p)) yield p; }

    protected * whitePiecePositions() { for (const p of this.wPieces.values()) yield p.position!; }
    protected * blackPiecePositions() { for (const p of this.bPieces.values()) yield p.position!; }

    private get currentKing(): King { return (this.turn === 'w' ? this.wKing : this.bKing); }

    public hasPiece(pos: Position): Nullable<PieceColor> {
        const posCol = (pos[0] + 1) >>> 1;
        const posLineMask = Board.lineMask(pos[1]);
        if ((this.wPositions[posCol] & posLineMask) != 0) {
            return 'White';
        }
        else if ((this.bPositions[posCol] & posLineMask) != 0) {
            return 'Black';
        } else return null;
    }

    //Game
    public getHexPiece(pos: string): Nullable<Piece> {
        const p = PositionHelper.parse(pos);
        if (p == null) return null;
        else return this.getPiece(p);
    }

    public getPiece(pos: Position): Nullable<Piece> {
        const color = this.hasPiece(pos);
        if (color == null) return null;
        else if (color == 'White') {
            return this.wPieces.get(PositionHelper.positionKey(pos));
        } else {
            return this.bPieces.get(PositionHelper.positionKey(pos));
        }
    }

    public hasThreat(pos: Position, color: PieceColor): boolean {
        const posCol = (pos[0] + 1) >>> 1;
        return ((color == "White" ? this.wThreats : this.bThreats)[posCol] & Board.lineMask(pos[1])) != 0;
    }

    public isThreated(pos: Position, color: PieceColor): boolean {
        const posCol = (pos[0] + 1) >>> 1;
        return ((color == "White" ? this.bThreats : this.wThreats)[posCol] & Board.lineMask(pos[1])) != 0;
    }

    public setThreat(pos: Position, color: PieceColor): void {
        const posCol = (pos[0] + 1) >>> 1;
        (color == "White" ? this.wThreats : this.bThreats)[posCol] |= Board.lineMask(pos[1]);
    }

    public hasRegainablePieces(hexColor: HexColor): boolean {
        const currentColor = this._turn == 'w' ? 'White' : 'Black';
        return this._regainablePieces.reduce(
            (found, x) => found || x.color == currentColor && (!cspty.isBishop(x) || x.hexesColor == hexColor), false);
    }

    public getHeuristicValue(h: Heuristic) {
        return round2hundredths(h.pieces[0] - h.pieces[1] + h.space[0] - h.space[1] + h.positioning + h.mobility + h.king);
    }

    public maxRegainablePiecesValue(hexColor: HexColor): number {
        const currentColor = this._turn == 'w' ? 'White' : 'Black';
        return this._regainablePieces.reduce((acc, x) =>
            x.value > acc && x.color == currentColor && (!cspty.isBishop(x) || x.hexesColor == hexColor) ? x.value : acc, 0);
    }

    public currentRegainablePieceNames(hexColor: HexColor): Set<PieceName> {
        const currentColor = this._turn == 'w' ? 'White' : 'Black';
        return this._regainablePieces.reduce((s: Set<PieceName>, x: Piece) =>
            x.color == currentColor && (!cspty.isBishop(x) || x.hexesColor == hexColor) ? s.add(x.symbol) : s,
            new Set<PieceName>());
    }

    public * pieceMoves(piece: Piece): Generator<Position, void, void> {
        const currentKing = this.currentKing;
        if (currentKing.checked) {
            if (piece.symbol == "K") yield* piece.moves(this);
            else {
                const capturePos = currentKing.checkThreat;
                if (capturePos != null) {
                    if (piece.canCaptureOn(this, capturePos)) yield capturePos;
                }
                if (currentKing.isSingleCheck()) {
                    yield* piece.blockThreat(this, currentKing.getSingleCheckBlockingPositions(this));
                }
            }
        } else {
            yield* piece.moves(this);
        }
    }

    protected addPiece(piece: Piece) {
        assertNonNullish(piece.position, `${piece.symbol} position`);
        const toPos = piece.position;
        const pieces = (piece.color == "White" ? this.wPieces : this.bPieces);
        pieces.set(PositionHelper.positionKey(toPos), piece);
        const posCol = (toPos[0] + 1) >>> 1;
        const posLineMask = Board.lineMask(toPos[1]);
        const positions = (piece.color == "White" ? this.wPositions : this.bPositions);
        positions[posCol] |= posLineMask;
    }

    protected capturePiece(piece: Piece) {
        assertNonNullish(piece.position, `${piece.symbol} position`);
        const fromPos = piece.position;
        const posCol = (fromPos[0] + 1) >>> 1;
        const posLineMask = Board.lineMask(fromPos[1]);
        const positions = (piece.color == "White" ? this.wPositions : this.bPositions);
        positions[posCol] &= ~posLineMask;
        const pieces = (piece.color == "White" ? this.wPieces : this.bPieces);
        pieces.delete(PositionHelper.positionKey(fromPos));
        piece.captured();
        if (piece.isRegainable) this._regainablePieces.push(piece);
    }

    protected undoCapturePiece(piece: Piece, colIndex: ColumnIndex, line: Line) {
        if (Piece.isRegainablePiece(piece.symbol)) {
            const pix = this._regainablePieces.indexOf(piece);
            assertCondition(pix >= 0, "Captured piece found in the regainable pieces bag");
            this._regainablePieces.splice(pix, 1);
        }
        piece.setPositionTo([colIndex, line]);
        this.addPiece(piece);
    }

    protected movePiece(piece: Piece, toColumnIndex: ColumnIndex, toLine: Line) {
        assertNonNullish(piece.position, `${piece.symbol} position`);
        const piecePos = piece.position;
        const fromPosCol = (piecePos[0] + 1) >>> 1;
        const fromPosLineMask = Board.lineMask(piecePos[1]);
        const pieces = (piece.color == "White" ? this.wPieces : this.bPieces);
        if (cspty.isPawn(piece)) {
            let scornedPawn: Nullable<Pawn> = null;
            let multipleStep: Nullable<Position[]> = null;
            if (piece.position[0] != toColumnIndex) {
                const frontPiece = this.getPiece(
                    [piece.position[0],
                    (toLine > piece.position[1] ? piece.position[1] + 2 : piece.position[1] - 2) as Line]);
                if (frontPiece != null && cspty.isPawn(frontPiece)) scornedPawn = frontPiece;
            } else if (Math.abs(toLine - piece.position[1]) > 2) {
                multipleStep = [];
                if (toLine > piece.position[1]) {
                    multipleStep.push([toColumnIndex, (piece.position[1] + 2) as Line]);
                    if (toLine > piece.position[1] + 4) {
                        multipleStep.push([toColumnIndex, (piece.position[1] + 4) as Line]);
                    }
                } else {
                    multipleStep.push([toColumnIndex, (piece.position[1] - 2) as Line]);
                    if (toLine < piece.position[1] - 4) {
                        multipleStep.push([toColumnIndex, (piece.position[1] - 4) as Line]);
                    }
                }
            }
            if (scornedPawn != null) {
                this._specialPawnCapture = new ScornfulCapturable(piece as Pawn, scornedPawn.position!);
            } else if (multipleStep != null) {
                this._specialPawnCapture = new EnPassantCapturable(piece as Pawn, multipleStep);
            } else {
                this._specialPawnCapture = null;
            }
            if (PositionHelper.isPromotionPos(toColumnIndex, toLine, piece.color)) {
                if (piece.color == 'White') this._wAwaitingPromotion = true;
                else this._bAwaitingPromotion = true;
            }
        } else {
            this._specialPawnCapture = null;
        }
        pieces.delete(PositionHelper.positionKey(piecePos));
        piece.moveTo(toColumnIndex, toLine); //piecePos updated
        pieces.set(PositionHelper.positionKey(piecePos), piece);
        const toPosCol = (piecePos[0] + 1) >>> 1;
        const toPosLineMask = Board.lineMask(piecePos[1]);
        const positions = (piece.color == "White" ? this.wPositions : this.bPositions);
        positions[fromPosCol] &= ~fromPosLineMask;
        positions[toPosCol] |= toPosLineMask;
    }

    protected undoPieceMove(piece: Piece, fromColumnIndex: ColumnIndex, fromLine: Line) {
        const pieces = (piece.color == "White" ? this.wPieces : this.bPieces);
        const piecePos = piece.position!;
        const actualPosCol = (piecePos[0] + 1) >>> 1;
        const actualPosLineMask = Board.lineMask(piecePos[1]);
        pieces.delete(PositionHelper.positionKey(piecePos));
        piece.moveTo(fromColumnIndex, fromLine); //piecePos updated
        pieces.set(PositionHelper.positionKey(piecePos), piece);
        const fromPosCol = (piecePos[0] + 1) >>> 1;
        const fromPosLineMask = Board.lineMask(piecePos[1]);
        const positions = (piece.color == "White" ? this.wPositions : this.bPositions);
        positions[actualPosCol] &= ~actualPosLineMask;
        positions[fromPosCol] |= fromPosLineMask;
    }

    protected promotePawn(pawn: Pawn, piece: Piece) {
        if (this._regainablePieces.includes(piece)) {
            const pieces = (piece.color == "White" ? this.wPieces : this.bPieces);
            pieces.delete(PositionHelper.positionKey(pawn.position!));
            pawn.promoteTo(piece);
            pieces.set(PositionHelper.positionKey(piece.position!), piece);
            if (this._specialPawnCapture != null && this._specialPawnCapture.capturablePawn == pawn) {
                if (this._specialPawnCapture.isScornfulCapturable()) {
                    this._specialPawnCapture = ScornfulCapturable.promoteCapturablePawn(this._specialPawnCapture, piece);
                } else if (this._specialPawnCapture.isEnPassantCapturable()) {
                    this._specialPawnCapture = EnPassantCapturable.promoteCapturablePawn(this._specialPawnCapture, piece);
                }
            }
            const pos = this._regainablePieces.indexOf(piece);
            this._regainablePieces.splice(pos, 1);
        }
    }

    protected undoPromotePawn(pawn: Pawn, piece: Piece) {
        const pieces = (piece.color == "White" ? this.wPieces : this.bPieces);
        pieces.delete(PositionHelper.positionKey(piece.position!));
        pawn.setPositionTo([piece.position![0], piece.position![1]]);
        piece.captured();
        this._regainablePieces.push(piece);
        pieces.set(PositionHelper.positionKey(pawn.position!), pawn);
    }

    protected addRegainablePiece(piece: Piece) {
        if (piece.position == null) this._regainablePieces.push(piece);
    }

    protected currentRegainablePieces(hexColor: HexColor): Piece[] {
        const currentColor = this._turn == 'w' ? 'White' : 'Black';
        const regainables = this._regainablePieces;
        return regainables.filter(
            (x, index) =>
                x.color == currentColor && (!cspty.isBishop(x) || x.hexesColor == hexColor)
                && index == regainables.findIndex(p =>
                    p.color == currentColor && p.symbol == x.symbol && (!cspty.isBishop(p) || p.hexesColor == hexColor)));
    }

    protected resetGame(turn: Turn) {
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

    protected prepareGame() {
        if (this._turn == 'w') this.prepareTurn(this.bKing);
        else this.prepareTurn(this.wKing);
        this.prepareCurrentTurn();
    }

    protected nextTurn(): void {
        this._turn = this._turn === 'w' ? 'b' : 'w';
        // this.clearThreats(this._turn === 'w' ? 'Black' : 'White');
        // this.clearPins(this._turn === 'w' ? 'White' : 'Black');
    }

    protected prepareCurrentTurn() {
        this.prepareTurn(this.currentKing);
    }

    private prepareTurn(currentKing: King) {
        const color = currentKing.color;
        const threats = (color == "White" ? this.bThreats : this.wThreats);
        for (let i = 0; i <= 7; i++) threats[i] = 0;
        {
            const threatingPieces = (color == 'White' ? this.bPieces.values() : this.wPieces.values());
            for (const piece of threatingPieces) piece.markThreats(this);
        }
        {
            const ownPieces = (color == "White" ? this.wPieces.values() : this.bPieces.values());
            for (const piece of ownPieces) piece.pin = null;
        }
        currentKing.computeCheckAndPins(this);
    }

    protected isMoveableTurn(): boolean {
        const movingPieces: IterableIterator<Piece> = (this.turn === 'w' ? this.wPieces.values() : this.bPieces.values());
        for (const piece of movingPieces) {
            const it = this.pieceMoves(piece);
            if (!it.next().done) return true;
        }
        return false;
    }

    protected computeHeuristic(turn: Turn, moveCount: number, anyMove: boolean, result: Heuristic) {

        const countBitset = function (value: number): number {
            const mask = 1;
            let r = 0;
            while (value > 0) {
                r += value & mask;
                value = value >>> 1;
            }
            return r;
        }
        const countEvenBitset = function (value: number): number {
            const mask = 1;
            let r = 0;
            while (value > 0) {
                r += value & mask;
                value = value >>> 2;
            }
            return r;
        }
        const countOddBitset = function (value: number): number {
            const mask = 1;
            let r = 0;
            value = value >>> 1;
            while (value > 0) {
                r += value & mask;
                value = value >>> 2;
            }
            return r;
        }
        const horizontalXray = function* (board: Board, pos: Position, color: PieceColor) {
            for (const direction of cscnv.orthogonalDirections()) {
                const it = PositionHelper.orthogonalRide(pos, direction);
                let v = it.next();
                while (v.done == false) {
                    const piece1 = board.getPiece(v.value);
                    if (piece1 == null) v = it.next();
                    else {
                        const it2 = PositionHelper.orthogonalRide(v.value, direction);
                        let v2 = it2.next();
                        while (v2.done == false) {
                            const piece2 = board.getPiece(v2.value);
                            if (piece2 == null) v2 = it.next();
                            else {
                                if (piece2.color != color) yield [piece1, piece2];
                                v2 = it2.return();
                            }
                        }
                        v = it.return();
                    }
                }
            }
        }
        const diagonalXray = function* (board: Board, pos: Position, color: PieceColor) {
            for (const direction of cscnv.diagonalDirections()) {
                const it = PositionHelper.diagonalRide(pos, direction);
                let v = it.next();
                while (v.done == false) {
                    const piece1 = board.getPiece(v.value);
                    if (piece1 == null) v = it.next();
                    else {
                        const it2 = PositionHelper.diagonalRide(v.value, direction);
                        let v2 = it2.next();
                        while (v2.done == false) {
                            const piece2 = board.getPiece(v2.value);
                            if (piece2 == null) v2 = it.next();
                            else {
                                if (piece2.color != color) yield [piece1, piece2];
                                v2 = it2.return();
                            }
                        }
                        v = it.return();
                    }
                }
            }
        }

        const currentKing = turn === 'w' ? this.wKing : this.bKing;
        result.pieces[0] = 0;
        result.pieces[1] = 0;
        result.positioning = 0;
        result.mobility = 0;
        if (!anyMove) {
            if (currentKing.checked) result.king = -120;
            else result.king = -6;
            result.space[0] = 0;
            result.space[0] = 0;
        } else {
            const color = (turn == 'w' ? 'White' : 'Black') as PieceColor;
            result.king = 0;
            if (currentKing.checked) {
                if (currentKing.isDoubleCheck()) result.king -= 30;
                else if (currentKing.isKnightOrCloseCheck()) result.king -= 20;
                else result.king -= 15;
            } else if (!currentKing.moved) result.king += 0.1;
            for (const pos of currentKing.attemptMoves(this, true)) {
                const pieceColor = this.hasPiece(pos);
                if (currentKing.checked) {
                    if (this.isThreated(pos, color)) result.king -= 2;
                    else if (pieceColor == null) result.king += 0.5;
                    else if (pieceColor == color) result.king -= 0.5;
                } else {
                    if (this.isThreated(pos, color)) {
                        result.king -= this.hasThreat(pos, color) ? 0.25 : 0.5;
                    }
                    else if (pieceColor == null) result.king -= 0.01;
                    else if (pieceColor == color) result.king += 0.05;
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
                for (const piece of pieces.values()) { piece.markThreats(this); }
            }

            let development = 0;
            let troupCount = 0;
            let troupDeveloped = 0;
            let pieceDeveloped = 0;
            let advancedPawn = 0;

            const isTroupDeveloped = (pos: Position, color: PieceColor) => color == 'White' ? pos[1] > 8 : pos[1] < 20;
            const isPieceDeveloped = (pos: Position, color: PieceColor) =>
                color == 'White' ? pos[1] > (pos[0] == 7 ? 6 : 3) : pos[1] < (pos[0] == 7 ? 22 : 25);

            for (const piece of pieces.values()) {
                if (piece.position != null) {
                    const defended = this.hasThreat(piece.position, color);
                    result.pieces[0] += piece.value;
                    if (piece.symbol === 'J') nOwnBishops++;
                    if (this.isThreated(piece.position, color)) {
                        threats -= defended ? piece.value * 0.75 : piece.value;
                    }
                    else if (defended) threats += 1 - piece.value * 0.0625; //=1/16
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
                                        } else if ((defended || !p2.hasOrthogonalAttack)) {
                                            threats += p2.value * 0.0625; //attack to p2 hindered by p1
                                        }
                                    }
                                    //waring! else cases: p1.value already counted other place
                                } else if (p1.value > piece.value) {
                                    threats += (p1.value - piece.value) * 0.25; //add attack for sure gain
                                } else if (p1.value < p2.value && !p1.hasOrthogonalAttack && p2.value > piece.value) {
                                    threats += p1.value * 0.25; //p1 pinned cause of attack to p2
                                }
                            }
                            if (isPieceDeveloped(piece.position, color)) pieceDeveloped += piece.value;
                        }
                        if (piece.hasDiagonalAttack) {
                            for (const [p1, p2] of diagonalXray(this, piece.position, color)) {
                                if (p1.color == color) {
                                    if (p1.value <= piece.value && piece.value < p2.value) {
                                        if (p1.hasDiagonalAttack) {
                                            //p2.value already counted other place
                                            threats += (p2.value - p1.value) * 0.25; //add attack for sure gain
                                        } else if ((defended || !p2.hasDiagonalAttack)) {
                                            threats += p2.value * 0.0625; //attack to p2 hindered by p1
                                        }
                                    }
                                    //waring! else cases: p1.value already counted other place
                                } else if (p1.value > piece.value) {
                                    threats += (p1.value - piece.value) * 0.25; //add attack for sure gain
                                } else if (p1.value < p2.value && !p1.hasDiagonalAttack && p2.value > piece.value) {
                                    threats += p1.value * 0.25; //p1 pinned cause of attack to p2
                                }
                            }
                            if (isPieceDeveloped(piece.position, color)) pieceDeveloped += piece.value;
                        } else if (cspty.isElephant(piece) || cspty.isAlmogaver(piece)) {
                            troupCount += piece.value;
                            if (isTroupDeveloped(piece.position, color)) troupDeveloped += piece.value;
                        } else if (cspty.isPawn(piece)) {
                            troupCount += piece.value;
                            if (piece.hasTripleStep(this.isGrand)) result.mobility += 0.01;
                            else if (isTroupDeveloped(piece.position, color)) {
                                troupDeveloped++;
                                if (defended) {
                                    troupDeveloped++;
                                    const pd = PositionHelper.promotionDistance(piece.position, color);
                                    if (pd < 14) {
                                        advancedPawn += (14 - PositionHelper.promotionDistance(piece.position, color)) << 1;
                                    }
                                }
                            }
                        }
                    } else {
                        //simplification of pin case: cant do any move
                        pin -= piece.value;
                        result.king -= defended ? 0.2 : 0.4;
                    }
                }
            }
            if (moveCount <= 12) {
                if (((troupCount - troupDeveloped) >> 1) > troupDeveloped) {
                    development = troupDeveloped - pieceDeveloped
                }
            }
            for (const piece of oponentPieces.values()) {
                if (piece.position != null) {
                    result.pieces[1] += piece.value;
                    if (piece.symbol === 'J') nOponentBishops++;
                    //be careful: Threated changed as hasThreat cause of color
                    if (this.hasThreat(piece.position, color)) threats += piece.value;
                    if (piece.pin != null) pin += piece.value;
                }
            }
            for (let i = 0; i <= 7; i++) {
                let enprise = oponentPositions[i] & ownThreats[i] & ~oponentThreats[i];
                let j = 0;
                while (enprise != 0) {
                    if ((enprise & 1) == 1) {
                        const colIndex = (i << 1) - ((j + 1) % 2) as ColumnIndex;
                        const piece = this.getPiece([colIndex, j as Line])!;
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
            if (nOwnBishops >= 2) result.pieces[0] += nOwnBishops == 3 ? 1 : 0.5;
            if (nOponentBishops >= 2) result.pieces[1] += nOponentBishops == 3 ? 1 : 0.5;
            result.space[0] = ownTotalHexes * 0.01;
            result.space[1] = oponentTotalHexes * 0.01;
            result.positioning = (ownCentralHexes - oponentCentralHexes + threats + pin + development + advancedPawn) * 0.01 + enpriseTotal * 0.125;
        }
        return result;
    }

    private clearThreats(color: PieceColor) {
        const threats = (color == "White" ? this.wThreats : this.bThreats);
        for (let i = 0; i <= 7; i++) threats[i] = 0;
    }

    private clearPins(color: PieceColor) {
        for (const piece of (color == "White" ? this.wPieces.values() : this.bPieces.values())) piece.pin = null;
    }

}

export class Game extends Board {

    public static kingCastlingPosition(color: PieceColor, column: CastlingColumn): Position {
        const kingPosition = (color == 'White' ? PositionHelper.whiteKingInitPosition : PositionHelper.blackKingInitPosition);
        const kingCastleMove = (color == 'White' ? Game.whiteKingCastleMove : Game.blackKingCastleMove)[column];
        return PositionHelper.knightJump(kingPosition, kingCastleMove)!;
    }

    private static createPiece(pieceName: PieceName, color: PieceColor): Piece
    private static createPiece(pieceName: PieceName, color: PieceColor, columnIndex: ColumnIndex, line: Line): Piece
    private static createPiece(pieceName: PieceName, color: PieceColor, columnIndex?: ColumnIndex, line?: Line): Piece {
        if (columnIndex != null && line != null) {
            const column = cscnv.columnFromIndex(columnIndex);
            switch (pieceName) {
                case "K": throw new Error("King must be created before setting it on the board (without position)");
                case "D": return new Queen(color, column, line);
                case "V": return new Wyvern(color, column, line);
                case "R": return new Rook(color, column, line);
                case "G": return new Pegasus(color, column, line);
                case "N": return new Knight(color, column, line);
                case "J": return new Bishop(color, column, line);
                case "E": return new Elephant(color, column, line);
                case "M": return new Almogaver(color, column, line);
                case "P": return new Pawn(color, column, line);
                default: {
                    const exhaustiveCheck: never = pieceName;
                    throw new Error(exhaustiveCheck);
                }
            }
        } else {
            switch (pieceName) {
                case "K": return new King(color);
                case "D": return new Queen(color);
                case "V": return new Wyvern(color);
                case "R": return new Rook(color);
                case "G": return new Pegasus(color);
                case "N": return new Knight(color);
                case "J": throw new Error("Bishop needs position or HexColor to be created");
                case "E": return new Elephant(color);
                case "M": return new Almogaver(color);
                case "P": return new Pawn(color);
                default: {
                    const exhaustiveCheck: never = pieceName;
                    throw new Error(exhaustiveCheck);
                }
            }
        }
    }

    private static convertPieceAliases(pieceSymbol: string): PieceName {
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
                if (csty.isPieceName(pieceSymbol)) return pieceSymbol as PieceName;
                else throw new TypeError(`Invalid piece symbol ${pieceSymbol}`);
            }
        }
    }

    private static fillDefaultPositions(grand: boolean = false): Piece[] {
        const pieces: Piece[] = [];
        pieces.push(new Queen("White", 'E', 1), new Wyvern("White", 'F', 0));
        pieces.push(new Pegasus("White", 'D', 2), new Bishop("White", 'F', 2), new Pegasus("White", 'H', 2));
        if (grand) {
            pieces.push(new Pawn("White", 'B', 6), new Rook("White", 'B', 4), new Knight("White", 'C', 3));
            pieces.push(new Knight("White", 'I', 3), new Rook("White", 'K', 4), new Pawn("White", 'K', 6));
            pieces.push(new Pawn("White", 'P', 7), new Pawn("White", 'T', 8), new Pawn("White", 'X', 8), new Pawn("White", 'Z', 7))
            pieces.push(new Almogaver("White", 'C', 7), new Almogaver("White", 'A', 7), new Almogaver("White", 'L', 7), new Almogaver("White", 'I', 7));
        } else {
            pieces.push(new Pawn("White", 'B', 4), new Rook("White", 'C', 3), new Rook("White", 'I', 3), new Pawn("White", 'K', 4));
        }
        pieces.push(new Knight("White", 'E', 3), new Knight("White", 'G', 3));
        pieces.push(new Elephant("White", 'D', 4), new Bishop("White", 'F', 4), new Elephant("White", 'H', 4));
        pieces.push(new Pawn("White", 'A', 5), new Pawn("White", 'C', 5), new Elephant("White", 'E', 5), new Elephant("White", 'G', 5), new Pawn("White", 'I', 5), new Pawn("White", 'L', 5));
        pieces.push(new Pawn("White", 'D', 6), new Bishop("White", 'F', 6), new Pawn("White", 'H', 6));
        pieces.push(new Pawn("White", 'E', 7), new Pawn("White", 'F', 8), new Pawn("White", 'G', 7));
        pieces.push(new Queen("Black", 'E', 27), new Wyvern("Black", 'F', 28));
        pieces.push(new Pegasus("Black", 'D', 26), new Bishop("Black", 'F', 26), new Pegasus("Black", 'H', 26));
        if (grand) {
            pieces.push(new Pawn("Black", 'B', 22), new Rook("Black", 'B', 24), new Knight("Black", 'C', 25));
            pieces.push(new Knight("Black", 'I', 25), new Rook("Black", 'K', 24), new Pawn("Black", 'K', 22));
            pieces.push(new Pawn("Black", 'P', 21), new Pawn("Black", 'T', 20), new Pawn("Black", 'X', 20), new Pawn("Black", 'Z', 21))
            pieces.push(new Almogaver("Black", 'C', 21), new Almogaver("Black", 'A', 21), new Almogaver("Black", 'I', 21), new Almogaver("Black", 'L', 21));
        } else {
            pieces.push(new Pawn("Black", 'B', 24), new Rook("Black", 'C', 25), new Rook("Black", 'I', 25), new Pawn("Black", 'K', 24));
        }
        pieces.push(new Knight("Black", 'E', 25), new Knight("Black", 'G', 25));
        pieces.push(new Elephant("Black", 'D', 24), new Bishop("Black", 'F', 24), new Elephant("Black", 'H', 24));
        pieces.push(new Pawn("Black", 'A', 23), new Pawn("Black", 'C', 23), new Elephant("Black", 'E', 23), new Elephant("Black", 'G', 23), new Pawn("Black", 'I', 23), new Pawn("Black", 'L', 23));
        pieces.push(new Pawn("Black", 'D', 22), new Bishop("Black", 'F', 22), new Pawn("Black", 'H', 22));
        pieces.push(new Pawn("Black", 'E', 21), new Pawn("Black", 'F', 20), new Pawn("Black", 'G', 21));
        return pieces;
    };

    private static whiteKingCastleMove = {
        'I': "LineUp-FileUp",
        'H': "LineUp-ColumnUp",
        'F': "LineInvUp-ColumnUp",
        'E': "LineInvUp-FileInvUp",
        'D': "TransversalLineDec-FileInvUp"
    } as const;
    private static blackKingCastleMove = {
        'I': "LineDown-FileDown",
        'H': "LineDown-ColumnDown",
        'F': "LineInvDown-ColumnDown",
        'E': "LineInvDown-FileInvDown",
        'D': "TransversalLineDec-FileInvDown"
    } as const;

    private static rookCastleMove(kingDestinationColumn: Column, rookDestinationColumn: Column, color: PieceColor, side: 'K' | 'D', grand: boolean): OrthogonalDirection {
        if (side == 'K') {
            if (rookDestinationColumn == 'K')
                return grand ? (color == 'White' ? "ColumnUp" : "ColumnDown") : color == 'White' ? "FileUp" : "FileDown";
            else if (rookDestinationColumn == 'I')
                return grand ? (color == 'White' ? "FileInvDown" : "FileInvUp") : color == 'White' ? "ColumnUp" : "ColumnDown";
            else return color == 'White' ? "FileInvUp" : "FileInvDown";
        } else {
            if (rookDestinationColumn == 'E' && kingDestinationColumn == 'D') return color == 'White' ? "FileDown" : "FileUp"
            else return color == 'White' ? "FileUp" : "FileDown";
        }
    }

    private _moves: UndoStatus[] = [];
    private moveNumber: number;
    private halfmoveClock: number;
    private pawnMoved = false;
    private pieceCaptured = false;
    private _mate = false;
    private _stalemate = false;
    private _draw = false;
    private _resigned = false;
    private _enpassantCaptureCoordString: Nullable<string> = null;
    private _lastMove: string = "";

    constructor(grand: boolean = false, restoreStatusTLPD?: string) {
        const restoreStatus: Nullable<string[]> = restoreStatusTLPD?.split(" ");
        const turn: Turn = restoreStatus?.[1] != null && (restoreStatus[1] == 'w' || restoreStatus[1] == 'b') ? restoreStatus[1] as Turn : 'w';
        super(grand, turn);
        if (restoreStatusTLPD === undefined) {
            this.wKing.setToInitialPosition(); this.addPiece(this.wKing);
            this.bKing.setToInitialPosition(); this.addPiece(this.bKing);
            const pieces = Game.fillDefaultPositions(grand);
            for (const piece of pieces) { this.addPiece(piece); }
            this.halfmoveClock = 0;
            this.moveNumber = 1;
        }
        else if (restoreStatus != null && restoreStatus.length >= 2 && csty.isTurn(restoreStatus[1])) {
            const [wCastlingStatus, bCastlingStatus] = Board.splitCastlingStatus(restoreStatus[2]);
            this.restoreTLPDPositions(restoreStatus[0], wCastlingStatus, bCastlingStatus);
            this.halfmoveClock = csty.isNumber(Number(restoreStatus[4])) ? Number(restoreStatus[4]) : 0;
            if (isNaN(Number(restoreStatus[4]))) {
                if (restoreStatus[4] != null && restoreStatus[4] !== "-") throw new TypeError("Invalid halfmove clock value");
            }
            this.moveNumber = csty.isNumber(Number(restoreStatus[5])) ? Number(restoreStatus[5]) : 1;
            if (isNaN(Number(restoreStatus[5]))) {
                if (restoreStatus[5] != null && restoreStatus[5] !== "-") throw new TypeError("Invalid move number");
            }
            super.specialPawnCapture = PawnSpecialCaptureStatus.parse(this, restoreStatus[3]);
        } else throw new Error("Piece positions and turn are mandatory parts of the TLPD string");
        this.initGame();
    }

    public get gameEnd() { return this._mate || this._stalemate || this._draw || this._resigned; }
    public get mate() { return this._mate; }
    public get stalemate() { return this._stalemate; }
    public set draw(value: boolean) { this._draw = value; }
    public get draw() { return this._draw; }
    public set resign(value: boolean) { this._resigned = value; }
    public get resigned() { return this._resigned; }

    public moves(fromMove: number) { return Object.freeze(this._moves.slice(fromMove)); }
    public strMoves(): string {
        let result = [];
        for (let i = 0; i < this._moves.length; i += 2) {
            let move = csmv.fullMoveNotation(this._moves[i]);
            if (i < this._moves.length - 1) {
                move += ", " + csmv.fullMoveNotation(this._moves[i + 1]);
            }
            result.push(move);
        }
        return result.join("\n");
    }
    public get lastMove() { return this._lastMove; }
    public get preMoveHeuristic(): Heuristic { return this.currentHeuristic; }

    public get enPassantCaptureCoordString(): Nullable<string> {
        return this._enpassantCaptureCoordString;
    }

    public get resultString() {
        if (this.gameEnd) {
            if (this._mate || this._resigned) return this.turn == 'w' ? "0 - 3" : "3 - 0";
            else if (this._stalemate) return this.turn == 'w' ? "1 - 2" : "2 - 1";
            else if (this._draw) return "1 - 1";
            else throw new Error("End game exhaustiveCheck fail");
        } else return null;
    }

    public set resultString(value: Nullable<string>) {
        if (value != null && value.length > 0) {
            if (this.gameEnd) {
                if (value != this.resultString) throw new Error(`Incorrect end game value issued: ${value} correct value ${this.resultString}`);
            } else {
                switch (value) {
                    case "0 - 3": {
                        if (this.turn == 'w') this.resign = true;
                        else throw new Error(`Incorrect resign turn: ${value}`);
                        break;
                    }
                    case "3 - 0": {
                        if (this.turn == 'b') this.resign = true;
                        else throw new Error(`Incorrect resign turn: ${value}`);
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

    public get movesJSON() {
        return JSON.stringify(this._moves);
    }

    public restoreMovesJSON(moves: string) {
        this._moves = JSON.parse(moves) as UndoStatus[];
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


    //TODO: Try-catch must be on user interface 
    public doMove(fromHex: string, toHex: string, pieceName?: PieceName): void {
        try {
            const moveFrom = PositionHelper.parse(fromHex);
            const moveTo = PositionHelper.parse(toHex);
            const piece = this.getPiece(moveFrom);
            if (piece != null && (pieceName == undefined || piece.symbol == pieceName)) {
                assertCondition(piece.canMoveTo(this, moveTo),
                    `Piece ${piece.symbol} at ${piece.position?.toString()} move to ${moveTo.toString()}`);
                const move: Record<string, any> = {
                    piece: piece,
                    pos: moveFrom,
                    moveTo: moveTo
                };
                const capturedPiece = this.getPiece(moveTo);
                if (capturedPiece != null) {
                    assertCondition(piece.color != capturedPiece.color && piece.canCaptureOn(this, moveTo),
                        `Piece ${piece.symbol} at ${piece.position?.toString()} capture on ${moveTo.toString()}`)
                    const isScornfulCapture = cspty.isPawn(piece) && this.specialPawnCapture != null &&
                        this.specialPawnCapture.isScornfulCapturable() && this.specialPawnCapture.isScorned(piece, moveTo);
                    move.captured = capturedPiece;
                    move.special = isScornfulCapture ? moveTo : undefined;
                    this._enpassantCaptureCoordString = null;
                    this.pieceCaptured = true;
                } else if (cspty.isPawn(piece) && this.specialPawnCapture != null
                    && this.specialPawnCapture.isEnPassantCapturable()
                    && this.specialPawnCapture.isEnPassantCapture(moveTo, piece)) {
                    const enPassantCapture = this.specialPawnCapture.capturablePiece;
                    move.captured = enPassantCapture;
                    move.special = [enPassantCapture.position![0], enPassantCapture.position![1]];
                    this._enpassantCaptureCoordString = cscnv.columnFromIndex(enPassantCapture.position![0]) + enPassantCapture.position![1].toString();
                    this.pieceCaptured = true;
                } else {
                    this._enpassantCaptureCoordString = null;
                    this.pieceCaptured = false;
                }
                this.pawnMoved = piece.symbol == 'P';
                this.pushMove(move as MoveInfo);
            } else {
                console.log("empty piece at " + PositionHelper.toString(moveFrom));
                this._lastMove = "";
            }
        }
        catch (e) {
            console.log(fromHex, toHex, e);
        }
    }

    public doPromotePawn(moveFrom: Position, moveTo: Position, promoteTo: Piece): void
    public doPromotePawn(fromHex: string, toHex: string, promoteTo: PieceName): void
    public doPromotePawn(fromHex: string | Position, toHex: string | Position, promoteTo: PieceName | Piece) {
        try {
            const moveFrom = typeof (fromHex) === "string" ? PositionHelper.parse(fromHex) : fromHex;
            const moveTo = typeof (toHex) === "string" ? PositionHelper.parse(toHex) : toHex;
            const pawn = this.getPiece(moveFrom);
            if (pawn != null && cspty.isPawn(pawn)) {
                let piece;
                if (typeof (promoteTo) === "string") {
                    assertCondition(PositionHelper.isPromotionHex(moveTo, pawn.color), "Promotion hex");
                    const hexesColor = PositionHelper.hexColor(moveTo);
                    piece = this.currentRegainablePieces(hexesColor).find(
                        x => x.symbol == promoteTo && (!cspty.isBishop(x) || x.hexesColor == hexesColor));
                    assertNonNullish(piece, "promotion piece");
                } else piece = promoteTo;
                if (PositionHelper.equals(moveFrom, moveTo)) {
                    this.pieceCaptured = false;
                    this.pawnMoved = true;
                    this._lastMove = PositionHelper.toString(moveTo) + "=" + promoteTo;
                } else {
                    const movementText = this.movePieceTo(pawn, moveTo);
                    const fromHexString = typeof (fromHex) === "string" ? fromHex : PositionHelper.toString(moveFrom);
                    const toHexString = typeof (toHex) === "string" ? toHex : PositionHelper.toString(moveTo);
                    this.setLastMove(undefined, fromHexString, movementText, toHexString, piece.symbol);
                }
                super.promotePawn(pawn, piece);
                this.forwardingTurn();
            } else {
                console.log("empty piece or invalid for promotion at " + PositionHelper.toString(moveFrom));
                this._lastMove = "";
            }
        }
        catch (e) {
            console.log(e);
        }
    }

    private movePieceTo(piece: Piece, pos: Position): string {
        const isEnPassantCapture = cspty.isPawn(piece) && this.specialPawnCapture != null &&
            this.specialPawnCapture.isEnPassantCapturable() && this.specialPawnCapture.isEnPassantCapture(pos, piece);
        const capturedPiece = this.getPiece(pos) ?? (isEnPassantCapture ? this.specialPawnCapture!.capturablePiece : null);
        const isScornfulCapture = capturedPiece != null && cspty.isPawn(piece) && this.specialPawnCapture != null &&
            this.specialPawnCapture.isScornfulCapturable() && this.specialPawnCapture.isScorned(piece, pos);
        const isLongEnPassant = isEnPassantCapture && Math.abs(capturedPiece!.position![1] - pos[1]) > 2;
        this._enpassantCaptureCoordString = null;
        assertCondition(piece.canMoveTo(this, pos),
            `Piece ${piece.symbol} at ${piece.position?.toString()} move to ${pos.toString()}`);
        if (capturedPiece != null) {
            assertCondition(piece.color != capturedPiece.color && piece.canCaptureOn(this, pos),
                `Piece ${piece.symbol} at ${piece.position?.toString()} capture on ${pos.toString()}`)
            if (isEnPassantCapture) {
                this._enpassantCaptureCoordString = cscnv.columnFromIndex(capturedPiece.position![0]) + capturedPiece.position![1].toString();
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

    private castling(currentKing: King, kPos: Position, rook: Rook, rPos: Position, rook2?: Rook, r2Pos?: Position) {
        super.movePiece(currentKing, kPos[0], kPos[1]);
        super.movePiece(rook, rPos[0], rPos[1]);
        if (rook2 !== undefined && r2Pos != undefined) {
            super.movePiece(rook2, r2Pos[0], r2Pos[1]);
        }
        this.pieceCaptured = false;
        this.pawnMoved = false;
    }

    public doCastling(castlingMove: string, assertions = false) {
        if (assertions) {
            assertCondition(castlingMove.length >= 6 && castlingMove.length <= 8, "castling move string length");
            assertCondition(castlingMove[0] == 'K' && castlingMove[1] == 'R', "castling move string prefix");
        }
        const currentColor = this.turn == 'w' ? 'White' : 'Black';
        const currentKing = this.turn == 'w' ? this.wKing : this.bKing;
        const cmove = castlingMove.split("-");
        const side = cmove[0][2] == 'R' ? 'K' : cmove[0][2];
        const kCol = cmove[1][0] as CastlingColumn;
        const rCol = cmove[1][1] as Column;
        const rCol2 = cmove[1].length == 3 && cmove[1][2] != 'O' ? cmove[1][2] as Column : undefined;
        const singleStep = cmove[1].length > 3 ? false : cmove[1].length == 3 && cmove[1][2] == 'O' ? true : undefined;
        assertCondition(side == 'K' || side == 'D', `${side} must be King (K) side or Queen (D) side`);
        if (assertions) {
            assertCondition(csty.iscastlingColumn(kCol), `${kCol} must be a king castling column name`);
            assertCondition(csty.isColumn(rCol), `${rCol} must be a column name`);
        }
        const kPos = this.castlingKingPosition(kCol);
        const rPos = this.castlingRookPosition(kCol, rCol, side, singleStep);
        const rook = this.getPiece(side == 'K' ? PositionHelper.initialKingSideRookPosition(currentColor, this.isGrand)
            : PositionHelper.initialQueenSideRookPosition(currentColor, this.isGrand));
        assertNonNullish(kPos, "king castling position");
        assertNonNullish(rook, "castling rook piece");
        assertCondition(cspty.isRook(rook), "castling king rook");
        if (assertions) {
            assertCondition(!rook.moved && rook.canMoveTo(this, rPos, false), "castling king rook move");
        }
        if (rCol2 !== undefined) {
            const r2Pos = this.castlingRookPosition(kCol, rCol2, 'D', singleStep);
            const rook2 = this.getPiece(PositionHelper.initialQueenSideRookPosition(currentColor, this.isGrand));
            assertNonNullish(rook2, "double castling queen side rook");
            assertCondition(cspty.isRook(rook2), "castling queen rook");
            if (assertions) {
                assertCondition(!rook2.moved && rook2.canMoveTo(this, r2Pos, false), "castling queen rook move");
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

    public * pieceList() {
        for (const p of this.whitePieces()) yield p.uncapitalizedSymbolPositionString;
        for (const p of this.blackPieces()) yield p.uncapitalizedSymbolPositionString;
    }

    public * threatedPieceStringPositions() {
        const piecePositionsGenerator = this.turn == 'w' ? this.whitePiecePositions() : this.blackPiecePositions();
        const color = this.turn == 'w' ? 'White' : 'Black';
        for (const pos of piecePositionsGenerator) {
            if (this.isThreated(pos, color)) yield PositionHelper.toString(pos);
        }
    }

    public * ownThreatedPieceStringPositions() {
        const piecePositionsGenerator = this.turn == 'w' ? this.blackPiecePositions() : this.whitePiecePositions();
        const color = this.turn == 'w' ? 'Black' : 'White';
        for (const pos of piecePositionsGenerator) {
            if (this.isThreated(pos, color)) yield PositionHelper.toString(pos);
        }
    }

    public * castlingMoves(color: PieceColor, kingFinalPos: Position) {
        //TODO
    }

    public * castlingStrMoves(color: PieceColor, kingFinalPos: Position): Generator<string, void, void> {
        const qRookPos: Position = PositionHelper.initialQueenSideRookPosition(color, this.isGrand);
        const kRookPos: Position = PositionHelper.initialKingSideRookPosition(color, this.isGrand);
        const qRook: Nullable<Rook> = this.getPiece(qRookPos) as Nullable<Rook>;
        const kRook: Nullable<Rook> = this.getPiece(kRookPos) as Nullable<Rook>;
        if (kRook != null && !kRook.moved) {
            for (const d of cscnv.orthogonalDirections()) {
                const destPos = PositionHelper.orthogonalStep(kingFinalPos, d);
                if (destPos != null && kRook.canMoveTo(this, destPos, false)) {
                    let str = "KRK-" + cscnv.columnFromIndex(kingFinalPos[0]) + cscnv.columnFromIndex(destPos[0]);
                    //specific case
                    if (kingFinalPos[0] == 9 && destPos[0] == 10) {
                        const rookDesp = destPos[1] - kRookPos[1];
                        str += rookDesp == 2 || rookDesp == -2 ? "O" : "OO";
                    }
                    yield (str);
                    //double castling
                    if (qRook != null && !qRook.moved) {
                        let c: ColumnIndex;
                        let l: Line;
                        if (kingFinalPos[0] == destPos[0]) {
                            c = destPos[0] + 1 as ColumnIndex;
                            l = (kingFinalPos[1] > destPos[1] ? destPos[1] + 1 : kingFinalPos[1] + 1) as Line;
                            const rrPos = [c, l] as Position;
                            //only one of this positions is possible for a double castling, as are different files
                            let canMove: boolean;
                            canMove = qRook.canMoveTo(this, rrPos, false);
                            if (!canMove) {
                                rrPos[0] = destPos[0] - 1 as ColumnIndex;
                                canMove = qRook.canMoveTo(this, rrPos, false)
                            }
                            if (canMove) {
                                str = "KRR-" +
                                    cscnv.columnFromIndex(kingFinalPos[0]) +
                                    cscnv.columnFromIndex(destPos[0]) +
                                    cscnv.columnFromIndex(rrPos[0]);
                                yield str;
                            }
                        } else {
                            c = destPos[0];
                            l = (kingFinalPos[1] > destPos[1] ? destPos[1] + 2 : destPos[1] - 2) as Line;
                            const rrPos = [c, l] as Position;
                            if (qRook.canMoveTo(this, rrPos, false)) {
                                str = "KRR-" +
                                    cscnv.columnFromIndex(kingFinalPos[0]) +
                                    cscnv.columnFromIndex(destPos[0]) +
                                    cscnv.columnFromIndex(rrPos[0]);
                                yield str;
                            }
                            rrPos[0] = kingFinalPos[0];
                            rrPos[1] = (kingFinalPos[1] > destPos[1] ? kingFinalPos[1] - 2 : kingFinalPos[1] + 2) as Line;
                            if (qRook.canMoveTo(this, rrPos, false)) {
                                str = "KRR-" +
                                    cscnv.columnFromIndex(kingFinalPos[0]) +
                                    cscnv.columnFromIndex(destPos[0]) +
                                    cscnv.columnFromIndex(rrPos[0]);
                                yield str;
                            }
                        }
                    }
                }
            }
        }
        if (qRook != null && !qRook.moved) {
            for (const d of cscnv.orthogonalDirections()) {
                const destPos = PositionHelper.orthogonalStep(kingFinalPos, d);
                if (destPos != null && qRook.canMoveTo(this, destPos, false)) {
                    yield ("KRD-" + cscnv.columnFromIndex(kingFinalPos[0]) + cscnv.columnFromIndex(destPos[0]));
                }
            }
        }
    }

    public castlingKingPosition(column: CastlingColumn): Nullable<Position> {
        const currentKing = this.turn == 'w' ? this.wKing : this.bKing;
        assertCondition(csty.iscastlingColumn(column), `Column: ${column} has to be a king castling column`);
        if (currentKing.moved) return null;
        else {
            const pos: Position = Game.kingCastlingPosition(currentKing.color, column);
            if (this.hasPiece(pos) == null && !this.isThreated(pos, currentKing.color)) return pos;
            else return null;
        }
    }

    public castlingRookPosition(kingColumn: CastlingColumn, rookColumn: Column, side: 'K' | 'D', singleStep?: boolean) {
        const currentColor = this.turn == 'w' ? 'White' : 'Black';
        const rookPos: Position = side == 'K' ? PositionHelper.initialKingSideRookPosition(currentColor, this.isGrand)
            : PositionHelper.initialQueenSideRookPosition(currentColor, this.isGrand);
        assertCondition(csty.iscastlingColumn(kingColumn), `King column: ${kingColumn} has to be a king castling column`);
        const dir = Game.rookCastleMove(kingColumn, rookColumn, currentColor, side, this.isGrand);
        let pos = PositionHelper.orthogonalStep(rookPos, dir)!;
        if (dir == "ColumnUp" || dir == "ColumnDown") {
            if (singleStep === undefined && !this.isGrand || singleStep !== undefined && !singleStep) {
                pos = PositionHelper.orthogonalStep(pos!, dir)!;
            }
            return pos;
        } else {
            const rookColumnIndex = cscnv.toColumnIndex(rookColumn);
            while (pos[0] != rookColumnIndex) {
                pos = PositionHelper.orthogonalStep(pos, dir)!;
            }
            return pos;
        }
    }

    public playerCastlingPositionStatus(column: CastlingColumn): Nullable<[Position, '' | 'occupied' | 'threated']> {
        const currentKing = this.turn == 'w' ? this.wKing : this.bKing;
        assertCondition(csty.iscastlingColumn(column), `Column: ${column} has to be a king castling column`);
        if (currentKing.moved) return null;
        else {
            const kingCastleMove: KnightDirection = (this.turn == 'w' ? Game.whiteKingCastleMove : Game.blackKingCastleMove)[column];
            const pos: Position = PositionHelper.knightJump(currentKing.position!, kingCastleMove)!;
            return [pos,
                this.hasPiece(pos) != null ? 'occupied' : this.isThreated(pos, currentKing.color) ? 'threated' : ""];
        }
    }

    private get castlingStatus(): string {
        const w = this.wKing.getCastlingStatus(this);
        const b = this.bKing.getCastlingStatus(this).toLowerCase();
        if (w == "-" && b == "-") return "-";
        else if (w == "-") return b;
        else if (b == "-") return w;
        else return w + b;
    }

    public playerCastlingStatus(): CastlingStatus {
        const currentKing = this.turn == 'w' ? this.wKing : this.bKing;
        return currentKing.getCastlingStatus(this);
    }

    public get valueTLPD(): string {
        return this.piecePositionsTLPD + " " + this.turn + " " + this.castlingStatus
            + " " + (this.specialPawnCapture?.toString() ?? "-")
            + " " + this.halfmoveClock.toString() + " " + this.moveNumber.toString();
    }

    private get piecePositionsTLPD(): string {
        let r: string = "/";
        for (let i = 28; i >= 0; i--) {
            const isEven = i % 2 == 0;
            const firstColumnIndex = i <= 5 ? 7 - i : (i >= 23 ? i - 21 : isEven ? 1 : 0);
            const lastColumnIndex = i <= 5 ? i + 7 : (i >= 23 ? 35 - i : isEven ? 13 : 14);
            let kStr = "";
            let e = 0;
            for (let k = firstColumnIndex; k <= lastColumnIndex; k += 2) {
                const piece = this.getPiece([k as ColumnIndex, i as Line]);
                if (piece != null) {
                    if (e > 0) kStr += e.toString();
                    kStr += piece.uncapitalizedSymbol;
                    e = 0;
                } else e++;
            }
            if (kStr.length > 0) {
                r += i.toString() + ":" + kStr;
                if (e > 0) r += e.toString();
                r += "/";
            }
        }
        return r;
    }

    public loadTLPD(restoreStatusTLPD: string): boolean {
        if (restoreStatusTLPD == null || restoreStatusTLPD.trim().length <= 10) return false;
        else try {
            const restoreStatus: string[] = restoreStatusTLPD.split(" ");
            if (restoreStatus.length >= 2 && restoreStatus[0].length >= 10 && csty.isTurn(restoreStatus[1])) {
                const turn: Turn = restoreStatus[1] as Turn;
                super.resetGame(turn);
                this._moves.length = 0;
                const [wCastlingStatus, bCastlingStatus] = Board.splitCastlingStatus(restoreStatus[2]);
                this.restoreTLPDPositions(restoreStatus[0], wCastlingStatus, bCastlingStatus);
                this.halfmoveClock = csty.isNumber(Number(restoreStatus[4])) ? Number(restoreStatus[4]) : 0;
                if (isNaN(Number(restoreStatus[4]))) {
                    if (restoreStatus[4] != null && restoreStatus[4] !== "-") throw new TypeError("Invalid halfmove clock value");
                }
                this.moveNumber = csty.isNumber(Number(restoreStatus[5])) ? Number(restoreStatus[5]) : 1;
                if (isNaN(Number(restoreStatus[5]))) {
                    if (restoreStatus[5] != null && restoreStatus[5] !== "-") throw new TypeError("Invalid move number");
                }
                super.specialPawnCapture = PawnSpecialCaptureStatus.parse(this, restoreStatus[3]);
                this.initGame();
                return true;
            }
            else return false;
        } catch (error) {
            console.log(error);
            return false;
        }
    }

    private restoreTLPDPositions(positions: string, wCastlingStatus: CastlingStatus, bCastlingStatus: CastlingStatus): void {
        assertCondition(positions.length >= 10 && positions[0] == '/' && positions[positions.length - 1] == '/',
            `Valid TLPD string positions: ${positions}`);
        const rooks: Rook[] = [];
        const wPiece: Piece[] = [];
        const bPiece: Piece[] = [];
        const piecePos: string[] = positions.split("/");
        this.wKing.captured();
        this.bKing.captured();
        for (let lineContent of piecePos) {
            if (lineContent.length > 0) {
                if (!lineContent.startsWith(':') && !lineContent.endsWith(':') && (lineContent.match(/:/g) || []).length == 1) {
                    const [strActualLine, content] = lineContent.split(":");
                    const actualLine = Number(strActualLine);
                    if (!isNaN(actualLine) && actualLine >= 0 && actualLine <= 28) {
                        const initialColumnIndex: number = (actualLine >= 0 && actualLine < 6) ?
                            7 - actualLine : actualLine <= 22 ? (actualLine % 2 == 0 ? 1 : 0) : actualLine - 21;
                        const finalColumnIndex: number = (actualLine >= 0 && actualLine < 6) ?
                            7 + actualLine : actualLine <= 22 ? (actualLine % 2 == 0 ? 13 : 14) : 35 - actualLine;

                        let actualColumnIndex = initialColumnIndex;
                        for (const pieceName of content) {
                            if (actualColumnIndex > finalColumnIndex) throw new Error("Incorrect TLPD line content");
                            else {
                                const value = Number(pieceName);
                                if (isNaN(value)) {
                                    const pieceSymbol = csty.isPieceName(pieceName) ? pieceName : Game.convertPieceAliases(pieceName.toUpperCase());
                                    const color: PieceColor = pieceName.toUpperCase() == pieceName ? "White" : "Black";
                                    if (pieceSymbol == 'K') {
                                        if (color == 'White') {
                                            if (this.wKing.position != null) throw new Error("Can't place two White Kings");
                                            else this.wKing.setPositionTo([actualColumnIndex as ColumnIndex, actualLine as Line]);
                                            if (this.hasPiece(this.wKing.position!) == null) this.addPiece(this.wKing);
                                            else throw new Error("Can't place White King on the place used by another piece");
                                        } else {
                                            if (this.bKing.position != null) throw new Error("Can't place two Black Kings");
                                            else this.bKing.setPositionTo([actualColumnIndex as ColumnIndex, actualLine as Line]);
                                            if (this.hasPiece(this.bKing.position!) == null) this.addPiece(this.bKing);
                                            else throw new Error("Can't place Black King on the place used by another piece");
                                        }
                                    } else {
                                        const newPiece = Game.createPiece(pieceSymbol, color, actualColumnIndex as ColumnIndex, actualLine as Line);
                                        if (cspty.isRook(newPiece)) rooks.push(newPiece);
                                        if (cspty.isPawn(newPiece) && newPiece.isAwaitingPromotion) super.isAwaitingPromotion = true;
                                        if (this.hasPiece(newPiece.position!) == null) {
                                            const pieceSet = (color == 'White' ? wPiece : bPiece);
                                            this.addPiece(newPiece);
                                            pieceSet.push(newPiece);
                                        }
                                        else throw new Error(`You cannot put a ${color} ${pieceSymbol} there` +
                                            ", because the hex is already in use; There may be a repeated line in the TLPD");
                                    }
                                    actualColumnIndex += 2;
                                }
                                else actualColumnIndex += value << 1;
                            }
                        }
                    } else throw new Error(`Incorrect line issued: ${strActualLine}`);
                } else throw new Error(`Incorrect line number issued: ${lineContent}`);
            }
        }
        if (this.wKing.position == null) throw new Error("There must be a White King");
        if (this.bKing.position == null) throw new Error("There must be a Black King");
        {
            const countOccurrences = (arr: Piece[], val: PieceName) => arr.reduce((n, v) => (v.symbol === val ? n + 1 : n), 0);
            for (let color of ['White', 'Black'] as PieceColor[]) {
                const pieceSet = (color == 'White' ? wPiece : bPiece);
                let n = countOccurrences(pieceSet, 'D');
                if (n > 1) throw new Error(`Too many ${color} Queens`);
                else if (n == 0) this.addRegainablePiece(Game.createPiece("D", color));
                n = countOccurrences(pieceSet, 'V');
                if (n > 1) throw new Error(`Too many ${color} Wyverns`);
                else if (n == 0) this.addRegainablePiece(Game.createPiece("V", color));
                n = countOccurrences(pieceSet, 'R');
                if (n > 2) throw new Error(`Too many ${color} Rooks`);
                else {
                    while (n < 2) {
                        this.addRegainablePiece(Game.createPiece("R", color));
                        n++;
                    }
                }
                n = countOccurrences(pieceSet, 'G');
                if (n > 2) throw new Error(`Too many ${color} Pegasus`);
                else {
                    while (n < 2) {
                        this.addRegainablePiece(Game.createPiece("G", color));
                        n++;
                    }
                }
                n = countOccurrences(pieceSet, 'N');
                if (n > 2) throw new Error(`Too many ${color} Knights`);
                else {
                    while (n < 2) {
                        this.addRegainablePiece(Game.createPiece("N", color));
                        n++;
                    }
                }
                n = countOccurrences(pieceSet, 'J');
                if (n > 3) throw new Error(`Too many ${color} Bishops`);
                else {
                    let count = { "White": 0, "Black": 0, "Color": 0 };
                    for (const element of pieceSet.filter((value) => cspty.isBishop(value))) {
                        count[(element as Bishop).hexesColor] += 1;
                    }
                    if (count.White > 1 || count.Black > 1 || count.Color > 1)
                        throw new Error(`Too many ${color} Bishops on same color hexes`);
                    else {
                        if (count.White == 0) this.addRegainablePiece(new Bishop(color, "White"));
                        if (count.Black == 0) this.addRegainablePiece(new Bishop(color, "Black"));
                        if (count.Color == 0) this.addRegainablePiece(new Bishop(color, "Color"));
                    }
                }
            }
        }
        this.wKing.castlingStatus = wCastlingStatus;
        this.bKing.castlingStatus = bCastlingStatus;
        for (const r of rooks) { r.setCastlingStatus(r.color == "White" ? wCastlingStatus : bCastlingStatus, this.isGrand); }
    }

    private setLastMove(symbolPrefix: PieceName | undefined, fromHex: string, movement: string, toHex: string, promotionPostfix?: PieceName) {
        this._lastMove = (symbolPrefix ?? "") + fromHex + movement + toHex;
        if (promotionPostfix !== undefined) this._lastMove += "=" + promotionPostfix;
    }

    private forwardingTurn() {
        super.nextTurn();
        if (this.turn === 'w') this.moveNumber++;
        if (this.pawnMoved || this.pieceCaptured) this.halfmoveClock = 0;
        else this.halfmoveClock++;
        super.prepareCurrentTurn();
        const anyMove = super.isMoveableTurn();
        if (!anyMove) {
            if (this.checked) this._mate = true;
            else this._stalemate = true;
        } else if (this.halfmoveClock >= 100) this._draw = true;
        if (this.checked) {
            if (this._mate) this._lastMove += "#";
            else if (this.isKnightOrCloseCheck) this._lastMove += "^+";
            else if (this.isSingleCheck) this._lastMove += "+";
            else if (this.isDoubleCheck) this._lastMove += "++"
            else throw new Error("never: exhaused check options");
        }
        super.computeHeuristic(this.turn, this.moveNumber, anyMove, this.currentHeuristic);
    }

    private backwardingTurn(turnInfo: UndoStatus) {
        if (this.moveNumber > 0) {
            super.nextTurn(); //works anyway
            if (this.turn === 'b') this.moveNumber--;
            if (turnInfo.initHalfMoveClock === undefined) this.halfmoveClock--;
            else this.halfmoveClock = 0;
            super.prepareCurrentTurn();
            super.computeHeuristic(this.turn, this.moveNumber, true, this.currentHeuristic);
        }
    }

    private initGame() {
        super.prepareGame();
        this._mate = false; this._stalemate = false;
        this._resigned = false; this._draw = false;
        const anyMove = super.isMoveableTurn();
        if (!anyMove) {
            if (this.checked) this._mate = true;
            else this._stalemate = true;
        } else if (this.halfmoveClock >= 100) this._draw = true;
        this._lastMove = "";
        super.computeHeuristic(this.turn, this.moveNumber, anyMove, this.currentHeuristic);
    }

    //Draft
    //////////////////////////////////////////////////////

    private pushMove(move: MoveInfo) {
        const turnInfo: UndoStatus = {
            n: this.moveNumber,
            turn: this.turn,
            move: move,
            initHalfMoveClock: this.halfmoveClock == 0 ? 1 : undefined,
            specialPawnCapture: this.specialPawnCapture == null ? undefined : this.specialPawnCapture.toString(),
            castlingStatus: (csmv.isMoveInfo(move) && ['K', 'R'].indexOf(move.piece.symbol) >= 0) ?
                this.playerCastlingStatus() : undefined,
            end: undefined,
            check: undefined
        };
        this.applyMove(move);
        super.nextTurn();
        if (this.turn === 'w') this.moveNumber++;
        if (csmv.isMoveInfo(move) && move.piece.symbol == 'P' || csmv.isCaptureInfo(move) || csmv.isPromotionInfo(move))
            this.halfmoveClock = 0;
        else this.halfmoveClock++;
        super.prepareCurrentTurn();
        const anyMove = super.isMoveableTurn();
        if (!anyMove) {
            if (this.checked) { this._mate = true; turnInfo.end = "mate"; }
            else { this._stalemate = true; turnInfo.end = "stalemate"; }
        } else if (this.halfmoveClock >= 100) {
            this._draw = true; turnInfo.end = "draw";
        } else if (this.checked) {
            if (this.isKnightOrCloseCheck) turnInfo.check = "^+";
            else if (this.isSingleCheck) turnInfo.check = "+";
            else if (this.isDoubleCheck) turnInfo.check += "++"
            else throw new Error("never: exhaused check options");
        }
        this._moves.push(turnInfo);
        super.computeHeuristic(this.turn, this.moveNumber, anyMove, this.currentHeuristic);
        this._lastMove = csmv.moveNotation(move);
    }

    private popMove() {
        if (this._moves.length > 0) {
            const turnInfo: UndoStatus = this._moves.pop()!;
            super.nextTurn(); //works anyway
            this._draw = false; this._resigned = false;
            this._mate = false; this._stalemate = false;
            this.undoMove(turnInfo.move, this.turn == 'w' ? 'White' : 'Black');
            if (turnInfo.castlingStatus != undefined && csmv.isMoveInfo(turnInfo.move)) {
                if (turnInfo.move.piece.symbol == 'R') (turnInfo.move.piece as Rook).setCastlingStatus(turnInfo.castlingStatus, this.isGrand);
                else if (turnInfo.move.piece.symbol == 'K') (turnInfo.move.piece as King).castlingStatus = turnInfo.castlingStatus;
            }
            if (turnInfo.specialPawnCapture === undefined) this.specialPawnCapture = null;
            else this.specialPawnCapture = PawnSpecialCaptureStatus.parse(this, turnInfo.specialPawnCapture);
            //backwarding turn
            if (this.turn === 'b') this.moveNumber--;
            if (turnInfo.initHalfMoveClock === undefined) this.halfmoveClock--;
            else this.halfmoveClock = 0;
            super.prepareCurrentTurn();
            super.computeHeuristic(this.turn, this.moveNumber, true, this.currentHeuristic);
            this._lastMove = csmv.moveNotation(turnInfo.move);
        }
    }

    private applyMove(move: MoveInfo) {
        if (csmv.isCastlingInfo(move)) this.doCastling(csmv.moveNotation(move));
        else {
            const piece = move.piece;
            const pos = piece.position!;
            if (csmv.isMoveInfo(move)) {
                const dest = move.moveTo;
                if (csmv.isCaptureInfo(move)) {
                    super.capturePiece(move.captured);
                }
                super.movePiece(piece, dest[0], dest[1]);
                if (csmv.isPromotionInfo(move)) {
                    super.promotePawn(piece as Pawn, move.promoted);
                }
            } else {
                super.promotePawn(piece as Pawn, move.promoted);
                this.pieceCaptured = false;
                this.pawnMoved = true;
            }
        }
    }

    private undoMove(move: MoveInfo, moveTurn: PieceColor) {
        if (csmv.isCastlingInfo(move)) this.undoCastling(csmv.moveNotation(move), moveTurn);
        else if (csmv.isMoveInfo(move)) {
            if (csmv.isPromotionInfo(move)) super.undoPromotePawn(move.piece as Pawn, move.promoted);
            super.undoPieceMove(move.piece, move.moveTo[0], move.moveTo[1]);
            if (csmv.isCaptureInfo(move)) {
                const pos = move.special === undefined ? move.moveTo : move.special;
                super.undoCapturePiece(move.captured, pos[0], pos[1]);
            }
        } else super.undoPromotePawn(move.piece as Pawn, move.promoted);
    }

    private undoCastling(castling: string, color: PieceColor) {
        const firstValue = (gen: Generator<Piece, void, void>) => {
            for (const p of gen) return p;
        }
        const isGrand = this.isGrand;
        const side = castling[2] as CastlingSide;
        const column = castling[4] as CastlingColumn;
        const rColumn = cscnv.toColumnIndex(castling[5] as Column);
        const currentKing = color == 'White' ? this.wKing : this.bKing;
        const kingInitialPos = color == 'White' ? PositionHelper.whiteKingInitPosition : PositionHelper.blackKingInitPosition;
        const rookInitialPos = side == 'D' ?
            PositionHelper.initialQueenSideRookPosition(color, isGrand)
            : PositionHelper.initialKingSideRookPosition(color, isGrand);
        const pieces = color == 'White' ? this.whitePiecesFulfil : this.blackPiecesFulfil;
        const rook = firstValue(pieces(p => cspty.isRook(p) && p.position != null && p.position[0] == rColumn
            && PositionHelper.isOrthogonally(p.position, rookInitialPos) != null)) as Rook;
        super.undoPieceMove(currentKing, kingInitialPos[0], kingInitialPos[1]);
        super.undoPieceMove(rook!, rookInitialPos[0], rookInitialPos[1]);
        currentKing.castlingStatus = "RKR";
        rook.setCastlingStatus("RKR", isGrand);
        if (side == 'R') {
            const r2Column = cscnv.toColumnIndex(castling[6] as Column);
            const r2InitialPos = PositionHelper.initialQueenSideRookPosition(color, isGrand);
            const rook2 = firstValue(pieces(p => cspty.isRook(p) && p.position != null && p.position[0] == r2Column
                && PositionHelper.isOrthogonally(p.position, r2InitialPos) != null)) as Rook;
            super.undoPieceMove(rook2!, r2InitialPos[0], r2InitialPos[1]);
            rook2.setCastlingStatus("RKR", isGrand);
        }
    }

    public applyMoveSq(sq: string) {
        const lines = sq.split(/\r?\n/);
        for (let i = 0; i < lines.length; i++) {
            const parts = lines[i].split(/[.,]\s?/);
            assertCondition(parts.length > 1, "numbered plays");
            this.applyStringMove(parts[1]);
            if (i < lines.length - 1) {
                assertCondition(parts.length == 3, "both players on each numbered play");
                this.applyStringMove(parts[2]);
            } else if (parts.length == 3) {
                this.applyStringMove(parts[2]);
            }
        }
    }

    //TODO: always assertions when string parameters (call from user interface)
    public applyStringMove(mov: string, assertions: boolean = false) {
        const separatorIndex = (mov: string, ini: number = 0) => {
            let i = ini;
            while (i < mov.length) {
                const code = mov.charCodeAt(i);
                if (code >= 48 && code < 58 || code >= 65 && code < 91 || code >= 97 && code < 123) i++;
                else return i;
            }
            return i;
        }
        const isHexPosition = (hex: string) => {
            return PositionHelper.isValidPosition(PositionHelper.parse(hex));
        }

        if (assertions) assertCondition(mov.length >= 4, "Moviment length must be at least of 4 chars");
        if (mov.startsWith("KR") && (mov[3] == '-' || mov[3] == '–')) {
            const castlingString = mov[3] == '–' ? mov.replace('–', '-') : mov;
            if (!assertions
                || !this.isGrand && csty.isCastlingString(castlingString)
                || this.isGrand && csty.isGrandCastlingString(castlingString)) {
                this.doCastling(castlingString, assertions);
            } else throw new Error(`never: incorrect castling move: ${castlingString}`);
        } else {
            const sepIx = separatorIndex(mov);
            const movePiece: PieceName = csty.isPieceName(mov[0]) && csty.isColumn(mov[1]) ? mov[0] : 'P';
            const fromHexPos: string = mov.slice(movePiece == 'P' ? 0 : 1, sepIx);
            if (assertions) {
                assertCondition(sepIx < mov.length - 1, "Moviment divided into parts");
                assertCondition(isHexPosition(fromHexPos), "Initial hex");
            }
            const separator = mov.charAt(sepIx) == '@' && mov.charAt(sepIx + 1) == '@' ? '@@' : mov.charAt(sepIx);
            if (separator == '=') {
                const promotionPiece: PieceName = mov[sepIx + 1] as PieceName;
                if (assertions) assertCondition(movePiece == 'P', "Promoting a pawn");
                this.doPromotePawn(fromHexPos, fromHexPos, promotionPiece!);
            }
            else {
                if (assertions) {
                    assertCondition(sepIx < mov.length - 2, "Movement destination");
                }
                const toIx = sepIx + separator.length;
                const toEndIx = separatorIndex(mov, toIx);
                const capturedPiece: Nullable<PieceName> =
                    csty.isPieceName(mov[toIx]) && csty.isColumn(mov[toIx + 1]) ? mov[toIx] as PieceName : undefined;
                const toHexPos = mov.slice(capturedPiece === undefined ? toIx : toIx + 1, toEndIx);
                if (assertions) {
                    assertCondition(isHexPosition(toHexPos), "Destination hex");
                    assertCondition(capturedPiece === undefined || (separator != '-' && separator != '–'), "Captured piece")
                }
                if (toEndIx < mov.length && mov[toEndIx] == '=') {
                    const promotionPiece: PieceName = mov[toEndIx + 1] as PieceName;
                    if (assertions) assertCondition(movePiece == 'P', "Promoting a pawn");
                    this.doPromotePawn(fromHexPos, toHexPos, promotionPiece!);
                }
                else this.doMove(fromHexPos, toHexPos, movePiece);
            }
        }
    }


}


