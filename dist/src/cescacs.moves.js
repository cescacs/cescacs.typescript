"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.csMoves = void 0;
const cescacs_types_1 = require("./cescacs.types");
const cescacs_positionHelper_1 = require("./cescacs.positionHelper");
const cescacs_piece_1 = require("./cescacs.piece");
var csMoves;
(function (csMoves) {
    function isCastlingSide(side) {
        return (typeof side === 'string') && (side === 'K' || side === 'D' || side === 'R');
    }
    csMoves.isCastlingSide = isCastlingSide;
    function isCastlingInfo(mov) {
        return mov.side !== undefined && isCastlingSide(mov.side)
            && mov.col !== undefined && cescacs_types_1.csTypes.isCastlingColumn(mov.col)
            && mov.rPos !== undefined && cescacs_types_1.csTypes.isPosition(mov.rPos)
            && (mov.side === 'D' || mov.kRook !== undefined && mov.kRook instanceof cescacs_piece_1.Rook)
            && (mov.side === 'K' || mov.qRook !== undefined && mov.qRook instanceof cescacs_piece_1.Rook)
            && (mov.side != 'R' || mov.r2Pos !== undefined && cescacs_types_1.csTypes.isPosition(mov.r2Pos));
    }
    csMoves.isCastlingInfo = isCastlingInfo;
    function isPromotionInfo(mov) {
        return mov.piece !== undefined && (mov.piece instanceof cescacs_piece_1.Piece)
            && mov.prPos !== undefined && cescacs_types_1.csTypes.isPosition(mov.prPos)
            && mov.promoted !== undefined && (mov.promoted instanceof cescacs_piece_1.Piece);
    }
    csMoves.isPromotionInfo = isPromotionInfo;
    function isMoveInfo(mov) {
        return mov.piece !== undefined && (mov.piece instanceof cescacs_piece_1.Piece)
            && mov.pos !== undefined && cescacs_types_1.csTypes.isPosition(mov.pos)
            && mov.moveTo !== undefined && cescacs_types_1.csTypes.isPosition(mov.moveTo);
    }
    csMoves.isMoveInfo = isMoveInfo;
    function isCaptureInfo(mov) {
        return mov.captured !== undefined && (mov.captured instanceof cescacs_piece_1.Piece)
            && (mov.special === undefined || cescacs_types_1.csTypes.isPosition(mov.special));
    }
    csMoves.isCaptureInfo = isCaptureInfo;
    function fullMoveNotation(info) {
        const postStr = info.check ?? ((info.end == "mate") ? "#" : "");
        const preStr = info.turn == 'w' ? info.n + '. ' : "";
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
    function undoStatusId(info) {
        return info.turn + info.n;
    }
    csMoves.undoStatusId = undoStatusId;
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
                    sep = info.captured.symbol == 'P' ? "\u00D7" : "\u00D7" + info.captured.symbol;
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
