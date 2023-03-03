import type {
    Position, Turn, Side, CastlingColumn, CastlingStatus, PieceKey, EndGame, CheckNotation
} from "./cescacs.types";
import type { Nullable } from "./ts.general";

import { csTypes as csty, csConvert as cscnv } from "./cescacs.types";
import { PositionHelper } from "./cescacs.positionHelper";


export type MoveInfo = csMoves.Castling | csMoves.Promotion | csMoves.Move | csMoves.Capture;
export type CastlingSide = Side | "R";

export interface UndoStatus {
    readonly n: number;
    readonly turn: Turn;
    readonly move: MoveInfo | '\u2026';
    readonly iHMClock?: '1'; /* initHalfMoveClock */
    readonly castlingStatus?: CastlingStatus;
    readonly specialCapture?: string; /* specialPawnCapture */
    readonly fixedNumbering?: '?';
}

export interface UndoStatusWhithCheckInfo extends UndoStatus {
    readonly end?: EndGame;
    readonly check?: CheckNotation;
}

export function isUndoStatus(st: any): st is UndoStatus {
    return st.n !== undefined && typeof st.n == 'number'
    && st.turn !== undefined && csty.isTurn(st.turn)
    && st.move !== undefined && (st.move == '\u2026' || csMoves.isMoveInfo(st.move) 
        || csMoves.isCastlingInfo(st.move) || csMoves.isPromotionInfo(st.move))
    && (st.iHMClock === undefined || st.iHMClock == '1')
    && (st.castlingStatus === undefined || csty.isCastlingStatus(st.castlingStatus))
    && (st.specialPawnCapture === undefined 
        || (typeof st.specialPawnCapture == 'string' && st.specialPawnCapture.indexOf('@') > 0))
    && (st.fixedNumbering === undefined || st.fixedNumbering == '?')
}

export function undoStatusEquals(a: UndoStatusWhithCheckInfo, b: UndoStatusWhithCheckInfo): boolean {
    return a.n == b.n && a.turn == b.turn
        && ((a.move == '\u2026' && b.move == '\u2026')
            || (a.move != '\u2026' && b.move != '\u2026' && csMoves.equals(a.move, b.move)))
        && a.iHMClock == b.iHMClock
        && a.castlingStatus == b.castlingStatus
        && a.specialCapture == b.specialCapture
        && a.fixedNumbering == b.fixedNumbering
        && a.end == b.end && a.check == b.check;
}

export function undoStatusArrayEquals(a: UndoStatusWhithCheckInfo[], b: UndoStatusWhithCheckInfo[]): boolean {
    return a.every((val, index) => undoStatusEquals(val, b[index]));
}

export namespace csMoves {

    export function promoteUndoStatus(value: UndoStatus, end?: EndGame, check?: CheckNotation): UndoStatusWhithCheckInfo {
        const untypedValue = value as Record<string, any>;
        if (end !== undefined) untypedValue["end"] = end;
        if (check !== undefined) untypedValue["check"] = check;
        return untypedValue as UndoStatusWhithCheckInfo;
    }

    export interface Castling {
        readonly side: CastlingSide;
        readonly col: CastlingColumn;
        readonly rPos: Position;
        readonly kRook: PieceKey | undefined;
        readonly qRook: PieceKey | undefined;
        readonly r2Pos: Position | undefined;
    }

    export function isCastlingSide(side: any): side is CastlingSide {
        return (typeof side === 'string') && (side === 'K' || side === 'D' || side === 'R');
    }

    export function isCastlingInfo(mov: any): mov is Castling {
        return mov.side !== undefined && isCastlingSide(mov.side)
            && mov.col !== undefined && csty.isCastlingColumn(mov.col)
            && mov.rPos !== undefined && csty.isPosition(mov.rPos)
            && (mov.side === 'D' || mov.kRook !== undefined && cscnv.getPieceKeyName(mov.kRook) == 'R')
            && (mov.side === 'K' || mov.qRook !== undefined && cscnv.getPieceKeyName(mov.qRook) == 'R')
            && (mov.side != 'R' || mov.r2Pos !== undefined && csty.isPosition(mov.r2Pos));
    }

    export interface Promotion {
        readonly piece: PieceKey;
        readonly prPos: Position;
        readonly promoted: PieceKey;
    }

    export function isPromotionInfo(mov: any): mov is Promotion {
        return mov.piece !== undefined
            && mov.prPos !== undefined && csty.isPosition(mov.prPos)
            && mov.promoted !== undefined;
    }

    export interface Move {
        readonly piece: PieceKey;
        readonly pos: Position;
        readonly moveTo: Position;
    }

    export function isMoveInfo(mov: any): mov is Move {
        return mov.piece !== undefined
            && mov.pos !== undefined && csty.isPosition(mov.pos)
            && mov.moveTo !== undefined && csty.isPosition(mov.moveTo);
    }

    export interface Capture extends Move {
        readonly captured: PieceKey;
        readonly special: Position | undefined;
    }

    export function isCaptureInfo(mov: any): mov is Capture {
        return mov.captured !== undefined
            && (mov.special === undefined || csty.isPosition(mov.special));
    }

    export function fullMoveNotation(info: UndoStatusWhithCheckInfo, mvNum: boolean = true): string {
        const preStr = mvNum && info.turn == 'w' ? info.n + (info.fixedNumbering === undefined ? '. ' : '? ') : "";
        if (info.move == '\u2026') return preStr + '\u2026';
        else {
            const postStr = info.check ?? ((info.end == "mate") ? "#" : "");
            return preStr + csMoves.moveNotation(info.move) + postStr;
        }
    }

    export function endText(info: UndoStatusWhithCheckInfo, turn: Turn) {
        if (info.end === undefined) return "";
        else {
            switch (info.end) {
                case "mate":
                case "resigned": return turn == "b" ? "3 - 0" : "0 - 3";
                case "stalemate": return turn == "b" ? "2 - 1" : "1 - 2";
                case "draw": return "1 - 1";
                default: {
                    const exhaustiveCheck: never = info.end;
                    throw new Error(exhaustiveCheck);
                }
            }
        }
    }

    export function undoStatusId(info: UndoStatus): string {
        return info.move == '\u2026' ? "" : info.turn + info.n;
    }

    export function moveNotation(info: MoveInfo): string {
        if (csMoves.isCastlingInfo(info)) {
            const tail = info.r2Pos !== undefined ? cscnv.columnFromIndex(info.r2Pos[0])
                : (info.side == 'K' && info.col == 'H' && info.rPos[0] == 10) ?
                    (info.rPos[1] == 5 || info.rPos[1] == 23 ? 'O' : info.rPos[1] == 7 || info.rPos[1] == 21 ? 'OO' : "")
                    : "";
            return "KR" + info.side + "-" + info.col + cscnv.columnFromIndex(info.rPos[0]) + tail;
        } else if (csMoves.isMoveInfo(info)) {
            const symbol = cscnv.getPieceKeyName(info.piece);
            const pre = (symbol == 'P' ? "" : symbol) + PositionHelper.toString(info.pos);
            const post = isPromotionInfo(info) ? "=" + cscnv.getPieceKeyName(info.promoted) : "";
            let sep: string;
            if (isCaptureInfo(info)) {
                if (info.special !== undefined) {
                    sep = PositionHelper.equals(info.moveTo, info.special)
                        || Math.abs(info.special[1] - info.moveTo[1]) <= 2 ? "@" : "@@";
                } else {
                    sep = "\u00D7";
                }
                const capSymbol = cscnv.getPieceKeyName(info.captured);
                if (capSymbol != 'P') sep += capSymbol;
            } else sep = "-";
            return pre + sep + PositionHelper.toString(info.moveTo) + post;
        } else if (csMoves.isPromotionInfo(info)) {
            return PositionHelper.toString(info.prPos) + "=" + cscnv.getPieceKeyName(info.promoted);
        } else {
            throw new TypeError("must be a move notation");
        }
    }

    export function equals(a: MoveInfo, b: MoveInfo): boolean {
        if (isMoveInfo(a) && isMoveInfo(b)) {
            return a.piece == b.piece
                && PositionHelper.equals(a.pos, b.pos)
                && PositionHelper.equals(a.moveTo, b.moveTo);
        } else if (isPromotionInfo(a) && isPromotionInfo(b)) {
            return a.piece == b.piece
                && a.promoted == b.promoted
                && PositionHelper.equals(a.prPos, b.prPos);
        } else if (isCastlingInfo(a) && isCastlingInfo(b)) {
            return a.side == b.side
                && a.col == b.col
                && PositionHelper.equals(a.rPos, b.rPos)
                && a.kRook == b.kRook && a.qRook == b.qRook;
        } else return false;

    }

}