import { assertNonNullish, assertCondition, round2hundredths } from "./ts.general.js";
import { csTypes as csty, csConvert as cscnv } from "./cescacs.types.js";
import { csPieceTypes as cspty } from "./cescacs.piece.js";
import { PositionHelper } from "./cescacs.positionHelper.js";
import { Piece, King, Queen, Wyvern, Rook, Pegasus, Knight, Bishop, Elephant, Almogaver, Pawn } from "./cescacs.piece.js";
import { csMoves as csmv } from "./cescacs.moves.js";
export { PositionHelper, cscnv, cspty, csmv, round2hundredths };
//#region PawnSpecialCapture classes
/** register a pawn special capture state */
export class PawnSpecialCaptureStatus {
    /**
     * @param  {IBoard} board - callback reference
     * @param  {Nullable<string>} value
     * @returns {Nullable<PawnSpecialCaptureStatus>}
     */
    static parse(board, value) {
        if (value != null && value.length > 0 && value != "-") {
            if (value.length >= 4) {
                const elements = value.split("@");
                if (elements.length == 2 && elements[0].length >= 1 && elements[0].length <= 3 && elements[1].length >= 2) {
                    if (elements[0] == 'P') {
                        const enPassantelements = elements[1].slice(0, elements[1].length - 1).split("[");
                        if (elements[1].endsWith("]") && enPassantelements.length == 2) {
                            const p0 = PositionHelper.parse(enPassantelements[1]);
                            const piece = board.getPiece(p0);
                            if (piece != null) {
                                const values = enPassantelements[0].split(",");
                                if (values.length >= 1 && values.length <= 2) {
                                    let captureTo = [];
                                    captureTo.push(PositionHelper.parse(values[0]));
                                    if (values.length == 2) {
                                        let l = Number(values[1]);
                                        if (!isNaN(l) && csty.isLine(l)) {
                                            captureTo.push(PositionHelper.fromBoardPosition(captureTo[0][0], l, true));
                                        }
                                        else
                                            throw new TypeError("Invalid en passant capture line value");
                                    }
                                    return new EnPassantCapturable(piece, captureTo);
                                }
                                else
                                    throw new TypeError("Missing or invalid en passant capture positions");
                            }
                            else
                                throw new Error(PositionHelper.toString(p0) + " doesn't have a pawn nor promoted pawn");
                        }
                        else
                            throw new TypeError("Invalid special 'en passant' pawn capture status string");
                    }
                    else {
                        const p0 = PositionHelper.parse(elements[0]);
                        const p1 = PositionHelper.parse(elements[1]);
                        const piece = board.getPiece(p1);
                        if (piece != null)
                            return new ScornfulCapturable(piece, p0);
                        else
                            throw new Error(PositionHelper.toString(p1) + " doesn't have a pawn nor promoted pawn");
                    }
                }
                else
                    throw new TypeError("Invalid special pawn capture status string");
            }
            else
                throw new TypeError("Too short special pawn capture status string");
        }
        else
            return null;
    }
    _capturablePiece;
    /**
     * subtype predicate
     * @returns {boolean} - this is ScornfulCapturable
     */
    isScornfulCapturable() {
        return this.specialCaptureType == 'scornful';
    }
    /**
     * subtype predicate
     * @returns {boolean} - this is EnPassantCapturable
     */
    isEnPassantCapturable() {
        return this.specialCaptureType == 'enPassant';
    }
    /**
     * The piece, usually a pawn, if not promoted, which can be captured. It can be also an Almogaver in grand C'escacs
     * @returns {Piece}
     */
    get capturablePiece() { return this._capturablePiece; }
    /**
     * In initial constructor, the pawn which made a special move;
     * afterwards, cause of promotion, it could be any piece. Use capturablePiece to query for it.
     * @returns {Nullable<Pawn>}
     */
    get capturablePawn() {
        if (cspty.isPawn(this._capturablePiece))
            return this._capturablePiece;
        else
            return null;
    }
    /**
     * @constructor
     * @param  {Piece} capturablePawn
     */
    constructor(capturablePawn) {
        this._capturablePiece = capturablePawn;
    }
}
/** register a pawn special capture state: Scornful case */
export class ScornfulCapturable extends PawnSpecialCaptureStatus {
    /**
     * After the promotion, a promoting panw as the new piece regained must update the special capture register,
     * if it were just created in the movement because of a scornful move
     * @param  {ScornfulCapturable} scorfulCapturable - the instance to upgrade
     * @param  {Piece} capturablePiece - the piece which the pawn promoted to
     * @returns {ScornfulCapturable} - the instance upgraded
     */
    static promoteCapturablePawn(scorfulCapturable, capturablePiece) {
        return new ScornfulCapturable(capturablePiece, scorfulCapturable._capturerPawnPos);
    }
    specialCaptureType = 'scornful';
    _capturerPawnPos;
    /**
     * Available capture of a scornful pawn (which could've been promoted), which must be done from a pawn position
     * @constructor
     * @param  {Piece} capturablePawn
     * @param  {Position} scornedPawnPos
     */
    constructor(capturablePawn, scornedPawnPos) {
        super(capturablePawn);
        this._capturerPawnPos = scornedPawnPos;
    }
    isScorned(pawn, pos) {
        const result = pawn.position != null && PositionHelper.equals(pawn.position, this._capturerPawnPos);
        if (pos == null)
            return result;
        else
            return result && PositionHelper.equals(pos, this.capturablePiece.position);
    }
    /**
     * Orthogonal direction from the scorned pawn to the capturable pawn
     * @returns {ScornfulCaptureDirection}
     */
    get scornfulCaptureDirection() {
        const capturerColumnIndex = this._capturerPawnPos[0];
        const capturablePawnPos = this.capturablePiece.position;
        const capturableColumnIndex = capturablePawnPos[0];
        if (capturablePawnPos[1] > this._capturerPawnPos[1]) {
            return capturableColumnIndex > capturerColumnIndex ? "FileUp" : "FileInvUp";
        }
        else {
            return capturableColumnIndex > capturerColumnIndex ? "FileDown" : "FileInvDown";
        }
    }
    /**
     * Scornful notation: just the move needed to capture
     * @returns {string}
     */
    toString() {
        return PositionHelper.toString(this._capturerPawnPos) + "@" + PositionHelper.toString(this.capturablePiece.position);
    }
}
/** register a pawn special capture state: En passant case */
export class EnPassantCapturable extends PawnSpecialCaptureStatus {
    /**
     * After the promotion, a promoting panw as the new piece regained must update the special capture register,
     * if it were just created in the movement because of double stepping
     * @param  {EnPassantCapturable} enpassantCapturable - the instance to upgrade
     * @param  {Piece} capturablePiece - the piece which the pawn promoted to
     * @returns {EnPassantCapturable} - the instance upgraded
     */
    static promoteCapturablePawn(enpassantCapturable, capturablePiece) {
        return new EnPassantCapturable(capturablePiece, enpassantCapturable._captureTo);
    }
    specialCaptureType = 'enPassant';
    _captureTo;
    /**
     * @constructor
     * @param  {Piece} capturablePawn
     * @param  {Position[]} captureTo
     */
    constructor(capturablePawn, captureTo) {
        super(capturablePawn);
        this._captureTo = captureTo;
    }
    isEnPassantCapture(pos, capturerPawn) {
        const isEnPassantCapturePos = this._captureTo.some(x => PositionHelper.equals(x, pos));
        if (capturerPawn == null)
            return isEnPassantCapturePos;
        else if (isEnPassantCapturePos && capturerPawn.position != null) {
            const capturerPos = capturerPawn.position;
            if (cspty.isPawn(capturerPawn)) {
                if (Math.abs(pos[0] - capturerPos[0]) == 1) {
                    if (capturerPawn.color == 'w')
                        return pos[1] - capturerPos[1] == 3;
                    else
                        return capturerPos[1] - pos[1] == 3;
                }
                else
                    return false;
            }
            else
                return PositionHelper.isDiagonally(pos, capturerPos, cspty.isElephant(capturerPawn)) != null;
        }
        else
            return false;
    }
    /**
     * En Passant notation: The capturable pawn position and its preceding one or two lines where it can be captured
     * @returns {string}
     */
    toString() {
        const captureTo = this._captureTo;
        let strCaptureTo = PositionHelper.toString(captureTo[0]);
        if (captureTo.length == 2) {
            strCaptureTo += "," + (captureTo[1][1]).toString();
        }
        return "P@" + strCaptureTo + "[" + PositionHelper.toString(this.capturablePiece.position) + "]";
    }
}
//#endregion
export class Board {
    isGrand;
    static newHeuristic() {
        return { pieces: [0, 0], space: [0, 0], positioning: 0, mobility: 0, king: 0 };
    }
    static splitCastlingStatus(source) {
        if (source != null && source.length > 0) {
            let wSrc;
            let bSrc;
            let i = 0;
            while (i < source.length && source[i].toUpperCase() == source[i])
                i++;
            if (i == 0) {
                wSrc = "-";
                bSrc = source;
            }
            else if (i == source.length) {
                wSrc = source;
                bSrc = "-";
            }
            else {
                wSrc = source.slice(0, i);
                bSrc = source.slice(i);
            }
            bSrc = bSrc.toUpperCase();
            if (!csty.isCastlingStatus(wSrc) || !csty.isCastlingStatus(bSrc))
                throw new TypeError(`Invalid TLPD issued castling status ${source}`);
            return [wSrc, bSrc];
        }
        else
            return ["RKR", "RKR"];
    }
    static lineMask(l) { return 1 << l; }
    wPositions = [0, 0, 0, 0, 0, 0, 0, 0];
    bPositions = [0, 0, 0, 0, 0, 0, 0, 0];
    wThreats = [0, 0, 0, 0, 0, 0, 0, 0];
    bThreats = [0, 0, 0, 0, 0, 0, 0, 0];
    pieces = new Map();
    wPieces = new Map();
    bPieces = new Map();
    _regainablePieces = [];
    wKing = new King('w');
    bKing = new King('b');
    _specialPawnCapture = null;
    _currentHeuristic = Board.newHeuristic();
    _wAwaitingPromotion = false;
    _bAwaitingPromotion = false;
    _turn;
    /**
     * Creates an instance of Board.
     * @param {boolean} isGrand
     * @param {Turn} [turn='w']
     * @memberof Board
     */
    constructor(isGrand, turn = 'w') {
        this.isGrand = isGrand;
        this._turn = turn ?? 'w';
        this.pieces.set(this.wKing.key, this.wKing);
        this.pieces.set(this.bKing.key, this.bKing);
    }
    /**
     *
     *
     * @readonly
     * @type {Turn}
     * @memberof Board
     */
    get turn() { return this._turn; }
    get turnKing() { return (this.turn === 'w' ? this.wKing : this.bKing); }
    get checked() { return this.turnKing.checked; }
    get isKnightOrCloseCheck() { return this.turnKing.isKnightOrCloseCheck(); }
    get isSingleCheck() { return this.turnKing.isSingleCheck(); }
    get isDoubleCheck() { return this.turnKing.isDoubleCheck(); }
    /**
     * Get a piece by its unique key. Used for serialization of game status.
     *
     * @param {PieceKey} key
     * @return {Piece}
     * @memberof Board
     */
    pieceByKey(key) {
        const piece = this.pieces.get(key);
        assertNonNullish(piece, "piece from unique key");
        return piece;
    }
    /**
     * Special pawn capture available for next move
     *
     * @type {Nullable<PawnSpecialCaptureStatus>}
     * @memberof Board
     */
    get specialPawnCapture() { return this._specialPawnCapture; }
    set specialPawnCapture(value) { this._specialPawnCapture = value; }
    /**
     * Special awaiting promotion status
     *
     * @readonly
     * @type {boolean}
     * @memberof Board
     */
    get isAwaitingPromotion() { return this._turn == 'w' ? this._wAwaitingPromotion : this._bAwaitingPromotion; }
    setAwaitingPromotion(color) {
        if (color == 'w')
            this._wAwaitingPromotion = true;
        else
            this._bAwaitingPromotion = true;
    }
    computeAwaitingPromotion(color) {
        let value = false;
        for (const piece of (color == 'w' ? this.wPieces : this.bPieces).values()) {
            if (cspty.isPawn(piece) && piece.awaitingPromotion) {
                value = true;
                break;
            }
        }
        if (color == 'w')
            this._wAwaitingPromotion = value;
        else
            this._bAwaitingPromotion = value;
    }
    /**
     * Get Heuristic object of the position
     *
     * @readonly
     * @type {Heuristic}
     * @memberof Board
     */
    get currentHeuristic() { return this._currentHeuristic; }
    /**
     * Get the total numeric value from Heuristic
     *
     * @param {Heuristic} h
     * @return {number}
     * @memberof Board
     */
    getHeuristicValue(h) {
        return round2hundredths(h.pieces[0] - h.pieces[1] + h.space[0] - h.space[1] + h.positioning + h.mobility + h.king);
    }
    createPiece(pieceName, color, column, line) {
        let piece;
        switch (pieceName) {
            //TODO: correct the King creation exception?
            case "K": throw new Error("King must be created before setting it on the board");
            case "D":
                piece = new Queen(color, column, line);
                break;
            case "V":
                piece = new Wyvern(color, column, line);
                break;
            case "R":
                piece = new Rook(color, this.isGrand, column, line);
                break;
            case "G":
                piece = new Pegasus(color, column, line);
                break;
            case "N":
                piece = new Knight(color, column, line);
                break;
            case "J":
                piece = new Bishop(color, column, line);
                break;
            case "E":
                piece = new Elephant(color, column, line);
                break;
            case "M":
                piece = new Almogaver(color, column, line);
                break;
            case "P":
                piece = new Pawn(color, column, line);
                break;
            default: {
                const exhaustiveCheck = pieceName;
                throw new Error(exhaustiveCheck);
            }
        }
        if (this.hasPiece(piece.position) == null) {
            this.pieces.set(piece.key, piece);
            this.addPiece(piece);
        }
        else
            throw new Error(`You cannot put a ${color} ${piece.symbol} there` +
                ", because the hex is already in use; There may be a repeated line in the TLPD");
        return piece;
    }
    addPiece(piece) {
        assertNonNullish(piece.position, `${piece.symbol} position`);
        const toPos = piece.position;
        const pieces = (piece.color == "w" ? this.wPieces : this.bPieces);
        pieces.set(PositionHelper.positionKey(toPos), piece);
        const posCol = (toPos[0] + 1) >>> 1;
        const posLineMask = Board.lineMask(toPos[1]);
        const positions = (piece.color == "w" ? this.wPositions : this.bPositions);
        positions[posCol] |= posLineMask;
    }
    /**
     * Is there a piece? Which color is it?
     *
     * @param {Position} pos
     * @return {Nullable<PieceColor>}
     * @memberof Board
     */
    hasPiece(pos) {
        const posCol = (pos[0] + 1) >>> 1;
        const posLineMask = Board.lineMask(pos[1]);
        if ((this.wPositions[posCol] & posLineMask) != 0) {
            return 'w';
        }
        else if ((this.bPositions[posCol] & posLineMask) != 0) {
            return 'b';
        }
        else
            return null;
    }
    /**
     * Get the piece of the position
     *
     * @param {Position} pos
     * @return {Nullable<Piece>}
     * @memberof Board
     */
    getPiece(pos) {
        const color = this.hasPiece(pos);
        if (color == null)
            return null;
        else if (color == 'w') {
            return this.wPieces.get(PositionHelper.positionKey(pos));
        }
        else {
            return this.bPieces.get(PositionHelper.positionKey(pos));
        }
    }
    /**
     * Is color defended in position?
     *
     * @param {Position} pos
     * @param {PieceColor} color
     * @return {boolean}
     * @memberof Board
     */
    hasThreat(pos, color) {
        const posCol = (pos[0] + 1) >>> 1;
        return ((color == "w" ? this.wThreats : this.bThreats)[posCol] & Board.lineMask(pos[1])) != 0;
    }
    /**
     * Is color threatened in position?
     *
     * @param {Position} pos
     * @param {PieceColor} color
     * @return {boolean}
     * @memberof Board
     */
    isThreatened(pos, color) {
        const posCol = (pos[0] + 1) >>> 1;
        return ((color == "w" ? this.bThreats : this.wThreats)[posCol] & Board.lineMask(pos[1])) != 0;
    }
    /**
     * Mark a threat for the opposite color, a defense to its own color, in the position
     *
     * @param {Position} pos
     * @param {PieceColor} color
     * @memberof Board
     */
    setThreat(pos, color) {
        const posCol = (pos[0] + 1) >>> 1;
        (color == "w" ? this.wThreats : this.bThreats)[posCol] |= Board.lineMask(pos[1]);
    }
    //#region Regainable pieces
    addRegainablePiece(piece) {
        if (piece.position == null) {
            this._regainablePieces.push(piece);
            this.pieces.set(piece.key, piece);
        }
    }
    /**
     * Are threre any regainable pieces for the current player?
     *
     * @param {HexColor} hexColor - needed to select bishop color
     * @return {boolean}
     * @memberof Board
     */
    hasRegainablePieces(hexColor) {
        const currentColor = this._turn;
        return this._regainablePieces.reduce((found, p) => found || p.color == currentColor && (!cspty.isBishop(p) || p.hexesColor == hexColor), false);
    }
    /**
     * Check regainable pieces with awaiting promotion pawns, to select the available regainable bishops
     *
     * @return {boolean}
     * @memberof Board
     */
    hasAwaitingRegainablePieces() {
        const currentColor = this._turn;
        if (this._regainablePieces.reduce((found, p) => found || p.color == currentColor && p.symbol != 'J', false))
            return true;
        else {
            const bishops = this._regainablePieces.filter(p => p.color == currentColor && p.symbol == 'J');
            if (bishops.length == 0)
                return false;
            else {
                const pieces = this._turn == 'w' ? this.wPieces : this.bPieces;
                for (const piece of pieces.values()) {
                    if (cspty.isPawn(piece)) {
                        const awaitingPromotion = piece.awaitingPromotion;
                        if (awaitingPromotion != null && bishops.some(b => b.hexesColor == awaitingPromotion))
                            return true;
                    }
                }
                return false;
            }
        }
    }
    /**
     * Set of the regainable pieces available for current player
     *
     * @param {HexColor} hexColor
     * @return {Set<PieceName>}
     * @memberof Board
     */
    currentRegainablePieceNames(hexColor) {
        const currentColor = this._turn;
        return this._regainablePieces.reduce((s, x) => x.color == currentColor && (!cspty.isBishop(x) || x.hexesColor == hexColor) ? s.add(x.symbol) : s, new Set());
    }
    /**
     * Max regainable piece value for current player
     *
     * @param {HexColor} hexColor
     * @return {*}  {number}
     * @memberof Board
     */
    maxRegainablePiecesValue(hexColor) {
        const currentColor = this._turn;
        return this._regainablePieces.reduce((acc, x) => x.value > acc && x.color == currentColor && (!cspty.isBishop(x) || x.hexesColor == hexColor) ? x.value : acc, 0);
    }
    findRegeinablePiece(color, promoteTo, hexColor) {
        const piece = this._regainablePieces.find(p => p.color == color && p.symbol == promoteTo && (!cspty.isBishop(p) || p.hexesColor == hexColor));
        assertNonNullish(piece, "retrieve the promoted piece");
        return piece;
    }
    //#endregion
    /**
     * White player current pieces
     *
     * @yields {Piece}
     * @memberof Board
     */
    *whitePieces() { for (const p of this.wPieces.values())
        yield p; }
    /**
     * Black player current pieces
     *
     * @yields {Piece}
     * @memberof Board
     */
    *blackPieces() { for (const p of this.bPieces.values())
        yield p; }
    *whitePiecePositions() { for (const p of this.wPieces.values())
        yield p.position; }
    *blackPiecePositions() { for (const p of this.bPieces.values())
        yield p.position; }
    /**
     * Move options for a piece on a board context
     *
     * @param {Piece} piece
     * @yields {Position}
     * @memberof Board
     */
    *pieceMoves(piece) {
        const currentKing = this.turnKing;
        if (currentKing.checked) {
            if (piece.symbol == "K")
                yield* piece.moves(this);
            else {
                const capturePos = currentKing.checkThreat;
                if (capturePos != null) {
                    if (piece.canCaptureOn(this, capturePos))
                        yield capturePos;
                }
                if (currentKing.isSingleCheck()) {
                    yield* piece.blockThreat(this, currentKing.getSingleCheckBlockingPositions(this));
                }
            }
        }
        else {
            yield* piece.moves(this);
        }
    }
    movePiece(piece, toColumnIndex, toLine) {
        assertNonNullish(piece.position, `${piece.symbol} position`);
        const piecePos = piece.position;
        const fromPosCol = (piecePos[0] + 1) >>> 1;
        const fromPosLineMask = Board.lineMask(piecePos[1]);
        const pieces = (piece.color == "w" ? this.wPieces : this.bPieces);
        if (cspty.isPawn(piece)) {
            /* ANCHOR: SCORNFUL GRANT MODIFICATION */
            if (piece.position[0] != toColumnIndex && (this.isGrand || Math.abs(piece.position[1] - toLine) == 1)) {
                const frontPiece = this.getPiece([piece.position[0],
                    (toLine > piece.position[1] ? piece.position[1] + 2 : piece.position[1] - 2)]);
                this._specialPawnCapture = (frontPiece != null && cspty.isPawn(frontPiece)) ?
                    new ScornfulCapturable(piece, frontPiece.position)
                    : null;
            }
            else if (Math.abs(toLine - piece.position[1]) > 2) {
                const multipleStep = [];
                if (toLine > piece.position[1]) {
                    multipleStep.push([toColumnIndex, (piece.position[1] + 2)]);
                    if (toLine > piece.position[1] + 4) {
                        multipleStep.push([toColumnIndex, (piece.position[1] + 4)]);
                    }
                }
                else {
                    multipleStep.push([toColumnIndex, (piece.position[1] - 2)]);
                    if (toLine < piece.position[1] - 4) {
                        multipleStep.push([toColumnIndex, (piece.position[1] - 4)]);
                    }
                }
                this._specialPawnCapture = new EnPassantCapturable(piece, multipleStep);
            }
            else {
                this._specialPawnCapture = null;
            }
            if (PositionHelper.isPromotionPos(toColumnIndex, toLine, piece.color)) {
                if (piece.color == 'w')
                    this._wAwaitingPromotion = true;
                else
                    this._bAwaitingPromotion = true;
            }
        }
        else if (cspty.isAlmogaver(piece)) {
            const dirMove = PositionHelper.isOrthogonally(piecePos, [toColumnIndex, toLine]);
            if (dirMove != null) {
                const captureTo = [];
                switch (dirMove) {
                    case "ColumnUp":
                        captureTo.push([piecePos[0], piecePos[1] + 2]);
                        break;
                    case "ColumnDown":
                        captureTo.push([piecePos[0], piecePos[1] - 2]);
                        break;
                    case "FileUp":
                        captureTo.push([piecePos[0] + 1, piecePos[1] + 1]);
                        break;
                    case "FileDown":
                        captureTo.push([piecePos[0] + 1, piecePos[1] - 1]);
                        break;
                    case "FileInvUp":
                        captureTo.push([piecePos[0] - 1, piecePos[1] + 1]);
                        break;
                    case "FileInvDown":
                        captureTo.push([piecePos[0] - 1, piecePos[1] - 1]);
                        break;
                    default: {
                        const exhaustiveCheck = dirMove;
                        throw new Error(exhaustiveCheck);
                    }
                }
                this._specialPawnCapture = new EnPassantCapturable(piece, captureTo);
            }
            else {
                this._specialPawnCapture = null;
            }
        }
        else if (this.isGrand && cspty.isElephant(piece)) {
            /* ANCHOR: ENPASSANT MODIFICATION (ELEPHANT) */
            if (piece.position[0] == toColumnIndex && Math.abs(toLine - piece.position[1]) > 2) {
                const captureLine = (toLine > piece.position[1] ? (piece.position[1] + 2) : (piece.position[1] - 2));
                const captureTo = [[toColumnIndex, captureLine]];
                this._specialPawnCapture = new EnPassantCapturable(piece, captureTo);
            }
            else {
                this._specialPawnCapture = null;
            }
        }
        else {
            this._specialPawnCapture = null;
        }
        pieces.delete(PositionHelper.positionKey(piecePos));
        piece.moveTo(toColumnIndex, toLine); //piecePos updated
        pieces.set(PositionHelper.positionKey(piecePos), piece);
        const toPosCol = (piecePos[0] + 1) >>> 1;
        const toPosLineMask = Board.lineMask(piecePos[1]);
        const positions = (piece.color == "w" ? this.wPositions : this.bPositions);
        positions[fromPosCol] &= ~fromPosLineMask;
        positions[toPosCol] |= toPosLineMask;
    }
    undoPieceMove(piece, fromColumnIndex, fromLine) {
        const pieces = (piece.color == "w" ? this.wPieces : this.bPieces);
        const piecePos = piece.position;
        const actualPosCol = (piecePos[0] + 1) >>> 1;
        const actualPosLineMask = Board.lineMask(piecePos[1]);
        pieces.delete(PositionHelper.positionKey(piecePos));
        piece.moveTo(fromColumnIndex, fromLine); //piecePos updated
        pieces.set(PositionHelper.positionKey(piecePos), piece);
        const fromPosCol = (piecePos[0] + 1) >>> 1;
        const fromPosLineMask = Board.lineMask(piecePos[1]);
        const positions = (piece.color == "w" ? this.wPositions : this.bPositions);
        positions[actualPosCol] &= ~actualPosLineMask;
        positions[fromPosCol] |= fromPosLineMask;
    }
    capturePiece(piece) {
        assertNonNullish(piece.position, `${piece.symbol} position`);
        const fromPos = piece.position;
        const posCol = (fromPos[0] + 1) >>> 1;
        const posLineMask = Board.lineMask(fromPos[1]);
        const positions = (piece.color == "w" ? this.wPositions : this.bPositions);
        positions[posCol] &= ~posLineMask;
        const pieces = (piece.color == "w" ? this.wPieces : this.bPieces);
        pieces.delete(PositionHelper.positionKey(fromPos));
        piece.captured();
        if (piece.isRegainable)
            this._regainablePieces.push(piece);
    }
    undoCapturePiece(piece, colIndex, line) {
        if (Piece.isRegainablePiece(piece.symbol)) {
            const pix = this._regainablePieces.indexOf(piece);
            assertCondition(pix >= 0, "Captured piece found in the regainable pieces bag");
            this._regainablePieces.splice(pix, 1);
        }
        piece.setPositionTo([colIndex, line]);
        this.addPiece(piece);
    }
    promotePawn(pawn, piece) {
        if (this._regainablePieces.includes(piece)) {
            const pieces = (piece.color == "w" ? this.wPieces : this.bPieces);
            pieces.delete(PositionHelper.positionKey(pawn.position));
            pawn.promoteTo(piece);
            pieces.set(PositionHelper.positionKey(piece.position), piece);
            if (this._specialPawnCapture != null && this._specialPawnCapture.capturablePawn == pawn) {
                if (this._specialPawnCapture.isScornfulCapturable()) {
                    this._specialPawnCapture = ScornfulCapturable.promoteCapturablePawn(this._specialPawnCapture, piece);
                }
                else if (this._specialPawnCapture.isEnPassantCapturable()) {
                    this._specialPawnCapture = EnPassantCapturable.promoteCapturablePawn(this._specialPawnCapture, piece);
                }
            }
            const pos = this._regainablePieces.indexOf(piece);
            this._regainablePieces.splice(pos, 1);
            if (piece.color == 'w')
                this._wAwaitingPromotion = false;
            else
                this._bAwaitingPromotion = false;
        }
    }
    undoPromotePawn(pawn, piece) {
        const pieces = (piece.color == "w" ? this.wPieces : this.bPieces);
        pieces.delete(PositionHelper.positionKey(piece.position));
        pawn.setPositionTo([piece.position[0], piece.position[1]]);
        piece.captured();
        this._regainablePieces.push(piece);
        pieces.set(PositionHelper.positionKey(pawn.position), pawn);
    }
    insuficientMaterial() {
        const hasPawns = (values) => { for (const p of values)
            if (cspty.isPawn(p))
                return true; return false; };
        const hasMajorPieces = (values) => { for (const p of values)
            if (cspty.isMajorPiece(p))
                return true; return false; };
        const hasMinorPieces = (values) => { for (const p of values)
            if (cspty.isMinorPiece(p))
                return true; return false; };
        const mediumPieceCount = (values) => {
            let n = 0;
            for (const p of values)
                if (cspty.isMediumPiece(p))
                    n++;
            return n;
        };
        if (this.wPieces.size <= 3 && this.bPieces.size <= 3
            && !hasPawns(this.wPieces.values()) && !hasPawns(this.bPieces.values())) {
            if (hasMajorPieces(this.wPieces.values()) || hasMajorPieces(this.bPieces.values()))
                return false;
            else {
                const wG = mediumPieceCount(this.wPieces.values());
                if (wG == 2)
                    return false;
                else if (wG == 1 && hasMinorPieces(this.wPieces.values()))
                    return false;
                const bG = mediumPieceCount(this.bPieces.values());
                if (bG == 2)
                    return false;
                else if (bG == 1 && hasMinorPieces(this.bPieces.values()))
                    return false;
                return true;
            }
        }
    }
    nextTurn() {
        this._turn = this._turn === 'w' ? 'b' : 'w';
    }
    prepareTurn(currentKing) {
        const color = currentKing.color;
        {
            const threats = (color == "w" ? this.bThreats : this.wThreats);
            for (let i = 0; i <= 7; i++)
                threats[i] = 0;
        }
        {
            const threatingPieces = (color == 'w' ? this.bPieces.values() : this.wPieces.values());
            for (const piece of threatingPieces)
                piece.markThreats(this);
        }
        {
            const ownPieces = (color == "w" ? this.wPieces.values() : this.bPieces.values());
            for (const piece of ownPieces)
                piece.pin = null;
        }
        currentKing.computeCheckAndPins(this);
    }
    prepareCurrentTurn() {
        this.prepareTurn(this.turnKing);
    }
    isMoveableTurn() {
        const movingPieces = (this.turn === 'w' ? this.wPieces.values() : this.bPieces.values());
        for (const piece of movingPieces) {
            const it = this.pieceMoves(piece);
            if (!it.next().done)
                return true;
        }
        return false;
    }
    prepareGame() {
        if (this._turn == 'w')
            this.prepareTurn(this.bKing);
        else
            this.prepareTurn(this.wKing);
        this.prepareCurrentTurn();
    }
    resetGame(turn) {
        for (let i = 0; i < 8; i++) {
            this.wPositions[i] = 0;
            this.bPositions[i] = 0;
            this.wThreats[i] = 0;
            this.bThreats[i] = 0;
        }
        this.pieces.clear();
        this.wPieces.clear();
        this.bPieces.clear();
        if (this.wKing.position != null)
            this.wKing.captured();
        if (this.bKing.position != null)
            this.bKing.captured();
        this._regainablePieces.length = 0;
        this._specialPawnCapture = null;
        this._turn = turn;
        this.pieces.set(this.wKing.key, this.wKing);
        this.pieces.set(this.bKing.key, this.bKing);
    }
    computeHeuristic(turn, moveCount, anyMove, result) {
        const countBitset = function (value) {
            const mask = 1;
            let r = 0;
            while (value > 0) {
                r += value & mask;
                value = value >>> 1;
            }
            return r;
        };
        const countEvenBitset = function (value) {
            const mask = 1;
            let r = 0;
            while (value > 0) {
                r += value & mask;
                value = value >>> 2;
            }
            return r;
        };
        const countOddBitset = function (value) {
            const mask = 1;
            let r = 0;
            value = value >>> 1;
            while (value > 0) {
                r += value & mask;
                value = value >>> 2;
            }
            return r;
        };
        const horizontalXray = function* (board, pos, color) {
            for (const direction of cscnv.orthogonalDirections()) {
                const it = PositionHelper.orthogonalRide(pos, direction);
                let v = it.next();
                while (v.done == false) {
                    const piece1 = board.getPiece(v.value);
                    if (piece1 == null)
                        v = it.next();
                    else {
                        const it2 = PositionHelper.orthogonalRide(v.value, direction);
                        let v2 = it2.next();
                        while (v2.done == false) {
                            const piece2 = board.getPiece(v2.value);
                            if (piece2 == null)
                                v2 = it.next();
                            else {
                                if (piece2.color != color)
                                    yield [piece1, piece2];
                                v2 = it2.return();
                            }
                        }
                        v = it.return();
                    }
                }
            }
        };
        const diagonalXray = function* (board, pos, color) {
            for (const direction of cscnv.diagonalDirections()) {
                const it = PositionHelper.diagonalRide(pos, direction);
                let v = it.next();
                while (v.done == false) {
                    const piece1 = board.getPiece(v.value);
                    if (piece1 == null)
                        v = it.next();
                    else {
                        const it2 = PositionHelper.diagonalRide(v.value, direction);
                        let v2 = it2.next();
                        while (v2.done == false) {
                            const piece2 = board.getPiece(v2.value);
                            if (piece2 == null)
                                v2 = it.next();
                            else {
                                if (piece2.color != color)
                                    yield [piece1, piece2];
                                v2 = it2.return();
                            }
                        }
                        v = it.return();
                    }
                }
            }
        };
        const currentKing = this.turnKing;
        result.pieces[0] = 0;
        result.pieces[1] = 0;
        result.positioning = 0;
        result.mobility = 0;
        if (!anyMove) {
            if (currentKing.checked)
                result.king = -120;
            else
                result.king = -6;
            result.space[0] = 0;
            result.space[0] = 0;
        }
        else {
            const color = turn;
            if (currentKing.checked) {
                if (currentKing.isDoubleCheck())
                    result.king = -15;
                else if (currentKing.isKnightOrCloseCheck())
                    result.king = -12;
                else
                    result.king = -10;
            }
            else if (!currentKing.moved)
                result.king = 0.1;
            else
                result.king = 0;
            for (const pos of currentKing.attemptMoves(this, true)) {
                const pieceColor = this.hasPiece(pos);
                if (currentKing.checked) {
                    if (this.isThreatened(pos, color))
                        result.king -= 2;
                    else if (pieceColor == null)
                        result.king += 0.5;
                    else if (pieceColor == color)
                        result.king -= 0.5;
                }
                else {
                    if (this.isThreatened(pos, color)) {
                        result.king -= this.hasThreat(pos, color) ? 0.25 : 0.5;
                    }
                    else if (pieceColor == null)
                        result.king -= 0.01;
                    else if (pieceColor == color)
                        result.king += 0.05;
                }
            }
            const pieces = turn == 'w' ? this.wPieces : this.bPieces;
            const oponentPieces = turn == 'w' ? this.bPieces : this.wPieces;
            const ownThreats = turn == 'w' ? this.wThreats : this.bThreats;
            const oponentThreats = turn == 'w' ? this.bThreats : this.wThreats;
            const ownCentralHexMask = turn == 'w' ? ((63 >>> 1) >>> 0) : (((63 >>> 1) >>> 0) << 24);
            const oponentCentralHexMask = turn == 'w' ? (((63 >>> 1) >>> 0) << 24) : ((63 >>> 1) >>> 0);
            const oponentPositions = turn == 'w' ? this.bPositions : this.wPositions;
            let ownTotalHexes = 0;
            let oponentTotalHexes = 0;
            let ownCentralHexes = 0;
            let oponentCentralHexes = 0;
            let nOwnBishops = 0;
            let nOponentBishops = 0;
            let enpriseTotal = 0;
            let threats = 0;
            let pin = 0;
            {
                // reverse threats are already computed prepareCurrentTurn
                const threats = (color == "w" ? this.wThreats : this.bThreats);
                for (let i = 0; i <= 7; i++)
                    threats[i] = 0;
                for (const piece of pieces.values()) {
                    piece.markThreats(this);
                }
            }
            let development = 0;
            let troupCount = 0;
            let troupDeveloped = 0;
            let pieceDeveloped = 0;
            let advancedPawn = 0;
            const isTroupDeveloped = (pos, color) => color == 'w' ? pos[1] > 8 : pos[1] < 20;
            const isPieceDeveloped = (pos, color) => color == 'w' ? pos[1] > (pos[0] == 7 ? 6 : 3) : pos[1] < (pos[0] == 7 ? 22 : 25);
            for (const piece of pieces.values()) {
                if (piece.position != null) {
                    const defended = this.hasThreat(piece.position, color);
                    result.pieces[0] += piece.value;
                    if (piece.symbol === 'J')
                        nOwnBishops++;
                    if (this.isThreatened(piece.position, color)) {
                        threats -= defended ? piece.value * 0.75 : piece.value;
                    }
                    else if (defended)
                        threats += 1 - piece.value * 0.0625; //=1/16
                    //pinned piece cant move
                    if (piece.pin == null) {
                        for (const m of this.pieceMoves(piece)) {
                            result.mobility += 0.01;
                        }
                        if (piece.hasOrthogonalAttack) {
                            for (const [p1, p2] of horizontalXray(this, piece.position, color)) {
                                if (p1.color == color) {
                                    if (p1.value <= piece.value && piece.value < p2.value) {
                                        if (p1.hasOrthogonalAttack) {
                                            //p2.value already counted other place
                                            threats += (p2.value - p1.value) * 0.25; //add attack for sure gain
                                        }
                                        else if ((defended || !p2.hasOrthogonalAttack)) {
                                            threats += p2.value * 0.0625; //attack to p2 hindered by p1
                                        }
                                    }
                                    //waring! else cases: p1.value already counted other place
                                }
                                else if (p1.value > piece.value) {
                                    threats += (p1.value - piece.value) * 0.25; //add attack for sure gain
                                }
                                else if (p1.value < p2.value && !p1.hasOrthogonalAttack && p2.value > piece.value) {
                                    threats += p1.value * 0.25; //p1 pinned cause of attack to p2
                                }
                            }
                            if (isPieceDeveloped(piece.position, color))
                                pieceDeveloped += piece.value;
                        }
                        if (piece.hasDiagonalAttack) {
                            for (const [p1, p2] of diagonalXray(this, piece.position, color)) {
                                if (p1.color == color) {
                                    if (p1.value <= piece.value && piece.value < p2.value) {
                                        if (p1.hasDiagonalAttack) {
                                            //p2.value already counted other place
                                            threats += (p2.value - p1.value) * 0.25; //add attack for sure gain
                                        }
                                        else if ((defended || !p2.hasDiagonalAttack)) {
                                            threats += p2.value * 0.0625; //attack to p2 hindered by p1
                                        }
                                    }
                                    //waring! else cases: p1.value already counted other place
                                }
                                else if (p1.value > piece.value) {
                                    threats += (p1.value - piece.value) * 0.25; //add attack for sure gain
                                }
                                else if (p1.value < p2.value && !p1.hasDiagonalAttack && p2.value > piece.value) {
                                    threats += p1.value * 0.25; //p1 pinned cause of attack to p2
                                }
                            }
                            if (isPieceDeveloped(piece.position, color))
                                pieceDeveloped += piece.value;
                        }
                        else if (cspty.isElephant(piece) || cspty.isAlmogaver(piece)) {
                            troupCount += piece.value;
                            if (isTroupDeveloped(piece.position, color))
                                troupDeveloped += piece.value;
                        }
                        else if (cspty.isPawn(piece)) {
                            troupCount += piece.value;
                            if (piece.hasTripleStep(this.isGrand))
                                result.mobility += 0.01;
                            else if (isTroupDeveloped(piece.position, color)) {
                                troupDeveloped++;
                                if (defended) {
                                    troupDeveloped++;
                                    const pd = PositionHelper.promotionDistance(piece.position, color);
                                    if (pd < 14) {
                                        advancedPawn += (14 - PositionHelper.promotionDistance(piece.position, color)) << 1;
                                    }
                                }
                            }
                        }
                    }
                    else {
                        //simplification of pin case: cant do any move
                        pin -= piece.value;
                        result.king -= defended ? 0.2 : 0.4;
                    }
                }
            }
            if (moveCount <= 12) {
                if (((troupCount - troupDeveloped) >> 1) > troupDeveloped) {
                    development = troupDeveloped - pieceDeveloped;
                }
            }
            for (const piece of oponentPieces.values()) {
                if (piece.position != null) {
                    result.pieces[1] += piece.value;
                    if (piece.symbol === 'J')
                        nOponentBishops++;
                    //be careful: Threated changed as hasThreat cause of color
                    if (this.hasThreat(piece.position, color))
                        threats += piece.value;
                    if (piece.pin != null)
                        pin += piece.value;
                }
            }
            for (let i = 0; i <= 7; i++) {
                let enprise = oponentPositions[i] & ownThreats[i] & ~oponentThreats[i];
                let j = 0;
                while (enprise != 0) {
                    if ((enprise & 1) == 1) {
                        const colIndex = (i << 1) - ((j + 1) % 2);
                        const piece = this.getPiece([colIndex, j]);
                        enpriseTotal += piece.value;
                    }
                    enprise = enprise >>> 1;
                    j++;
                }
                ownTotalHexes += countBitset(ownThreats[i]);
                oponentTotalHexes += countBitset(oponentThreats[i]);
            }
            ownCentralHexes += countOddBitset(ownThreats[2] & ~oponentThreats[2] & ownCentralHexMask);
            oponentCentralHexes += countOddBitset(oponentThreats[2] & ~ownThreats[2] & oponentCentralHexMask);
            for (let i = 3; i <= 5; i++) {
                ownCentralHexes += countBitset(ownThreats[i] & ~oponentThreats[i] & ownCentralHexMask);
                oponentCentralHexes += countBitset(oponentThreats[i] & ~ownThreats[i] & oponentCentralHexMask);
            }
            if (nOwnBishops >= 2)
                result.pieces[0] += nOwnBishops == 3 ? 1 : 0.5;
            if (nOponentBishops >= 2)
                result.pieces[1] += nOponentBishops == 3 ? 1 : 0.5;
            result.space[0] = ownTotalHexes * 0.01;
            result.space[1] = oponentTotalHexes * 0.01;
            result.positioning = (ownCentralHexes - oponentCentralHexes + threats + pin + development + advancedPawn) * 0.01 + enpriseTotal * 0.125;
        }
        return result;
    }
}
export class Game extends Board {
    static movesToString(moves) {
        let result = [];
        if (moves.length > 0) {
            let ini;
            if (moves[0].turn == 'b') {
                result.push(moves[0].n + ". \u2026, " + csmv.fullMoveNotation(moves[0]));
                ini = 1;
            }
            else
                ini = 0;
            for (let i = ini; i < moves.length; i += 2) {
                let move = csmv.fullMoveNotation(moves[i]);
                if (i + 1 < moves.length) {
                    move += ", " + csmv.fullMoveNotation(moves[i + 1]);
                }
                result.push(move);
            }
        }
        return result.join("\n");
    }
    static kingCastlingPosition(color, column) {
        const kingPosition = (color == 'w' ? PositionHelper.whiteKingInitPosition : PositionHelper.blackKingInitPosition);
        const kingCastleMove = (color == 'w' ? Game.whiteKingCastlingMove : Game.blackKingCastlingMove)[column];
        return PositionHelper.knightJump(kingPosition, kingCastleMove);
    }
    //#region PRIVATE STATIC
    static convertPieceAliases(pieceSymbol) {
        switch (pieceSymbol) {
            case "Q": return "D";
            case "W": return "V";
            case "T": return "R";
            case "C":
            case "S": return "N";
            case "A":
            case "B":
            case "F":
            case "L": return "J";
            default: {
                if (csty.isPieceName(pieceSymbol))
                    return pieceSymbol;
                else
                    throw new TypeError(`Invalid piece symbol ${pieceSymbol}`);
            }
        }
    }
    static whiteKingCastlingMove = {
        'I': "LineUp-FileUp",
        'H': "LineUp-ColumnUp",
        'F': "LineInvUp-ColumnUp",
        'E': "LineInvUp-FileInvUp",
        'D': "TransversalLineDec-FileInvUp"
    };
    static blackKingCastlingMove = {
        'I': "LineDown-FileDown",
        'H': "LineDown-ColumnDown",
        'F': "LineInvDown-ColumnDown",
        'E': "LineInvDown-FileInvDown",
        'D': "TransversalLineDec-FileInvDown"
    };
    static rookCastleMove(kingDestinationColumn, rookDestinationColumn, color, side, grand) {
        if (side == 'K') {
            if (rookDestinationColumn == 'K')
                return grand ? (color == 'w' ? "ColumnUp" : "ColumnDown") : color == 'w' ? "FileUp" : "FileDown";
            else if (rookDestinationColumn == 'I')
                return grand ? (color == 'w' ? "FileInvDown" : "FileInvUp") : color == 'w' ? "ColumnUp" : "ColumnDown";
            else
                return color == 'w' ? "FileInvUp" : "FileInvDown";
        }
        else {
            if (rookDestinationColumn == 'E' && kingDestinationColumn == 'D')
                return color == 'w' ? "FileDown" : "FileUp";
            else
                return color == 'w' ? "FileUp" : "FileDown";
        }
    }
    //#endregion
    _moves = [];
    _top = -1;
    _moveNumber;
    halfmoveClock;
    fixedNumbering = true;
    _mate = false;
    _stalemate = false;
    _draw = false;
    _resigned = false;
    _enpassantCaptureCoordString = null;
    constructor(grand = false, restoreStatusTLPD) {
        const restoreStatus = restoreStatusTLPD?.split(" ");
        const turn = restoreStatus?.[1] != null && (restoreStatus[1] == 'w' || restoreStatus[1] == 'b') ? restoreStatus[1] : 'w';
        super(grand, turn);
        if (restoreStatusTLPD === undefined) {
            this.fillDefaultPositions();
            this.halfmoveClock = 0;
            this._moveNumber = 1;
            this.fixedNumbering = true;
        }
        else if (restoreStatus != null && restoreStatus.length >= 2 && csty.isTurn(restoreStatus[1])) {
            const [wCastlingStatus, bCastlingStatus] = Board.splitCastlingStatus(restoreStatus[2]);
            this.restoreTLPDPositions(restoreStatus[0], wCastlingStatus, bCastlingStatus);
            this.halfmoveClock = csty.isNumber(Number(restoreStatus[4])) ? Number(restoreStatus[4]) : 0;
            if (isNaN(Number(restoreStatus[4]))) {
                if (restoreStatus[4] != null && restoreStatus[4] !== "-")
                    throw new TypeError("Invalid halfmove clock value");
            }
            this._moveNumber = csty.isNumber(Number(restoreStatus[5])) ? Number(restoreStatus[5]) : 1;
            if (isNaN(Number(restoreStatus[5]))) {
                if (restoreStatus[5] == null || restoreStatus[5] == "-")
                    this.fixedNumbering = false;
                else
                    throw new TypeError("Invalid move number");
            }
            else
                this.fixedNumbering = true;
            super.specialPawnCapture = PawnSpecialCaptureStatus.parse(this, restoreStatus[3]);
        }
        else
            throw new Error("Piece positions and turn are mandatory parts of the TLPD string");
        this.initGame();
    }
    get moveNumber() { return this._moveNumber; }
    get gameEnd() { return this._mate || this._stalemate || this._draw || this._resigned; }
    get mate() { return this._mate; }
    get stalemate() { return this._stalemate; }
    set draw(value) { this._draw = value; }
    get draw() { return this._draw; }
    set resign(value) { this._resigned = value; }
    get resigned() { return this._resigned; }
    getHexPiece(pos) {
        const p = PositionHelper.parse(pos);
        if (p == null || !PositionHelper.isValidPosition(p))
            return null;
        else
            return this.getPiece(p);
    }
    get lastMove() {
        if (this._moves.length > 0)
            return this._moves[this._moves.length - 1];
        else
            return null;
    }
    get strLastMove() {
        if (this._top >= 0)
            return csmv.fullMoveNotation(this._moves[this._top], false);
        else
            return null;
    }
    get resultString() {
        if (this.gameEnd) {
            if (this._mate || this._resigned)
                return this.turn == 'w' ? "0 - 3" : "3 - 0";
            else if (this._stalemate)
                return this.turn == 'w' ? "1 - 2" : "2 - 1";
            else if (this._draw)
                return "1 - 1";
            else
                throw new Error("End game exhaustiveCheck fail");
        }
        else
            return null;
    }
    set resultString(value) {
        if (value != null && value.length > 0) {
            if (this.gameEnd) {
                if (value != this.resultString)
                    throw new Error(`Incorrect end game value issued: ${value} correct value ${this.resultString}`);
            }
            else {
                switch (value) {
                    case "0 - 3": {
                        if (this.turn == 'w')
                            this.resign = true;
                        else
                            throw new Error(`Incorrect resign turn: ${value}`);
                        break;
                    }
                    case "3 - 0": {
                        if (this.turn == 'b')
                            this.resign = true;
                        else
                            throw new Error(`Incorrect resign turn: ${value}`);
                        break;
                    }
                    case "1 - 1": {
                        this.draw = true;
                        break;
                    }
                    case "null": break;
                    default: throw new Error(`Incorrect end game value issued: ${value}`);
                }
            }
        }
    }
    get enPassantCaptureCoordString() {
        return this._enpassantCaptureCoordString;
    }
    get preMoveHeuristic() { return this.currentHeuristic; }
    /**
     * Current positions of the pieces
     *
     * @yield {string} - piece name, capitalized for whites, followed by hex name.
     * @memberof Game
     */
    *pieceList() {
        for (const p of this.whitePieces())
            yield p.uncapitalizedSymbolPositionString;
        for (const p of this.blackPieces())
            yield p.uncapitalizedSymbolPositionString;
    }
    /**
     * Current positions of the player threatened pieces
     *
     * @yield {string} - hex name
     * @memberof Game
     */
    *threatenedPieceStringPositions() {
        const piecePositionsGenerator = this.turn == 'w' ? this.whitePiecePositions() : this.blackPiecePositions();
        const color = this.turn;
        for (const pos of piecePositionsGenerator) {
            if (this.isThreatened(pos, color))
                yield PositionHelper.toString(pos);
        }
    }
    /**
     * Current positions of pieces which the player threats
     *
     * @yield {string} - hex name
     * @memberof Game
     */
    *threatsPieceStringPositions() {
        const piecePositionsGenerator = this.turn == 'w' ? this.blackPiecePositions() : this.whitePiecePositions();
        const color = this.turn;
        for (const pos of piecePositionsGenerator) {
            if (this.hasThreat(pos, color))
                yield PositionHelper.toString(pos);
        }
        const specialPawnCapture = this.specialPawnCapture;
        if (specialPawnCapture != null) {
            if (specialPawnCapture.isScornfulCapturable())
                yield PositionHelper.toString(specialPawnCapture.capturablePiece.position);
            else if (specialPawnCapture.isEnPassantCapturable()) {
                const enPassantPos = specialPawnCapture.capturablePiece.position;
                if (this.isThreatened(enPassantPos, color))
                    yield PositionHelper.toString(enPassantPos);
            }
        }
    }
    /**
     * Move from hex to hex (for GUI)
     *
     * @param {string} fromHex
     * @param {string} toHex
     * @param {PieceName} [pieceName] - Must be the piece on fromHex position; useless, but a check
     * @memberof Game
     */
    doMove(fromHex, toHex, pieceName) {
        try {
            assertCondition(this._top == this._moves.length - 1, "push the moves over the last one");
            const moveFrom = PositionHelper.parse(fromHex);
            const moveTo = PositionHelper.parse(toHex);
            const piece = this.getPiece(moveFrom);
            assertCondition(piece != null, `piece on ${fromHex} position`);
            assertCondition(pieceName == undefined || piece.symbol == pieceName, `${pieceName} is the piece on ${moveFrom}`);
            assertCondition(piece.canMoveTo(this, moveTo), `Piece ${piece.symbol} at ${piece.position?.toString()} move to ${moveTo.toString()}`);
            const move = {
                piece: piece.key,
                pos: moveFrom,
                moveTo: moveTo
            };
            const capturedPiece = this.getPiece(moveTo);
            if (capturedPiece != null) {
                assertCondition(piece.color != capturedPiece.color && piece.canCaptureOn(this, moveTo), `Piece ${piece.symbol} at ${piece.position?.toString()} capture on ${moveTo.toString()}`);
                const isScornfulCapture = cspty.isPawn(piece) && this.specialPawnCapture != null &&
                    this.specialPawnCapture.isScornfulCapturable() && this.specialPawnCapture.isScorned(piece, moveTo);
                move.captured = capturedPiece.key;
                move.special = isScornfulCapture ? moveTo : undefined;
                this._enpassantCaptureCoordString = null;
                /* ANCHOR: ENPASSANT CONDITION MODIFICATION (ELEPHANT) */
            }
            else if (this.specialPawnCapture != null
                && (cspty.isPawn(piece)
                    || cspty.isAlmogaver(piece)
                    || (this.isGrand && cspty.isElephant(piece)))
                && this.specialPawnCapture.isEnPassantCapturable()
                && this.specialPawnCapture.isEnPassantCapture(moveTo, piece)) {
                const enPassantCapture = this.specialPawnCapture.capturablePiece;
                move.captured = enPassantCapture.key;
                move.special = [enPassantCapture.position[0], enPassantCapture.position[1]];
                this._enpassantCaptureCoordString = PositionHelper.toString(move.special);
            }
            else {
                this._enpassantCaptureCoordString = null;
            }
            this.pushMove(move);
        }
        catch (e) {
            if (e instanceof Error && e.name == 'Error')
                e.name = 'DoMove';
            throw e;
        }
    }
    /**
     * Move pawn with promotion (GUI)
     *
     * @param {string} fromHex
     * @param {string} toHex
     * @param {PieceName} promoteTo
     * @memberof Game
     */
    doPromotePawn(fromHex, toHex, promoteTo) {
        try {
            assertCondition(this._top == this._moves.length - 1, "push the moves over the last one");
            const moveFrom = PositionHelper.parse(fromHex);
            const moveTo = PositionHelper.parse(toHex);
            const pawn = this.getPiece(moveFrom);
            assertCondition(pawn != null && cspty.isPawn(pawn), `pawn on ${fromHex} position`);
            assertCondition(PositionHelper.isPromotionHex(moveTo, pawn.color), "Promotion hex");
            const hexesColor = PositionHelper.hexColor(moveTo);
            const piece = super.findRegeinablePiece(pawn.color, promoteTo, hexesColor);
            const promotion = {
                piece: pawn.key,
                prPos: moveTo,
                promoted: piece
            };
            if (!PositionHelper.equals(moveFrom, moveTo)) {
                promotion.pos = moveFrom;
                promotion.moveTo = moveTo;
                const capturedPiece = this.getPiece(moveTo);
                if (capturedPiece != null) {
                    assertCondition(pawn.color != capturedPiece.color && pawn.canCaptureOn(this, moveTo), `Pawn at ${piece.position?.toString()} capture on ${moveTo.toString()}`);
                    const isScornfulCapture = cspty.isPawn(piece) && this.specialPawnCapture != null &&
                        this.specialPawnCapture.isScornfulCapturable() && this.specialPawnCapture.isScorned(piece, moveTo);
                    promotion.captured = capturedPiece.key;
                    promotion.special = isScornfulCapture ? moveTo : undefined;
                    this._enpassantCaptureCoordString = null;
                }
                else if (this.specialPawnCapture != null && this.specialPawnCapture.isEnPassantCapturable()
                    && this.specialPawnCapture.isEnPassantCapture(moveTo, pawn)) {
                    const enPassantCapture = this.specialPawnCapture.capturablePiece;
                    promotion.captured = enPassantCapture.key;
                    promotion.special = [enPassantCapture.position[0], enPassantCapture.position[1]];
                    this._enpassantCaptureCoordString = PositionHelper.toString(promotion.special);
                }
                else {
                    this._enpassantCaptureCoordString = null;
                }
            }
            this.pushMove(promotion);
        }
        catch (e) {
            if (e instanceof Error && e.name == 'Error')
                e.name = 'DoPromotePawn';
            throw e;
        }
    }
    /**
     * Apply castling move (GUI; castling is selected from a list)
     *
     * @param {(CastlingString | GrandCastlingString)} strMove
     * @memberof Game
     */
    doCastling(strMove) {
        try {
            if (this.isGrand)
                assertCondition(csty.isGrandCastlingString(strMove), "castling move string");
            else
                assertCondition(csty.isCastlingString(strMove), "castling move string");
            const currentKing = super.turnKing;
            const currentColor = this.turn;
            const cmove = strMove.split("-");
            const side = cmove[0][2] == 'R' ? 'K' : cmove[0][2];
            const kCol = cmove[1][0];
            const rCol = cmove[1][1];
            const rCol2 = cmove[1].length == 3 && cmove[1][2] != 'O' ? cmove[1][2] : undefined;
            const singleStep = cmove[1].length > 3 ? false : cmove[1].length == 3 && cmove[1][2] == 'O' ? true : undefined; //KRK-HIO i KRK-HIOO
            const kPos = Game.kingCastlingPosition(currentKing.color, kCol);
            assertCondition(side == 'K' || side == 'D', `${side} must be King (K) side or Queen (D) side`);
            const rPos = this.castlingRookPosition(kCol, rCol, side, singleStep);
            const rook = this.getPiece(side == 'K' ? PositionHelper.initialKingSideRookPosition(currentColor, this.isGrand)
                : PositionHelper.initialQueenSideRookPosition(currentColor, this.isGrand));
            assertCondition(!currentKing.moved, "King hasn't been moved");
            assertNonNullish(kPos, "king destination hex");
            assertCondition(this.hasPiece(kPos) == null, "empty king destination hex");
            assertCondition(!this.isThreatened(kPos, currentKing.color), "Not threated king destination hex");
            assertNonNullish(rook, "castling rook piece");
            assertCondition(cspty.isRook(rook), "castling rook");
            assertCondition(!rook.moved, "castling rook's not been moved");
            assertCondition(rook.canMoveTo(this, rPos, false), "castling rook movement");
            const castlingMove = {
                side: cmove[0][2],
                col: kCol,
                rPos: rPos,
                kRook: side == 'K' ? rook.key : undefined,
                qRook: side == 'D' ? rook.key : undefined
            };
            if (rCol2 !== undefined) {
                const r2Pos = this.castlingRookPosition(kCol, rCol2, 'D', singleStep);
                const rook2 = this.getPiece(PositionHelper.initialQueenSideRookPosition(currentColor, this.isGrand));
                assertNonNullish(rook2, "double castling queen side rook");
                assertCondition(cspty.isRook(rook2), "castling queen rook");
                assertCondition(!rook2.moved, "castling queen rook's not been moved");
                assertCondition(rook2.canMoveTo(this, r2Pos, false), "castling queen rook movement");
                castlingMove["r2Pos"] = r2Pos;
                castlingMove["qRook"] = rook2.key;
            }
            this._enpassantCaptureCoordString = null;
            this.pushMove(castlingMove);
        }
        catch (e) {
            if (e instanceof Error && e.name == 'Error')
                e.name = 'doCastling';
            throw e;
        }
    }
    /**
     * Undo the last move
     *
     * @memberof Game
     */
    popMove() {
        if (this._moves.length > 1 || this._top == 0 && this._moves[0].move != '\u2026') {
            assertCondition(this._moves[this._top].move != '\u2026');
            this._top--;
            const turnInfo = this._moves.pop();
            assertCondition(turnInfo.move != '\u2026');
            super.nextTurn(); //works anyway
            this._draw = false;
            this._resigned = false;
            this._mate = false;
            this._stalemate = false;
            this.undoMove(turnInfo.move, turnInfo.turn);
            if (turnInfo.castlingStatus !== undefined && csmv.isMoveInfo(turnInfo.move)) {
                const symbol = cscnv.getPieceKeyName(turnInfo.move.piece);
                if (symbol === 'R' || symbol === 'K') {
                    const piece = this.pieceByKey(turnInfo.move.piece);
                    switch (symbol) {
                        case 'R':
                            piece.setCastlingStatus(turnInfo.castlingStatus, this.isGrand);
                            break;
                        case 'K':
                            piece.castlingStatus = turnInfo.castlingStatus;
                            break;
                    }
                }
            }
            if (turnInfo.specialCapture === undefined)
                this.specialPawnCapture = null;
            else
                this.specialPawnCapture = PawnSpecialCaptureStatus.parse(this, turnInfo.specialCapture);
            if (this.isAwaitingPromotion) {
                if (csmv.isMoveInfo(turnInfo.move) && cscnv.getPieceKeyName(turnInfo.move.piece) == 'P'
                    || csmv.isPromotionInfo(turnInfo.move)) {
                    this.computeAwaitingPromotion(turnInfo.turn == 'b' ? 'w' : 'b');
                }
            }
            if (this.turn === 'b')
                this._moveNumber--;
            if (turnInfo.iHMClock === undefined)
                this.halfmoveClock--;
            else
                this.halfmoveClock = 0;
            super.prepareCurrentTurn();
            super.computeHeuristic(this.turn, this._moveNumber, true, this.currentHeuristic);
        }
    }
    //#region CASTLING
    *castlingMoves(color, kingFinalPos) {
        //TODO castlingMoves without string (useful to generate moves for minimax)
    }
    *castlingStrMoves(color, kingFinalPos) {
        const qRookPos = PositionHelper.initialQueenSideRookPosition(color, this.isGrand);
        const kRookPos = PositionHelper.initialKingSideRookPosition(color, this.isGrand);
        const qRook = this.getPiece(qRookPos);
        const kRook = this.getPiece(kRookPos);
        if (kRook != null && !kRook.moved) {
            for (const d of cscnv.orthogonalDirections()) {
                const destPos = PositionHelper.orthogonalStep(kingFinalPos, d);
                if (destPos != null && kRook.canMoveTo(this, destPos, false)) {
                    let str = "KRK-" + cscnv.columnFromIndex(kingFinalPos[0]) + cscnv.columnFromIndex(destPos[0]);
                    //specific case
                    if (kingFinalPos[0] == 9 && destPos[0] == 10) {
                        const rookDesp = destPos[1] - kRookPos[1];
                        str += rookDesp == 2 || rookDesp == -2 ? "O" : "OO";
                    }
                    yield (str);
                    //double castling
                    if (qRook != null && !qRook.moved) {
                        let c;
                        let l;
                        if (kingFinalPos[0] == destPos[0]) {
                            c = destPos[0] + 1;
                            l = (kingFinalPos[1] > destPos[1] ? destPos[1] + 1 : kingFinalPos[1] + 1);
                            const rrPos = [c, l];
                            //only one of this positions is possible for a double castling, as are different files
                            let canMove;
                            canMove = qRook.canMoveTo(this, rrPos, false);
                            if (!canMove) {
                                rrPos[0] = destPos[0] - 1;
                                canMove = qRook.canMoveTo(this, rrPos, false);
                            }
                            if (canMove) {
                                str = "KRR-" +
                                    cscnv.columnFromIndex(kingFinalPos[0]) +
                                    cscnv.columnFromIndex(destPos[0]) +
                                    cscnv.columnFromIndex(rrPos[0]);
                                yield str;
                            }
                        }
                        else {
                            c = destPos[0];
                            l = (kingFinalPos[1] > destPos[1] ? destPos[1] + 2 : destPos[1] - 2);
                            const rrPos = [c, l];
                            if (qRook.canMoveTo(this, rrPos, false)) {
                                str = "KRR-" +
                                    cscnv.columnFromIndex(kingFinalPos[0]) +
                                    cscnv.columnFromIndex(destPos[0]) +
                                    cscnv.columnFromIndex(rrPos[0]);
                                yield str;
                            }
                            rrPos[0] = kingFinalPos[0];
                            rrPos[1] = (kingFinalPos[1] > destPos[1] ? kingFinalPos[1] - 2 : kingFinalPos[1] + 2);
                            if (qRook.canMoveTo(this, rrPos, false)) {
                                str = "KRR-" +
                                    cscnv.columnFromIndex(kingFinalPos[0]) +
                                    cscnv.columnFromIndex(destPos[0]) +
                                    cscnv.columnFromIndex(rrPos[0]);
                                yield str;
                            }
                        }
                    }
                }
            }
        }
        if (qRook != null && !qRook.moved) {
            for (const d of cscnv.orthogonalDirections()) {
                const destPos = PositionHelper.orthogonalStep(kingFinalPos, d);
                if (destPos != null && qRook.canMoveTo(this, destPos, false)) {
                    yield ("KRD-" + cscnv.columnFromIndex(kingFinalPos[0]) + cscnv.columnFromIndex(destPos[0]));
                }
            }
        }
    }
    castlingKingPosition(column) {
        assertCondition(csty.isCastlingColumn(column), `Column: ${column} has to be a king castling column`);
        const currentKing = super.turnKing;
        if (currentKing.moved)
            return null;
        else {
            const pos = Game.kingCastlingPosition(currentKing.color, column);
            if (this.hasPiece(pos) == null && !this.isThreatened(pos, currentKing.color))
                return pos;
            else
                return null;
        }
    }
    castlingRookPosition(kingColumn, rookColumn, side, singleStep) {
        const currentColor = this.turn;
        const rookPos = side == 'K' ? PositionHelper.initialKingSideRookPosition(currentColor, this.isGrand)
            : PositionHelper.initialQueenSideRookPosition(currentColor, this.isGrand);
        assertCondition(csty.isCastlingColumn(kingColumn), `King column: ${kingColumn} has to be a king castling column`);
        const dir = Game.rookCastleMove(kingColumn, rookColumn, currentColor, side, this.isGrand);
        let pos = PositionHelper.orthogonalStep(rookPos, dir);
        if (dir == "ColumnUp" || dir == "ColumnDown") {
            if (singleStep === undefined && !this.isGrand || singleStep !== undefined && !singleStep) {
                pos = PositionHelper.orthogonalStep(pos, dir);
            }
            return pos;
        }
        else {
            const rookColumnIndex = cscnv.toColumnIndex(rookColumn);
            while (pos[0] != rookColumnIndex) {
                pos = PositionHelper.orthogonalStep(pos, dir);
            }
            return pos;
        }
    }
    playerCastlingPositionStatus(column) {
        const currentKing = super.turnKing;
        assertCondition(csty.isCastlingColumn(column), `Column: ${column} has to be a king castling column`);
        if (currentKing.moved)
            return null;
        else {
            const kingCastleMove = (this.turn == 'w' ? Game.whiteKingCastlingMove : Game.blackKingCastlingMove)[column];
            const pos = PositionHelper.knightJump(currentKing.position, kingCastleMove);
            return [pos,
                this.hasPiece(pos) != null ? 'occupied' : this.isThreatened(pos, currentKing.color) ? 'threated' : ""];
        }
    }
    get castlingStatus() {
        const w = this.wKing.getCastlingStatus(this);
        const b = this.bKing.getCastlingStatus(this).toLowerCase();
        if (w == "-" && b == "-")
            return "-";
        else if (w == "-")
            return b;
        else if (b == "-")
            return w;
        else
            return w + b;
    }
    playerCastlingStatus() {
        return super.turnKing.getCastlingStatus(this);
    }
    //#endregion
    //#region STORED MOVES
    get topHalfMove() { return this._top; }
    moves(fromMove) { return Object.freeze(this._moves.slice(fromMove)); }
    strMoves() { return Game.movesToString(this._moves); }
    moveBottom() {
        while (this._top > 1 || this._top == 1 && this._moves[0].move != '\u2026') {
            const moveInfo = this._moves[this._top--];
            assertCondition(moveInfo.move != '\u2026');
            this.undoMove(moveInfo.move, moveInfo.turn);
        }
    }
    moveBackward() {
        if (this._top > 1 || this._top == 1 && this._moves[0].move != '\u2026') {
            const moveInfo = this._moves[this._top--];
            assertCondition(moveInfo.move != '\u2026');
            this.undoMove(moveInfo.move, moveInfo.turn);
        }
    }
    moveForward() {
        if (this._top < this._moves.length - 1) {
            const moveInfo = this._moves[++this._top];
            assertCondition(moveInfo.move != '\u2026');
            this.applyMove(moveInfo.move, moveInfo.turn);
        }
    }
    moveTop() {
        while (this._top < this._moves.length - 1) {
            const moveInfo = this._moves[++this._top];
            assertCondition(moveInfo.move != '\u2026');
            this.applyMove(moveInfo.move, moveInfo.turn);
        }
    }
    get topMoveId() {
        return this._top >= 0 ? csmv.undoStatusId(this._moves[this._top]) : "";
    }
    get movesJSON() {
        return JSON.stringify(this._moves);
    }
    restoreMovesJSON(moves) {
        //version name changes (to remove after some time)
        const strMv = moves
            .replace(/"initHalfMoveClock":/g, '"iHMClock":')
            .replace(/"specialPawnCapture":/g, '"specialCapture":');
        const tmpMoves = JSON.parse(strMv);
        this.restoreMoves(tmpMoves);
    }
    restoreMoves(moves) {
        while (moves.length > 0) {
            const moveInfo = moves.shift();
            assertCondition(moveInfo.move != '\u2026');
            this.pushMove(moveInfo.move);
        }
        this.initGame();
    }
    //#endregion
    //#region TLPD
    /**
     * Game state TLPD
     *
     * @readonly
     * @type {string}
     * @memberof Game
     */
    get valueTLPD() {
        return this.piecePositionsTLPD + " " + this.turn + " " + this.castlingStatus
            + " " + (this.specialPawnCapture?.toString() ?? "-")
            + " " + this.halfmoveClock.toString() + " " + (this.fixedNumbering ? this._moveNumber.toString() : "-");
    }
    get piecePositionsTLPD() {
        let r = "/";
        for (let i = 28; i >= 0; i--) {
            const isEven = i % 2 == 0;
            const firstColumnIndex = i <= 5 ? 7 - i : (i >= 23 ? i - 21 : isEven ? 1 : 0);
            const lastColumnIndex = i <= 5 ? i + 7 : (i >= 23 ? 35 - i : isEven ? 13 : 14);
            let kStr = "";
            let e = 0;
            for (let k = firstColumnIndex; k <= lastColumnIndex; k += 2) {
                const piece = this.getPiece([k, i]);
                if (piece != null) {
                    if (e > 0)
                        kStr += e.toString();
                    kStr += piece.uncapitalizedSymbol;
                    e = 0;
                }
                else
                    e++;
            }
            if (kStr.length > 0) {
                r += i.toString() + ":" + kStr;
                if (e > 0)
                    r += e.toString();
                r += "/";
            }
        }
        return r;
    }
    /**
     * Load game using TLPD string
     *
     * @param {string} restoreStatusTLPD
     * @memberof Game
     */
    loadTLPD(restoreStatusTLPD) {
        try {
            assertCondition(restoreStatusTLPD != null, "Not empty TLPD");
            assertCondition(restoreStatusTLPD.trim().length > 12, "Enough TLPD length");
            const restoreStatus = restoreStatusTLPD.split(" ");
            assertCondition(restoreStatus.length >= 2, "Piece positions and turn are mandatory");
            assertCondition(restoreStatus[0].length >= 10, "Piece positions string");
            assertCondition(csty.isTurn(restoreStatus[1]), "Correct turn");
            const turn = restoreStatus[1];
            super.resetGame(turn);
            this._moves.length = 0;
            this._top = -1;
            const [wCastlingStatus, bCastlingStatus] = Board.splitCastlingStatus(restoreStatus[2]);
            this.restoreTLPDPositions(restoreStatus[0], wCastlingStatus, bCastlingStatus);
            this.halfmoveClock = csty.isNumber(Number(restoreStatus[4])) ? Number(restoreStatus[4]) : 0;
            if (isNaN(Number(restoreStatus[4]))) {
                if (restoreStatus[4] != null && restoreStatus[4] !== "-")
                    throw new TypeError("Invalid halfmove clock value");
            }
            this._moveNumber = csty.isNumber(Number(restoreStatus[5])) ? Number(restoreStatus[5]) : 1;
            if (isNaN(Number(restoreStatus[5]))) {
                if (restoreStatus[5] == null || restoreStatus[5] == "-")
                    this.fixedNumbering = false;
                else
                    throw new TypeError("Invalid move number");
            }
            else
                this.fixedNumbering = true;
            super.specialPawnCapture = PawnSpecialCaptureStatus.parse(this, restoreStatus[3]);
            this.initGame();
        }
        catch (e) {
            if (e instanceof Error && e.name == 'Error')
                e.name = 'TLPD';
            throw e;
        }
    }
    restoreTLPDPositions(positions, wCastlingStatus, bCastlingStatus) {
        assertCondition(positions.length >= 10 && positions[0] == '/' && positions[positions.length - 1] == '/', `Valid TLPD string positions: ${positions}`);
        const rooks = [];
        const wPiece = [];
        const bPiece = [];
        const piecePos = positions.split("/");
        for (let lineContent of piecePos) {
            if (lineContent.length > 0) {
                if (!lineContent.startsWith(':') && !lineContent.endsWith(':') && (lineContent.match(/:/g) || []).length == 1) {
                    const [strActualLine, content] = lineContent.split(":");
                    const actualLine = Number(strActualLine);
                    if (!isNaN(actualLine) && actualLine >= 0 && actualLine <= 28) {
                        const initialColumnIndex = (actualLine >= 0 && actualLine < 6) ?
                            7 - actualLine : actualLine <= 22 ? (actualLine % 2 == 0 ? 1 : 0) : actualLine - 21;
                        const finalColumnIndex = (actualLine >= 0 && actualLine < 6) ?
                            7 + actualLine : actualLine <= 22 ? (actualLine % 2 == 0 ? 13 : 14) : 35 - actualLine;
                        let actualColumnIndex = initialColumnIndex;
                        for (const pieceName of content) {
                            if (actualColumnIndex > finalColumnIndex)
                                throw new Error("Incorrect TLPD line content");
                            else {
                                const value = Number(pieceName);
                                if (isNaN(value)) {
                                    const pieceSymbol = csty.isPieceName(pieceName) ? pieceName : Game.convertPieceAliases(pieceName.toUpperCase());
                                    const color = pieceName.toUpperCase() == pieceName ? "w" : "b";
                                    if (pieceSymbol == 'K') {
                                        if (color == 'w') {
                                            if (this.wKing.position != null)
                                                throw new Error("Can't place two White Kings");
                                            else
                                                this.wKing.setPositionTo([actualColumnIndex, actualLine]);
                                            if (this.hasPiece(this.wKing.position) == null)
                                                this.addPiece(this.wKing);
                                            else
                                                throw new Error("Can't place White King on the place used by another piece");
                                        }
                                        else {
                                            if (this.bKing.position != null)
                                                throw new Error("Can't place two Black Kings");
                                            else
                                                this.bKing.setPositionTo([actualColumnIndex, actualLine]);
                                            if (this.hasPiece(this.bKing.position) == null)
                                                this.addPiece(this.bKing);
                                            else
                                                throw new Error("Can't place Black King on the place used by another piece");
                                        }
                                    }
                                    else {
                                        const newPiece = super.createPiece(pieceSymbol, color, cscnv.columnFromIndex(actualColumnIndex), actualLine);
                                        if (cspty.isRook(newPiece))
                                            rooks.push(newPiece);
                                        else if (cspty.isPawn(newPiece) && newPiece.awaitingPromotion != null)
                                            super.setAwaitingPromotion(newPiece.color);
                                        (color == 'w' ? wPiece : bPiece).push(newPiece);
                                    }
                                    actualColumnIndex += 2;
                                }
                                else
                                    actualColumnIndex += value << 1;
                            }
                        }
                    }
                    else
                        throw new Error(`Incorrect line issued: ${strActualLine}`);
                }
                else
                    throw new Error(`Incorrect line number issued: ${lineContent}`);
            }
        }
        if (this.wKing.position == null)
            throw new Error("There must be a White King");
        if (this.bKing.position == null)
            throw new Error("There must be a Black King");
        {
            const countOccurrences = (arr, val) => arr.reduce((n, v) => (v.symbol === val ? n + 1 : n), 0);
            for (let color of ['w', 'b']) {
                const pieceSet = (color == 'w' ? wPiece : bPiece);
                let n = countOccurrences(pieceSet, 'D');
                if (n > 1)
                    throw new Error(`Too many ${color} Queens`);
                else if (n == 0)
                    this.addRegainablePiece(new Queen(color));
                n = countOccurrences(pieceSet, 'V');
                if (n > 1)
                    throw new Error(`Too many ${color} Wyverns`);
                else if (n == 0)
                    this.addRegainablePiece(new Wyvern(color));
                n = countOccurrences(pieceSet, 'R');
                if (n > 2)
                    throw new Error(`Too many ${color} Rooks`);
                else {
                    while (n < 2) {
                        this.addRegainablePiece(new Rook(color, this.isGrand, n));
                        n++;
                    }
                }
                n = countOccurrences(pieceSet, 'G');
                if (n > 2)
                    throw new Error(`Too many ${color} Pegasus`);
                else {
                    while (n < 2) {
                        this.addRegainablePiece(new Pegasus(color, n));
                        n++;
                    }
                }
                n = countOccurrences(pieceSet, 'N');
                if (!this.isGrand && n > 2 || this.isGrand && n > 4)
                    throw new Error(`Too many ${color} Knights`);
                else {
                    while (n < 2) {
                        this.addRegainablePiece(new Knight(color, n));
                        n++;
                    }
                }
                n = countOccurrences(pieceSet, 'J');
                if (n > 3)
                    throw new Error(`Too many ${color} Bishops`);
                else {
                    let count = { "White": 0, "Black": 0, "Color": 0 };
                    for (const element of pieceSet.filter((value) => cspty.isBishop(value))) {
                        count[element.hexesColor] += 1;
                    }
                    if (count.White > 1 || count.Black > 1 || count.Color > 1)
                        throw new Error(`Too many ${color} Bishops on same color hexes`);
                    else {
                        if (count.White == 0)
                            this.addRegainablePiece(new Bishop(color, "White"));
                        if (count.Black == 0)
                            this.addRegainablePiece(new Bishop(color, "Black"));
                        if (count.Color == 0)
                            this.addRegainablePiece(new Bishop(color, "Color"));
                    }
                }
            }
        }
        this.wKing.castlingStatus = wCastlingStatus;
        this.bKing.castlingStatus = bCastlingStatus;
        for (const r of rooks) {
            r.setCastlingStatus(r.color == "w" ? wCastlingStatus : bCastlingStatus, this.isGrand);
        }
    }
    //#endregion
    //#region ADD STORED MOVES
    /**
     * Apply a numbered sequence of paired moves
     *
     * @param {string} sq
     * @memberof Game
     */
    applyMoveSq(sq) {
        try {
            assertCondition(this._top == this._moves.length - 1, "push the moves over the last one");
            sq = sq.replaceAll(' ', '').replace(/\n\n+/g, '\n').replace(/^[\s\n]+|[\s\n]+$/gm, '');
            const fixedNumbering = (sq[0] != '1' || sq[1] != '?');
            sq = sq.replace(/^1\?/, '1.').replace(/^1....,/, '1.\u2026');
            const regExp = new RegExp(/^(\d+\..*\n)+\d+\..*$/);
            assertCondition(regExp.test(sq), "numbered lines");
            const lines = sq.split(/\r?\n/);
            const firstLine = this._moveNumber;
            this.fixedNumbering = (this.fixedNumbering && firstLine != 1) || fixedNumbering;
            for (let i = 0; i < lines.length; i++) {
                const parts = lines[i].split(/[.,]\s?/);
                const nMove = parseInt(parts[0]);
                assertCondition(nMove.toString() == parts[0], `Line number of "${lines[i]}"`);
                assertCondition(this._moveNumber == (fixedNumbering ? nMove : firstLine + nMove - 1), `Expected move number ${this._moveNumber} on move ${i}`);
                if (nMove == 1) {
                    assertCondition(parts.length == 3, `first move must be a numbered pair of moves; white move can be an ellipsis: ${lines[0]}`);
                    if (parts[1] == '\u2026') {
                        assertCondition(this.turn == 'b', "It begins on black's turn");
                        this.applyStringMove(parts[2]);
                    }
                    else {
                        assertCondition(this.turn == 'w', "It begins on white's turn");
                        this.applyStringMove(parts[1]);
                        this.applyStringMove(parts[2]);
                    }
                }
                else if (i == lines.length - 1) {
                    assertCondition(parts.length >= 2 && parts.length <= 3, `last move ${lines[i]}`);
                    this.applyStringMove(parts[1]);
                    if (parts.length == 3)
                        this.applyStringMove(parts[2]);
                }
                else {
                    assertCondition(parts.length == 3, `numbered pair of moves: ${lines[i]}`);
                    this.applyStringMove(parts[1]);
                    this.applyStringMove(parts[2]);
                }
            }
        }
        catch (e) {
            //if (e instanceof Error && e.name == 'Error') e.name = 'Move seq';
            console.log(e);
            throw e;
        }
    }
    /**
     * Apply a string single move
     *
     * @param {string} mov
     * @memberof Game
     */
    applyStringMove(mov) {
        const separatorIndex = (mov, ini = 0) => {
            let i = ini;
            while (i < mov.length) {
                const code = mov.charCodeAt(i);
                if (code >= 48 && code < 58 || code >= 65 && code < 91 || code >= 97 && code < 123)
                    i++;
                else
                    return i;
            }
            return i;
        };
        const isHexPosition = (hex) => {
            return PositionHelper.isValidPosition(PositionHelper.parse(hex));
        };
        assertCondition(this._top == this._moves.length - 1, "push the move over the last one");
        assertCondition(mov.length >= 4, "Moviment length must be at least of 4 chars");
        if (mov.startsWith("KR") && mov[3] == '-' || mov[3] == '\u2013') {
            const castlingString = mov[3] == '\u2013' ? mov.replace('\u2013', '-') : mov;
            if (this.isGrand)
                assertCondition(csty.isGrandCastlingString(castlingString), `grand castling move: ${castlingString}`);
            else
                assertCondition(csty.isCastlingString(castlingString), `castling move: ${castlingString}`);
            this.doCastling(castlingString);
        }
        else {
            mov = mov.replace('x', '\u00D7');
            const sepIx = separatorIndex(mov);
            const movePiece = csty.isPieceName(mov[0]) && csty.isColumn(mov[1]) ? mov[0] : 'P';
            const fromHexPos = mov.slice(movePiece == 'P' ? 0 : 1, sepIx);
            assertCondition(sepIx < mov.length - 1, "Moviment divided into parts");
            assertCondition(isHexPosition(fromHexPos), "Initial hex");
            const separator = mov.charAt(sepIx) == '@' && mov.charAt(sepIx + 1) == '@' ? '@@' : mov.charAt(sepIx);
            assertCondition(['-', '\u2013', '\u00D7', '@', '@@', '='].includes(separator), `valid origin&destiny separator "${separator}"`);
            if (separator == '=') {
                const promotionPiece = mov[sepIx + 1];
                assertCondition(movePiece == 'P', "Promoting a pawn");
                this.doPromotePawn(fromHexPos, fromHexPos, promotionPiece);
            }
            else {
                assertCondition(sepIx < mov.length - 2, "Movement destination");
                const toIx = sepIx + separator.length;
                const toEndIx = separatorIndex(mov, toIx);
                const capturedPiece = csty.isPieceName(mov[toIx]) && csty.isColumn(mov[toIx + 1]) ? mov[toIx] : undefined;
                const toHexPos = mov.slice(capturedPiece === undefined ? toIx : toIx + 1, toEndIx);
                assertCondition(isHexPosition(toHexPos), "Destination hex");
                assertCondition(capturedPiece === undefined || (separator != '-' && separator != '\u2013'), "Captured piece");
                if (toEndIx < mov.length && mov[toEndIx] == '=') {
                    const promotionPiece = mov[toEndIx + 1];
                    assertCondition(movePiece == 'P', "Promoting a pawn");
                    this.doPromotePawn(fromHexPos, toHexPos, promotionPiece);
                }
                else
                    this.doMove(fromHexPos, toHexPos, movePiece);
            }
        }
    }
    //#endregion
    /**
     * Add a move to the game
     *
     * @param {MoveInfo} move
     * @memberof Game
     */
    pushMove(move) {
        const turnInfo = {
            n: this._moveNumber,
            turn: this.turn,
            move: move,
            fixedNumbering: this._moveNumber == 1 && !this.fixedNumbering ? '?' : undefined,
            iHMClock: this.halfmoveClock == 0 ? '1' : undefined,
            specialCapture: this.specialPawnCapture == null ? undefined : this.specialPawnCapture.toString(),
            castlingStatus: (csmv.isMoveInfo(move) && ['K', 'R'].indexOf(cscnv.getPieceKeyName(move.piece)) >= 0) ?
                this.playerCastlingStatus() : undefined
        };
        this.applyMove(move, this.turn);
        super.nextTurn();
        if (this.turn === 'w')
            this._moveNumber++;
        if (csmv.isMoveInfo(move) && ['P', 'M'].includes(cscnv.getPieceKeyName(move.piece))
            || csmv.isCaptureInfo(move)
            || csmv.isPromotionInfo(move))
            this.halfmoveClock = 0;
        else
            this.halfmoveClock++;
        super.prepareCurrentTurn();
        const anyMove = super.isMoveableTurn();
        let endGame = undefined;
        let check = undefined;
        if (!anyMove) {
            if (this.checked) {
                this._mate = true;
                endGame = "mate";
            }
            else {
                this._stalemate = true;
                endGame = "stalemate";
            }
        }
        else if (this.halfmoveClock >= 200 || super.insuficientMaterial()) {
            this._draw = true;
            endGame = "draw";
        }
        else if (this.checked) {
            if (this.isKnightOrCloseCheck)
                check = "^+";
            else if (this.isSingleCheck)
                check = "+";
            else if (this.isDoubleCheck)
                check = "++";
            else
                throw new Error("never: exhaused check options");
        }
        if (this._top < 0 && turnInfo.turn == 'b') {
            this._moves.push({ n: turnInfo.n, turn: 'w', move: '\u2026' });
            this._top++;
        }
        const turnInfoEnriched = csmv.promoteUndoStatus(turnInfo, endGame, check);
        this._moves.push(turnInfoEnriched);
        this._top++;
        super.computeHeuristic(this.turn, this._moveNumber, anyMove, this.currentHeuristic);
    }
    applyMove(move, turn) {
        if (csmv.isCastlingInfo(move))
            this.applyCastling(move, turn);
        else {
            const piece = this.pieceByKey(move.piece);
            if (csmv.isMoveInfo(move)) {
                const dest = move.moveTo;
                if (csmv.isCaptureInfo(move)) {
                    super.capturePiece(this.pieceByKey(move.captured));
                }
                super.movePiece(piece, dest[0], dest[1]);
                if (csmv.isPromotionInfo(move)) {
                    super.promotePawn(piece, this.pieceByKey(move.promoted));
                }
            }
            else {
                super.promotePawn(piece, this.pieceByKey(move.promoted));
            }
        }
    }
    applyCastling(mov, color) {
        const currentKing = color == 'w' ? this.wKing : this.bKing;
        const kpos = Game.kingCastlingPosition(currentKing.color, mov.col);
        switch (mov.side) {
            case 'K':
                super.movePiece(this.pieceByKey(mov.kRook), mov.rPos[0], mov.rPos[1]);
                break;
            case 'D':
                super.movePiece(this.pieceByKey(mov.qRook), mov.rPos[0], mov.rPos[1]);
                break;
            case 'R':
                super.movePiece(this.pieceByKey(mov.kRook), mov.rPos[0], mov.rPos[1]);
                super.movePiece(this.pieceByKey(mov.qRook), mov.r2Pos[0], mov.r2Pos[1]);
        }
        super.movePiece(currentKing, kpos[0], kpos[1]);
    }
    undoMove(move, turn) {
        if (csmv.isCastlingInfo(move))
            this.undoCastling(move, turn);
        else {
            const piece = this.pieceByKey(move.piece);
            if (csmv.isMoveInfo(move)) {
                if (csmv.isPromotionInfo(move))
                    super.undoPromotePawn(piece, this.pieceByKey(move.promoted));
                super.undoPieceMove(piece, move.pos[0], move.pos[1]);
                if (csmv.isCaptureInfo(move)) {
                    const capPos = move.special === undefined ? move.moveTo : move.special;
                    super.undoCapturePiece(this.pieceByKey(move.captured), capPos[0], capPos[1]);
                }
            }
            else
                super.undoPromotePawn(piece, this.pieceByKey(move.promoted));
        }
    }
    undoCastling(castling, color) {
        const isGrand = this.isGrand;
        const currentKing = color == 'w' ? this.wKing : this.bKing;
        const kingInitialPos = color == 'w' ? PositionHelper.whiteKingInitPosition : PositionHelper.blackKingInitPosition;
        const rookInitialPos = castling.side == 'D' ?
            PositionHelper.initialQueenSideRookPosition(color, isGrand)
            : PositionHelper.initialKingSideRookPosition(color, isGrand);
        const rook = this.pieceByKey(castling.side == 'D' ? castling.qRook : castling.kRook);
        console.log(castling);
        assertNonNullish(rook);
        super.undoPieceMove(currentKing, kingInitialPos[0], kingInitialPos[1]);
        super.undoPieceMove(rook, rookInitialPos[0], rookInitialPos[1]);
        currentKing.castlingStatus = "RKR";
        rook.setCastlingStatus("RKR", isGrand);
        if (castling.side == 'R') {
            const qRook = this.pieceByKey(castling.qRook);
            const r2InitialPos = PositionHelper.initialQueenSideRookPosition(color, isGrand);
            super.undoPieceMove(qRook, r2InitialPos[0], r2InitialPos[1]);
            qRook.setCastlingStatus("RKR", isGrand);
        }
    }
    fillDefaultPositions() {
        this.wKing.setToInitialPosition();
        this.addPiece(this.wKing);
        this.bKing.setToInitialPosition();
        this.addPiece(this.bKing);
        //whites
        super.createPiece('D', 'w', 'E', 1);
        super.createPiece('V', "w", 'F', 0);
        super.createPiece('G', "w", 'D', 2);
        super.createPiece('J', "w", 'F', 2);
        super.createPiece('G', "w", 'H', 2);
        if (this.isGrand) {
            super.createPiece('P', "w", 'B', 6);
            super.createPiece('R', "w", 'B', 4);
            super.createPiece('N', "w", 'C', 3);
            super.createPiece('N', "w", 'I', 3);
            super.createPiece('R', "w", 'K', 4);
            super.createPiece('P', "w", 'K', 6);
            super.createPiece('P', "w", 'P', 7);
            super.createPiece('P', "w", 'T', 8);
            super.createPiece('P', "w", 'X', 8);
            super.createPiece('P', "w", 'Z', 7);
            super.createPiece('M', "w", 'C', 7);
            super.createPiece('M', "w", 'A', 7);
            super.createPiece('M', "w", 'L', 7);
            super.createPiece('M', "w", 'I', 7);
        }
        else {
            super.createPiece('P', "w", 'B', 4);
            super.createPiece('R', "w", 'C', 3),
                super.createPiece('R', "w", 'I', 3);
            super.createPiece('P', "w", 'K', 4);
        }
        super.createPiece('N', "w", 'E', 3);
        super.createPiece('N', "w", 'G', 3);
        super.createPiece('E', "w", 'D', 4);
        super.createPiece('J', "w", 'F', 4);
        super.createPiece('E', "w", 'H', 4);
        super.createPiece('P', "w", 'A', 5);
        super.createPiece('P', "w", 'C', 5);
        super.createPiece('E', "w", 'E', 5);
        super.createPiece('E', "w", 'G', 5);
        super.createPiece('P', "w", 'I', 5);
        super.createPiece('P', "w", 'L', 5);
        super.createPiece('P', "w", 'D', 6);
        super.createPiece('J', "w", 'F', 6);
        super.createPiece('P', "w", 'H', 6);
        super.createPiece('P', "w", 'E', 7);
        super.createPiece('P', "w", 'F', 8);
        super.createPiece('P', "w", 'G', 7);
        //blacks
        super.createPiece('D', "b", 'E', 27);
        super.createPiece('V', "b", 'F', 28);
        super.createPiece('G', "b", 'D', 26);
        super.createPiece('J', "b", 'F', 26);
        super.createPiece('G', "b", 'H', 26);
        if (this.isGrand) {
            super.createPiece('P', "b", 'B', 22);
            super.createPiece('R', "b", 'B', 24);
            super.createPiece('N', "b", 'C', 25);
            super.createPiece('N', "b", 'I', 25);
            super.createPiece('R', "b", 'K', 24);
            super.createPiece('P', "b", 'K', 22);
            super.createPiece('P', "b", 'P', 21);
            super.createPiece('P', "b", 'T', 20);
            super.createPiece('P', "b", 'X', 20);
            super.createPiece('P', "b", 'Z', 21);
            super.createPiece('M', "b", 'C', 21);
            super.createPiece('M', "b", 'A', 21);
            super.createPiece('M', "b", 'I', 21);
            super.createPiece('M', "b", 'L', 21);
        }
        else {
            super.createPiece('P', "b", 'B', 24);
            super.createPiece('R', "b", 'C', 25);
            super.createPiece('R', "b", 'I', 25);
            super.createPiece('P', "b", 'K', 24);
        }
        super.createPiece('N', "b", 'E', 25);
        super.createPiece('N', "b", 'G', 25);
        super.createPiece('E', "b", 'D', 24);
        super.createPiece('J', "b", 'F', 24);
        super.createPiece('E', "b", 'H', 24);
        super.createPiece('P', "b", 'A', 23);
        super.createPiece('P', "b", 'C', 23);
        super.createPiece('E', "b", 'E', 23);
        super.createPiece('E', "b", 'G', 23);
        super.createPiece('P', "b", 'I', 23);
        super.createPiece('P', "b", 'L', 23);
        super.createPiece('P', "b", 'D', 22);
        super.createPiece('J', "b", 'F', 22);
        super.createPiece('P', "b", 'H', 22);
        super.createPiece('P', "b", 'E', 21);
        super.createPiece('P', "b", 'F', 20);
        super.createPiece('P', "b", 'G', 21);
    }
    ;
    initGame() {
        super.prepareGame();
        this._mate = false;
        this._stalemate = false;
        this._resigned = false;
        this._draw = false;
        const anyMove = super.isMoveableTurn();
        if (!anyMove) {
            if (this.checked)
                this._mate = true;
            else
                this._stalemate = true;
        }
        else if (this.halfmoveClock >= 200)
            this._draw = true;
        super.computeHeuristic(this.turn, this._moveNumber, anyMove, this.currentHeuristic);
    }
}
