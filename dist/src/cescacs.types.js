"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.csConvert = exports.csTypes = void 0;
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
;
// Construct the type as the types of the properties of the type array whose keys are of type number (all ones)
// Type predicate
// Type predicates
var csTypes;
(function (csTypes) {
    csTypes.isNumber = (x) => typeof x === "number" && !isNaN(x);
    csTypes.isColumn = (x) => _column.includes(x);
    csTypes.isColumnIndex = (x) => csTypes.isNumber(x) && Number.isInteger(x) && x >= 0 && x <= 14;
    csTypes.isLine = (x) => csTypes.isNumber(x) && Number.isInteger(x) && x >= 0 && x <= 28;
    csTypes.isPosition = (x) => Array.isArray(x) && x.length == 2 && csTypes.isColumnIndex(x[0]) && csTypes.isLine(x[1]);
    csTypes.isOrthogonalDirection = (x) => _orthogonalDirection.includes(x);
    csTypes.isDiagonalDirection = (x) => _diagonalDirection.includes(x);
    csTypes.isKnightDirection = (x) => _knightDirection.includes(x);
    csTypes.iscastlingColumn = (x) => _castlingColumn.includes(x);
    csTypes.isDirectionMoveRange = (x) => csTypes.isNumber(x) && Number.isInteger(x) && x >= 0 && x <= 5;
    csTypes.isDirectionFullMoveRange = (x) => csTypes.isNumber(x) && Number.isInteger(x) && x >= 0 && x <= 11;
    csTypes.isOrthogonalOrientation = (x) => Array.isArray(x) && _orthogonalOrientation.some(y => y[0] == x[0] && y[1] == x[1]);
    csTypes.isDiagonalOrientation = (x) => Array.isArray(x) && _diagonalOrientation.some(y => y[0] == x[0] && y[1] == x[1]);
    csTypes.isHexColor = (x) => _hexColor.includes(x);
    csTypes.isPieceName = (x) => _pieceName.includes(x);
    csTypes.isTurn = (x) => _turn.includes(x);
    csTypes.isCastlingStatus = (x) => _castlingStatus.includes(x);
    csTypes.isSingleCheck = (x) => Object.prototype.hasOwnProperty.call(x, "d") && Object.prototype.hasOwnProperty.call(x, "p");
    csTypes.isDoubleCheck = (x) => Array.isArray(x) && length == 3 && csTypes.isPosition(x[0]) && csTypes.isPosition(x[1]) &&
        (x[2] == null || csTypes.isOrthogonalOrientation(x[2]) || csTypes.isDiagonalOrientation(x[2]));
    csTypes.hasDoubleCheckPin = (x) => Array.isArray(x) && length == 3 && csTypes.isPosition(x[0]) && csTypes.isPosition(x[1]) &&
        x[2] != null && (csTypes.isOrthogonalOrientation(x[2]) || csTypes.isDiagonalOrientation(x[2]));
})(csTypes = exports.csTypes || (exports.csTypes = {}));
// Conversions
var csConvert;
(function (csConvert) {
    csConvert.columnFromIndex = (i) => _column[i];
    csConvert.toColumnIndex = (column) => _column.indexOf(column);
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
