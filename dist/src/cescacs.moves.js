"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.csMoves = void 0;
const cescacs_types_1 = require("./cescacs.types");
const cescacs_positionHelper_1 = require("./cescacs.positionHelper");
var csMoves;
(function (csMoves) {
    function isCastlingInfo(mov) {
        return mov.side !== undefined && mov.col !== undefined && mov.rPos !== undefined &&
            (mov.kRook !== undefined || mov.qRook !== undefined) &&
            (mov.side != 'R' || mov.r2Pos === undefined);
    }
    csMoves.isCastlingInfo = isCastlingInfo;
    function isPromotionInfo(mov) {
        return mov.piece !== undefined && mov.prPos !== undefined && mov.promoted !== undefined;
    }
    csMoves.isPromotionInfo = isPromotionInfo;
    function isMoveInfo(mov) {
        return mov.piece !== undefined && mov.pos !== undefined && mov.moveTo !== undefined;
    }
    csMoves.isMoveInfo = isMoveInfo;
    function isCaptureInfo(mov) {
        return mov.captured !== undefined;
    }
    csMoves.isCaptureInfo = isCaptureInfo;
    function fullMoveNotation(info) {
        var _a;
        const postStr = (_a = info.check) !== null && _a !== void 0 ? _a : (info.end == "mate" ? "#" : "");
        const preStr = info.turn == 'w' ? info.n + '.\xa0' : "";
        return preStr + moveNotation(info.move) + postStr;
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
    function moveNotation(info) {
        if (isCastlingInfo(info)) {
            const tail = info.r2Pos !== undefined ? cescacs_types_1.csConvert.columnFromIndex(info.r2Pos[0])
                : (info.side == 'K' && info.col == 'H' && info.rPos[0] == 10) ?
                    (info.rPos[1] == 5 || info.rPos[1] == 23 ? 'O' : info.rPos[1] == 7 || info.rPos[1] == 21 ? 'OO' : "")
                    : "";
            return "KR" + info.side + "-" + info.col + cescacs_types_1.csConvert.columnFromIndex(info.rPos[0]) + tail;
        }
        else if (isMoveInfo(info)) {
            const pre = (info.piece.symbol == 'P' ? "" : info.piece.symbol) + cescacs_positionHelper_1.PositionHelper.toString(info.pos);
            const post = isPromotionInfo(info) ? "=" + info.promoted.symbol : "";
            let sep;
            if (isCaptureInfo(info)) {
                if (info.special !== undefined) {
                    sep = cescacs_positionHelper_1.PositionHelper.equals(info.moveTo, info.special)
                        || Math.abs(info.special[1] - info.moveTo[1]) == 2 ? "@" : "@@";
                }
                else {
                    sep = info.captured.symbol == 'P' ? "×" : "×" + info.captured.symbol;
                }
            }
            else
                sep = "-";
            return pre + sep + cescacs_positionHelper_1.PositionHelper.toString(info.moveTo) + post;
        }
        else if (isPromotionInfo(info)) {
            return cescacs_positionHelper_1.PositionHelper.toString(info.prPos) + "=" + info.promoted.symbol;
        }
        else
            throw new TypeError("must be a move notation");
    }
    csMoves.moveNotation = moveNotation;
})(csMoves = exports.csMoves || (exports.csMoves = {}));
