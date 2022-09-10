import { isNotNullNorEmpty, Nullable } from "./ts.general";
import type {
    Column, ColumnIndex, Line, Position, PieceKey,
    OrthogonalDirection, DiagonalDirection,
    Orientation, OrthogonalOrientation, DiagonalOrientation,
    ScornfulCaptureDirection,
    HexColor, PieceName, PieceColor, CastlingStatus,
    KnightOrCloseCheck, DoubleCheck, Direction
} from "./cescacs.types";
import { csTypes as csty, csConvert as cscnv, SingleCheck } from "./cescacs.types";
import { PositionHelper } from "./cescacs.positionHelper";
import { assertCondition, assertNonNullish } from "./ts.general";

export interface IPawnSpecialCaptureStatus {
    isScornfulCapturable(): this is IScornfulCapturable;
    isEnPassantCapturable(): this is IEnPassantCapturable;
    get capturablePawn(): Pawn;
}
export interface IScornfulCapturable {
    isScorned(pawn: Pawn): boolean;
    get capturablePiece(): Piece;
    get scornfulCaptureDirection(): ScornfulCaptureDirection;
}
export interface IEnPassantCapturable {
    isEnPassantCapture: (pos: Position) => boolean;
}
export interface IBoard {
    readonly isGrand: boolean;
    hasPiece: (pos: Position) => Nullable<PieceColor>;
    getPiece: (pos: Position) => Nullable<Piece>;
    setThreat: (pos: Position, color: PieceColor) => void;
    hasThreat: (pos: Position, color: PieceColor) => boolean;
    isThreated: (pos: Position, color: PieceColor) => boolean;
    readonly specialPawnCapture: Nullable<IPawnSpecialCaptureStatus>;
}



export abstract class Piece {

    public static isRegainablePiece(symbol: PieceName): boolean {
        switch (symbol) {
            case "D": case "V": case "R": case "G": case "N": case "J": return true;
            default: return false;
        }
    }

    public abstract readonly key: PieceKey;
    public abstract readonly symbol: PieceName;
    public abstract readonly value: number;

    private _position: Nullable<Position>;
    private _pin: Nullable<Orientation>;

    constructor(public readonly color: PieceColor) { }

    public abstract moves(board: IBoard): Generator<Position, void, void>;
    public abstract markThreats(board: IBoard): void;

    public get position(): Nullable<Position> { return this._position; }

    public setPositionTo(p: Position) {
        if (this._position == null) this._position = p;
        else throw new Error("Piece can't be reassigned to a new position");
    }

    public moveTo(c: ColumnIndex, l: Line): void {
        if (this._position != null) {
            this._position[0] = c;
            this._position[1] = l!;
        }
    }

    public get pin(): Nullable<Orientation> {
        return this._pin;
    }

    public set pin(value: Nullable<Orientation>) {
        this._pin = value;
    }

    public get hasOrthogonalAttack() {
        return this.symbol == 'R' || this.symbol == 'V' || this.symbol == 'D';
    }

    public get hasDiagonalAttack() {
        return this.symbol == 'J' || this.symbol == 'G' || this.symbol == 'D';
    }

    public get hasKnightJumpAttack() {
        return this.symbol == 'N' || this.symbol == 'V' || this.symbol == 'G';
    }

    public get hasOnlyCloseAttack() {
        return this.symbol == 'P' || this.symbol == 'E' || this.symbol == 'M' || this.symbol == 'K';
    }

    public get isRegainable(): boolean {
        return Piece.isRegainablePiece(this.symbol);
    }

    public toString() {
        return this.uncapitalizedSymbol + this.position?.toString();
    }

    public get uncapitalizedSymbol(): string {
        return (this.color == "w" ? this.symbol : this.symbol.toLowerCase());
    }

    public get symbolPositionString(): string {
        return this.symbol + (this.position == null ? "" : PositionHelper.toString(this.position));
    }

    public get uncapitalizedSymbolPositionString(): string {
        return this.uncapitalizedSymbol + (this.position == null ? "" : PositionHelper.toString(this.position));
    }

    public canMoveTo(board: IBoard, p: Position): boolean {
        return PositionHelper.positionIteratorIncludes(this.moves(board), p);
    }

    public canCaptureOn(board: IBoard, p: Position): boolean {
        return this.canMoveTo(board, p); //default piece capture same as move
    }

    public captured(): void {
        assertNonNullish(this._position, "Don't capture again the piece");
        this._position = null;
    }

    public * blockThreat(board: IBoard, threatBlockingPositions: Position[]) {
        yield* PositionHelper.positionIteratorIntersection(this.moves(board), threatBlockingPositions);
    }

    protected * knightMoves(board: IBoard, defends: boolean = false): Generator<Position, void, void> {
        if (this._position != null && this.pin == null) {
            for (const pos of PositionHelper.knightMoves(this._position)) {
                if (defends) yield pos;
                else {
                    const pieceColor: Nullable<PieceColor> = board.hasPiece(pos);
                    if (pieceColor == null || pieceColor !== this.color) yield pos;
                }
            }
        }
    }

    protected * orthogonalMoves(board: IBoard, defends: boolean = false): Generator<Position, void, void> {
        if (this._position != null) {
            const orientation: Nullable<OrthogonalOrientation> | [] =
                (this.pin == null ? null : csty.isOrthogonalOrientation(this.pin) ? this.pin : []);
            for (const direction of (orientation ?? cscnv.orthogonalDirections())) {
                const it = PositionHelper.orthogonalRide(this._position, direction);
                let v = it.next();
                while (v.done == false) {
                    const pieceColor: Nullable<PieceColor> = board.hasPiece(v.value);
                    if (pieceColor == null) {
                        yield v.value;
                        v = it.next();
                    }
                    else {
                        if (defends || pieceColor !== this.color) yield v.value;
                        v = it.return();
                    }
                }
            }
        }
    }

    protected * diagonalMoves(board: IBoard, defends: boolean = false): Generator<Position, void, void> {
        if (this._position != null) {
            const orientation: Nullable<DiagonalOrientation> | [] =
                (this.pin == null ? null : csty.isDiagonalOrientation(this.pin) ? this.pin : []);
            for (const direction of (orientation ?? cscnv.diagonalDirections())) {
                const it = PositionHelper.diagonalRide(this._position, direction);
                let v = it.next();
                while (!v.done) {
                    const pieceColor: Nullable<PieceColor> = board.hasPiece(v.value);
                    if (pieceColor == null) {
                        yield v.value;
                        v = it.next();
                    }
                    else {
                        if (defends || pieceColor !== this.color) { yield v.value; }
                        v = it.return();
                    }
                }
            }
        }
    }

    protected orthogonalStep(board: IBoard, direction: OrthogonalDirection, capture: boolean = true, defends: boolean = false): Nullable<Position> {
        if (this._position != null) {
            const pinOrientation: Nullable<OrthogonalOrientation> = (this.pin != null && csty.isOrthogonalOrientation(this.pin) ? this.pin : null);
            if (this._pin == null || (this._pin as Direction[]).includes(direction)) {
                const pos = PositionHelper.orthogonalStep(this._position, direction);
                if (pos != undefined) {
                    const pieceColor: Nullable<PieceColor> = board.hasPiece(pos);
                    if (defends || pieceColor == null || (capture && pieceColor !== this.color)) return pos;
                    else return null;
                } else return null;
            } else return null;
        } else return null;
    }

    protected diagonalStep(board: IBoard, direction: DiagonalDirection, capture: boolean = true, defends: boolean = false): Nullable<Position> {
        if (this._position != null) {
            if (this._pin == null || (this._pin as Direction[]).includes(direction)) {
                const pos = PositionHelper.diagonalStep(this._position, direction);
                if (pos != undefined) {
                    const pieceColor: Nullable<PieceColor> = board.hasPiece(pos);
                    if (defends || pieceColor == null || (capture && pieceColor !== this.color)) return pos;
                    else return null;
                } else return null;
            } else return null;
        } else return null;
    }

    public canMoveOrthogonallyTo(board: IBoard, p: Position, capture = true): boolean {
        if (this.position != null) {
            const direction = PositionHelper.isOrthogonally(this.position, p);
            if (direction != null && (this._pin == null || (this._pin as Direction[]).includes(direction))) {
                const pieceColor = board.hasPiece(p);
                if (pieceColor == null || capture && pieceColor != this.color) {
                    for (const pos of PositionHelper.orthogonalRide(this.position, direction)) {
                        if (PositionHelper.equals(p, pos)) return true;
                        else if (board.hasPiece(pos) != null) return false;
                    }
                    return false;
                } else return false;
            } else return false;
        }
        else return false;
    }

    public canMoveDiagonallyTo(board: IBoard, p: Position, capture = true): boolean {
        if (this.position != null) {
            const direction = PositionHelper.isDiagonally(this.position, p);
            if (direction != null && (this._pin == null || (this._pin as Direction[]).includes(direction))) {
                const pieceColor = board.hasPiece(p);
                if (pieceColor == null || capture && pieceColor != this.color) {
                    for (const pos of PositionHelper.diagonalRide(this.position, direction)) {
                        if (PositionHelper.equals(p, pos)) return true;
                        else if (board.hasPiece(pos) != null) return false;
                    }
                    return false;
                } else return false;
            } else return false;
        }
        else return false;
    }

}

export class King extends Piece {

    public readonly key;
    public readonly symbol = "K";
    public readonly value = 0;
    private _moved: boolean = false;
    private checkPosition: Nullable<KnightOrCloseCheck | SingleCheck | DoubleCheck> = null;

    constructor(color: PieceColor) {
        super(color);
        this.key = color + this.symbol;
    }

    public setPositionTo(pos: Position) {
        super.setPositionTo(pos);
        this._moved = !this.isInitialPosition;
    }

    public setToInitialPosition() {
        super.setPositionTo(this.initialPosiition);
        this._moved = false;
    }

    public get checked(): boolean {
        return this.checkPosition != null;
    }

    public get moved(): boolean {
        return this._moved;
    }

    public set castlingStatus(castlingStatusValue: CastlingStatus) {
        this._moved = this._moved || (castlingStatusValue == "-");
    }

    public getCastlingStatus(callback: IBoard): CastlingStatus {
        if (this._moved) return "-";
        else {
            const rK = callback.getPiece(PositionHelper.initialKingSideRookPosition(this.color, callback.isGrand));
            const rQ = callback.getPiece(PositionHelper.initialQueenSideRookPosition(this.color, callback.isGrand));
            if (rK != null && rK.color == this.color && csPieceTypes.isRook(rK) && !rK.moved) {
                if (rQ != null && rQ.color == this.color && csPieceTypes.isRook(rQ) && !rQ.moved) {
                    return "RKR"
                } else return "KR"
            } else if (rQ != null && rQ.color == this.color && csPieceTypes.isRook(rQ) && !rQ.moved) {
                return "KR"
            } else return "K"
        }
    }

    public moveTo(c: ColumnIndex, l: Line): void {
        super.moveTo(c, l);
        this._moved = true;
    }

    public * moves(board: IBoard): Generator<Position, void, void> {
        if (this.checked) {
            //King's pin is used for the direction of the attack, as backwards there's still no threat detected, cause of the king's shade
            assertNonNullish(this.position);
            assertNonNullish(this.checkPosition);
            for (const direction of cscnv.orthogonalDirections()) {
                const pos = PositionHelper.orthogonalStep(this.position, direction);
                if (pos != undefined) {
                    if (this.pin == null || !((this.pin as Direction[]).includes(direction)) || csty.isCheckAttackPos(this.checkPosition, pos)) {
                        const pieceColor: Nullable<PieceColor> = board.hasPiece(pos);
                        if ((pieceColor == null || pieceColor != this.color) && !board.isThreated(pos, this.color)) yield pos;
                    }
                }
            }
            for (const direction of cscnv.diagonalDirections()) {
                const pos = PositionHelper.diagonalStep(this.position, direction);
                if (pos != undefined) {
                    if (this.pin == null || !((this.pin as Direction[]).includes(direction)) || csty.isCheckAttackPos(this.checkPosition, pos)) {
                        const pieceColor: Nullable<PieceColor> = board.hasPiece(pos);
                        if ((pieceColor == null || pieceColor != this.color) && !board.isThreated(pos, this.color)) yield pos;
                    }
                }
            }
        } else {
            for (const m of this.attemptMoves(board)) {
                if (!board.isThreated(m, this.color)) yield m;
            }
        }
    }

    public markThreats(board: IBoard): void {
        for (const p of this.attemptMoves(board, true)) {
            //if (!board.isThreated(p, this.color))
            board.setThreat(p, this.color);
        }
    }

    public computeCheckAndPins(board: IBoard) {
        this.checkPosition = null;
        console.log(`Compute ${this.color} pins`);
        for (const p of PositionHelper.knightMoves(this.position!)) {
            const piece = board.getPiece(p);
            if (piece != null && piece.color != this.color && piece.hasKnightJumpAttack) {
                this.setKnightOrCloseAttack(p);
            }
        }
        for (const d of cscnv.orthogonalDirections()) {
            const it = PositionHelper.orthogonalRide(this.position!, d);
            let v = it.next();
            let isCloseAttack: boolean = true;
            while (!v.done) {
                const p: Position = v.value;
                const piece = board.getPiece(p);
                if (piece == null) {
                    isCloseAttack = false;
                    v = it.next();
                } else {
                    if (piece.color != this.color) {
                        if (isCloseAttack) {
                            if (piece.hasOrthogonalAttack) this.setKnightOrCloseAttack(p, d);
                            else if (piece.hasOnlyCloseAttack && piece.canCaptureOn(board, this.position!)) {
                                this.setKnightOrCloseAttack(p);
                            }
                        } else if (piece.hasOrthogonalAttack) {
                            this.setOrthogonalAtack(p, d);
                        }
                    } else {
                        const it2 = PositionHelper.orthogonalRide(p, d);
                        let v2 = it2.next();
                        while (!v2.done) {
                            const p2: Position = v2.value;
                            const piece2 = board.getPiece(p2);
                            if (piece2 == null) v2 = it2.next();
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
            const it = PositionHelper.diagonalRide(this.position!, d);
            let v = it.next();
            let isCloseAttack: boolean = true;
            while (!v.done) {
                const p: Position = v.value;
                const piece = board.getPiece(p);
                if (piece == null) {
                    isCloseAttack = false;
                    v = it.next();
                } else {
                    if (piece.color != this.color) {
                        if (isCloseAttack) {
                            if (piece.hasDiagonalAttack) this.setKnightOrCloseAttack(p, d);
                            else if (piece.hasOnlyCloseAttack && piece.canCaptureOn(board, this.position!)) {
                                this.setKnightOrCloseAttack(p);
                            }
                        } else if (piece.hasDiagonalAttack) {
                            this.setDiagonalAtack(p, d);
                        }
                    }
                    else {
                        const it2 = PositionHelper.diagonalRide(p, d);
                        let v2 = it2.next();
                        while (!v2.done) {
                            const p2: Position = v2.value;
                            const piece2 = board.getPiece(p2);
                            if (piece2 == null) v2 = it2.next();
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

    public isKnightOrCloseCheck(): boolean {
        return this.checkPosition != null && csty.isPosition(this.checkPosition);
    }

    public isSingleCheck(): boolean {
        return this.checkPosition != null && csty.isSingleCheck(this.checkPosition);
    }

    public isDoubleCheck(): boolean {
        return this.checkPosition != null
            && !csty.isPosition(this.checkPosition)
            && !csty.isSingleCheck(this.checkPosition);
    }

    public get checkThreat(): Nullable<Position> {
        if (this.checkPosition != null) {
            if (csty.isPosition(this.checkPosition)) return this.checkPosition;
            else if (csty.isSingleCheck(this.checkPosition)) return this.checkPosition.p;
            else return null;
        }
        else return null;
    }

    public getSingleCheckBlockingPositions(board: IBoard): Position[] {
        const r: Position[] = [];
        assertNonNullish(this.position);
        if (csty.isSingleCheck(this.checkPosition)) {
            const d = this.checkPosition.d;
            if (csty.isDiagonalDirection(d)) {
                for (const p of PositionHelper.diagonalRide(this.position, d)) {
                    if (board.hasPiece(p) == null) r.push(p);
                    else break;
                }
            } else if (csty.isOrthogonalDirection(d)) {
                for (const p of PositionHelper.orthogonalRide(this.position, d)) {
                    if (board.hasPiece(p) == null) r.push(p);
                    else break;
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

    private setOrthogonalAtack(pos: Position, dir: OrthogonalDirection) {
        if (this.checkPosition != null) {
            if (csty.isPosition(this.checkPosition)) {
                this.checkPosition = [this.checkPosition, pos, null];
                this.pin = cscnv.getOrthogonalOrientation(dir);
            } else if (csty.isSingleCheck(this.checkPosition)) {
                this.checkPosition = [this.checkPosition.p, pos, cscnv.getOrthogonalOrientation(dir)];
            } else {
                throw new Error("Triple check situation can't be achieved in the course of a game")
            }
        } else {
            this.checkPosition = { p: pos, d: dir };
            this.pin = cscnv.getOrthogonalOrientation(dir);
        }
    }

    private setDiagonalAtack(pos: Position, dir: DiagonalDirection) {
        if (this.checkPosition != null) {
            if (csty.isPosition(this.checkPosition)) {
                this.checkPosition = [this.checkPosition, pos, null];
                this.pin = cscnv.getDiagonalOrientation(dir);
            } else if (csty.isSingleCheck(this.checkPosition)) {
                this.checkPosition = [this.checkPosition.p, pos, cscnv.getDiagonalOrientation(dir)];
            } else {
                throw new Error("Triple check situation can't be achieved in the course of a game")
            }
        } else {
            this.checkPosition = { p: pos, d: dir };
            this.pin = cscnv.getDiagonalOrientation(dir);
        }
    }

    private setKnightOrCloseAttack(value: KnightOrCloseCheck, directional?: Direction) {
        if (this.checkPosition != null) {
            if (csty.isPosition(this.checkPosition)) {
                //this.checkPosition = [this.checkPosition, value];
                throw new Error("Double knight or close check situation can't be achieved in the course of a game")
            } else if (csty.isSingleCheck(this.checkPosition)) {
                if (directional == null) this.checkPosition = [this.checkPosition.p, value, null];
                else if (csty.isOrthogonalDirection(directional)) {
                    this.checkPosition = [this.checkPosition.p, value, cscnv.getOrthogonalOrientation(directional)];
                } else {
                    this.checkPosition = [this.checkPosition.p, value, cscnv.getDiagonalOrientation(directional)];
                }
            } else {
                throw new Error("Triple check situation can't be reached along a game")
            }
        } else {
            this.checkPosition = value;
            if (directional != null) {
                this.pin = csty.isOrthogonalDirection(directional) ?
                    cscnv.getOrthogonalOrientation(directional)
                    : cscnv.getDiagonalOrientation(directional);
            }
        }
    }

    private * orthogonalStepList(board: IBoard, defends: boolean): Generator<Position, void, void> {
        assertNonNullish(this.position);
        for (const direction of cscnv.orthogonalDirections()) {
            const pos = PositionHelper.orthogonalStep(this.position, direction);
            if (pos != undefined) {
                if (defends) yield pos;
                else {
                    const pieceColor: Nullable<PieceColor> = board.hasPiece(pos);
                    if (pieceColor == null || pieceColor !== this.color) yield pos;
                }
            }
        }
    }

    private * diagonalStepList(board: IBoard, defends: boolean): Generator<Position, void, void> {
        assertNonNullish(this.position);
        for (const direction of cscnv.diagonalDirections()) {
            const pos = PositionHelper.diagonalStep(this.position, direction);
            if (pos != undefined) {
                if (defends) yield pos;
                else {
                    const pieceColor: Nullable<PieceColor> = board.hasPiece(pos);
                    if (pieceColor == null || pieceColor !== this.color) yield pos;
                }
            }
        }
    }

    public * attemptMoves(board: IBoard, defends: boolean = false) {
        yield* this.orthogonalStepList(board, defends);
        yield* this.diagonalStepList(board, defends);
        if (!this._moved && !this.checked) {
            yield* this.knightMoves(board);
        }
    }

    private get initialPosiition(): Position {
        return this.color == "w" ? PositionHelper.whiteKingInitPosition : PositionHelper.blackKingInitPosition;
    }

    private get isInitialPosition(): boolean {
        if (this.position == null) return false;
        else return this.position[0] == 8
            && (this.color == "w" && this.position[1] == 1 || this.color == "b" && this.position[1] == 27);
    }
}

export class Queen extends Piece {
    public readonly key;
    public readonly symbol = "D";
    public readonly value = 15;

    constructor(color: PieceColor)
    constructor(color: PieceColor, column: Column, line: Line)
    constructor(color: PieceColor, column?: Column, line?: Line) {
        super(color);
        this.key = color + this.symbol;
        if (column !== undefined) {
            assertCondition(csty.isColumn(column));
            assertNonNullish(line, "line of the column");
            super.setPositionTo(PositionHelper.fromBoardPosition(column, line, true));
        }
    }

    public * moves(board: IBoard) {
        yield* this.orthogonalMoves(board);
        yield* this.diagonalMoves(board);
    }

    public canMoveTo(board: IBoard, p: Position): boolean {
        return super.canMoveOrthogonallyTo(board, p) || super.canMoveDiagonallyTo(board, p);
    }

    public markThreats(board: IBoard): void {
        for (const p of this.orthogonalMoves(board, true)) {
            board.setThreat(p, this.color);
        }
        for (const p of this.diagonalMoves(board, true)) {
            board.setThreat(p, this.color);
        }
    }
}

export class Wyvern extends Piece {
    public readonly key;
    public readonly symbol = "V";
    public readonly value = 14;

    constructor(color: PieceColor)
    constructor(color: PieceColor, column: Column, line: Line)
    constructor(color: PieceColor, column?: Column, line?: Line) {
        super(color);
        this.key = color + this.symbol;
        if (column !== undefined) {
            assertCondition(csty.isColumn(column));
            assertNonNullish(line, "line of the column");
            super.setPositionTo(PositionHelper.fromBoardPosition(column, line, true));
        }
    }

    public * moves(board: IBoard) {
        yield* this.orthogonalMoves(board);
        yield* this.knightMoves(board);
    }

    public canMoveTo(board: IBoard, p: Position): boolean {
        return super.canMoveOrthogonallyTo(board, p) ||
            PositionHelper.positionIteratorIncludes(this.knightMoves(board), p);
    }

    public markThreats(board: IBoard): void {
        for (const p of this.orthogonalMoves(board, true)) {
            board.setThreat(p, this.color);
        }
        for (const p of this.knightMoves(board, true)) {
            board.setThreat(p, this.color);
        }
    }
}

export class Rook extends Piece {

    public readonly key;
    public readonly symbol = "R";
    public readonly value = 11;
    private _moved: boolean;

    constructor(color: PieceColor, grand: boolean, n: number)
    constructor(color: PieceColor, grand: boolean, column: Column, line: Line)
    constructor(color: PieceColor, grand: boolean, columnOrNumber: Column | number, line?: Line) {
        super(color);
        if (line !== undefined) {
            assertCondition(csty.isColumn(columnOrNumber));
            super.setPositionTo(PositionHelper.fromBoardPosition(columnOrNumber, line, true));
            this.key = color + this.symbol +
                (this.isKingSide(grand) ? "k" : this.isQueenSide(grand) ? "q" : (columnOrNumber + line));
            // first moved heuristic aprox; but needs castlingStatus
            this._moved = !this.isKingSide(grand) && !this.isQueenSide(grand);
        } else {
            assertCondition(typeof columnOrNumber == "number", `instance number of piece ${this.symbol}`);
            this.key = color + this.symbol + columnOrNumber;
            this._moved = false;
        }
    }

    public setPositionTo(pos: Position) {
        super.setPositionTo(pos);
        // first moved heuristic aprox; but needs castlingStatus
        this._moved = !this.isQueenSide(false) && !this.isKingSide(false)
            && !this.isQueenSide(true) && !this.isKingSide(true);
    }

    public isQueenSide(grand: boolean): boolean {
        if (this.position == null) return false;
        else if (grand)
            return this.position[0] == 3 && (this.color == "w" ? this.position[1] == 4 : this.position[1] == 24);
        else
            return this.position[0] == 4 && (this.color == "w" ? this.position[1] == 3 : this.position[1] == 25);
    }

    public isKingSide(grand: boolean): boolean {
        if (this.position == null) return false;
        else if (grand)
            return this.position[0] == 11 && (this.color == "w" ? this.position[1] == 4 : this.position[1] == 24);
        else
            return this.position[0] == 10 && (this.color == "w" ? this.position[1] == 3 : this.position[1] == 25);
    }

    public * moves(board: IBoard) {
        yield* this.orthogonalMoves(board);
    }

    public moveTo(c: ColumnIndex, l: Line): void {
        super.moveTo(c, l);
        this._moved = true;
    }

    public canMoveTo(board: IBoard, p: Position, capture = true): boolean {
        return super.canMoveOrthogonallyTo(board, p, capture);
    }

    public markThreats(board: IBoard): void {
        for (const p of this.orthogonalMoves(board, true)) {
            board.setThreat(p, this.color);
        }
    }

    public setCastlingStatus(value: CastlingStatus, grand: boolean) {
        this._moved = this.isQueenSide(grand) ? !value.startsWith("R")
            : this.isKingSide(grand) ? !value.endsWith("R")
                : true;
    }

    public get moved(): boolean {
        return this._moved;
    }

}

export class Pegasus extends Piece {
    public readonly key;
    public readonly symbol = "G";
    public readonly value = 8;

    constructor(color: PieceColor, n: number)
    constructor(color: PieceColor, column: Column, line: Line)
    constructor(color: PieceColor, columnOrNumber: Column | number, line?: Line) {
        super(color);
        if (line !== undefined) {
            assertCondition(csty.isColumn(columnOrNumber));
            super.setPositionTo(PositionHelper.fromBoardPosition(columnOrNumber, line, true));
            this.key = color + this.symbol + columnOrNumber + line;
        } else {
            assertCondition(typeof columnOrNumber == "number", `instance number of piece ${this.symbol}`);
            this.key = color + this.symbol + columnOrNumber;
        }
    }

    public * moves(board: IBoard) {
        yield* this.diagonalMoves(board);
        yield* this.knightMoves(board);
    }

    public canMoveTo(board: IBoard, p: Position): boolean {
        return super.canMoveDiagonallyTo(board, p) ||
            PositionHelper.positionIteratorIncludes(this.knightMoves(board), p);
    }

    public markThreats(board: IBoard): void {
        for (const p of this.diagonalMoves(board, true)) {
            board.setThreat(p, this.color);
        }
        for (const p of this.knightMoves(board, true)) {
            board.setThreat(p, this.color);
        }
    }
}

export class Knight extends Piece {
    public readonly key;
    public readonly symbol = "N";
    public readonly value = 4;

    constructor(color: PieceColor, n: number)
    constructor(color: PieceColor, column: Column, line: Line)
    constructor(color: PieceColor, columnOrNumber: Column | number, line?: Line) {
        super(color);
        if (line !== undefined) {
            assertCondition(csty.isColumn(columnOrNumber));
            super.setPositionTo(PositionHelper.fromBoardPosition(columnOrNumber, line, true));
            this.key = color + this.symbol + columnOrNumber + line;
        } else {
            assertCondition(typeof columnOrNumber == "number", `instance number of piece ${this.symbol}`);
            this.key = color + this.symbol + columnOrNumber;
        }
    }

    public * moves(board: IBoard): Generator<Position, void, void> {
        yield* this.knightMoves(board);
        if (this.position != undefined && this.pin == null) {
            for (const d of cscnv.knightDirections()) {
                const pos = PositionHelper.knightJump(this.position, d);
                if (pos != null && board.hasPiece(pos) == null) {
                    const pride = PositionHelper.knightJump(pos, d);
                    if (pride != null && board.hasPiece(pride) == null) yield pride;
                }
            }
        }
    }

    public canCaptureOn(board: IBoard, p: Position): boolean {
        return PositionHelper.positionIteratorIncludes(this.knightMoves(board), p);
    }

    public markThreats(board: IBoard): void {
        for (const p of this.knightMoves(board, true)) {
            board.setThreat(p, this.color);
        }
    }
}

export class Bishop extends Piece {
    public readonly key;
    public readonly symbol = "J";
    public readonly value = 3;
    public readonly hexesColor: HexColor;

    constructor(color: PieceColor, bishopHexColor: HexColor)
    constructor(color: PieceColor, column: Column, line: Line)
    constructor(color: PieceColor, columnOrHexcolor: Column | HexColor, line?: Line) {
        super(color);
        if (line !== undefined) {
            assertCondition(csty.isColumn(columnOrHexcolor));
            super.setPositionTo(PositionHelper.fromBoardPosition(columnOrHexcolor, line, true));
            this.hexesColor = PositionHelper.hexColor(this.position!);
        } else if (csty.isHexColor(columnOrHexcolor)) {
            this.hexesColor = columnOrHexcolor;
        } else throw new TypeError("Bishop constructor error");
        this.key = color + this.symbol + this.hexesColor;
    }

    public * moves(board: IBoard) {
        yield* super.diagonalMoves(board);
    }

    public canMoveTo(board: IBoard, p: Position): boolean {
        return super.canMoveDiagonallyTo(board, p);
    }

    public markThreats(board: IBoard): void {
        for (const p of super.diagonalMoves(board, true)) {
            board.setThreat(p, this.color);
        }
    }
}

export class Elephant extends Piece {
    public readonly key;
    public readonly symbol = "E";
    public readonly value = 2;

    constructor(color: PieceColor, column: Column, line: Line) {
        super(color);
        assertCondition(csty.isColumn(column));
        super.setPositionTo(PositionHelper.fromBoardPosition(column, line, true));
        this.key = color + this.symbol + column + line;
    }

    public * moves(board: IBoard, defend: boolean = false) {
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
                            if (pieceColor2 == null || defend || pieceColor2 != this.color) yield p2;
                        }
                    } else if (defend || pieceColor != this.color) yield p;
                }
            }
            for (const d of ["LineUp", "LineInvUp", "LineDown", "LineInvDown"] as const) {
                if (pin == null || (pin as Direction[]).includes(d)) {
                    const diagP = PositionHelper.diagonalStep(piecePos, d as DiagonalDirection);
                    if (diagP != null) {
                        const pieceColor = board.hasPiece(diagP);
                        if (pieceColor == null || defend || pieceColor != this.color) yield diagP;
                    }
                }
            }
        }
    }

    public markThreats(board: IBoard): void {
        for (const p of this.moves(board, true)) {
            board.setThreat(p, this.color);
        }
    }

    private get ownOrthogonalDirection(): OrthogonalDirection {
        return this.color === 'w' ? "ColumnUp" : "ColumnDown";
    }

}

export class Almogaver extends Piece {
    public readonly key;
    public readonly symbol = "M";
    public readonly value = 2;

    constructor(color: PieceColor, column: Column, line: Line) {
        super(color);
        assertCondition(csty.isColumn(column));
        super.setPositionTo(PositionHelper.fromBoardPosition(column, line, true));
        this.key = color + this.symbol + column + line;
    }

    public * moves(board: IBoard, onlyCaptures: boolean = false, defends: boolean = false) {
        const piecePos = this.position;
        if (piecePos != null) {
            const pin = this.pin;
            if (!onlyCaptures) {
                for (const direction of cscnv.orthogonalDirections()) {
                    if (pin == null || (pin as Direction[]).includes(direction)) {
                        const pos = PositionHelper.orthogonalStep(piecePos, direction);
                        if (pos != undefined && board.hasPiece(pos) == null) {
                            const pos2 = PositionHelper.orthogonalStep(pos, direction);
                            if (pos2 != undefined && board.hasPiece(pos2) == null) yield pos2;
                        }
                    }
                }
            }
            for (const direction of cscnv.diagonalDirections()) {
                if (pin == null || (pin as Direction[]).includes(direction)) {
                    const pos = PositionHelper.diagonalStep(piecePos, direction);
                    if (pos != undefined) {
                        const pieceColor: Nullable<PieceColor> = board.hasPiece(pos);
                        if (pieceColor != null) {
                            if (pieceColor !== this.color || defends) yield pos;
                        }
                    }
                }
            }
        }
    }

    public canCaptureOn(board: IBoard, p: Position): boolean {
        return PositionHelper.positionIteratorIncludes(this.moves(board, true, false), p);
    }

    public markThreats(board: IBoard): void {
        for (const p of this.moves(board, true, true)) {
            board.setThreat(p, this.color);
        }
    }

}

export class Pawn extends Piece {
    public readonly key;
    public readonly symbol = "P";
    public readonly value = 1;

    constructor(color: PieceColor, column: Column, line: Line) {
        super(color);
        assertCondition(csty.isColumn(column));
        super.setPositionTo(PositionHelper.fromBoardPosition(column, line, true));
        this.key = color + this.symbol + column + line;
    }

    public * moves(board: IBoard, onlyCaptures: boolean = false, defend: boolean = false) {
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
                                if (p3 != null && board.hasPiece(p3) == null) yield p3;
                            }
                        }
                    }
                }
                for (const d of this.ownOrthogonalAlternateDirections) {
                    if (pin == null || (pin as Direction[]).includes(d)) {
                        const p = PositionHelper.orthogonalStep(pawnPos, d);
                        if (p != null && board.hasPiece(p) == null)
                            yield p;
                    }
                }
            }
            const specialCapture = board.specialPawnCapture;
            if (specialCapture != null && specialCapture.isScornfulCapturable() && specialCapture.isScorned(this)) {
                if (this.pin == null) yield specialCapture.capturablePiece.position!;
                else {
                    const captureDirection = PositionHelper.isOrthogonally(pawnPos, specialCapture.capturablePiece.position!);
                    if (captureDirection != null && (this.pin as Direction[]).includes(captureDirection))
                        yield specialCapture.capturablePiece.position!; //pawn, this case
                }
            }
            for (const d of this.ownCaptureDirections) {
                if (pin == null || (pin as Direction[]).includes(d)) {
                    const p = PositionHelper.diagonalStep(pawnPos, d);
                    if (p != null) {
                        const pieceColor = board.hasPiece(p);
                        if (pieceColor != null) {
                            if (defend || pieceColor != this.color) yield p;
                        } else if (specialCapture != null && specialCapture.isEnPassantCapturable() && specialCapture.isEnPassantCapture(p)) yield p;
                    }
                }
            }
        }
    }

    public promoteTo(piece: Piece) {
        assertNonNullish(this.position, "Pawn to promote is not captured");
        assertCondition(PositionHelper.isPromotionHex(this.position, this.color), `Promotion hex ${PositionHelper.toString(this.position)}`);
        piece.setPositionTo(this.position!);
        this.captured();
    }

    public get awaitingPromotion(): Nullable<HexColor> {
        if (this.position != null)
            return PositionHelper.isPromotionHex(this.position, this.color) ? PositionHelper.lineHexColor(this.position[1]) : null;
        else return null;
    }

    public canCaptureOn(board: IBoard, p: Position): boolean {
        return PositionHelper.positionIteratorIncludes(this.moves(board, true, false), p);
    }

    public markThreats(board: IBoard): void {
        for (const p of this.moves(board, true, true)) {
            board.setThreat(p, this.color);
        }
    }

    public hasTripleStep(grand: boolean): boolean {
        const p = this.position;
        if (p != null) {
            const c = p[0];
            if (c > 3 && c < 7 || c == 3 && !grand) {
                return p[1] == (this.color == "w" ? c + 1 : 27 - c);
            } else if (c > 7 && c < 11 || c == 11 && !grand) {
                return p[1] == (this.color == "w" ? 15 - c : 13 + c);
            } else if (grand) {
                if (c == 2 || c == 12) return p[1] == (this.color == "w" ? 5 : 23);
                else if (c == 3 || c == 11) return p[1] == (this.color == "w" ? 6 : 22);
                else return false;
            }
            else return false;
        } else return false;
    }

    private get ownOrthogonalStraightDirection(): OrthogonalDirection {
        return this.color === 'w' ? "ColumnUp" : "ColumnDown";
    }

    private get ownOrthogonalAlternateDirections(): [OrthogonalDirection, OrthogonalDirection] {
        return this.color === 'w' ? ["FileUp", "FileInvUp"] : ["FileDown", "FileInvDown"];
    }

    private get ownCaptureDirections(): [DiagonalDirection, DiagonalDirection] {
        return this.color == 'w' ? ["LineUp", "LineInvUp"] : ["LineDown", "LineInvDown"];
    }


}

export namespace csPieceTypes {
    export function isKing(p: Piece): p is King { return p.symbol == 'K'; }
    export function isQueen(p: Piece): p is Queen { return p.symbol == 'D'; }
    export function isWyvern(p: Piece): p is Wyvern { return p.symbol == 'V'; }
    export function isRook(p: Piece): p is Rook { return p.symbol == 'R'; }
    export function isPegasus(p: Piece): p is Pegasus { return p.symbol == 'G'; }
    export function isKnight(p: Piece): p is Knight { return p.symbol == 'N'; }
    export function isBishop(p: Piece): p is Bishop { return p.symbol == 'J'; }
    export function isElephant(p: Piece): p is Elephant { return p.symbol == 'E'; }
    export function isPawn(p: Piece): p is Pawn { return p.symbol == 'P'; }
    export function isAlmogaver(p: Piece): p is Almogaver { return p.symbol == 'M'; }
}
