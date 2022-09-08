
import {
    Position, Turn, CastlingColumn, CastlingStatus
} from "./cescacs.types";

import { csTypes as csty, csConvert as cscnv } from "./cescacs.types";
import { PositionHelper } from "./cescacs.positionHelper";
import {
    Piece, King, Rook, Pawn
} from "./cescacs.piece";
import { cspty } from "./cescacs";


export type MoveInfo = csMoves.Castling | csMoves.Promotion | csMoves.Move | csMoves.Capture;
export type CastlingSide = "K" | "D" | "R";

export interface UndoStatus {
    n: number;
    turn: Turn;
    move: MoveInfo;
    initHalfMoveClock: 1 | undefined;
    castlingStatus: CastlingStatus | undefined;
    specialPawnCapture: string | undefined;
    end: "mate" | "stalemate" | "resigned" | "draw" | undefined;
    check: "+" | "^+" | "++" | undefined;
}

export namespace csMoves {

    /* TODO change Piece by PieceKey, a reference to a piece repository
        PieceKey can be the Hex (string) where it'd been created
        Problem: Nowadays Kings are part of Board object; change that would be the first stage
        Moves will have no objects, but key references (allow independent storage)
    */

    export interface Castling {
        side: CastlingSide;
        col: CastlingColumn;
        rPos: Position;
        kRook: Rook | undefined;
        qRook: Rook | undefined;
        r2Pos: Position | undefined;
    }

    export function isCastlingSide(side: any): side is CastlingSide {
        return (typeof side ==='string') && (side === 'K' || side === 'D' || side === 'R');
    }

    export function isCastlingInfo(mov: any): mov is Castling {
        return mov.side !== undefined && isCastlingSide(mov.side)
            && mov.col !== undefined && csty.isCastlingColumn(mov.col)
            && mov.rPos !== undefined && csty.isPosition(mov.rPos)
            && (mov.side === 'D' || mov.kRook !== undefined && mov.kRook instanceof Rook)
            && (mov.side === 'K' || mov.qRook !== undefined && mov.qRook instanceof Rook)
            && (mov.side != 'R' || mov.r2Pos !== undefined && csty.isPosition(mov.r2Pos));
    }

    export interface Promotion {
        piece: Piece;
        prPos: Position;
        promoted: Piece;
    }

    export function isPromotionInfo(mov: any): mov is Promotion {
        return mov.piece !== undefined && (mov.piece instanceof Piece)
            && mov.prPos !== undefined && csty.isPosition(mov.prPos)
            && mov.promoted !== undefined && (mov.promoted instanceof Piece);
    }

    export interface Move {
        piece: Piece;
        pos: Position;
        moveTo: Position;
    }

    export function isMoveInfo(mov: any): mov is Move {
        return mov.piece !== undefined && (mov.piece instanceof Piece)
            && mov.pos !== undefined && csty.isPosition(mov.pos)
            && mov.moveTo !== undefined && csty.isPosition(mov.moveTo);
    }

    export interface Capture extends Move {
        captured: Piece;
        special: Position | undefined;
    }

    export function isCaptureInfo(mov: any): mov is Capture {
        return mov.captured !== undefined && (mov.captured instanceof Piece)
            && (mov.special === undefined || csty.isPosition(mov.special));
    }

    export function fullMoveNotation(info: UndoStatus): string {
        const postStr = info.check ?? ((info.end == "mate") ? "#" : "");
        const preStr = info.turn == 'w' ? info.n + '. ' : "";
        return preStr + moveNotation(info.move) + postStr;
    }

    export function endText(info: UndoStatus, turn: Turn) {
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
        return info.turn + info.n;
    }

    export function moveNotation(info: MoveInfo): string {
        if (isCastlingInfo(info)) {
            const tail = info.r2Pos !== undefined ? cscnv.columnFromIndex(info.r2Pos[0])
                : (info.side == 'K' && info.col == 'H' && info.rPos[0] == 10) ?
                    (info.rPos[1] == 5 || info.rPos[1] == 23 ? 'O' : info.rPos[1] == 7 || info.rPos[1] == 21 ? 'OO' : "")
                    : "";
            return "KR" + info.side + "-" + info.col + cscnv.columnFromIndex(info.rPos[0]) + tail;
        } else if (isMoveInfo(info)) {
            const pre = (info.piece.symbol == 'P' ? "" : info.piece.symbol) + PositionHelper.toString(info.pos);
            const post = isPromotionInfo(info) ? "=" + info.promoted.symbol : "";
            let sep: string;
            if (isCaptureInfo(info)) {
                if (info.special !== undefined) {
                    sep = PositionHelper.equals(info.moveTo, info.special)
                        || Math.abs(info.special[1] - info.moveTo[1]) == 2 ? "@" : "@@";
                } else {
                    sep = info.captured.symbol == 'P' ? "\u00D7" : "\u00D7" + info.captured.symbol;
                }
            } else sep = "-";
            return pre + sep + PositionHelper.toString(info.moveTo) + post;
        } else if (isPromotionInfo(info)) {
            return PositionHelper.toString(info.prPos) + "=" + info.promoted.symbol;
        } else throw new TypeError("must be a move notation")
    }

}