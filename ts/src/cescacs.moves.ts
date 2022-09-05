
import {
    Position, Turn, CastlingColumn, CastlingStatus
} from "./cescacs.types";

import { csTypes as csty, csConvert as cscnv } from "./cescacs.types";
import { PositionHelper } from "./cescacs.positionHelper";
import {
    Piece, King, Rook, Pawn
} from "./cescacs.piece";


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

    export interface Castling {
        side: CastlingSide;
        col: CastlingColumn;
        rPos: Position;
        r2Pos: Position | undefined;
        kRook: Rook | undefined;
        qRook: Rook | undefined;
    }

    export function isCastlingInfo(mov: any): mov is Castling {
        return mov.side !== undefined && mov.col !== undefined && mov.rPos !== undefined &&
            (mov.kRook !== undefined || mov.qRook !== undefined) &&
            (mov.side != 'R' || mov.r2Pos === undefined);
    }

    export interface Promotion {
        piece: Piece;
        prPos: Position;
        promoted: Piece;
    }

    export function isPromotionInfo(mov: any): mov is Promotion {
        return mov.piece !== undefined && mov.prPos !== undefined && mov.promoted !== undefined;
    }

    export interface Move {
        piece: Piece;
        pos: Position;
        moveTo: Position;
    }

    export function isMoveInfo(mov: any): mov is Move {
        return mov.piece !== undefined && mov.pos !== undefined && mov.moveTo !== undefined;
    }

    export interface Capture extends Move {
        captured: Piece;
        special: Position | undefined;
    }

    export function isCaptureInfo(mov: any): mov is Capture {
        return mov.captured !== undefined;
    }

    export function fullMoveNotation(info: UndoStatus): string {
        const postStr = info.check ?? (info.end == "mate" ? "#" : "");
        const preStr = info.turn == 'w' ? info.n + '.\xa0' : "";
        return preStr + moveNotation(info.move) + postStr;
    }

    export function endText(info: UndoStatus, turn: Turn) {
        if (info.end === undefined) return "";
        else {
            switch(info.end) {
                case "mate":
                case "resigned": return turn == "b"? "3 - 0": "0 - 3";
                case "stalemate": return turn == "b"? "2 - 1": "1 - 2";
                case "draw": return "1 - 1";
                default: {
                    const exhaustiveCheck: never = info.end;
                    throw new Error(exhaustiveCheck);
                }
            }
        }
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
                    sep = info.captured.symbol == 'P' ? "×" : "×" + info.captured.symbol;
                }
            } else sep = "-";
            return pre + sep + PositionHelper.toString(info.moveTo) + post;
        } else if (isPromotionInfo(info)) {
            return PositionHelper.toString(info.prPos) + "=" + info.promoted.symbol;
        } else throw new TypeError("must be a move notation")
    }

}