import type { Nullable } from "./ts.general";
import type {
    Column, ColumnIndex, Line, Position,
    OrthogonalDirection, KnightDirection,
    ScornfulCaptureDirection,
    Turn, HexColor, PieceName, PieceColor, CastlingStatus,
    CastlingColumn,
    CastlingString,
    GrandCastlingString,
    PieceKey, EndGame, CheckNotation
} from "./cescacs.types";

import { assertNonNullish, assertCondition, isNotNullNorEmpty, round2hundredths } from "./ts.general";
import { csTypes as csty, csConvert as cscnv } from "./cescacs.types";
import { csPieceTypes as cspty } from "./cescacs.piece";
import { PositionHelper } from "./cescacs.positionHelper";
import {
    IBoard, Piece, IPawnSpecialCaptureStatus, IScornfulCapturable, IEnPassantCapturable,
    King, Queen, Wyvern, Rook, Pegasus, Knight, Bishop, Elephant, Almogaver, Pawn
} from "./cescacs.piece";
import { UndoStatus, MoveInfo, CastlingSide, UndoStatusWhithCheckInfo } from "./cescacs.moves";
import { csMoves as csmv } from "./cescacs.moves"

export { PositionHelper, cspty, csmv, round2hundredths };

export type Heuristic = {
    readonly pieces: [number, number],
    readonly space: [number, number],
    positioning: number,
    mobility: number,
    king: number
}

//#region PawnSpecialCapture classes

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
    public isEnPassantCapture(pos: Position, capturerPawn: Pawn | Almogaver): boolean
    public isEnPassantCapture(pos: Position, capturerPawn?: Pawn | Almogaver): boolean {
        const isEnPassantCapturePos = this._captureTo.some(x => PositionHelper.equals(x, pos));
        if (capturerPawn == null) return isEnPassantCapturePos;
        else if (isEnPassantCapturePos && capturerPawn.position != null) {
            const capturerPos = capturerPawn.position;
            if (cspty.isPawn(capturerPawn)) {
                if (Math.abs(pos[0] - capturerPos[0]) == 1) {
                    if (capturerPawn.color == 'w') return pos[1] - capturerPos[1] == 3;
                    else return capturerPos[1] - pos[1] == 3;
                } else return false;
            } else return PositionHelper.isDiagonally(pos, capturerPos) != null;
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

//#endregion

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
    private readonly pieces = new Map<string, Piece>();
    private readonly wPieces = new Map<string, Piece>();
    private readonly bPieces = new Map<string, Piece>();
    private readonly _regainablePieces: Piece[] = [];
    public readonly wKing: King = new King('w');
    public readonly bKing: King = new King('b');
    private _specialPawnCapture: Nullable<PawnSpecialCaptureStatus> = null;
    private _currentHeuristic: Heuristic = Board.newHeuristic();
    private _wAwaitingPromotion: boolean = false;
    private _bAwaitingPromotion: boolean = false;
    private _turn: Turn;

    constructor(grand: boolean)
    constructor(grand: boolean, turn: Turn)
    constructor(readonly isGrand: boolean, turn?: Turn) {
        this._turn = turn ?? 'w';
        this.pieces.set(this.wKing.key, this.wKing);
        this.pieces.set(this.bKing.key, this.bKing);
    }

    public get turn(): Turn { return this._turn; }

    protected get turnKing(): King { return (this.turn === 'w' ? this.wKing : this.bKing); }
    protected get checked(): boolean { return this.turnKing.checked; }
    protected get isKnightOrCloseCheck(): boolean { return this.turnKing.isKnightOrCloseCheck(); }
    protected get isSingleCheck(): boolean { return this.turnKing.isSingleCheck(); }
    protected get isDoubleCheck(): boolean { return this.turnKing.isDoubleCheck(); }

    public pieceByKey(key: PieceKey): Piece {
        const piece = this.pieces.get(key); assertNonNullish(piece, "piece from unique key"); return piece;
    }
    public get specialPawnCapture(): Nullable<PawnSpecialCaptureStatus> { return this._specialPawnCapture; }
    protected set specialPawnCapture(value: Nullable<PawnSpecialCaptureStatus>) { this._specialPawnCapture = value; }

    public get isAwaitingPromotion() { return this._turn == 'w' ? this._wAwaitingPromotion : this._bAwaitingPromotion; }
    protected setAwaitingPromotion(color: PieceColor) {
        if (color == 'w') this._wAwaitingPromotion = true; else this._bAwaitingPromotion = true;
    }
    protected computeAwaitingPromotion(color: PieceColor) {
        let value = false;
        for (const piece of (color == 'w' ? this.wPieces : this.bPieces).values()) { if (cspty.isPawn(piece) && piece.awaitingPromotion) { value = true; break; } }
        if (color == 'w') this._wAwaitingPromotion = value; else this._bAwaitingPromotion = value;
    }

    public get currentHeuristic() { return this._currentHeuristic; }

    public getHeuristicValue(h: Heuristic) {
        return round2hundredths(h.pieces[0] - h.pieces[1] + h.space[0] - h.space[1] + h.positioning + h.mobility + h.king);
    }

    protected createPiece(pieceName: PieceName, color: PieceColor, column: Column, line: Line): Piece {
        let piece: Piece;
        switch (pieceName) {
            //TODO: King creation exception
            case "K": throw new Error("King must be created before setting it on the board");
            case "D": piece = new Queen(color, column, line); break;
            case "V": piece = new Wyvern(color, column, line); break;
            case "R": piece = new Rook(color, this.isGrand, column, line); break;
            case "G": piece = new Pegasus(color, column, line); break;
            case "N": piece = new Knight(color, column, line); break;
            case "J": piece = new Bishop(color, column, line); break;
            case "E": piece = new Elephant(color, column, line); break;
            case "M": piece = new Almogaver(color, column, line); break;
            case "P": piece = new Pawn(color, column, line); break;
            default: {
                const exhaustiveCheck: never = pieceName;
                throw new Error(exhaustiveCheck);
            }
        }
        if (this.hasPiece(piece.position!) == null) {
            this.pieces.set(piece.key, piece);
            this.addPiece(piece);
        }
        else throw new Error(`You cannot put a ${color} ${piece.symbol} there` +
            ", because the hex is already in use; There may be a repeated line in the TLPD");
        return piece;
    }

    protected addPiece(piece: Piece) {
        assertNonNullish(piece.position, `${piece.symbol} position`);
        const toPos = piece.position;
        const pieces = (piece.color == "w" ? this.wPieces : this.bPieces);
        pieces.set(PositionHelper.positionKey(toPos), piece);
        const posCol = (toPos[0] + 1) >>> 1;
        const posLineMask = Board.lineMask(toPos[1]);
        const positions = (piece.color == "w" ? this.wPositions : this.bPositions);
        positions[posCol] |= posLineMask;
    }

    public hasPiece(pos: Position): Nullable<PieceColor> {
        const posCol = (pos[0] + 1) >>> 1;
        const posLineMask = Board.lineMask(pos[1]);
        if ((this.wPositions[posCol] & posLineMask) != 0) {
            return 'w';
        }
        else if ((this.bPositions[posCol] & posLineMask) != 0) {
            return 'b';
        } else return null;
    }

    public getPiece(pos: Position): Nullable<Piece> {
        const color = this.hasPiece(pos);
        if (color == null) return null;
        else if (color == 'w') {
            return this.wPieces.get(PositionHelper.positionKey(pos));
        } else {
            return this.bPieces.get(PositionHelper.positionKey(pos));
        }
    }

    public hasThreat(pos: Position, color: PieceColor): boolean {
        const posCol = (pos[0] + 1) >>> 1;
        return ((color == "w" ? this.wThreats : this.bThreats)[posCol] & Board.lineMask(pos[1])) != 0;
    }

    public isThreated(pos: Position, color: PieceColor): boolean {
        const posCol = (pos[0] + 1) >>> 1;
        return ((color == "w" ? this.bThreats : this.wThreats)[posCol] & Board.lineMask(pos[1])) != 0;
    }

    public setThreat(pos: Position, color: PieceColor): void {
        const posCol = (pos[0] + 1) >>> 1;
        (color == "w" ? this.wThreats : this.bThreats)[posCol] |= Board.lineMask(pos[1]);
    }

    //#region Regainable pieces

    protected addRegainablePiece(piece: Piece) {
        if (piece.position == null) {
            this._regainablePieces.push(piece);
            this.pieces.set(piece.key, piece);
        }
    }

    public hasRegainablePieces(hexColor: HexColor): boolean {
        const currentColor = this._turn;
        return this._regainablePieces.reduce(
            (found, p) => found || p.color == currentColor && (!cspty.isBishop(p) || p.hexesColor == hexColor), false);
    }

    public hasAwaitingRegainablePieces() {
        const currentColor = this._turn;
        if (this._regainablePieces.reduce((found, p) => found || p.color == currentColor && p.symbol != 'J', false))
            return true;
        else {
            const bishops = this._regainablePieces.filter(p => p.color == currentColor && p.symbol == 'J') as Bishop[];
            if (bishops.length == 0) return false;
            else {
                const pieces = this._turn == 'w' ? this.wPieces : this.bPieces;
                for (const piece of pieces.values()) {
                    if (cspty.isPawn(piece)) {
                        const awaitingPromotion = piece.awaitingPromotion;
                        if (awaitingPromotion != null && bishops.some(b => b.hexesColor == awaitingPromotion)) return true;
                    }
                }
                return false;
            }
        }
    }

    protected findRegeinablePiece(color: PieceColor, promoteTo: PieceName, hexColor: HexColor): Piece {
        const piece = this._regainablePieces.find(p => p.color == color && p.symbol == promoteTo && (!cspty.isBishop(p) || p.hexesColor == hexColor))
        assertNonNullish(piece, "retrieve the promoted piece");
        return piece;
    }

    public currentRegainablePieceNames(hexColor: HexColor): Set<PieceName> {
        const currentColor = this._turn;
        return this._regainablePieces.reduce((s: Set<PieceName>, x: Piece) =>
            x.color == currentColor && (!cspty.isBishop(x) || x.hexesColor == hexColor) ? s.add(x.symbol) : s,
            new Set<PieceName>());
    }

    public maxRegainablePiecesValue(hexColor: HexColor): number {
        const currentColor = this._turn;
        return this._regainablePieces.reduce((acc, x) =>
            x.value > acc && x.color == currentColor && (!cspty.isBishop(x) || x.hexesColor == hexColor) ? x.value : acc, 0);
    }

    //#endregion

    public * whitePieces() { for (const p of this.wPieces.values()) yield p; }
    public * blackPieces() { for (const p of this.bPieces.values()) yield p; }

    protected * whitePiecePositions() { for (const p of this.wPieces.values()) yield p.position!; }
    protected * blackPiecePositions() { for (const p of this.bPieces.values()) yield p.position!; }

    public * pieceMoves(piece: Piece): Generator<Position, void, void> {
        const currentKing = this.turnKing;
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

    protected movePiece(piece: Piece, toColumnIndex: ColumnIndex, toLine: Line) {
        assertNonNullish(piece.position, `${piece.symbol} position`);
        const piecePos = piece.position;
        const fromPosCol = (piecePos[0] + 1) >>> 1;
        const fromPosLineMask = Board.lineMask(piecePos[1]);
        const pieces = (piece.color == "w" ? this.wPieces : this.bPieces);
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
                if (piece.color == 'w') this._wAwaitingPromotion = true;
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
        const positions = (piece.color == "w" ? this.wPositions : this.bPositions);
        positions[fromPosCol] &= ~fromPosLineMask;
        positions[toPosCol] |= toPosLineMask;
    }

    protected undoPieceMove(piece: Piece, fromColumnIndex: ColumnIndex, fromLine: Line) {
        const pieces = (piece.color == "w" ? this.wPieces : this.bPieces);
        const piecePos = piece.position!;
        const actualPosCol = (piecePos[0] + 1) >>> 1;
        const actualPosLineMask = Board.lineMask(piecePos[1]);
        pieces.delete(PositionHelper.positionKey(piecePos));
        piece.moveTo(fromColumnIndex, fromLine); //piecePos updated
        pieces.set(PositionHelper.positionKey(piecePos), piece);
        const fromPosCol = (piecePos[0] + 1) >>> 1;
        const fromPosLineMask = Board.lineMask(piecePos[1]);
        const positions = (piece.color == "w" ? this.wPositions : this.bPositions);
        positions[actualPosCol] &= ~actualPosLineMask;
        positions[fromPosCol] |= fromPosLineMask;
    }

    protected capturePiece(piece: Piece) {
        assertNonNullish(piece.position, `${piece.symbol} position`);
        const fromPos = piece.position;
        const posCol = (fromPos[0] + 1) >>> 1;
        const posLineMask = Board.lineMask(fromPos[1]);
        const positions = (piece.color == "w" ? this.wPositions : this.bPositions);
        positions[posCol] &= ~posLineMask;
        const pieces = (piece.color == "w" ? this.wPieces : this.bPieces);
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

    protected promotePawn(pawn: Pawn, piece: Piece) {
        if (this._regainablePieces.includes(piece)) {
            const pieces = (piece.color == "w" ? this.wPieces : this.bPieces);
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
            if (piece.color == 'w') this._wAwaitingPromotion = false;
            else this._bAwaitingPromotion = false;
        }
    }

    protected undoPromotePawn(pawn: Pawn, piece: Piece) {
        const pieces = (piece.color == "w" ? this.wPieces : this.bPieces);
        pieces.delete(PositionHelper.positionKey(piece.position!));
        pawn.setPositionTo([piece.position![0], piece.position![1]]);
        piece.captured();
        this._regainablePieces.push(piece);
        pieces.set(PositionHelper.positionKey(pawn.position!), pawn);
    }

    protected nextTurn(): void {
        this._turn = this._turn === 'w' ? 'b' : 'w';
    }

    private prepareTurn(currentKing: King) {
        const color = currentKing.color;
        const threats = (color == "w" ? this.bThreats : this.wThreats);
        for (let i = 0; i <= 7; i++) threats[i] = 0;
        {
            const threatingPieces = (color == 'w' ? this.bPieces.values() : this.wPieces.values());
            for (const piece of threatingPieces) piece.markThreats(this);
        }
        {
            const ownPieces = (color == "w" ? this.wPieces.values() : this.bPieces.values());
            for (const piece of ownPieces) piece.pin = null;
        }
        currentKing.computeCheckAndPins(this);
    }

    protected prepareCurrentTurn() {
        this.prepareTurn(this.turnKing);
    }

    protected isMoveableTurn(): boolean {
        const movingPieces: IterableIterator<Piece> = (this.turn === 'w' ? this.wPieces.values() : this.bPieces.values());
        for (const piece of movingPieces) {
            const it = this.pieceMoves(piece);
            if (!it.next().done) return true;
        }
        return false;
    }

    protected prepareGame() {
        if (this._turn == 'w') this.prepareTurn(this.bKing);
        else this.prepareTurn(this.wKing);
        this.prepareCurrentTurn();
    }

    protected resetGame(turn: Turn) {
        for (let i = 0; i < 8; i++) {
            this.wPositions[i] = 0;
            this.bPositions[i] = 0;
            this.wThreats[i] = 0;
            this.bThreats[i] = 0;
        }
        this.pieces.clear();
        this.wPieces.clear();
        this.bPieces.clear();
        if (this.wKing.position != null) this.wKing.captured();
        if (this.bKing.position != null) this.bKing.captured();
        this._regainablePieces.length = 0;
        this._specialPawnCapture = null;
        this._turn = turn;
        this.pieces.set(this.wKing.key, this.wKing);
        this.pieces.set(this.bKing.key, this.bKing);
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

        const currentKing = this.turnKing;
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
            if (currentKing.checked) {
                if (currentKing.isDoubleCheck()) result.king = -15;
                else if (currentKing.isKnightOrCloseCheck()) result.king = -12;
                else result.king = -10;
            }
            else if (!currentKing.moved) result.king = 0.1;
            else result.king = 0;
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

            const isTroupDeveloped = (pos: Position, color: PieceColor) => color == 'w' ? pos[1] > 8 : pos[1] < 20;
            const isPieceDeveloped = (pos: Position, color: PieceColor) =>
                color == 'w' ? pos[1] > (pos[0] == 7 ? 6 : 3) : pos[1] < (pos[0] == 7 ? 22 : 25);

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

}

export class Game extends Board {

    public static kingCastlingPosition(color: PieceColor, column: CastlingColumn): Position {
        const kingPosition = (color == 'w' ? PositionHelper.whiteKingInitPosition : PositionHelper.blackKingInitPosition);
        const kingCastleMove = (color == 'w' ? Game.whiteKingCastlingMove : Game.blackKingCastlingMove)[column];
        return PositionHelper.knightJump(kingPosition, kingCastleMove)!;
    }

    //#region PRIVATE STATIC
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

    private static whiteKingCastlingMove = {
        'I': "LineUp-FileUp",
        'H': "LineUp-ColumnUp",
        'F': "LineInvUp-ColumnUp",
        'E': "LineInvUp-FileInvUp",
        'D': "TransversalLineDec-FileInvUp"
    } as const;
    private static blackKingCastlingMove = {
        'I': "LineDown-FileDown",
        'H': "LineDown-ColumnDown",
        'F': "LineInvDown-ColumnDown",
        'E': "LineInvDown-FileInvDown",
        'D': "TransversalLineDec-FileInvDown"
    } as const;

    private static rookCastleMove(kingDestinationColumn: Column, rookDestinationColumn: Column, color: PieceColor, side: 'K' | 'D', grand: boolean): OrthogonalDirection {
        if (side == 'K') {
            if (rookDestinationColumn == 'K')
                return grand ? (color == 'w' ? "ColumnUp" : "ColumnDown") : color == 'w' ? "FileUp" : "FileDown";
            else if (rookDestinationColumn == 'I')
                return grand ? (color == 'w' ? "FileInvDown" : "FileInvUp") : color == 'w' ? "ColumnUp" : "ColumnDown";
            else return color == 'w' ? "FileInvUp" : "FileInvDown";
        } else {
            if (rookDestinationColumn == 'E' && kingDestinationColumn == 'D') return color == 'w' ? "FileDown" : "FileUp"
            else return color == 'w' ? "FileUp" : "FileDown";
        }
    }
    //#endregion

    private _moves: UndoStatusWhithCheckInfo[] = [];
    private _top: number = -1;
    private moveNumber: number;
    private halfmoveClock: number;
    private fixedNumbering: boolean = true;
    private _mate = false;
    private _stalemate = false;
    private _draw = false;
    private _resigned = false;
    private _enpassantCaptureCoordString: Nullable<string> = null;

    constructor(grand: boolean = false, restoreStatusTLPD?: string) {
        const restoreStatus: Nullable<string[]> = restoreStatusTLPD?.split(" ");
        const turn: Turn = restoreStatus?.[1] != null && (restoreStatus[1] == 'w' || restoreStatus[1] == 'b') ? restoreStatus[1] as Turn : 'w';
        super(grand, turn);
        if (restoreStatusTLPD === undefined) {
            this.fillDefaultPositions();
            this.halfmoveClock = 0;
            this.moveNumber = 1;
            this.fixedNumbering = true;
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
                if (restoreStatus[5] == null || restoreStatus[5] == "-") this.fixedNumbering = false;
                else throw new TypeError("Invalid move number");
            } else this.fixedNumbering = true;
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

    public getHexPiece(pos: string): Nullable<Piece> {
        const p = PositionHelper.parse(pos);
        if (p == null || !PositionHelper.isValidPosition(p)) return null;
        else return this.getPiece(p);
    }

    public get lastMove() {
        if (this._top >= 0) return csmv.fullMoveNotation(this._moves[this._top], false);
        else return null;
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

    public get enPassantCaptureCoordString(): Nullable<string> {
        return this._enpassantCaptureCoordString;
    }

    public get preMoveHeuristic(): Heuristic { return this.currentHeuristic; }

    public doMove(fromHex: string, toHex: string, pieceName?: PieceName): void {
        try {
            assertCondition(this._top == this._moves.length - 1, "push the moves over the last one");
            const moveFrom = PositionHelper.parse(fromHex);
            const moveTo = PositionHelper.parse(toHex);
            const piece = this.getPiece(moveFrom);
            assertCondition(piece != null, `piece on ${fromHex} position`);
            assertCondition(pieceName == undefined || piece.symbol == pieceName, `${pieceName} is the piece on ${moveFrom}`);
            assertCondition(piece.canMoveTo(this, moveTo),
                `Piece ${piece.symbol} at ${piece.position?.toString()} move to ${moveTo.toString()}`);
            const move: Record<string, any> = {
                piece: piece.key,
                pos: moveFrom,
                moveTo: moveTo
            };
            const capturedPiece = this.getPiece(moveTo);
            if (capturedPiece != null) {
                assertCondition(piece.color != capturedPiece.color && piece.canCaptureOn(this, moveTo),
                    `Piece ${piece.symbol} at ${piece.position?.toString()} capture on ${moveTo.toString()}`)
                const isScornfulCapture = cspty.isPawn(piece) && this.specialPawnCapture != null &&
                    this.specialPawnCapture.isScornfulCapturable() && this.specialPawnCapture.isScorned(piece, moveTo);
                move.captured = capturedPiece.key;
                move.special = isScornfulCapture ? moveTo : undefined;
                this._enpassantCaptureCoordString = null;
            } else if (this.specialPawnCapture != null && (cspty.isPawn(piece) || cspty.isAlmogaver(piece))
                && this.specialPawnCapture.isEnPassantCapturable()
                && this.specialPawnCapture.isEnPassantCapture(moveTo, piece)) {
                const enPassantCapture = this.specialPawnCapture.capturablePiece;
                move.captured = enPassantCapture.key;
                move.special = [enPassantCapture.position![0], enPassantCapture.position![1]];
                this._enpassantCaptureCoordString = PositionHelper.toString(move.special);
            } else {
                this._enpassantCaptureCoordString = null;
            }
            this.pushMove(move as MoveInfo);
        }
        catch (e) {
            if (e instanceof Error && e.name == 'Error') e.name = 'DoMove';
            throw e;
        }
    }

    public doPromotePawn(fromHex: string, toHex: string, promoteTo: PieceName) {
        try {
            assertCondition(this._top == this._moves.length - 1, "push the moves over the last one");
            const moveFrom = PositionHelper.parse(fromHex);
            const moveTo = PositionHelper.parse(toHex);
            const pawn = this.getPiece(moveFrom);
            assertCondition(pawn != null && cspty.isPawn(pawn), `pawn on ${fromHex} position`);
            assertCondition(PositionHelper.isPromotionHex(moveTo, pawn.color), "Promotion hex");
            const hexesColor = PositionHelper.hexColor(moveTo);
            const piece = super.findRegeinablePiece(pawn.color, promoteTo, hexesColor);
            const promotion: Record<string, any> = {
                piece: pawn.key,
                prPos: moveTo,
                promoted: piece
            };
            if (!PositionHelper.equals(moveFrom, moveTo)) {
                promotion.pos = moveFrom;
                promotion.moveTo = moveTo;
                const capturedPiece = this.getPiece(moveTo);
                if (capturedPiece != null) {
                    assertCondition(pawn.color != capturedPiece.color && pawn.canCaptureOn(this, moveTo),
                        `Pawn at ${piece.position?.toString()} capture on ${moveTo.toString()}`)
                    const isScornfulCapture = cspty.isPawn(piece) && this.specialPawnCapture != null &&
                        this.specialPawnCapture.isScornfulCapturable() && this.specialPawnCapture.isScorned(piece, moveTo);
                    promotion.captured = capturedPiece.key;
                    promotion.special = isScornfulCapture ? moveTo : undefined;
                    this._enpassantCaptureCoordString = null;
                } else if (this.specialPawnCapture != null && this.specialPawnCapture.isEnPassantCapturable()
                    && this.specialPawnCapture.isEnPassantCapture(moveTo, pawn)) {
                    const enPassantCapture = this.specialPawnCapture.capturablePiece;
                    promotion.captured = enPassantCapture.key;
                    promotion.special = [enPassantCapture.position![0], enPassantCapture.position![1]];
                    this._enpassantCaptureCoordString = PositionHelper.toString(promotion.special);
                } else {
                    this._enpassantCaptureCoordString = null;
                }
            }
            this.pushMove(promotion as MoveInfo);
        }
        catch (e) {
            if (e instanceof Error && e.name == 'Error') e.name = 'DoPromotePawn';
            throw e;
        }
    }

    public doCastling(strMove: CastlingString | GrandCastlingString) {
        try {
            if (this.isGrand) assertCondition(csty.isGrandCastlingString(strMove), "castling move string");
            else assertCondition(csty.isCastlingString(strMove), "castling move string");
            const currentKing = super.turnKing;
            const currentColor = this.turn;
            const cmove = strMove.split("-");
            const side = cmove[0][2] == 'R' ? 'K' : cmove[0][2];
            const kCol = cmove[1][0] as CastlingColumn;
            const rCol = cmove[1][1] as Column;
            const rCol2 = cmove[1].length == 3 && cmove[1][2] != 'O' ? cmove[1][2] as Column : undefined;
            const singleStep = cmove[1].length > 3 ? false : cmove[1].length == 3 && cmove[1][2] == 'O' ? true : undefined; //KRK-HIO i KRK-HIOO
            const kPos = Game.kingCastlingPosition(currentKing.color, kCol);
            assertCondition(side == 'K' || side == 'D', `${side} must be King (K) side or Queen (D) side`);
            const rPos = this.castlingRookPosition(kCol, rCol, side, singleStep);
            const rook = this.getPiece(side == 'K' ? PositionHelper.initialKingSideRookPosition(currentColor, this.isGrand)
                : PositionHelper.initialQueenSideRookPosition(currentColor, this.isGrand));
            assertCondition(!currentKing.moved, "King hasn't been moved");
            assertNonNullish(kPos, "king destination hex");
            assertCondition(this.hasPiece(kPos) == null, "empty king destination hex");
            assertCondition(!this.isThreated(kPos, currentKing.color), "Not threated king destination hex");
            assertNonNullish(rook, "castling rook piece");
            assertCondition(cspty.isRook(rook), "castling rook");
            assertCondition(!rook.moved, "castling rook's not been moved");
            assertCondition(rook.canMoveTo(this, rPos, false), "castling rook movement");
            const castlingMove: Record<string, any> = {
                side: cmove[0][2],
                col: kCol,
                rPos: rPos,
                kRook: side == 'K' ? rook.key : undefined,
                qRook: side == 'D' ? rook.key : undefined
            };
            if (rCol2 !== undefined) {
                const r2Pos = this.castlingRookPosition(kCol, rCol2, 'D', singleStep);
                const rook2 = this.getPiece(PositionHelper.initialQueenSideRookPosition(currentColor, this.isGrand));
                assertNonNullish(rook2, "double castling queen side rook");
                assertCondition(cspty.isRook(rook2), "castling queen rook");
                assertCondition(!rook2.moved, "castling queen rook's not been moved");
                assertCondition(rook2.canMoveTo(this, r2Pos, false), "castling queen rook movement");
                castlingMove["r2Pos"] = r2Pos;
                castlingMove["qRook"] = rook2.key;
            }
            this._enpassantCaptureCoordString = null;
            this.pushMove(castlingMove as MoveInfo);
        }
        catch (e) {
            if (e instanceof Error && e.name == 'Error') e.name = 'doCastling';
            throw e;
        }
    }

    public popMove() {
        if (this._moves.length > 1 || this._top == 0 && this._moves[0].move != '\u2026') {
            assertCondition(this._moves[this._top].move != '\u2026')
            this._top--;
            const turnInfo: UndoStatus = this._moves.pop()!;
            assertCondition(turnInfo.move != '\u2026')
            super.nextTurn(); //works anyway
            this._draw = false; this._resigned = false;
            this._mate = false; this._stalemate = false;
            this.undoMove(turnInfo.move, turnInfo.turn);
            if (turnInfo.castlingStatus !== undefined && csmv.isMoveInfo(turnInfo.move)) {
                const symbol = cscnv.getPieceKeyName(turnInfo.move.piece);
                if (symbol === 'R' || symbol === 'K') {
                    const piece = this.pieceByKey(turnInfo.move.piece);
                    switch (symbol) {
                        case 'R': (piece as Rook).setCastlingStatus(turnInfo.castlingStatus, this.isGrand);
                            break;
                        case 'K': (piece as King).castlingStatus = turnInfo.castlingStatus;
                            break;
                    }
                }
            }
            if (turnInfo.specialPawnCapture === undefined) this.specialPawnCapture = null;
            else this.specialPawnCapture = PawnSpecialCaptureStatus.parse(this, turnInfo.specialPawnCapture);
            if (this.isAwaitingPromotion) {
                if (csmv.isMoveInfo(turnInfo.move) && cscnv.getPieceKeyName(turnInfo.move.piece) == 'P'
                    || csmv.isPromotionInfo(turnInfo.move)) {
                    this.computeAwaitingPromotion(turnInfo.turn == 'b' ? 'w' : 'b');
                }
            }
            if (this.turn === 'b') this.moveNumber--;
            if (turnInfo.initHalfMoveClock === undefined) this.halfmoveClock--;
            else this.halfmoveClock = 0;
            super.prepareCurrentTurn();
            super.computeHeuristic(this.turn, this.moveNumber, true, this.currentHeuristic);
        }
    }

    //#region CASTLING

    public * castlingMoves(color: PieceColor, kingFinalPos: Position) {
        //TODO castlingMoves without string (useful to generate moves)
    }

    public * castlingStrMoves(color: PieceColor, kingFinalPos: Position): Generator<CastlingString | GrandCastlingString, void, void> {
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
        assertCondition(csty.isCastlingColumn(column), `Column: ${column} has to be a king castling column`);
        const currentKing = super.turnKing;
        if (currentKing.moved) return null;
        else {
            const pos: Position = Game.kingCastlingPosition(currentKing.color, column);
            if (this.hasPiece(pos) == null && !this.isThreated(pos, currentKing.color)) return pos;
            else return null;
        }
    }

    public castlingRookPosition(kingColumn: CastlingColumn, rookColumn: Column, side: 'K' | 'D', singleStep?: boolean) {
        const currentColor = this.turn;
        const rookPos: Position = side == 'K' ? PositionHelper.initialKingSideRookPosition(currentColor, this.isGrand)
            : PositionHelper.initialQueenSideRookPosition(currentColor, this.isGrand);
        assertCondition(csty.isCastlingColumn(kingColumn), `King column: ${kingColumn} has to be a king castling column`);
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
        const currentKing = super.turnKing;
        assertCondition(csty.isCastlingColumn(column), `Column: ${column} has to be a king castling column`);
        if (currentKing.moved) return null;
        else {
            const kingCastleMove: KnightDirection = (this.turn == 'w' ? Game.whiteKingCastlingMove : Game.blackKingCastlingMove)[column];
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
        return super.turnKing.getCastlingStatus(this);
    }

    //#endregion

    //#region STORED MOVES

    public moves(fromMove: number) { return Object.freeze(this._moves.slice(fromMove)); }
    public strMoves(): string {
        let result = [];
        if (this._moves.length > 0) {
            let ini: number;
            if (this._moves[0].turn == 'b') {
                result.push(this._moves[0].n + ". \u2026, " + csmv.fullMoveNotation(this._moves[0]));
                ini = 1;
            } else ini = 0;
            for (let i = ini; i <= this._top; i += 2) {
                let move = csmv.fullMoveNotation(this._moves[i]);
                if (i < this._top) {
                    move += ", " + csmv.fullMoveNotation(this._moves[i + 1]);
                }
                result.push(move);
            }
        }
        return result.join("\n");
    }
    public moveBottom(): void {
        while (this._top > 1 || this._top == 1 && this._moves[0].move != '\u2026') {
            const moveInfo = this._moves[this._top--];
            assertCondition(moveInfo.move != '\u2026')
            this.undoMove(moveInfo.move, moveInfo.turn);
        }
    }
    public moveBackward(): void {
        if (this._top > 1 || this._top == 1 && this._moves[0].move != '\u2026') {
            const moveInfo = this._moves[this._top--];
            assertCondition(moveInfo.move != '\u2026')
            this.undoMove(moveInfo.move, moveInfo.turn);
        }
    }
    public moveForward(): void {
        if (this._top < this._moves.length - 1) {
            const moveInfo = this._moves[++this._top];
            assertCondition(moveInfo.move != '\u2026')
            this.applyMove(moveInfo.move, moveInfo.turn);
        }
    }
    public moveTop(): void {
        while (this._top < this._moves.length - 1) {
            const moveInfo = this._moves[++this._top];
            assertCondition(moveInfo.move != '\u2026')
            this.applyMove(moveInfo.move, moveInfo.turn);
        }
    }
    public get topMoveId(): string {
        return this._top >= 0 ? csmv.undoStatusId(this._moves[this._top]) : "";
    }

    public get movesJSON() {
        return JSON.stringify(this._moves);
    }
    public restoreMovesJSON(moves: string) {
        this._moves = JSON.parse(moves) as UndoStatus[];
        this._top = this._moves.length - 1;
    }

    //#endregion

    //#region TLPD

    public get valueTLPD(): string {
        return this.piecePositionsTLPD + " " + this.turn + " " + this.castlingStatus
            + " " + (this.specialPawnCapture?.toString() ?? "-")
            + " " + this.halfmoveClock.toString() + " " + (this.fixedNumbering ? this.moveNumber.toString() : "-");
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

    public loadTLPD(restoreStatusTLPD: string): void {
        try {
            assertCondition(restoreStatusTLPD != null, "Not empty TLPD");
            assertCondition(restoreStatusTLPD.trim().length > 12, "Enough TLPD length");
            const restoreStatus: string[] = restoreStatusTLPD.split(" ");
            assertCondition(restoreStatus.length >= 2, "Piece positions and turn are mandatory");
            assertCondition(restoreStatus[0].length >= 10, "Piece positions string");
            assertCondition(csty.isTurn(restoreStatus[1]), "Correct turn");
            const turn: Turn = restoreStatus[1] as Turn;
            super.resetGame(turn);
            this._moves.length = 0;
            this._top = -1;
            const [wCastlingStatus, bCastlingStatus] = Board.splitCastlingStatus(restoreStatus[2]);
            this.restoreTLPDPositions(restoreStatus[0], wCastlingStatus, bCastlingStatus);
            this.halfmoveClock = csty.isNumber(Number(restoreStatus[4])) ? Number(restoreStatus[4]) : 0;
            if (isNaN(Number(restoreStatus[4]))) {
                if (restoreStatus[4] != null && restoreStatus[4] !== "-") throw new TypeError("Invalid halfmove clock value");
            }
            this.moveNumber = csty.isNumber(Number(restoreStatus[5])) ? Number(restoreStatus[5]) : 1;
            if (isNaN(Number(restoreStatus[5]))) {
                if (restoreStatus[5] == null || restoreStatus[5] == "-") this.fixedNumbering = false;
                else throw new TypeError("Invalid move number");
            } else this.fixedNumbering = true;
            super.specialPawnCapture = PawnSpecialCaptureStatus.parse(this, restoreStatus[3]);
            this.initGame();
        } catch (e) {
            if (e instanceof Error && e.name == 'Error') e.name = 'TLPD';
            throw e;
        }
    }

    private restoreTLPDPositions(positions: string, wCastlingStatus: CastlingStatus, bCastlingStatus: CastlingStatus): void {
        assertCondition(positions.length >= 10 && positions[0] == '/' && positions[positions.length - 1] == '/',
            `Valid TLPD string positions: ${positions}`);
        const rooks: Rook[] = [];
        const wPiece: Piece[] = [];
        const bPiece: Piece[] = [];
        const piecePos: string[] = positions.split("/");
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
                                    const color: PieceColor = pieceName.toUpperCase() == pieceName ? "w" : "b";
                                    if (pieceSymbol == 'K') {
                                        if (color == 'w') {
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
                                        const newPiece = super.createPiece(pieceSymbol, color,
                                            cscnv.columnFromIndex(actualColumnIndex as ColumnIndex),
                                            actualLine as Line);
                                        if (cspty.isRook(newPiece)) rooks.push(newPiece);
                                        else if (cspty.isPawn(newPiece) && newPiece.awaitingPromotion != null)
                                            super.setAwaitingPromotion(newPiece.color);
                                        (color == 'w' ? wPiece : bPiece).push(newPiece);
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
            for (let color of ['w', 'b'] as PieceColor[]) {
                const pieceSet = (color == 'w' ? wPiece : bPiece);
                let n = countOccurrences(pieceSet, 'D');
                if (n > 1) throw new Error(`Too many ${color} Queens`);
                else if (n == 0) this.addRegainablePiece(new Queen(color));
                n = countOccurrences(pieceSet, 'V');
                if (n > 1) throw new Error(`Too many ${color} Wyverns`);
                else if (n == 0) this.addRegainablePiece(new Wyvern(color));
                n = countOccurrences(pieceSet, 'R');
                if (n > 2) throw new Error(`Too many ${color} Rooks`);
                else {
                    while (n < 2) {
                        this.addRegainablePiece(new Rook(color, this.isGrand, n));
                        n++;
                    }
                }
                n = countOccurrences(pieceSet, 'G');
                if (n > 2) throw new Error(`Too many ${color} Pegasus`);
                else {
                    while (n < 2) {
                        this.addRegainablePiece(new Pegasus(color, n));
                        n++;
                    }
                }
                n = countOccurrences(pieceSet, 'N');
                if (!this.isGrand && n > 2 || this.isGrand && n > 4) throw new Error(`Too many ${color} Knights`);
                else {
                    while (n < 2) {
                        this.addRegainablePiece(new Knight(color, n));
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
        for (const r of rooks) { r.setCastlingStatus(r.color == "w" ? wCastlingStatus : bCastlingStatus, this.isGrand); }
    }

    //#endregion

    //#region ADD STORED MOVES

    public applyMoveSq(sq: string) {
        try {
            assertCondition(this._top == this._moves.length - 1, "push the moves over the last one");
            sq = sq.replaceAll(' ', '').replace(/\n\n+/g, '\n').replace(/^[\s\n]+|[\s\n]+$/gm, '');
            const fixedNumbering: boolean = (sq[0] != '1' || sq[1] != '?');
            sq = sq.replace(/^1\?/, '1.').replace(/^1....,/, '1.\u2026');
            const regExp = new RegExp(/^(\d+\..*\n)+\d+\..*$/);
            assertCondition(regExp.test(sq), "numbered lines");
            const lines = sq.split(/\r?\n/);
            const firstLine = this.moveNumber;
            for (let i = 0; i < lines.length; i++) {
                const parts: string[] = lines[i].split(/[.,]\s?/);
                const nMove = parseInt(parts[0]);
                assertCondition(nMove.toString() == parts[0], `Line number of "${lines[i]}"`);
                assertCondition(this.moveNumber == (fixedNumbering ? nMove : firstLine + nMove - 1), `Expected move number ${this.moveNumber} on move ${i}`);
                if (nMove == 1) {
                    assertCondition(parts.length == 3, `first move must be a numbered pair of moves; white move can be an ellipsis: ${lines[0]}`);
                    if (parts[1] == '\u2026') {
                        assertCondition(this.turn == 'b', "It begins on black's turn");
                        this.applyStringMove(parts[2]);
                    } else {
                        assertCondition(this.turn == 'w', "It begins on white's turn");
                        this.applyStringMove(parts[1]);
                        this.applyStringMove(parts[2]);
                    }
                } else if (i == lines.length - 1) {
                    assertCondition(parts.length >= 2 && parts.length <= 3, `last move ${lines[i]}`);
                    this.applyStringMove(parts[1]);
                    if (parts.length == 3) this.applyStringMove(parts[2]);
                } else {
                    assertCondition(parts.length == 3, `numbered pair of moves: ${lines[i]}`);
                    this.applyStringMove(parts[1]);
                    this.applyStringMove(parts[2]);
                }
            }
            this.fixedNumbering = (this.fixedNumbering && firstLine != 1) || fixedNumbering;
        } catch (e) {
            if (e instanceof Error && e.name == 'Error') e.name = 'Move seq';
            throw e;
        }
    }

    public applyStringMove(mov: string) {
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

        assertCondition(this._top == this._moves.length - 1, "push the move over the last one");
        assertCondition(mov.length >= 4, "Moviment length must be at least of 4 chars");
        if (mov.startsWith("KR") && mov[3] == '-' || mov[3] == '\u2013') {
            const castlingString = mov[3] == '\u2013' ? mov.replace('\u2013', '-') : mov;
            if (this.isGrand) assertCondition(csty.isGrandCastlingString(castlingString), `grand castling move: ${castlingString}`);
            else assertCondition(csty.isCastlingString(castlingString), `castling move: ${castlingString}`);
            this.doCastling(castlingString);
        } else {
            mov = mov.replace('x', '\u00D7');
            const sepIx = separatorIndex(mov);
            const movePiece: PieceName = csty.isPieceName(mov[0]) && csty.isColumn(mov[1]) ? mov[0] : 'P';
            const fromHexPos: string = mov.slice(movePiece == 'P' ? 0 : 1, sepIx);
            assertCondition(sepIx < mov.length - 1, "Moviment divided into parts");
            assertCondition(isHexPosition(fromHexPos), "Initial hex");
            const separator = mov.charAt(sepIx) == '@' && mov.charAt(sepIx + 1) == '@' ? '@@' : mov.charAt(sepIx);
            assertCondition(['-', '\u2013', '\u00D7', '@', '@@', '='].includes(separator), `valid origin&destiny separator "${separator}"`);
            if (separator == '=') {
                const promotionPiece: PieceName = mov[sepIx + 1] as PieceName;
                assertCondition(movePiece == 'P', "Promoting a pawn");
                this.doPromotePawn(fromHexPos, fromHexPos, promotionPiece!);
            }
            else {
                assertCondition(sepIx < mov.length - 2, "Movement destination");
                const toIx = sepIx + separator.length;
                const toEndIx = separatorIndex(mov, toIx);
                const capturedPiece: Nullable<PieceName> =
                    csty.isPieceName(mov[toIx]) && csty.isColumn(mov[toIx + 1]) ? mov[toIx] as PieceName : undefined;
                const toHexPos = mov.slice(capturedPiece === undefined ? toIx : toIx + 1, toEndIx);
                assertCondition(isHexPosition(toHexPos), "Destination hex");
                assertCondition(capturedPiece === undefined || (separator != '-' && separator != '\u2013'), "Captured piece")
                if (toEndIx < mov.length && mov[toEndIx] == '=') {
                    const promotionPiece: PieceName = mov[toEndIx + 1] as PieceName;
                    assertCondition(movePiece == 'P', "Promoting a pawn");
                    this.doPromotePawn(fromHexPos, toHexPos, promotionPiece!);
                }
                else this.doMove(fromHexPos, toHexPos, movePiece);
            }
        }
    }

    //#endregion

    public * pieceList() {
        for (const p of this.whitePieces()) yield p.uncapitalizedSymbolPositionString;
        for (const p of this.blackPieces()) yield p.uncapitalizedSymbolPositionString;
    }

    public * threatedPieceStringPositions() {
        const piecePositionsGenerator = this.turn == 'w' ? this.whitePiecePositions() : this.blackPiecePositions();
        const color = this.turn;
        for (const pos of piecePositionsGenerator) {
            if (this.isThreated(pos, color)) yield PositionHelper.toString(pos);
        }
    }

    public * ownThreatedPieceStringPositions() {
        const piecePositionsGenerator = this.turn == 'w' ? this.blackPiecePositions() : this.whitePiecePositions();
        const color = this.turn;
        for (const pos of piecePositionsGenerator) {
            if (this.isThreated(pos, color)) yield PositionHelper.toString(pos);
        }
    }

    private pushMove(move: MoveInfo) {
        const turnInfo: UndoStatus = {
            n: this.moveNumber,
            turn: this.turn,
            move: move,
            initHalfMoveClock: this.halfmoveClock == 0 ? 1 : undefined,
            specialPawnCapture: this.specialPawnCapture == null ? undefined : this.specialPawnCapture.toString(),
            castlingStatus: (csmv.isMoveInfo(move) && ['K', 'R'].indexOf(cscnv.getPieceKeyName(move.piece)) >= 0) ?
                this.playerCastlingStatus() : undefined
        };
        this.applyMove(move, this.turn);
        super.nextTurn();
        if (this.turn === 'w') this.moveNumber++;
        if (csmv.isMoveInfo(move) && cscnv.getPieceKeyName(move.piece) == 'P'
            || csmv.isCaptureInfo(move)
            || csmv.isPromotionInfo(move))
            this.halfmoveClock = 0;
        else this.halfmoveClock++;
        super.prepareCurrentTurn();
        const anyMove = super.isMoveableTurn();
        let endGame: EndGame | undefined = undefined;
        let check: CheckNotation | undefined = undefined;
        if (!anyMove) {
            if (this.checked) { this._mate = true; endGame = "mate"; }
            else { this._stalemate = true; endGame = "stalemate"; }
        } else if (this.halfmoveClock >= 200) {
            this._draw = true; endGame = "draw";
        } else if (this.checked) {
            if (this.isKnightOrCloseCheck) check = "^+";
            else if (this.isSingleCheck) check = "+";
            else if (this.isDoubleCheck) check = "++"
            else throw new Error("never: exhaused check options");
        }
        if (this._top < 0 && turnInfo.turn == 'b') {
            this._moves.push({ n: turnInfo.n, turn: 'w', move: '\u2026' });
            this._top++;
        }
        const turnInfoEnriched = csmv.promoteUndoStatus(turnInfo, endGame, check);
        this._moves.push(turnInfoEnriched);
        this._top++;
        super.computeHeuristic(this.turn, this.moveNumber, anyMove, this.currentHeuristic);
    }

    private applyMove(move: MoveInfo, turn: Turn) {
        if (csmv.isCastlingInfo(move)) this.applyCastling(move, turn);
        else {
            const piece = this.pieceByKey(move.piece);
            if (csmv.isMoveInfo(move)) {
                const dest = move.moveTo;
                if (csmv.isCaptureInfo(move)) {
                    super.capturePiece(this.pieceByKey(move.captured));
                }
                super.movePiece(piece, dest[0], dest[1]);
                if (csmv.isPromotionInfo(move)) {
                    super.promotePawn(piece as Pawn, this.pieceByKey(move.promoted));
                }
            } else {
                super.promotePawn(piece as Pawn, this.pieceByKey(move.promoted));
            }
        }
    }

    private applyCastling(mov: csmv.Castling, color: PieceColor) {
        const currentKing = color == 'w' ? this.wKing : this.bKing;
        const kpos = Game.kingCastlingPosition(currentKing.color, mov.col);
        switch (mov.side) {
            case 'K':
                super.movePiece(this.pieceByKey(mov.kRook!), mov.rPos[0], mov.rPos[1]);
                break;
            case 'D':
                super.movePiece(this.pieceByKey(mov.qRook!), mov.rPos[0], mov.rPos[1]);
                break;
            case 'R':
                super.movePiece(this.pieceByKey(mov.kRook!), mov.rPos[0], mov.rPos[1]);
                super.movePiece(this.pieceByKey(mov.qRook!), mov.r2Pos![0], mov.r2Pos![1]);
        }
        super.movePiece(currentKing, kpos[0], kpos[1]);
    }

    private undoMove(move: MoveInfo, turn: Turn) {
        if (csmv.isCastlingInfo(move))
            this.undoCastling(move, turn);
        else {
            const piece = this.pieceByKey(move.piece);
            if (csmv.isMoveInfo(move)) {
                if (csmv.isPromotionInfo(move)) super.undoPromotePawn(piece as Pawn, this.pieceByKey(move.promoted));
                super.undoPieceMove(piece, move.pos[0], move.pos[1]);
                if (csmv.isCaptureInfo(move)) {
                    const capPos = move.special === undefined ? move.moveTo : move.special;
                    super.undoCapturePiece(this.pieceByKey(move.captured), capPos[0], capPos[1]);
                }
            } else super.undoPromotePawn(piece as Pawn, this.pieceByKey(move.promoted));
        }
    }

    private undoCastling(castling: csmv.Castling, color: PieceColor) {
        const isGrand = this.isGrand;
        const currentKing = color == 'w' ? this.wKing : this.bKing;
        const kingInitialPos = color == 'w' ? PositionHelper.whiteKingInitPosition : PositionHelper.blackKingInitPosition;
        const rookInitialPos = castling.side == 'D' ?
            PositionHelper.initialQueenSideRookPosition(color, isGrand)
            : PositionHelper.initialKingSideRookPosition(color, isGrand);
        const rook = this.pieceByKey(castling.side == 'D' ? castling.qRook! : castling.kRook!) as Rook;
        console.log(castling);
        assertNonNullish(rook);
        super.undoPieceMove(currentKing, kingInitialPos[0], kingInitialPos[1]);
        super.undoPieceMove(rook, rookInitialPos[0], rookInitialPos[1]);
        currentKing.castlingStatus = "RKR";
        rook.setCastlingStatus("RKR", isGrand);
        if (castling.side == 'R') {
            const qRook = this.pieceByKey(castling.qRook!) as Rook;
            const r2InitialPos = PositionHelper.initialQueenSideRookPosition(color, isGrand);
            super.undoPieceMove(qRook, r2InitialPos[0], r2InitialPos[1]);
            qRook.setCastlingStatus("RKR", isGrand);
        }
    }

    private fillDefaultPositions(): void {
        this.wKing.setToInitialPosition(); this.addPiece(this.wKing);
        this.bKing.setToInitialPosition(); this.addPiece(this.bKing);
        //whites
        super.createPiece('D', 'w', 'E', 1); super.createPiece('V', "w", 'F', 0);
        super.createPiece('G', "w", 'D', 2); super.createPiece('J', "w", 'F', 2); super.createPiece('G', "w", 'H', 2);
        if (this.isGrand) {
            super.createPiece('P', "w", 'B', 6); super.createPiece('R', "w", 'B', 4); super.createPiece('N', "w", 'C', 3);
            super.createPiece('N', "w", 'I', 3); super.createPiece('R', "w", 'K', 4); super.createPiece('P', "w", 'K', 6);
            super.createPiece('P', "w", 'P', 7); super.createPiece('P', "w", 'T', 8);
            super.createPiece('P', "w", 'X', 8); super.createPiece('P', "w", 'Z', 7);
            super.createPiece('M', "w", 'C', 7); super.createPiece('M', "w", 'A', 7);
            super.createPiece('M', "w", 'L', 7); super.createPiece('M', "w", 'I', 7);
        } else {
            super.createPiece('P', "w", 'B', 4); super.createPiece('R', "w", 'C', 3),
                super.createPiece('R', "w", 'I', 3); super.createPiece('P', "w", 'K', 4);
        }
        super.createPiece('N', "w", 'E', 3); super.createPiece('N', "w", 'G', 3);
        super.createPiece('E', "w", 'D', 4); super.createPiece('J', "w", 'F', 4); super.createPiece('E', "w", 'H', 4);
        super.createPiece('P', "w", 'A', 5); super.createPiece('P', "w", 'C', 5); super.createPiece('E', "w", 'E', 5);
        super.createPiece('E', "w", 'G', 5); super.createPiece('P', "w", 'I', 5); super.createPiece('P', "w", 'L', 5);
        super.createPiece('P', "w", 'D', 6); super.createPiece('J', "w", 'F', 6); super.createPiece('P', "w", 'H', 6);
        super.createPiece('P', "w", 'E', 7); super.createPiece('P', "w", 'F', 8); super.createPiece('P', "w", 'G', 7);
        //blacks
        super.createPiece('D', "b", 'E', 27); super.createPiece('V', "b", 'F', 28);
        super.createPiece('G', "b", 'D', 26); super.createPiece('J', "b", 'F', 26); super.createPiece('G', "b", 'H', 26);
        if (this.isGrand) {
            super.createPiece('P', "b", 'B', 22); super.createPiece('R', "b", 'B', 24); super.createPiece('N', "b", 'C', 25);
            super.createPiece('N', "b", 'I', 25); super.createPiece('R', "b", 'K', 24); super.createPiece('P', "b", 'K', 22);
            super.createPiece('P', "b", 'P', 21); super.createPiece('P', "b", 'T', 20);
            super.createPiece('P', "b", 'X', 20); super.createPiece('P', "b", 'Z', 21);
            super.createPiece('M', "b", 'C', 21); super.createPiece('M', "b", 'A', 21);
            super.createPiece('M', "b", 'I', 21); super.createPiece('M', "b", 'L', 21);
        } else {
            super.createPiece('P', "b", 'B', 24); super.createPiece('R', "b", 'C', 25);
            super.createPiece('R', "b", 'I', 25); super.createPiece('P', "b", 'K', 24);
        }
        super.createPiece('N', "b", 'E', 25); super.createPiece('N', "b", 'G', 25);
        super.createPiece('E', "b", 'D', 24); super.createPiece('J', "b", 'F', 24); super.createPiece('E', "b", 'H', 24);
        super.createPiece('P', "b", 'A', 23); super.createPiece('P', "b", 'C', 23); super.createPiece('E', "b", 'E', 23);
        super.createPiece('E', "b", 'G', 23); super.createPiece('P', "b", 'I', 23); super.createPiece('P', "b", 'L', 23);
        super.createPiece('P', "b", 'D', 22); super.createPiece('J', "b", 'F', 22); super.createPiece('P', "b", 'H', 22);
        super.createPiece('P', "b", 'E', 21); super.createPiece('P', "b", 'F', 20); super.createPiece('P', "b", 'G', 21);
    };

    private initGame() {
        super.prepareGame();
        this._mate = false; this._stalemate = false;
        this._resigned = false; this._draw = false;
        const anyMove = super.isMoveableTurn();
        if (!anyMove) {
            if (this.checked) this._mate = true;
            else this._stalemate = true;
        } else if (this.halfmoveClock >= 100) this._draw = true;
        super.computeHeuristic(this.turn, this.moveNumber, anyMove, this.currentHeuristic);
    }

}


