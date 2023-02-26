import { csTypes as csty, csConvert as cscnv } from "./cescacs.types.js";
import { PositionHelper } from "./cescacs.positionHelper.js";
export function isUndoStatus(st) {
    return st.n !== undefined && typeof st.n == 'number'
        && st.turn !== undefined && csty.isTurn(st.turn)
        && st.move !== undefined && (st.move == '\u2026' || csMoves.isMoveInfo(st.move)
        || csMoves.isCastlingInfo(st.move) || csMoves.isPromotionInfo(st.move))
        && (st.initHalfMoveClock === undefined || st.initHalfMoveClock == '1')
        && (st.castlingStatus === undefined || csty.isCastlingStatus(st.castlingStatus))
        && (st.specialPawnCapture === undefined
            || (typeof st.specialPawnCapture == 'string' && st.specialPawnCapture.indexOf('@') > 0))
        && (st.fixedNumbering === undefined || st.fixedNumbering == '?');
}
export function undoStatusEquals(a, b) {
    return a.n == b.n && a.turn == b.turn
        && ((a.move == '\u2026' && b.move == '\u2026')
            || (a.move != '\u2026' && b.move != '\u2026' && csMoves.equals(a.move, b.move)))
        && a.initHalfMoveClock == b.initHalfMoveClock
        && a.castlingStatus == b.castlingStatus
        && a.specialPawnCapture == b.specialPawnCapture
        && a.fixedNumbering == b.fixedNumbering
        && a.end == b.end && a.check == b.check;
}
export function undoStatusArrayEquals(a, b) {
    return a.every((val, index) => undoStatusEquals(val, b[index]));
}
export var csMoves;
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
            && mov.col !== undefined && csty.isCastlingColumn(mov.col)
            && mov.rPos !== undefined && csty.isPosition(mov.rPos)
            && (mov.side === 'D' || mov.kRook !== undefined && cscnv.getPieceKeyName(mov.kRook) == 'R')
            && (mov.side === 'K' || mov.qRook !== undefined && cscnv.getPieceKeyName(mov.qRook) == 'R')
            && (mov.side != 'R' || mov.r2Pos !== undefined && csty.isPosition(mov.r2Pos));
    }
    csMoves.isCastlingInfo = isCastlingInfo;
    function isPromotionInfo(mov) {
        return mov.piece !== undefined
            && mov.prPos !== undefined && csty.isPosition(mov.prPos)
            && mov.promoted !== undefined;
    }
    csMoves.isPromotionInfo = isPromotionInfo;
    function isMoveInfo(mov) {
        return mov.piece !== undefined
            && mov.pos !== undefined && csty.isPosition(mov.pos)
            && mov.moveTo !== undefined && csty.isPosition(mov.moveTo);
    }
    csMoves.isMoveInfo = isMoveInfo;
    function isCaptureInfo(mov) {
        return mov.captured !== undefined
            && (mov.special === undefined || csty.isPosition(mov.special));
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
            const tail = info.r2Pos !== undefined ? cscnv.columnFromIndex(info.r2Pos[0])
                : (info.side == 'K' && info.col == 'H' && info.rPos[0] == 10) ?
                    (info.rPos[1] == 5 || info.rPos[1] == 23 ? 'O' : info.rPos[1] == 7 || info.rPos[1] == 21 ? 'OO' : "")
                    : "";
            return "KR" + info.side + "-" + info.col + cscnv.columnFromIndex(info.rPos[0]) + tail;
        }
        else if (csMoves.isMoveInfo(info)) {
            const symbol = cscnv.getPieceKeyName(info.piece);
            const pre = (symbol == 'P' ? "" : symbol) + PositionHelper.toString(info.pos);
            const post = isPromotionInfo(info) ? "=" + cscnv.getPieceKeyName(info.promoted) : "";
            let sep;
            if (isCaptureInfo(info)) {
                if (info.special !== undefined) {
                    sep = PositionHelper.equals(info.moveTo, info.special)
                        || Math.abs(info.special[1] - info.moveTo[1]) <= 2 ? "@" : "@@";
                }
                else {
                    const capSymbol = cscnv.getPieceKeyName(info.captured);
                    sep = capSymbol == 'P' ? "\u00D7" : "\u00D7" + capSymbol;
                }
            }
            else
                sep = "-";
            return pre + sep + PositionHelper.toString(info.moveTo) + post;
        }
        else if (csMoves.isPromotionInfo(info)) {
            return PositionHelper.toString(info.prPos) + "=" + cscnv.getPieceKeyName(info.promoted);
        }
        else {
            throw new TypeError("must be a move notation");
        }
    }
    csMoves.moveNotation = moveNotation;
    function equals(a, b) {
        if (isMoveInfo(a) && isMoveInfo(b)) {
            return a.piece == b.piece
                && PositionHelper.equals(a.pos, b.pos)
                && PositionHelper.equals(a.moveTo, b.moveTo);
        }
        else if (isPromotionInfo(a) && isPromotionInfo(b)) {
            return a.piece == b.piece
                && a.promoted == b.promoted
                && PositionHelper.equals(a.prPos, b.prPos);
        }
        else if (isCastlingInfo(a) && isCastlingInfo(b)) {
            return a.side == b.side
                && a.col == b.col
                && PositionHelper.equals(a.rPos, b.rPos)
                && a.kRook == b.kRook && a.qRook == b.qRook;
        }
        else
            return false;
    }
    csMoves.equals = equals;
})(csMoves || (csMoves = {}));
