"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts_general_1 = require("./ts.general");
const cescacs_types_1 = require("./cescacs.types");
const cescacs_positionHelper_1 = require("./cescacs.positionHelper");
const cescacs_piece_1 = require("./cescacs.piece");
const cescacs_piece_2 = require("./cescacs.piece");
const cescacs_1 = require("./cescacs");
const cescacs_moves_1 = require("./cescacs.moves");
/* running object */
var searchTree = undefined;
/* Web Workers:
    https://developer.mozilla.org/en-US/docs/Web/API/Worker
    https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers
 */
/* Promise:
    https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
    https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises
    https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function
    https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await
    https://learn.microsoft.com/es-es/archive/msdn-magazine/2013/march/async-await-best-practices-in-asynchronous-programming
    https://javascript.info/promise-basics
    Also (same than the last one): https://basarat.gitbook.io/typescript/future-javascript/promise

*/
/* Async communication with workers: https://advancedweb.hu/how-to-use-async-await-with-postmessage/ */
onmessage = async (e) => {
    console.log(`Message ${e.data[0]} received from main script`);
    if (e.data[0] == 'INI') {
        console.log(`grand: ${e.data[1][0]} TLPD: ${e.data[1][1]}`);
        const tmpMoves = JSON.parse(e.data[2]);
        console.log(`e N-halfmoves: ${tmpMoves.length} Moves:\n ${cescacs_1.Game.movesToString(tmpMoves)}`);
        let activateLoop = false;
        if (searchTree !== undefined && searchTree.grand === e.data[1][0] && searchTree.initStr === e.data[1][1]) {
            activateLoop = searchTree.isWorking;
            try {
                console.log("Search tree count: ", searchTree.gameMoves.length, "values: ", cescacs_1.Game.movesToString(searchTree.gameMoves));
                if (searchTree.gameMoves.length == tmpMoves.length
                    && (0, cescacs_moves_1.undoStatusArrayEquals)(searchTree.gameMoves, tmpMoves)) {
                    /* Everything's OK, nothing to do */
                    console.log("Everything's OK, nothing to do");
                    if (!activateLoop)
                        Minimax.sendWorkerPausedMessage();
                    return;
                }
                else if (searchTree.gameMoves.length < tmpMoves.length
                    && (0, cescacs_moves_1.undoStatusArrayEquals)(searchTree.gameMoves, tmpMoves.slice(0, searchTree.gameMoves.length))) {
                    /* S'han d'afegir nivells, ignorant les jugades que no siguin d'aquest arbre */
                    searchTree.addMoves(tmpMoves.slice(searchTree.gameMoves.length, tmpMoves.length - searchTree.gameMoves.length));
                }
                else if (searchTree.gameMoves.length > tmpMoves.length
                    && (0, cescacs_moves_1.undoStatusArrayEquals)(searchTree.gameMoves.slice(0, tmpMoves.length), tmpMoves)) {
                    /* S'ha retrocedit; s'han d'afegir nivells anteriors */
                    for (let i = searchTree.gameMoves.length; i >= tmpMoves.length; i--) {
                        console.log(`TODO: undo move:  ${cescacs_1.csmv.fullMoveNotation(searchTree.gameMoves[i])}`);
                        searchTree.undoLastMove();
                    }
                }
                else {
                    /* L'arbre de jugades no es pot reaprofitar */
                    console.log("Game moves doesn't match");
                    searchTree.resetMoves(tmpMoves);
                }
            }
            catch (error) {
                console.log(error);
                activateLoop = false;
            }
        }
        else {
            if (searchTree !== undefined) {
                if (searchTree.isWorking) {
                    console.log("Start game doesn't match: restart");
                    searchTree.resetMoves([]);
                    searchTree = undefined;
                    activateLoop = true;
                }
                else {
                    Minimax.sendWorkerPausedMessage();
                    return;
                }
            }
            console.log("begin search tree for a new game");
            searchTree = new Minimax(e.data[1][0], e.data[1][1], tmpMoves);
        }
        if (!searchTree.isWorking && activateLoop)
            searchTree.mainLoop();
    }
    else if (searchTree !== undefined && searchTree.grand === e.data[1][0] && searchTree.initStr === e.data[1][1]) {
        console.log(`${e.data[0]} issues correct grand and TLPD`);
        switch (e.data[0]) {
            case 'M' /* MOVE */: {
                if (searchTree.isWorking) {
                    if (cescacs_types_1.csTypes.isTurn(e.data[2][0]) && e.data[2][0] == searchTree.gameTurn
                        && typeof e.data[2][1] == 'number' && e.data[2][1] == searchTree.gameHalfMove
                        && typeof e.data[2][2] == 'string') {
                        const move = e.data[2][2];
                        console.log(move);
                        await searchTree.addStringMove(move);
                        break;
                    }
                    else {
                        console.log(`event ${e.data[0]} format error: ${e.data[2]} `);
                        console.log(`e turn: ${e.data[2][0]} local turn: ${searchTree.gameTurn}`);
                        console.log(`e halfMove #: ${e.data[2][1]} local halfMove #: ${searchTree.gameHalfMove}`);
                        console.log(`error move: ${e.data[2][2]}`);
                        searchTree.stop(true);
                        Minimax.sendRqResetMessage("Incorrect 'M' (move) message received");
                        return;
                    }
                }
                else {
                    Minimax.sendWorkerPausedMessage();
                    return;
                }
            }
            case 'BK' /* UNDOMOVE */: {
                if (searchTree.isWorking) {
                    if (e.data.length == 2) {
                        searchTree.undoLastMove();
                        break;
                    }
                    else {
                        console.log(`event ${e.data[0]} format error, data length: ${e.data.length} `);
                        searchTree.stop(true);
                        Minimax.sendRqResetMessage("Incorrect 'BK' (undo move) message received");
                        return;
                    }
                }
                else {
                    Minimax.sendWorkerPausedMessage();
                    return;
                }
            }
            case 'RQ' /* REQUEST FOR RESULT */: {
                if (searchTree.isWorking) {
                    if (e.data.length == 2) {
                        const move = await searchTree.resultReady();
                        //TODO: RQ RESULT
                        console.log("OIDO COCINA");
                        Minimax.sendWorkerMoveMessage(move);
                    }
                    else {
                        console.log(`event ${e.data[0]} format error, data length: ${e.data.length} `);
                        searchTree.stop(true);
                        Minimax.sendRqResetMessage("Incorrect 'RQ' (request result) message received");
                    }
                }
                else {
                    Minimax.sendWorkerPausedMessage();
                }
                return;
            }
            case 'P' /* PAUSE ENGINE */: {
                searchTree.stop(false);
                Minimax.sendWorkerPausedMessage();
                return;
            }
            case 'ON' /* ENGINE WORK ON */: {
                Minimax.sendWorkerWorkingMessage();
                break;
            }
            default: {
                if (searchTree.isWorking) {
                    console.log(`Event identification error ${e.data[0]}`);
                    searchTree.stop(false);
                    Minimax.sendRqResetMessage("Unknown message received");
                }
                else
                    Minimax.sendWorkerPausedMessage();
                return;
            }
        }
        if (searchTree.isWorking)
            return;
        searchTree.mainLoop();
    }
    else {
        console.log(`Game status doesn't match on event ${e.data[0]}`);
        console.log(`Value grant: ${e.data[1][1]} TLPD: ${e.data[1][1]}`);
        console.log(`Registered TLPD: ${searchTree?.initStr}`);
        if (searchTree !== undefined) {
            searchTree.stop(false);
            if (searchTree.isWorking)
                Minimax.sendRqResetMessage("Game status doesn't match on received event, or unknown message format received");
        }
        else
            Minimax.sendWorkerPausedMessage();
    }
};
// - MVV-LVA: Most Valuable Victim - Least Valuable Aggressor (ordering moves)
// https://www.chessprogramming.org/MVV-LVA
// - Attack table allows Static Exchange Evaluation
// https://www.chessprogramming.org/Static_Exchange_Evaluation
// Lazy evaluation
// https://www.chessprogramming.org/Lazy_Evaluation
// - Transposition Tables
// https://www.chessprogramming.org/Transposition_Table
// - Alpha-beta
// https://www.chessprogramming.org/Alpha-Beta
// - Principal variation search: improvements to Alpha-beta
// https://en.wikipedia.org/wiki/Principal_variation_search
// https://www.chessprogramming.org/Principal_Variation_Search
// - Null window
// https://www.chessprogramming.org/Null_Window
// - Aspiration Windows
// https://www.chessprogramming.org/Aspiration_Windows
// - Iterative deepening
// https://www.chessprogramming.org/Iterative_Deepening
// - MTD(f)
// https://en.wikipedia.org/wiki/MTD(f)
// - Best Node Search
// https://en.wikipedia.org/wiki/Best_node_search
// Quiesence search
// https://www.chessprogramming.org/Quiescence_Search
// Delta pruning
// https://www.chessprogramming.org/Delta_Pruning
// Null Move Pruning
// https://www.chessprogramming.org/Null_Move_Pruning
class Minimax {
    static sendRqResetMessage(message) {
        postMessage(['RQINI', message]);
    }
    static sendWorkerPausedMessage() {
        postMessage(['WOFF']);
    }
    static sendWorkerWorkingMessage() {
        postMessage(['WON']);
    }
    static sendWorkerMoveMessage(m) {
        postMessage(['MR', m]);
    }
    static availableProcessorCount() {
        const logicalProcessorCount = navigator.hardwareConcurrency;
        if (logicalProcessorCount >= 4)
            return (logicalProcessorCount - 2) >> 1;
        else
            return 0;
    }
    async addStringMove(move) {
        //TODO: MOVE: see if main line can be reused
        await this.stopLoop();
        this.game.applyStringMove(move);
        this._gameHalfMove = this.game.topHalfMove;
        this._gameTurn = this.game.turn;
        console.log("New halfMove value #:", this._gameHalfMove);
    }
    async addMoves(moves) {
        //TODO: MOVE: see if main line can be reused
        console.log("WAIT FOR STOP LOOP");
        await this.stopLoop();
        console.log("AFTER WAIT FOR STOP LOOP");
        for (let i = 0; i <= moves.length - 1; i++) {
            const move = moves[i];
            console.log(`TODO: add new move: ${cescacs_1.csmv.fullMoveNotation(move)}`);
            (0, ts_general_1.assertCondition)(move.move != '\u2026', "First empty move");
            this.game.pushMove(move.move);
            this._gameHalfMove = this.game.topHalfMove;
            console.log("New halfMove value #:", this._gameHalfMove);
            this._gameTurn = this.game.turn;
        }
    }
    async undoLastMove() {
        //TODO: UNDOMOVE
        await this.stopLoop();
        this.game.popMove();
        this._gameHalfMove = this.game.topHalfMove;
        this._gameTurn = this.game.turn;
    }
    async resetMoves(moves) {
        //TODO
        await this.stopLoop();
    }
    async mainLoop() {
        if (this._done && !this._endLoop) {
            if (!await this.isEndLoop(0)) {
                let i = 10;
                while (!await this.isEndLoop(i)) {
                    if (i < 300)
                        i << 1;
                }
            }
        }
        if (this._done && this._endLoop) {
            this._endLoop = this._done = false;
            console.log("BEGIN MAIN LOOP");
            let counter = 0; //simulation variable
            while (!await this.done()) {
                //TODO: Main loop step execution (TIMER SIMULATION)
                setTimeout(() => {
                    const v = Math.random();
                    if (v <= 0.000009) {
                        if (counter > 3)
                            this._answerReady = true;
                        else
                            counter++;
                        console.log("grossa! (", counter, ")");
                    }
                    else if (v <= 0.000012) {
                        if (counter > 3)
                            this._qanswerReady = true;
                        else
                            counter++;
                        console.log("premi consolació (", counter, ")");
                    }
                }, 173);
            }
            this._endLoop = true;
            console.log("MAIN LOOP ENDED");
        }
        else {
            console.log(`ERR!! done: ${this._done} end loop: ${this._endLoop}`);
        }
    }
    async resultReady() {
        const maxAnswerTime = Minimax.maxAnswerTime;
        const maxLimitAnswerTime = maxAnswerTime << 1;
        const meanAnswerTime = Math.min(this.meanms(), maxAnswerTime >> 1);
        const start = Date.now();
        let thecase = "default";
        while (!await this.answerReady(10000)) {
            const count = Date.now() + 500 - start;
            if (count >= maxLimitAnswerTime) {
                thecase = "1";
                break;
            }
            else if (count >= maxAnswerTime) {
                if (this._n < 15 || this.meanms() > 2000) {
                    thecase = "2";
                    break;
                }
            }
            else if (count >= meanAnswerTime && this._qanswerReady) {
                thecase = "3";
                break;
            }
            console.log("bucle: ", count);
        }
        this._n++;
        this._totalms += Date.now() - start;
        //TODO RETURN VALUE & SEARCH NEW MOVE
        const s = ((Date.now() - start) / 1000).toFixed(3);
        const result = "Result in: " + s + " seconds, case: " + thecase;
        console.log(this._answerReady, this._qanswerReady, " " + result);
        this._answerReady = false;
        this._qanswerReady = false;
        return result;
    }
    get isWorking() { return !this._done; }
    async stop(fatalError = false) {
        if (!this._done || !this._endLoop)
            await this.stopLoop();
        if (fatalError)
            Minimax.sendWorkerPausedMessage();
    }
    async stopLoop() {
        if (!this._done) {
            console.log("BEGIN STOP LOOP");
            this._done = true;
            await new Promise(resolve => setTimeout(resolve, 0));
        }
        if (!await this.isEndLoop(0)) {
            let i = 10;
            while (!await this.isEndLoop(i)) {
                if (i < 300)
                    i << 1;
            }
        }
        console.log("LOOP STOPPED");
        (0, ts_general_1.assertCondition)(this._done && this._endLoop, "stopLoop postcondition");
    }
    async done() {
        return await new Promise(resolve => setTimeout(resolve, 0)).then(() => { return this._done; });
    }
    async isEndLoop(milliseconds) {
        return await new Promise(resolve => setTimeout(resolve, milliseconds)).then(() => { return this._endLoop; });
    }
    async answerReady(milliseconds) {
        await new Promise(resolve => setTimeout(resolve, milliseconds));
        return this._answerReady;
    }
    constructor(grand, initStr, gameMoves) {
        this.grand = grand;
        this.initStr = initStr;
        this.gameMoves = gameMoves;
        this.meanms = () => { return this._n > 0 ? this._totalms / this._n : Minimax.maxAnswerTime; };
        this._done = true; //main loop flag: must be explitly set
        this._endLoop = true;
        this._answerReady = false;
        this._qanswerReady = false;
        this._n = 0;
        this._totalms = 0;
        this.previousMove = undefined;
        this.game = new cescacs_1.Game(grand, initStr);
        this.game.restoreMoves(gameMoves);
        this._gameHalfMove = this.game.topHalfMove;
        this._gameTurn = this.game.turn;
    }
    get gameHalfMove() {
        return this._gameHalfMove;
    }
    get gameTurn() {
        return this._gameTurn;
    }
    static findBest(grand, board) {
        const actualGame = new cescacs_1.Game(grand, board);
        const player = actualGame.turn;
        return Minimax.minimax(actualGame, 0, -Infinity, Infinity, player, player);
    }
    static minimax(node, depth, alpha, beta, maxPlayer, levelPlayer) {
        const currentKing = levelPlayer == 'w' ? node.wKing : node.bKing;
        //TODO const attackTable: [Position[], (Piece|null)[], Array<Piece>[]];
        const moves = Minimax.generateMoves(node, currentKing);
        function moveOrderValue(amove) {
            const moveNumber = node.moveNumber;
            const move = amove.move;
            if (currentKing.checked) {
                (0, ts_general_1.assertCondition)(!cescacs_1.csmv.isCastlingInfo(move), "No castling move");
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
    evaluate() {
        //TODO Heuristic
        return 0;
    }
    *capturesAndChecks() {
        const captures = [];
        const checks = [];
    }
    quiesce(alpha, beta) {
        let stand_pat = this.evaluate();
        if (stand_pat >= beta)
            return beta;
        if (alpha < stand_pat)
            alpha = stand_pat;
        for (const move of this.capturesAndChecks()) {
            this.game.pushMove(move);
            const score = -this.quiesce(-beta, -alpha);
            this.game.popMove();
            if (score >= beta)
                return beta;
            if (score > alpha)
                alpha = score;
        }
        return alpha;
    }
}
Minimax.maxAnswerTime = 135 * 1000;
Minimax.maxDepth = 4;
Minimax.maxQDepth = 8;
Minimax.limitedDepth = 2;
