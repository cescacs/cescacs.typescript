"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cescacs_types_1 = require("./cescacs.types");
const cescacs_positionHelper_1 = require("./cescacs.positionHelper");
const cescacs_piece_1 = require("./cescacs.piece");
const cescacs_1 = require("./cescacs");
class Minimax {
    static findBest(grand, board) {
        const actualGame = new cescacs_1.Game(grand, board);
        const player = actualGame.turn == 'w' ? 'White' : 'Black';
        return Minimax.minimax(actualGame, 0, -Infinity, Infinity, player, player);
    }
    static minimax(node, depth, alpha, beta, maxPlayer, levelPlayer) {
        const currentKing = levelPlayer == 'White' ? node.wKing : node.bKing;
        const moves = Minimax.generateMoves(node, currentKing);
        if (depth < Minimax.maxDepth) {
            moves.sort((a, b) => {
                return a.check - b.check + ((a.capture - b.capture) << 2) +
                    (a.defended != b.defended ? a.defended ? 2 : -2 : 0) +
                    (a.threated != b.threated ? a.threated ? -1 : 1 : 0);
            });
        }
        //TODO: Recursive call
        for (const m of moves) {
            // doMove: Attempt move can have information to undo:
            // - captured Piece
            // - enPassantPosition
            // - promotion Piece
            // - when the King or Rook moves, castling status
            if (depth >= Minimax.maxDepth) {
                const hValue = node.getHeuristicValue(node.currentHeuristic);
                if (levelPlayer == maxPlayer) {
                    if (alpha < hValue)
                        alpha = hValue;
                }
                else {
                    if (beta > hValue)
                        beta = hValue;
                }
            }
            else {
                Minimax.minimax(node, depth + 1, alpha, beta, maxPlayer, levelPlayer == 'White' ? 'Black' : 'White');
            }
            // undoMove
        }
    }
    static generateMoves(node, currentKing) {
        const color = currentKing.color;
        const closeChecks = Minimax.closeCheckBitset(node, currentKing);
        const knightChecks = Minimax.knightCheckBitset(node, currentKing);
        const [orthogonalChecks, orthogonalDiscoveredChecks] = Minimax.OrthogonalCheckBitset(node, currentKing);
        const [diagonalChecks, diagonalDiscoveredChecks] = Minimax.DiagonalCheckBitset(node, currentKing);
        const result = [];
        //TODO: Castlings, pawn promotion
        //this is a quick sort heuristic:
        //- computed closeChecks doesn't ensures check, only close position
        //- discovered doesn't ensures piece move destination allows discovered check not to be hiden
        for (const piece of color == 'White' ? node.whitePieces() : node.blackPieces()) {
            for (const pos of node.pieceMoves(piece)) {
                const isEnPassantCapture = cescacs_piece_1.csPieceTypes.isPawn(piece) && node.specialPawnCapture != null &&
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
                result.push({
                    piece: piece, pos: pos,
                    check: checkValue, capture: capturedValue + pawnValue,
                    defended: node.hasThreat(pos, color),
                    threated: node.isThreated(pos, color)
                });
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
    static OrthogonalCheckBitset(node, currentKing) {
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
    static DiagonalCheckBitset(node, currentKing) {
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
