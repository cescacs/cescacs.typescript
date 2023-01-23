"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PositionHelper = void 0;
const cescacs_types_1 = require("./cescacs.types");
class PositionHelper {
    static equals(p1, p2) {
        return p1[0] === p2[0] && p1[1] === p2[1];
    }
    static toString(pos) {
        return cescacs_types_1.csConvert.columnFromIndex(pos[0]) + pos[1].toString();
    }
    static compactPosToString(cpos) {
        return cescacs_types_1.csConvert.getColumnFromCompact(cpos) + cescacs_types_1.csConvert.getLineFromCompact(cpos).toString();
    }
    static positionKey(k) {
        return k[0].toString() + "-" + k[1].toString(); // k.toString();
    }
    static parse(coord) {
        if (coord) {
            const strCoord = coord.trim().toUpperCase();
            const l = strCoord.length;
            if (l >= 2 && l <= 3) {
                const column = strCoord[0];
                if (cescacs_types_1.csTypes.isColumn(column)) {
                    const line = parseInt(strCoord.slice(1));
                    if (cescacs_types_1.csTypes.isLine(line)) {
                        return [cescacs_types_1.csConvert.toColumnIndex(column), line];
                    }
                    else
                        throw new RangeError(`Invalid line value: ${line}`);
                }
                else
                    throw new RangeError(`Invalid column: ${column}`);
            }
            else
                throw new RangeError(`Invalid coordinates leght: ${strCoord}`);
        }
        else
            throw new RangeError("Empty string for coordinates value");
    }
    static fromBoardPosition(column, line, check = false) {
        if (cescacs_types_1.csTypes.isColumn(column)) {
            column = cescacs_types_1.csConvert.toColumnIndex(column);
        }
        const pos = [column, line];
        if (check && !PositionHelper.isValidPosition(pos))
            throw new RangeError(`Invalid position: ${pos}`);
        else
            return pos;
    }
    static isValidPosition(p) {
        return cescacs_types_1.csTypes.isPosition(p)
            && PositionHelper.isEvenLinesColumnIndex(p[0]) == (p[1] % 2 == 0)
            && PositionHelper.isOnBoard(p[0], p[1]);
    }
    static get whiteKingInitPosition() { return [8, 1]; }
    static get blackKingInitPosition() { return [8, 27]; }
    static initialQueenSideRookPosition(color, grand) {
        if (grand)
            return color == "w" ? [3, 4] : [3, 24];
        else
            return color == "w" ? [4, 3] : [4, 25];
    }
    static initialKingSideRookPosition(color, grand) {
        if (grand)
            return color == "w" ? [11, 4] : [11, 24];
        else
            return color == "w" ? [10, 3] : [10, 25];
    }
    static isPromotionPos(c, l, color) {
        return l == (c <= 7 ? (color == "w" ? 21 + c : 7 - c) : (color == "w" ? 35 - c : c - 7));
    }
    static isPromotionHex(pos, color) {
        const c = pos[0];
        return pos[1] == (c <= 7 ? (color == "w" ? 21 + c : 7 - c) : (color == "w" ? 35 - c : c - 7));
    }
    static promotionDistance(pos, color) {
        const c = pos[0];
        if (color == 'w')
            return (c <= 7 ? 21 + c : 35 - c) - pos[1];
        else
            return pos[1] - (c <= 7 ? 7 - c : c - 7);
    }
    static hexColor(p) {
        return PositionHelper.lineHexColor(p[1]);
    }
    static lineHexColor(line) {
        switch (line % 3) {
            case 0: return "Black";
            case 1: return "White";
            case 2: return "Color";
            default: throw new Error();
        }
    }
    static isOrthogonally(from, to) {
        const dif = [to[0] - from[0], to[1] - from[1]];
        if (dif[0] == 0) {
            if (dif[1] == 0)
                return null;
            else if (dif[1] % 2 == 0)
                return dif[1] > 0 ? "ColumnUp" : "ColumnDown";
            else
                return null;
        }
        else if (dif[0] > 0) {
            if (dif[0] == dif[1])
                return "FileUp";
            else if (dif[0] == -dif[1])
                return "FileDown";
            else
                return null;
        }
        else {
            if (dif[0] == dif[1])
                return "FileInvDown";
            else if (dif[0] == -dif[1])
                return "FileInvUp";
            else
                return null;
        }
    }
    static isDiagonally(from, to, avoidTransversal = false) {
        const dif = [to[0] - from[0], to[1] - from[1]];
        if (dif[1] == 0) {
            if (dif[0] == 0)
                return null;
            else if (!avoidTransversal && dif[0] % 2 == 0)
                return dif[0] > 0 ? "TransversalLineInc" : "TransversalLineDec";
            else
                return null;
        }
        else {
            const triple = (dif[0] << 1) + dif[0];
            if (dif[0] > 0) {
                if (triple == dif[1])
                    return "LineUp";
                else if (triple == -dif[1])
                    return "LineDown";
                else
                    return null;
            }
            else {
                if (triple == dif[1])
                    return "LineInvDown";
                else if (triple == -dif[1])
                    return "LineInvUp";
                else
                    return null;
            }
        }
    }
    static orthogonalStep(pos, d) {
        const offset = PositionHelper._ORTHOGONAL_MOVES[cescacs_types_1.csConvert.toOrthogonalDirectionIndex(d)];
        return PositionHelper.addOffset(pos, offset);
    }
    static diagonalStep(pos, d) {
        const offset = PositionHelper._DIAGONAL_MOVES[cescacs_types_1.csConvert.toDiagonalDirectionIndex(d)];
        return PositionHelper.addOffset(pos, offset);
    }
    static *orthogonalRide(pos, d) {
        const offset = PositionHelper._ORTHOGONAL_MOVES[cescacs_types_1.csConvert.toOrthogonalDirectionIndex(d)];
        let newPos = PositionHelper.addOffset(pos, offset);
        while (newPos != null) {
            yield newPos;
            newPos = PositionHelper.addOffset(newPos, offset);
        }
    }
    static *diagonalRide(pos, d) {
        const offset = PositionHelper._DIAGONAL_MOVES[cescacs_types_1.csConvert.toDiagonalDirectionIndex(d)];
        let newPos = PositionHelper.addOffset(pos, offset);
        while (newPos != null) {
            yield newPos;
            newPos = PositionHelper.addOffset(newPos, offset);
        }
    }
    static *orthogonalMoves(pos) {
        for (const offset of PositionHelper._ORTHOGONAL_MOVES) {
            let newPos = this.addOffset(pos, offset);
            while (newPos != null) {
                yield newPos;
                newPos = PositionHelper.addOffset(newPos, offset);
            }
        }
    }
    static *diagonalMoves(pos) {
        for (const offset of PositionHelper._DIAGONAL_MOVES) {
            let newPos = this.addOffset(pos, offset);
            while (newPos != null) {
                yield newPos;
                newPos = PositionHelper.addOffset(newPos, offset);
            }
        }
    }
    static knightJump(pos, d) {
        const offset = PositionHelper._KNIGHT_MOVES[cescacs_types_1.csConvert.toKnightDirectionIndex(d)];
        return PositionHelper.addOffset(pos, offset);
    }
    static *knightMoves(pos) {
        for (const offset of PositionHelper._KNIGHT_MOVES) {
            const newPos = this.addOffset(pos, offset);
            if (newPos != null)
                yield newPos;
        }
    }
    static positionIteratorIncludes(it, value) {
        for (const x of it) {
            if (x[0] === value[0] && x[1] === value[1])
                return true;
        }
        return false;
    }
    static *positionIteratorIntersection(it, positionsSet) {
        for (const x of it) {
            if (positionsSet.some(y => x[0] === y[0] && x[1] === y[1]))
                yield x;
        }
    }
    static isOnBoard(c, l) {
        return c >= 0 && c <= 14
            && (c <= 7 ? (l >= 7 - c && l <= 21 + c) : (l >= c - 7 && l <= 35 - c));
    }
    static addOffset(pos, offset) {
        const c = pos[0] + offset[0];
        const l = pos[1] + offset[1];
        if (PositionHelper.isOnBoard(c, l))
            return [c, l];
        else
            return null;
    }
}
exports.PositionHelper = PositionHelper;
PositionHelper._ORTHOGONAL_MOVES = [[0, 2], [0, -2], [1, 1], [1, -1], [-1, 1], [-1, -1]];
PositionHelper._DIAGONAL_MOVES = [[2, 0], [-2, 0], [1, 3], [1, -3], [-1, 3], [-1, -3]];
PositionHelper._KNIGHT_MOVES = [[3, 1], [3, -1], [-3, 1], [-3, -1],
    [2, 4], [1, 5], [2, -4], [1, -5],
    [-2, 4], [-1, 5], [-2, -4], [-1, -5]];
PositionHelper.isEvenLinesColumnIndex = (i) => i % 2 != 0;
