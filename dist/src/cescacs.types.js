"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.csConvert = exports.csTypes = void 0;
const ts_general_1 = require("./ts.general");
const _column = ['P', 'T', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'K', 'L', 'X', 'Z'];
const _castlingColumn = ['D', 'E', 'F', 'H', 'I'];
const _orthogonalDirection = ["ColumnUp", "ColumnDown", "FileUp", "FileDown", "FileInvUp", "FileInvDown"];
const _diagonalDirection = ["TransversalLineInc", "TransversalLineDec", "LineUp", "LineDown", "LineInvUp", "LineInvDown"];
const _knightDirection = ["TransversalLineInc-FileUp", "TransversalLineInc-FileDown", "TransversalLineDec-FileInvUp", "TransversalLineDec-FileInvDown",
    "LineUp-FileUp", "LineUp-ColumnUp", "LineDown-FileDown", "LineDown-ColumnDown",
    "LineInvUp-FileInvUp", "LineInvUp-ColumnUp", "LineInvDown-FileInvDown", "LineInvDown-ColumnDown"];
const _orthogonalOrientation = [["ColumnUp", "ColumnDown"], ["FileUp", "FileInvDown"], ["FileInvUp", "FileDown"]];
const _diagonalOrientation = [["TransversalLineInc", "TransversalLineDec"], ["LineUp", "LineInvDown"], ["LineInvUp", "LineDown"]];
const _hexColor = ["Black", "White", "Color"];
const _turn = ["w", "b"];
const _pieceName = ["K", "D", "V", "R", "G", "N", "J", "E", "M", "P"];
const _castlingStatus = ["RKR", "RK", "KR", "K", "-"];
const _castlingString = ["KRK-II", "KRK-IK", "KRK-IH", "KRK-HIO", "KRK-HIOO", "KRK-HH", "KRK-HG", "KRK-FG", "KRK-FE", "KRK-EF", "KRK-EE",
    "KRD-DD", "KRD-DE", "KRD-HH", "KRD-HG", "KRD-FG", "KRD-FE", "KRD-EF", "KRD-ED", "KRR-HIH", "KRR-HGG", "KRR-FGG", "KRR-FEE", "KRR-EEF"];
const _grandCastlingString = ["KRK-FF", "KRK-FG", "KRK-HG", "KRK-HI", "KRD-DE", "KRD-DC", "KRD-ED", "KRD-EE", "KRD-FE", "KRD-FF", "KRR-FFE", "KRR-FGF"];
;
// Type predicates
var csTypes;
(function (csTypes) {
    csTypes.isNumber = (x) => typeof x === "number" && !isNaN(x);
    csTypes.isColumn = (x) => _column.includes(x);
    csTypes.isColumnIndex = (x) => csTypes.isNumber(x) && Number.isInteger(x) && x >= 0 && x <= 14;
    csTypes.isLine = (x) => csTypes.isNumber(x) && Number.isInteger(x) && x >= 0 && x <= 28;
    csTypes.isPosition = (x) => Array.isArray(x) && x.length == 2 && csTypes.isColumnIndex(x[0]) && csTypes.isLine(x[1]);
    csTypes.isCompactPosition = (x) => typeof x === "number" && csTypes.isColumnIndex(x >> 5) && csTypes.isLine(x & 0b000011111);
    csTypes.isOrthogonalDirection = (x) => _orthogonalDirection.includes(x);
    csTypes.isDiagonalDirection = (x) => _diagonalDirection.includes(x);
    csTypes.isKnightDirection = (x) => _knightDirection.includes(x);
    csTypes.isCastlingColumn = (x) => _castlingColumn.includes(x);
    csTypes.isDirectionMoveRange = (x) => csTypes.isNumber(x) && Number.isInteger(x) && x >= 0 && x <= 5;
    csTypes.isDirectionFullMoveRange = (x) => csTypes.isNumber(x) && Number.isInteger(x) && x >= 0 && x <= 11;
    csTypes.isOrthogonalOrientation = (x) => Array.isArray(x) && _orthogonalOrientation.some(y => y[0] == x[0] && y[1] == x[1]);
    csTypes.isDiagonalOrientation = (x) => Array.isArray(x) && _diagonalOrientation.some(y => y[0] == x[0] && y[1] == x[1]);
    csTypes.isHexColor = (x) => _hexColor.includes(x);
    csTypes.isPieceName = (x) => _pieceName.includes(x);
    csTypes.isTurn = (x) => _turn.includes(x);
    csTypes.isSide = (x) => x === 'K' || x === 'D';
    csTypes.isCastlingStatus = (x) => _castlingStatus.includes(x);
    csTypes.isCastlingString = (x) => _castlingString.includes(x);
    csTypes.isGrandCastlingString = (x) => _grandCastlingString.includes(x);
    csTypes.isSingleCheck = (x) => Object.prototype.hasOwnProperty.call(x, "d") && Object.prototype.hasOwnProperty.call(x, "p");
    csTypes.isDoubleCheck = (x) => Array.isArray(x) && length == 3 && csTypes.isPosition(x[0]) && csTypes.isPosition(x[1]) &&
        (x[2] == null || csTypes.isOrthogonalOrientation(x[2]) || csTypes.isDiagonalOrientation(x[2]));
    csTypes.hasDoubleCheckPin = (x) => Array.isArray(x) && length == 3 && csTypes.isPosition(x[0]) && csTypes.isPosition(x[1]) &&
        x[2] != null && (csTypes.isOrthogonalOrientation(x[2]) || csTypes.isDiagonalOrientation(x[2]));
    csTypes.isCheckAttackPos = (checkPos, pos) => {
        return csTypes.isPosition(checkPos) ? pos[0] == checkPos[0] && pos[1] == checkPos[1]
            : csTypes.isSingleCheck(checkPos) ? checkPos.p[0] == pos[0] && checkPos.p[1] == pos[1]
                : checkPos[0][0] == pos[0] && checkPos[0][1] == pos[1] || checkPos[1][0] == pos[0] && checkPos[1][1] == pos[1];
    };
})(csTypes = exports.csTypes || (exports.csTypes = {}));
// Conversions
var csConvert;
(function (csConvert) {
    csConvert.columnFromIndex = (i) => _column[i];
    csConvert.toColumnIndex = (column) => _column.indexOf(column);
    csConvert.toCompactPosition = (c, line) => c << 5 + line;
    csConvert.toCompactFromPosition = (pos) => csConvert.toCompactPosition(pos[0], pos[1]);
    csConvert.toPositionFromCompact = (x) => [x >> 5, x & 0b000011111];
    csConvert.getColumnFromCompact = (x) => _column[x >> 5];
    csConvert.getColumnIndexFromCompact = (x) => x >> 5;
    csConvert.getLineFromCompact = (x) => x & 0b000011111;
    csConvert.toOrthogonalDirectionIndex = (direction) => _orthogonalDirection.indexOf(direction);
    csConvert.orthogonalDirectionFromIndex = (i) => _orthogonalDirection[i];
    csConvert.toDiagonalDirectionIndex = (direction) => _diagonalDirection.indexOf(direction);
    csConvert.diagonalDirectionFromIndex = (i) => _diagonalDirection[i];
    csConvert.toKnightDirectionIndex = (direction) => _knightDirection.indexOf(direction);
    csConvert.knightDirectionFromIndex = (i) => _knightDirection[i];
    function getOrthogonalOrientation(d) {
        switch (d) {
            case "ColumnUp":
            case "ColumnDown": return ["ColumnUp", "ColumnDown"];
            case "FileUp":
            case "FileInvDown": return ["FileUp", "FileInvDown"];
            case "FileInvUp":
            case "FileDown": return ["FileInvUp", "FileDown"];
            default: {
                const exhaustiveCheck = d;
                throw new Error(exhaustiveCheck);
            }
        }
    }
    csConvert.getOrthogonalOrientation = getOrthogonalOrientation;
    function getDiagonalOrientation(d) {
        switch (d) {
            case "TransversalLineInc":
            case "TransversalLineDec": return ["TransversalLineInc", "TransversalLineDec"];
            case "LineUp":
            case "LineInvDown": return ["LineUp", "LineInvDown"];
            case "LineInvUp":
            case "LineDown": return ["LineInvUp", "LineDown"];
            default: {
                const exhaustiveCheck = d;
                throw new Error(exhaustiveCheck);
            }
        }
    }
    csConvert.getDiagonalOrientation = getDiagonalOrientation;
    function otherSide(turn) { return turn == 'w' ? 'b' : 'w'; }
    csConvert.otherSide = otherSide;
    function getPieceKeyColor(key) {
        (0, ts_general_1.assertCondition)(csTypes.isTurn(key[0]), `key 1st char must have piece color`);
        return key[0];
    }
    csConvert.getPieceKeyColor = getPieceKeyColor;
    function getPieceKeyName(key) {
        (0, ts_general_1.assertCondition)(csTypes.isPieceName(key[1]), `key 2nd char must be piece symbol ${key}`);
        return key[1];
    }
    csConvert.getPieceKeyName = getPieceKeyName;
    function getBishopKeyHexColor(key) {
        return key[1] !== 'J' ? null : key.slice(2);
    }
    csConvert.getBishopKeyHexColor = getBishopKeyHexColor;
    function getRookKeySide(key) {
        return key[1] !== 'R' ? null : csTypes.isSide(key[2]) ? key[2] : null;
    }
    csConvert.getRookKeySide = getRookKeySide;
    function* orthogonalDirections() { for (const d of _orthogonalDirection)
        yield d; }
    csConvert.orthogonalDirections = orthogonalDirections;
    function* diagonalDirections() { for (const d of _diagonalDirection)
        yield d; }
    csConvert.diagonalDirections = diagonalDirections;
    function* knightDirections() { for (const d of _knightDirection)
        yield d; }
    csConvert.knightDirections = knightDirections;
})(csConvert = exports.csConvert || (exports.csConvert = {}));
