import { assertCondition, Nullable } from "./ts.general";
import type {
    Column, ColumnIndex, Line, Position,
    OrthogonalDirection, DiagonalDirection, KnightDirection,
    Orientation, OrthogonalOrientation, DiagonalOrientation,
    ScornfulCaptureDirection,
    Turn, HexColor, PieceName, PieceColor, CastlingStatus,
    KnightOrCloseCheck, DoubleCheck, CheckNotation
} from "./cescacs.types";


import { csTypes as csty, csConvert as cscnv } from "./cescacs.types";
import { PositionHelper } from "./cescacs.positionHelper";
import { csPieceTypes as cspty } from "./cescacs.piece";
import {
    IBoard, Piece, IPawnSpecialCaptureStatus, IScornfulCapturable, IEnPassantCapturable,
    King, Queen, Wyvern, Rook, Pegasus, Knight, Bishop, Elephant, Almogaver, Pawn
} from "./cescacs.piece";

import { Board, csmv, Game, Heuristic } from "./cescacs";
import { MoveInfo, UndoStatus } from "./cescacs.moves";

type Bitset = [number, number, number, number, number, number, number, number];


type AttemptMove = {
    move: MoveInfo;
    defended: boolean;
    threated: boolean;
}

type CheckType = 0 | 32 | 64 | 128 | 192 | 256; //none, CloseNotDefended, Close, Single, Knight, Double

abstract class Minimax {

    public static findBest(grand: boolean, board: string) {
        const actualGame: Game = new Game(grand, board);
        const player: PieceColor = actualGame.turn;
        return Minimax.minimax(actualGame, 0, -Infinity, Infinity, player, player);
    }


    private static readonly maxDepth: number = 4;

    private static minimax(node: Game, depth: number, alpha: number, beta: number, maxPlayer: PieceColor, levelPlayer: PieceColor) {
        const currentKing = levelPlayer == 'w' ? node.wKing : node.bKing;
        const moves = Minimax.generateMoves(node, currentKing);

        function moveOrderValue(amove: AttemptMove) {
            const moveNumber: number = node.moveNumber;
            const move = amove.move;
            if (currentKing.checked) {
                assertCondition(!csmv.isCastlingInfo(move));
                const p = cscnv.getPieceKeyName(move.piece);
                if (p == 'K') return -6;
                else {
                    const v = Piece.pieceValue(p);
                    return amove.threated ?
                        (amove.defended ? -v << 1 : - v) : (amove.defended ? 15 - v : (15 - v) << 1);
                }
            } else if (csmv.isCastlingInfo(move)) {
                return moveNumber < 6 ? -20 : moveNumber < 10 ? -10 : -1;
            } else {
                let tmpResult: number;
                const p = cscnv.getPieceKeyName(move.piece);
                if (p == 'K') { tmpResult = moveNumber < 6 ? -20 : moveNumber < 10 ? -10 : -1; }
                else {
                    const v = Piece.pieceValue(p);
                    if (moveNumber < 3) tmpResult = v > 2 ? -v : v;
                    else if (moveNumber < 6) tmpResult = v > 4 ? -v : v;
                    else if (moveNumber < 12) tmpResult = v > 10 ? -v : v;
                    else tmpResult = v;
                    if (amove.threated) tmpResult -= v;
                    if (amove.defended) tmpResult += 2;
                }
                if (csmv.isCaptureInfo(move)) tmpResult += Piece.pieceValue(cscnv.getPieceKeyName(move.captured)) << 2;
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
                    if (alpha < hValue) alpha = hValue;
                    if (beta <= alpha) break;
                }
                return alpha;
            } else {
                for (const m of moves) {
                    node.pushMove(m.move);
                    const hValue = Minimax.minimax(node, depth + 1, alpha, beta, maxPlayer, levelPlayer == 'w' ? 'b' : 'w');
                    node.popMove();
                    if (beta > hValue) beta = hValue;
                    if (beta <= alpha) break;
                }
                return beta;
            }
        } else {
            return node.getHeuristicValue(node.currentHeuristic);
        }
    }

    private static generateMoves(node: Game, currentKing: King) {
        const color: PieceColor = currentKing.color;
        const closeChecks = Minimax.closeCheckBitset(node, currentKing);
        const knightChecks = Minimax.knightCheckBitset(node, currentKing);
        const [orthogonalChecks, orthogonalDiscoveredChecks] = Minimax.orthogonalCheckBitset(node, currentKing);
        const [diagonalChecks, diagonalDiscoveredChecks] = Minimax.diagonalCheckBitset(node, currentKing);
        const result: AttemptMove[] = [];

        function getUndoInfo(move: MoveInfo) {
            const turnInfo: UndoStatus = {
                n: 1, //node.moveNumber,
                turn: node.turn,
                move: move,
                specialPawnCapture: node.specialPawnCapture == null ? undefined : node.specialPawnCapture.toString(),
                castlingStatus: (csmv.isMoveInfo(move) && ['K', 'R'].indexOf(cscnv.getPieceKeyName(move.piece)) >= 0) ?
                    node.playerCastlingStatus() : undefined
            };
            return turnInfo;
        }

        //TODO: Checked is state for all the moves
        //TODO: Castlings, pawn promotion

        //this is a quick sort heuristic:
        //- computed closeChecks doesn't ensures check, only close position
        //- discovered doesn't ensures piece move destination allows discovered check not to be hiden
        for (const piece of color == 'w' ? node.whitePieces() : node.blackPieces()) {
            //1st: awaiting promotion (when not in check)
            if (currentKing.checked)
                for (const pos of node.pieceMoves(piece)) {
                    const isEnPassantCapture = (cspty.isPawn(piece) || cspty.isAlmogaver(piece)) && node.specialPawnCapture != null &&
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
                    // result.push({
                    //     check: checkValue, capture: capturedValue + pawnValue,
                    //     defended: node.hasThreat(pos, color),
                    //     threated: node.isThreatened(pos, color)
                    // } as AttemptMove);
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
    private static orthogonalCheckBitset(node: Board, currentKing: King): [Bitset, Bitset] {
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
    private static diagonalCheckBitset(node: Board, currentKing: King): [Bitset, Bitset] {
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