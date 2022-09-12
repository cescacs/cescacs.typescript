import type { Nullable } from "./ts.general";
import type {
    Column, ColumnIndex, Line, Position,
    OrthogonalDirection, DiagonalDirection, KnightDirection,
    Orientation, OrthogonalOrientation, DiagonalOrientation,
    ScornfulCaptureDirection,
    Turn, HexColor, PieceName, PieceColor, CastlingStatus,
    KnightOrCloseCheck, DoubleCheck
} from "./cescacs.types";


import { csTypes as csty, csConvert as cscnv } from "./cescacs.types";
import { PositionHelper } from "./cescacs.positionHelper";
import { csPieceTypes as cspty } from "./cescacs.piece";
import {
    IBoard, Piece, IPawnSpecialCaptureStatus, IScornfulCapturable, IEnPassantCapturable,
    King, Queen, Wyvern, Rook, Pegasus, Knight, Bishop, Elephant, Almogaver, Pawn
} from "./cescacs.piece";

import { Board, Game, Heuristic } from "./cescacs";

type CheckType = 0 | 32 | 64 | 128 | 192 | 256; //none, CloseNotDefended, Close, Single, Knight, Double

type AttemptMove = {
    piece: Piece;
    pos: Position;
    check: CheckType;
    capture: number;
    defended: boolean;
    threated: boolean;
}

type Bitset = [number, number, number, number, number, number, number, number];

abstract class Minimax {

    public static findBest(grand: boolean, board: string) {
        const actualGame: Game = new Game(grand, board);
        const player: PieceColor = actualGame.turn;
        return Minimax.minimax(actualGame, 0, -Infinity, Infinity, player, player);

    }

    private static readonly maxDepth: number = 4;

    private static minimax(node: Board, depth: number, alpha: number, beta: number, maxPlayer: PieceColor, levelPlayer: PieceColor) {
        const currentKing = levelPlayer == 'w' ? node.wKing : node.bKing;
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
                        if (alpha < hValue) alpha = hValue;
                    } else {
                        if (beta > hValue) beta = hValue;
                    }
        
                } else {
                    Minimax.minimax(node, depth+1, alpha, beta, maxPlayer, levelPlayer == 'w' ? 'b' : 'w');
                }

                // undoMove
            }
    }

    private static generateMoves(node: Board, currentKing: King) {
        const color: PieceColor = currentKing.color;
        const closeChecks = Minimax.closeCheckBitset(node, currentKing);
        const knightChecks = Minimax.knightCheckBitset(node, currentKing);
        const [orthogonalChecks, orthogonalDiscoveredChecks] = Minimax.OrthogonalCheckBitset(node, currentKing);
        const [diagonalChecks, diagonalDiscoveredChecks] = Minimax.DiagonalCheckBitset(node, currentKing);
        const result: AttemptMove[] = [];

        //TODO: Castlings, pawn promotion

        //this is a quick sort heuristic:
        //- computed closeChecks doesn't ensures check, only close position
        //- discovered doesn't ensures piece move destination allows discovered check not to be hiden
        for (const piece of color == 'w' ? node.whitePieces() : node.blackPieces()) {
            for (const pos of node.pieceMoves(piece)) {
                const isEnPassantCapture = cspty.isPawn(piece) && node.specialPawnCapture != null &&
                    node.specialPawnCapture.isEnPassantCapturable() && node.specialPawnCapture.isEnPassantCapture(pos, piece);
                const capturedValue = node.getPiece(pos)?.value ?? (isEnPassantCapture ? piece.value : 0);
                let pawnValue = 0;
                let checkValue: CheckType = 0;
                if (piece.hasOnlyCloseAttack) {
                    if (Minimax.isBitset(orthogonalDiscoveredChecks, piece.position!)
                        || Minimax.isBitset(diagonalDiscoveredChecks, piece.position!)) checkValue = 128;
                    else if (Minimax.isBitset(closeChecks, pos)) checkValue = (node.hasThreat(pos, color) ? 64 : 32);
                    if (cspty.isPawn(piece)) {
                        if (PositionHelper.isPromotionHex(pos, color)) {
                            const maxPromotionValue = node.maxRegainablePiecesValue(PositionHelper.hexColor(pos));
                            pawnValue = maxPromotionValue > 0 ? maxPromotionValue - 1 : 0;
                        }
                        if (pos[0] == piece.position![0]) pawnValue += 0.1;  //better walk stright
                        if (pos[1] > piece.position![1] + 2) pawnValue += 0.1; //better long steps
                    }
                }
                else if (piece.hasKnightJumpAttack && Minimax.isBitset(knightChecks, pos)) {
                    if (Minimax.isBitset(orthogonalDiscoveredChecks, piece.position!)
                        || Minimax.isBitset(diagonalDiscoveredChecks, piece.position!)) checkValue = 256;
                    else checkValue = 192;
                }
                else if (piece.hasOrthogonalAttack && Minimax.isBitset(orthogonalChecks, pos)) {
                    checkValue = Minimax.isBitset(diagonalDiscoveredChecks, piece.position!) ? 256
                        : Minimax.isBitset(closeChecks, pos) ? node.hasThreat(pos, color) ? 192 : 64 : 128;
                }
                else if (piece.hasDiagonalAttack && Minimax.isBitset(diagonalChecks, pos)) {
                    checkValue = Minimax.isBitset(orthogonalDiscoveredChecks, piece.position!) ? 256
                        : Minimax.isBitset(closeChecks, pos) ? node.hasThreat(pos, color) ? 192 : 64 : 128;
                }
                else if (Minimax.isBitset(orthogonalDiscoveredChecks, piece.position!)
                    || Minimax.isBitset(diagonalDiscoveredChecks, piece.position!)) {
                    checkValue = 128;
                }
                result.push({
                    piece: piece, pos: pos,
                    check: checkValue, capture: capturedValue + pawnValue,
                    defended: node.hasThreat(pos, color),
                    threated: node.isThreatened(pos, color)
                } as AttemptMove);
            }
        }
        return result;
    }

    private static isBitset(bitset: Bitset, pos: Position): boolean {
        const posCol = (pos[0] + 1) >>> 1;
        return (bitset[posCol] & Minimax.lineMask(pos[1])) != 0;
    }
    private static setBitset(bitset: Bitset, pos: Position): void {
        const posCol = (pos[0] + 1) >>> 1;
        bitset[posCol] |= Minimax.lineMask(pos[1]);
    }
    private static lineMask(l: Line) { return 1 << l; }

    private static closeCheckBitset(node: Board, currentKing: King): Bitset {
        const checks: Bitset = [0, 0, 0, 0, 0, 0, 0, 0];
        for (const d of cscnv.orthogonalDirections()) {
            const p = PositionHelper.orthogonalStep(currentKing.position!, d);
            if (p != null) {
                const pieceColor = node.hasPiece(p);
                if (pieceColor == null || pieceColor == currentKing.color) {
                    Minimax.setBitset(checks, p);
                }
            }
        }
        for (const d of cscnv.diagonalDirections()) {
            const p = PositionHelper.diagonalStep(currentKing.position!, d);
            if (p != null) {
                const pieceColor = node.hasPiece(p);
                if (pieceColor == null || pieceColor == currentKing.color) {
                    Minimax.setBitset(checks, p);
                }
            }
        }
        return checks;
    }
    private static knightCheckBitset(node: Board, currentKing: King): Bitset {
        const checks: Bitset = [0, 0, 0, 0, 0, 0, 0, 0];
        for (const p of PositionHelper.knightMoves(currentKing.position!)) {
            Minimax.setBitset(checks, p);
        }
        return checks;
    }
    private static OrthogonalCheckBitset(node: Board, currentKing: King): [Bitset, Bitset] {
        const checks: Bitset = [0, 0, 0, 0, 0, 0, 0, 0];
        const discoveredChecks: Bitset = [0, 0, 0, 0, 0, 0, 0, 0];
        for (const d of cscnv.orthogonalDirections()) {
            const it = PositionHelper.orthogonalRide(currentKing.position!, d);
            let v = it.next();
            while (!v.done) {
                const p: Position = v.value;
                Minimax.setBitset(checks, p);
                const pieceColor = node.hasPiece(p);
                if (pieceColor == null) v = it.next();
                else {
                    if (pieceColor == currentKing.color) {
                        const it2 = PositionHelper.orthogonalRide(p, d);
                        let v2 = it2.next();
                        while (!v2.done) {
                            const piece = node.getPiece(v2.value);
                            if (piece == null) v = it.next();
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
    private static DiagonalCheckBitset(node: Board, currentKing: King): [Bitset, Bitset] {
        const checks: Bitset = [0, 0, 0, 0, 0, 0, 0, 0];
        const discoveredChecks: Bitset = [0, 0, 0, 0, 0, 0, 0, 0];
        for (const d of cscnv.diagonalDirections()) {
            const it = PositionHelper.diagonalRide(currentKing.position!, d);
            let v = it.next();
            while (!v.done) {
                const p: Position = v.value;
                Minimax.setBitset(checks, p);
                const pieceColor = node.hasPiece(p);
                if (pieceColor == null) v = it.next();
                else {
                    if (pieceColor == currentKing.color) {
                        const it2 = PositionHelper.diagonalRide(p, d);
                        let v2 = it2.next();
                        while (!v2.done) {
                            const piece = node.getPiece(v2.value);
                            if (piece == null) v = it.next();
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