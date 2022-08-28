
const _column = ['P', 'T', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'K', 'L', 'X', 'Z'] as const;
const _castlingColumn = ['D', 'E', 'F', 'H', 'I'] as const;
const _orthogonalDirection = ["ColumnUp", "ColumnDown", "FileUp", "FileDown", "FileInvUp", "FileInvDown"] as const;
const _diagonalDirection = ["TransversalLineInc", "TransversalLineDec", "LineUp", "LineDown", "LineInvUp", "LineInvDown"] as const;
const _knightDirection = ["TransversalLineInc-FileUp", "TransversalLineInc-FileDown", "TransversalLineDec-FileInvUp", "TransversalLineDec-FileInvDown",
    "LineUp-FileUp", "LineUp-ColumnUp", "LineDown-FileDown", "LineDown-ColumnDown",
    "LineInvUp-FileInvUp", "LineInvUp-ColumnUp", "LineInvDown-FileInvDown", "LineInvDown-ColumnDown"] as const;

const _orthogonalOrientation = [["ColumnUp", "ColumnDown"], ["FileUp", "FileInvDown"], ["FileInvUp", "FileDown"]] as
             readonly [[OrthogonalDirection, OrthogonalDirection], [OrthogonalDirection, OrthogonalDirection], [OrthogonalDirection, OrthogonalDirection]];
const _diagonalOrientation = [["TransversalLineInc", "TransversalLineDec"], ["LineUp", "LineInvDown"], ["LineInvUp", "LineDown"]] as
            readonly [[DiagonalDirection, DiagonalDirection], [DiagonalDirection, DiagonalDirection], [DiagonalDirection, DiagonalDirection]];
const _hexColor = ["Black", "White", "Color"] as const;
const _turn = ["w", "b"] as const;
const _pieceName = ["K", "D", "V", "R", "G", "N", "J", "E", "M", "P"] as const;
const _castlingStatus = ["RKR", "RK", "KR", "K", "-"] as const;


export type Nullable<T> = T | undefined | null;
// Construct the type as the types of the properties of the type array whose keys are of type number (all ones)
export type Column = (typeof _column)[number];
export type ColumnIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
export type Line = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28;
export type Position = [ColumnIndex, Line];
export type OrthogonalDirection = (typeof _orthogonalDirection)[number];
export type DiagonalDirection = (typeof _diagonalDirection)[number];
export type KnightDirection = (typeof _knightDirection)[number];
export type DirectionMoveRange = 0 | 1 | 2 | 3 | 4 | 5;
export type DirectionFullMoveRange = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
export type OrthogonalOrientation = (typeof _orthogonalOrientation)[number];
export type DiagonalOrientation = (typeof _diagonalOrientation)[number];
export type Direction = OrthogonalDirection | DiagonalDirection;
export type Orientation = OrthogonalOrientation | DiagonalOrientation;
export type ScornfulCaptureDirection = "FileUp" | "FileDown" | "FileInvUp" | "FileInvDown";
export type CastlingColumn = (typeof _castlingColumn)[number];
export type HexColor = (typeof _hexColor)[number];
export type PieceName = (typeof _pieceName)[number];
export type PieceColor = "White" | "Black";
export type Turn = (typeof _turn)[number];
export type CastlingStatus = (typeof _castlingStatus)[number];
export type KnightOrCloseCheck = Position;
export type DoubleCheck = [Position, Position, Nullable<Orientation>];
export interface SingleCheck { d: Direction, p: Position };

// Type predicates
export namespace csTypes {
    export const isNumber = (x: any): x is Number => typeof x === "number" && !isNaN(x);
    export const isColumn = (x: any): x is Column => _column.includes(x);
    export const isColumnIndex = (x: any): x is ColumnIndex => isNumber(x) && Number.isInteger(x) && x >= 0 && x <= 14;
    export const isLine = (x: any): x is Line => isNumber(x) && Number.isInteger(x) && x >= 0 && x <= 28;
    export const isPosition = (x: any): x is Position => Array.isArray(x) && x.length == 2 && isColumnIndex(x[0]) && isLine(x[1]);
    export const isOrthogonalDirection = (x: any): x is OrthogonalDirection => _orthogonalDirection.includes(x);
    export const isDiagonalDirection = (x: any): x is DiagonalDirection => _diagonalDirection.includes(x);
    export const isKnightDirection = (x: any): x is KnightDirection => _knightDirection.includes(x);
    export const iscastlingColumn = (x: any): x is Column => _castlingColumn.includes(x);
    export const isDirectionMoveRange = (x: any): x is DirectionMoveRange => isNumber(x) && Number.isInteger(x) && x >= 0 && x <= 5;
    export const isDirectionFullMoveRange = (x: any): x is DirectionFullMoveRange => isNumber(x) && Number.isInteger(x) && x >= 0 && x <= 11;
    export const isOrthogonalOrientation = (x: any): x is OrthogonalOrientation =>
        Array.isArray(x) && _orthogonalOrientation.some(y => y[0] == x[0] && y[1] == x[1]);
    export const isDiagonalOrientation = (x: any): x is DiagonalOrientation =>
        Array.isArray(x) && _diagonalOrientation.some(y => y[0] == x[0] && y[1] == x[1]);
    export const isHexColor = (x: any): x is HexColor => _hexColor.includes(x);
    export const isPieceName = (x: any): x is PieceName => _pieceName.includes(x);
    export const isTurn = (x: any): x is Turn => _turn.includes(x);
    export const isCastlingStatus = (x: any): x is CastlingStatus => _castlingStatus.includes(x);
    export const isSingleCheck = (x: unknown): x is SingleCheck => Object.prototype.hasOwnProperty.call(x, "d") && Object.prototype.hasOwnProperty.call(x, "p");
    export const isDoubleCheck = (x: unknown): x is DoubleCheck => Array.isArray(x) && length == 3 && isPosition(x[0]) && isPosition(x[1]) && 
        (x[2] == null || isOrthogonalOrientation(x[2]) || isDiagonalOrientation(x[2]));
    export const hasDoubleCheckPin = (x: unknown): x is DoubleCheck => Array.isArray(x) && length == 3 && isPosition(x[0]) && isPosition(x[1]) &&
        x[2] != null && (isOrthogonalOrientation(x[2]) || isDiagonalOrientation(x[2]));
}

// Conversions
export namespace csConvert {
    export const columnFromIndex = (i: ColumnIndex): Column => _column[i];
    export const toColumnIndex = (column: Column): ColumnIndex => _column.indexOf(column) as ColumnIndex;
    export const toOrthogonalDirectionIndex = (direction: OrthogonalDirection): DirectionMoveRange => _orthogonalDirection.indexOf(direction) as DirectionMoveRange;
    export const orthogonalDirectionFromIndex = (i: DirectionMoveRange): OrthogonalDirection => _orthogonalDirection[i];
    export const toDiagonalDirectionIndex = (direction: DiagonalDirection): DirectionMoveRange => _diagonalDirection.indexOf(direction) as DirectionMoveRange;
    export const diagonalDirectionFromIndex = (i: DirectionMoveRange): DiagonalDirection => _diagonalDirection[i];
    export const toKnightDirectionIndex = (direction: KnightDirection): DirectionFullMoveRange => _knightDirection.indexOf(direction) as DirectionFullMoveRange;
    export const knightDirectionFromIndex = (i: DirectionFullMoveRange): KnightDirection => _knightDirection[i];
    export function getOrthogonalOrientation(d: OrthogonalDirection): OrthogonalOrientation {
        switch (d) {
            case "ColumnUp":
            case "ColumnDown": return ["ColumnUp", "ColumnDown"];
            case "FileUp":
            case "FileInvDown": return ["FileUp", "FileInvDown"];
            case "FileInvUp":
            case "FileDown": return ["FileInvUp", "FileDown"];
            default: {
                const exhaustiveCheck: never = d;
                throw new Error(exhaustiveCheck);
            }
        }
    }
    export function getDiagonalOrientation(d: DiagonalDirection): DiagonalOrientation {
        switch (d) {
            case "TransversalLineInc":
            case "TransversalLineDec": return ["TransversalLineInc", "TransversalLineDec"];
            case "LineUp":
            case "LineInvDown": return ["LineUp", "LineInvDown"];
            case "LineInvUp":
            case "LineDown": return ["LineInvUp", "LineDown"];
            default: {
                const exhaustiveCheck: never = d;
                throw new Error(exhaustiveCheck);
            }
        }
    }
    export function * orthogonalDirections() { for (const d of _orthogonalDirection) yield d; }
    export function * diagonalDirections() { for (const d of _diagonalDirection) yield d; }
    export function * knightDirections() { for (const d of _knightDirection) yield d; }
}

