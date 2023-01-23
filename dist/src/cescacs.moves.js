"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.csMoves = exports.undoStatusArrayEquals = exports.undoStatusEquals = exports.isUndoStatus = void 0;
const cescacs_types_1 = require("./cescacs.types");
const cescacs_positionHelper_1 = require("./cescacs.positionHelper");
function isUndoStatus(st) {
    return st.n !== undefined && typeof st.n == 'number'
        && st.turn !== undefined && cescacs_types_1.csTypes.isTurn(st.turn)
        && st.move !== undefined && (st.move == '\u2026' || csMoves.isMoveInfo(st.move)
        || csMoves.isCastlingInfo(st.move) || csMoves.isPromotionInfo(st.move))
        && (st.initHalfMoveClock === undefined || st.initHalfMoveClock == '1')
        && (st.castlingStatus === undefined || cescacs_types_1.csTypes.isCastlingStatus(st.castlingStatus))
        && (st.specialPawnCapture === undefined
            || (typeof st.specialPawnCapture == 'string' && st.specialPawnCapture.indexOf('@') > 0))
        && (st.fixedNumbering === undefined || st.fixedNumbering == '?');
}
exports.isUndoStatus = isUndoStatus;
function undoStatusEquals(a, b) {
    return a.n == b.n && a.turn == b.turn
        && ((a.move == '\u2026' && b.move == '\u2026')
            || (a.move != '\u2026' && b.move != '\u2026' && csMoves.equals(a.move, b.move)))
        && a.initHalfMoveClock == b.initHalfMoveClock
        && a.castlingStatus == b.castlingStatus
        && a.specialPawnCapture == b.specialPawnCapture
        && a.fixedNumbering == b.fixedNumbering
        && a.end == b.end && a.check == b.check;
}
exports.undoStatusEquals = undoStatusEquals;
function undoStatusArrayEquals(a, b) {
    return a.every((val, index) => undoStatusEquals(val, b[index]));
}
exports.undoStatusArrayEquals = undoStatusArrayEquals;
var csMoves;
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
            && mov.col !== undefined && cescacs_types_1.csTypes.isCastlingColumn(mov.col)
            && mov.rPos !== undefined && cescacs_types_1.csTypes.isPosition(mov.rPos)
            && (mov.side === 'D' || mov.kRook !== undefined && cescacs_types_1.csConvert.getPieceKeyName(mov.kRook) == 'R')
            && (mov.side === 'K' || mov.qRook !== undefined && cescacs_types_1.csConvert.getPieceKeyName(mov.qRook) == 'R')
            && (mov.side != 'R' || mov.r2Pos !== undefined && cescacs_types_1.csTypes.isPosition(mov.r2Pos));
    }
    csMoves.isCastlingInfo = isCastlingInfo;
    function isPromotionInfo(mov) {
        return mov.piece !== undefined
            && mov.prPos !== undefined && cescacs_types_1.csTypes.isPosition(mov.prPos)
            && mov.promoted !== undefined;
    }
    csMoves.isPromotionInfo = isPromotionInfo;
    function isMoveInfo(mov) {
        return mov.piece !== undefined
            && mov.pos !== undefined && cescacs_types_1.csTypes.isPosition(mov.pos)
            && mov.moveTo !== undefined && cescacs_types_1.csTypes.isPosition(mov.moveTo);
    }
    csMoves.isMoveInfo = isMoveInfo;
    function isCaptureInfo(mov) {
        return mov.captured !== undefined
            && (mov.special === undefined || cescacs_types_1.csTypes.isPosition(mov.special));
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
            const tail = info.r2Pos !== undefined ? cescacs_types_1.csConvert.columnFromIndex(info.r2Pos[0])
                : (info.side == 'K' && info.col == 'H' && info.rPos[0] == 10) ?
                    (info.rPos[1] == 5 || info.rPos[1] == 23 ? 'O' : info.rPos[1] == 7 || info.rPos[1] == 21 ? 'OO' : "")
                    : "";
            return "KR" + info.side + "-" + info.col + cescacs_types_1.csConvert.columnFromIndex(info.rPos[0]) + tail;
        }
        else if (csMoves.isMoveInfo(info)) {
            const symbol = cescacs_types_1.csConvert.getPieceKeyName(info.piece);
            const pre = (symbol == 'P' ? "" : symbol) + cescacs_positionHelper_1.PositionHelper.toString(info.pos);
            const post = isPromotionInfo(info) ? "=" + cescacs_types_1.csConvert.getPieceKeyName(info.promoted) : "";
            let sep;
            if (isCaptureInfo(info)) {
                if (info.special !== undefined) {
                    sep = cescacs_positionHelper_1.PositionHelper.equals(info.moveTo, info.special)
                        || Math.abs(info.special[1] - info.moveTo[1]) <= 2 ? "@" : "@@";
                }
                else {
                    const capSymbol = cescacs_types_1.csConvert.getPieceKeyName(info.captured);
                    sep = capSymbol == 'P' ? "\u00D7" : "\u00D7" + capSymbol;
                }
            }
            else
                sep = "-";
            return pre + sep + cescacs_positionHelper_1.PositionHelper.toString(info.moveTo) + post;
        }
        else if (csMoves.isPromotionInfo(info)) {
            return cescacs_positionHelper_1.PositionHelper.toString(info.prPos) + "=" + cescacs_types_1.csConvert.getPieceKeyName(info.promoted);
        }
        else {
            throw new TypeError("must be a move notation");
        }
    }
    csMoves.moveNotation = moveNotation;
    function equals(a, b) {
        if (isMoveInfo(a) && isMoveInfo(b)) {
            return a.piece == b.piece
                && cescacs_positionHelper_1.PositionHelper.equals(a.pos, b.pos)
                && cescacs_positionHelper_1.PositionHelper.equals(a.moveTo, b.moveTo);
        }
        else if (isPromotionInfo(a) && isPromotionInfo(b)) {
            return a.piece == b.piece
                && a.promoted == b.promoted
                && cescacs_positionHelper_1.PositionHelper.equals(a.prPos, b.prPos);
        }
        else if (isCastlingInfo(a) && isCastlingInfo(b)) {
            return a.side == b.side
                && a.col == b.col
                && cescacs_positionHelper_1.PositionHelper.equals(a.rPos, b.rPos)
                && a.kRook == b.kRook && a.qRook == b.qRook;
        }
        else
            return false;
    }
    csMoves.equals = equals;
})(csMoves = exports.csMoves || (exports.csMoves = {}));
