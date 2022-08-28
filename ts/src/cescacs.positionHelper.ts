import type {
    Nullable, Column, ColumnIndex, Line, Position,
    OrthogonalDirection, DiagonalDirection, KnightDirection,
    HexColor, PieceColor
} from "./cescacs.types";
import { csTypes as csty, csConvert as cscnv } from "./cescacs.types";

export abstract class PositionHelper {

    public static equals(p1: Position, p2: Position): boolean {
        return p1[0] === p2[0] && p1[1] === p2[1];
    }

    public static toString(pos: Position): string {
        return cscnv.columnFromIndex(pos[0]) + pos[1].toString();
    }

    public static positionKey(k: Position): string {
        return k[0].toString() + "-" + k[1].toString(); // k.toString();
    }

    public static parse(coord: string): Position {
        if (coord) {
            const strCoord = coord.trim().toUpperCase();
            const l = strCoord.length;
            if (l >= 2 && l <= 3) {
                const column = strCoord[0] as Column;
                if (csty.isColumn(column)) {
                    const line = parseInt(strCoord.slice(1)) as Line;
                    if (csty.isLine(line)) {
                        return [cscnv.toColumnIndex(column), line];
                    } else throw new RangeError(`Invalid line value: ${line}`);
                } else throw new RangeError(`Invalid column: ${column}`);
            } else throw new RangeError(`Invalid coordinates leght: ${strCoord}`);
        } else throw new RangeError("Empty string for coordinates value");
    }

    public static fromBoardPosition(column: Column, line: Line, check?: boolean): Position
    public static fromBoardPosition(column: ColumnIndex, line: Line, check?: boolean): Position
    public static fromBoardPosition(column: Column | ColumnIndex, line: Line, check: boolean = false): Position {
        if (csty.isColumn(column)) { column = cscnv.toColumnIndex(column); }
        const pos: Position = [column, line];
        if (check && !PositionHelper.isValidPosition(pos)) throw new RangeError(`Invalid position: ${pos}`);
        else return pos;
    }

    public static isValidPosition(p: Position): p is Position {
        return csty.isPosition(p)
            && PositionHelper.isEvenLinesColumnIndex(p[0]) == (p[1] % 2 == 0)
            && PositionHelper.isOnBoard(p[0], p[1]);
    }

    public static get whiteKingInitPosition(): Position { return [8, 1]; }
    public static get blackKingInitPosition(): Position { return [8, 27]; }

    public static initialQueenSideRookPosition(color: PieceColor, grand: boolean): Position {
        if (grand) return color == "White" ? [3, 4] : [3, 24];
        else return color == "White" ? [4, 3] : [4, 25];
    }

    public static initialKingSideRookPosition(color: PieceColor, grand: boolean): Position {
        if (grand) return color == "White" ? [11, 4] : [11, 24];
        else return color == "White" ? [10, 3] : [10, 25];
    }

    public static isPromotionPos(c: ColumnIndex, l: Line, color: PieceColor): boolean {
        return l == (c <= 7 ? (color == "White" ? 21 + c : 7 - c) : (color == "White" ? 35 - c : c - 7));
    }

    public static isPromotionHex(pos: Position, color: PieceColor): boolean {
        const c = pos[0];
        return pos[1] == (c <= 7 ? (color == "White" ? 21 + c : 7 - c) : (color == "White" ? 35 - c : c - 7));
    }

    public static hexColor(p: Position): HexColor {
        return PositionHelper.lineHexColor(p[1]);
    }

    public static lineHexColor(line: Line): HexColor {
        switch (line % 3) {
            case 0: return "Black";
            case 1: return "White";
            case 2: return "Color";
            default: throw new Error();
        }
    }

    public static isOrthogonally(from: Position, to: Position): Nullable<OrthogonalDirection> {
        const dif = [to[0] - from[0], to[1] - from[1]];
        if (dif[0] == 0) {
            if (dif[1] == 0) return null;
            else if (dif[1] % 2 == 0)
                return dif[1] > 0 ? "ColumnUp" : "ColumnDown";
            else return null;
        } else if (dif[0] > 0) {
            if (dif[0] == dif[1]) return "FileUp";
            else if (dif[0] == -dif[1]) return "FileDown";
            else return null;
        } else {
            if (dif[0] == dif[1]) return "FileInvDown";
            else if (dif[0] == -dif[1]) return "FileInvUp";
            else return null;
        }
    }

    public static isDiagonally(from: Position, to: Position): Nullable<DiagonalDirection> {
        const dif = [to[0] - from[0], to[1] - from[1]];
        if (dif[1] == 0) {
            if (dif[0] == 0) return null;
            else if (dif[0] % 2 == 0)
                return dif[0] > 0 ? "TransversalLineInc" : "TransversalLineDec";
            else return null;
        } else {
            const triple = (dif[0] << 1) + dif[0];
            if (dif[0] > 0) {
                if (triple == dif[1]) return "LineUp";
                else if (triple == -dif[1]) return "LineDown";
                else return null;
            } else {
                if (triple == dif[1]) return "LineInvDown";
                else if (triple == -dif[1]) return "LineInvUp";
                else return null;
            }
        }
    }

    public static orthogonalStep(pos: Position, d: OrthogonalDirection): Nullable<Position> {
        const offset = PositionHelper._ORTHOGONAL_MOVES[cscnv.toOrthogonalDirectionIndex(d)];
        return PositionHelper.addOffset(pos, offset);
    }

    public static diagonalStep(pos: Position, d: DiagonalDirection): Nullable<Position> {
        const offset = PositionHelper._DIAGONAL_MOVES[cscnv.toDiagonalDirectionIndex(d)];
        return PositionHelper.addOffset(pos, offset);
    }

    public static * orthogonalRide(pos: Position, d: OrthogonalDirection): Generator<Position, void, void> {
        const offset = PositionHelper._ORTHOGONAL_MOVES[cscnv.toOrthogonalDirectionIndex(d)];
        let newPos = PositionHelper.addOffset(pos, offset);
        while (newPos != null) {
            yield newPos;
            newPos = PositionHelper.addOffset(newPos, offset);
        }
    }

    public static * diagonalRide(pos: Position, d: DiagonalDirection): Generator<Position, void, void> {
        const offset = PositionHelper._DIAGONAL_MOVES[cscnv.toDiagonalDirectionIndex(d)];
        let newPos = PositionHelper.addOffset(pos, offset);
        while (newPos != null) {
            yield newPos;
            newPos = PositionHelper.addOffset(newPos, offset);
        }
    }

    public static * orthogonalMoves(pos: Position): Generator<Position, void, void> {
        for (const offset of PositionHelper._ORTHOGONAL_MOVES) {
            let newPos = this.addOffset(pos, offset);
            while (newPos != null) {
                yield newPos;
                newPos = PositionHelper.addOffset(newPos, offset);
            }
        }
    }

    public static * diagonalMoves(pos: Position): Generator<Position, void, void> {
        for (const offset of PositionHelper._DIAGONAL_MOVES) {
            let newPos = this.addOffset(pos, offset);
            while (newPos != null) {
                yield newPos;
                newPos = PositionHelper.addOffset(newPos, offset);
            }
        }
    }

    public static knightJump(pos: Position, d: KnightDirection): Nullable<Position> {
        const offset = PositionHelper._KNIGHT_MOVES[cscnv.toKnightDirectionIndex(d)];
        return PositionHelper.addOffset(pos, offset);
    }

    public static * knightMoves(pos: Position): Generator<Position, void, void> {
        for (const offset of PositionHelper._KNIGHT_MOVES) {
            const newPos = this.addOffset(pos, offset);
            if (newPos != null) yield newPos;
        }
    }

    public static positionIteratorIncludes(it: Generator<Position, void, void>, value: Position): boolean {
        for (const x of it) {
            if (x[0] === value[0] && x[1] === value[1]) return true;
        }
        return false;
    }

    public static *positionIteratorIntersection(it: Generator<Position, void, void>, positionsSet: Position[]): Generator<Position, void, void> {
        for (const x of it) {
            if (positionsSet.some(y => x[0] === y[0] && x[1] === y[1])) yield x;
        }
    }

    private static _ORTHOGONAL_MOVES = [[0, 2], [0, -2], [1, 1], [1, -1], [-1, 1], [-1, -1]] as const;
    private static _DIAGONAL_MOVES = [[2, 0], [-2, 0], [1, 3], [1, -3], [-1, 3], [-1, -3]] as const;
    private static _KNIGHT_MOVES = [[3, 1], [3, -1], [-3, 1], [-3, -1],
    [2, 4], [1, 5], [2, -4], [1, -5],
    [-2, 4], [-1, 5], [-2, -4], [-1, -5]] as const;

    private static isOnBoard(c: ColumnIndex, l: Line): boolean {
        return c >= 0 && c <= 14
            && (c <= 7 ? (l >= 7 - c && l <= 21 + c) : (l >= c - 7 && l <= 35 - c));
    }

    private static addOffset(pos: Position, offset: Readonly<[number, number]>): Nullable<Position> {
        const c = pos[0] + offset[0] as ColumnIndex;
        const l = pos[1] + offset[1] as Line;
        if (PositionHelper.isOnBoard(c, l)) return [c, l];
        else return null;
    }

    private static isEvenLinesColumnIndex = (i: ColumnIndex): boolean => i % 2 != 0;

    // OPTIMIZED AWAY (NOT USED)
    //
    // public static isEvenLinesColumn(column: Column): boolean {
    //     switch (column) {
    //         case "T": case "B": case "D":
    //         case "F":
    //         case "H": case "K": case "X":
    //             return true;
    //         default: return false;
    //     }
    // }
    //
    // public static isStepFromPromotion(pos: Position, color: PieceColor): boolean {
    //     const c = pos[0];
    //     if (color == "White") return pos[1] >= (c <= 7 ? 17 + c : 31 - c);
    //     else  return pos[1] <= (c <= 7 ? 11 - c : c - 3);
    // }

}