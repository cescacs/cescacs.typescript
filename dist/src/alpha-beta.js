"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts_general_1 = require("./ts.general");
const cescacs_types_1 = require("./cescacs.types");
const cescacs_positionHelper_1 = require("./cescacs.positionHelper");
const cescacs_piece_1 = require("./cescacs.piece");
const cescacs_piece_2 = require("./cescacs.piece");
const cescacs_1 = require("./cescacs");
class Minimax {
    static findBest(grand, board) {
        const actualGame = new cescacs_1.Game(grand, board);
        const player = actualGame.turn;
        return Minimax.minimax(actualGame, 0, -Infinity, Infinity, player, player);
    }
    static minimax(node, depth, alpha, beta, maxPlayer, levelPlayer) {
        const currentKing = levelPlayer == 'w' ? node.wKing : node.bKing;
        const moves = Minimax.generateMoves(node, currentKing);
        function moveOrderValue(amove) {
            const moveNumber = node.moveNumber;
            const move = amove.move;
            if (currentKing.checked) {
                (0, ts_general_1.assertCondition)(!cescacs_1.csmv.isCastlingInfo(move));
                const p = cescacs_types_1.csConvert.getPieceKeyName(move.piece);
                if (p == 'K')
                    return -6;
                else {
                    const v = cescacs_piece_2.Piece.pieceValue(p);
                    return amove.threated ?
                        (amove.defended ? -v << 1 : -v) : (amove.defended ? 15 - v : (15 - v) << 1);
                }
            }
            else if (cescacs_1.csmv.isCastlingInfo(move)) {
                return moveNumber < 6 ? -20 : moveNumber < 10 ? -10 : -1;
            }
            else {
                let tmpResult;
                const p = cescacs_types_1.csConvert.getPieceKeyName(move.piece);
                if (p == 'K') {
                    tmpResult = moveNumber < 6 ? -20 : moveNumber < 10 ? -10 : -1;
                }
                else {
                    const v = cescacs_piece_2.Piece.pieceValue(p);
                    if (moveNumber < 3)
                        tmpResult = v > 2 ? -v : v;
                    else if (moveNumber < 6)
                        tmpResult = v > 4 ? -v : v;
                    else if (moveNumber < 12)
                        tmpResult = v > 10 ? -v : v;
                    else
                        tmpResult = v;
                    if (amove.threated)
                        tmpResult -= v;
                    if (amove.defended)
                        tmpResult += 2;
                }
                if (cescacs_1.csmv.isCaptureInfo(move))
                    tmpResult += cescacs_piece_2.Piece.pieceValue(cescacs_types_1.csConvert.getPieceKeyName(move.captured)) << 2;
                return tmpResult;
            }
        }
        //TODO: Check case (take a look deeper)
        //TODO: Return the move sequence
        if (depth < Minimax.maxDepth) {
            moves.sort((a, b) => moveOrderValue(a) - moveOrderValue(b));
            if (levelPlayer == maxPlayer) {
                for (const m of moves) {
                    node.pushMove(m.move);
                    const hValue = Minimax.minimax(node, depth + 1, alpha, beta, maxPlayer, levelPlayer == 'w' ? 'b' : 'w');
                    node.popMove();
                    if (alpha < hValue)
                        alpha = hValue;
                    if (beta <= alpha)
                        break;
                }
                return alpha;
            }
            else {
                for (const m of moves) {
                    node.pushMove(m.move);
                    const hValue = Minimax.minimax(node, depth + 1, alpha, beta, maxPlayer, levelPlayer == 'w' ? 'b' : 'w');
                    node.popMove();
                    if (beta > hValue)
                        beta = hValue;
                    if (beta <= alpha)
                        break;
                }
                return beta;
            }
        }
        else {
            return node.getHeuristicValue(node.currentHeuristic);
        }
    }
    static generateMoves(node, currentKing) {
        const color = currentKing.color;
        const closeChecks = Minimax.closeCheckBitset(node, currentKing);
        const knightChecks = Minimax.knightCheckBitset(node, currentKing);
        const [orthogonalChecks, orthogonalDiscoveredChecks] = Minimax.orthogonalCheckBitset(node, currentKing);
        const [diagonalChecks, diagonalDiscoveredChecks] = Minimax.diagonalCheckBitset(node, currentKing);
        const result = [];
        function getUndoInfo(move) {
            const turnInfo = {
                n: 1,
                turn: node.turn,
                move: move,
                specialPawnCapture: node.specialPawnCapture == null ? undefined : node.specialPawnCapture.toString(),
                castlingStatus: (cescacs_1.csmv.isMoveInfo(move) && ['K', 'R'].indexOf(cescacs_types_1.csConvert.getPieceKeyName(move.piece)) >= 0) ?
                    node.playerCastlingStatus() : undefined
            };
            return turnInfo;
        }
        //TODO: Checked is state for all the moves
        //TODO: Castlings, pawn promotion
        // * this is a quick sort heuristic:
        //- computed closeChecks doesn't ensures check, only close position
        //- discovered doesn't ensures piece move destination allows discovered check not to be hiden
        // @param 
        for (const piece of color == 'w' ? node.whitePieces() : node.blackPieces()) {
            //1st: awaiting promotion (when not in check)
            if (currentKing.checked)
                for (const pos of node.pieceMoves(piece)) {
                    const isEnPassantCapture = (cescacs_piece_1.csPieceTypes.isPawn(piece) || cescacs_piece_1.csPieceTypes.isAlmogaver(piece)) && node.specialPawnCapture != null &&
                        node.specialPawnCapture.isEnPassantCapturable() && node.specialPawnCapture.isEnPassantCapture(pos, piece);
                    const capturedValue = node.getPiece(pos)?.value ?? (isEnPassantCapture ? piece.value : 0);
                    let pawnValue = 0;
                    let checkValue = 0;
                    if (piece.hasOnlyCloseAttack) {
                        if (Minimax.isBitset(orthogonalDiscoveredChecks, piece.position)
                            || Minimax.isBitset(diagonalDiscoveredChecks, piece.position))
                            checkValue = 128;
                        else if (Minimax.isBitset(closeChecks, pos))
                            checkValue = (node.hasThreat(pos, color) ? 64 : 32);
                        if (cescacs_piece_1.csPieceTypes.isPawn(piece)) {
                            if (cescacs_positionHelper_1.PositionHelper.isPromotionHex(pos, color)) {
                                const maxPromotionValue = node.maxRegainablePiecesValue(cescacs_positionHelper_1.PositionHelper.hexColor(pos));
                                pawnValue = maxPromotionValue > 0 ? maxPromotionValue - 1 : 0;
                            }
                            if (pos[0] == piece.position[0])
                                pawnValue += 0.1; //better walk stright
                            if (pos[1] > piece.position[1] + 2)
                                pawnValue += 0.1; //better long steps
                        }
                    }
                    else if (piece.hasKnightJumpAttack && Minimax.isBitset(knightChecks, pos)) {
                        if (Minimax.isBitset(orthogonalDiscoveredChecks, piece.position)
                            || Minimax.isBitset(diagonalDiscoveredChecks, piece.position))
                            checkValue = 256;
                        else
                            checkValue = 192;
                    }
                    else if (piece.hasOrthogonalAttack && Minimax.isBitset(orthogonalChecks, pos)) {
                        checkValue = Minimax.isBitset(diagonalDiscoveredChecks, piece.position) ? 256
                            : Minimax.isBitset(closeChecks, pos) ? node.hasThreat(pos, color) ? 192 : 64 : 128;
                    }
                    else if (piece.hasDiagonalAttack && Minimax.isBitset(diagonalChecks, pos)) {
                        checkValue = Minimax.isBitset(orthogonalDiscoveredChecks, piece.position) ? 256
                            : Minimax.isBitset(closeChecks, pos) ? node.hasThreat(pos, color) ? 192 : 64 : 128;
                    }
                    else if (Minimax.isBitset(orthogonalDiscoveredChecks, piece.position)
                        || Minimax.isBitset(diagonalDiscoveredChecks, piece.position)) {
                        checkValue = 128;
                    }
                    // result.push({
                    //     check: checkValue, capture: capturedValue + pawnValue,
                    //     defended: node.hasThreat(pos, color),
                    //     threated: node.isThreatened(pos, color)
                    // } as AttemptMove);
                }
        }
        return result;
    }
    static isBitset(bitset, pos) {
        const posCol = (pos[0] + 1) >>> 1;
        return (bitset[posCol] & Minimax.lineMask(pos[1])) != 0;
    }
    static setBitset(bitset, pos) {
        const posCol = (pos[0] + 1) >>> 1;
        bitset[posCol] |= Minimax.lineMask(pos[1]);
    }
    static lineMask(l) { return 1 << l; }
    static closeCheckBitset(node, currentKing) {
        const checks = [0, 0, 0, 0, 0, 0, 0, 0];
        for (const d of cescacs_types_1.csConvert.orthogonalDirections()) {
            const p = cescacs_positionHelper_1.PositionHelper.orthogonalStep(currentKing.position, d);
            if (p != null) {
                const pieceColor = node.hasPiece(p);
                if (pieceColor == null || pieceColor == currentKing.color) {
                    Minimax.setBitset(checks, p);
                }
            }
        }
        for (const d of cescacs_types_1.csConvert.diagonalDirections()) {
            const p = cescacs_positionHelper_1.PositionHelper.diagonalStep(currentKing.position, d);
            if (p != null) {
                const pieceColor = node.hasPiece(p);
                if (pieceColor == null || pieceColor == currentKing.color) {
                    Minimax.setBitset(checks, p);
                }
            }
        }
        return checks;
    }
    static knightCheckBitset(node, currentKing) {
        const checks = [0, 0, 0, 0, 0, 0, 0, 0];
        for (const p of cescacs_positionHelper_1.PositionHelper.knightMoves(currentKing.position)) {
            Minimax.setBitset(checks, p);
        }
        return checks;
    }
    static orthogonalCheckBitset(node, currentKing) {
        const checks = [0, 0, 0, 0, 0, 0, 0, 0];
        const discoveredChecks = [0, 0, 0, 0, 0, 0, 0, 0];
        for (const d of cescacs_types_1.csConvert.orthogonalDirections()) {
            const it = cescacs_positionHelper_1.PositionHelper.orthogonalRide(currentKing.position, d);
            let v = it.next();
            while (!v.done) {
                const p = v.value;
                Minimax.setBitset(checks, p);
                const pieceColor = node.hasPiece(p);
                if (pieceColor == null)
                    v = it.next();
                else {
                    if (pieceColor == currentKing.color) {
                        const it2 = cescacs_positionHelper_1.PositionHelper.orthogonalRide(p, d);
                        let v2 = it2.next();
                        while (!v2.done) {
                            const piece = node.getPiece(v2.value);
                            if (piece == null)
                                v = it.next();
                            else {
                                if (piece.color == currentKing.color && piece.hasOrthogonalAttack) {
                                    Minimax.setBitset(discoveredChecks, p);
                                }
                                v2 = it2.return();
                            }
                        }
                    }
                    v = it.return();
                }
            }
        }
        return [checks, discoveredChecks];
    }
    static diagonalCheckBitset(node, currentKing) {
        const checks = [0, 0, 0, 0, 0, 0, 0, 0];
        const discoveredChecks = [0, 0, 0, 0, 0, 0, 0, 0];
        for (const d of cescacs_types_1.csConvert.diagonalDirections()) {
            const it = cescacs_positionHelper_1.PositionHelper.diagonalRide(currentKing.position, d);
            let v = it.next();
            while (!v.done) {
                const p = v.value;
                Minimax.setBitset(checks, p);
                const pieceColor = node.hasPiece(p);
                if (pieceColor == null)
                    v = it.next();
                else {
                    if (pieceColor == currentKing.color) {
                        const it2 = cescacs_positionHelper_1.PositionHelper.diagonalRide(p, d);
                        let v2 = it2.next();
                        while (!v2.done) {
                            const piece = node.getPiece(v2.value);
                            if (piece == null)
                                v = it.next();
                            else {
                                if (piece.color == currentKing.color && piece.hasDiagonalAttack) {
                                    Minimax.setBitset(discoveredChecks, p);
                                }
                                v2 = it2.return();
                            }
                        }
                    }
                    v = it.return();
                }
            }
        }
        return [checks, discoveredChecks];
    }
}
Minimax.maxDepth = 4;
