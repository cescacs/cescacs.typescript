'use strict';

import * as cescacs from "./dist/cescacs.js"

const urlParams = new URLSearchParams(window.location.search);
const grandParam = urlParams.get('grand') != null ||
    typeof (Storage) !== "undefined" && localStorage.getItem("cescacs-grand") == 'grand';
const game = new cescacs.Game(grandParam);

window.addEventListener("load", (event) => {
    init();
});


/*TODO

1) Threats/Threaded incorrectes per les captures especials.
    - No es verifica que hagi un peó per fer la captura...
    - De fet es comprova si és capturable per una peça amiga!!!
2) COMPTE!!!! Elefants incorporats en captura al pas
    - Poden ser capturats
    - Poden fer captures
    - Cal afegir-ho a les regles ????
3) Captura scornful incorrecta????
    - permet captura quan el peó retingut fa una captura
    - això incorpora moviment de retrocés en el peó
    - sembla excesiu... sinó, cal afegir a regles.

*/


// W I N D O W    R E S I Z E
//
window.addEventListener("resize", (event) => {
    if (castlingContainer.style.display != "none")
        cancelCastling();
    else if (movesPanel.style.display != "none")
        ShowMoves();
    }
);


//   B U T T O N   E V E N T S
// Dialogs
for (const span of document.querySelectorAll("dialog>span.close")) {
    span.onclick = function () { span.parentElement.close(); }
}

// ---- Game status
document.getElementById("buttonTLPD").addEventListener("click", (event) => {
    TLPDString();
});
document.getElementById("buttonLoad").addEventListener("click", (event) => {
    LoadTLPD();
});
document.getElementById("buttonNew").addEventListener("click", (event) => {
    LoadNewGame();
});
document.getElementById("buttonResign").addEventListener("click", (event) => {
    Resign();
});
document.getElementById("buttonDraw").addEventListener("click", (event) => {
    Draw();
});
// ---- Moves
document.getElementById("buttonShowMoves").addEventListener("click", (event) => {
    ShowMoves();
});
document.getElementById("buttonGoOn").addEventListener("click", (event) => {
    ShowMoves();
});
document.querySelectorAll('input[type=radio][name="showMovesPanelPosition"]').
    forEach(radio => radio.addEventListener('change', () => { 
        showMovesPanelPositionChange(radio); 
}));
document.querySelectorAll('input[type=radio][name="showMovesPanelVPosition"]').
    forEach(radio => radio.addEventListener('change', () => { 
        showMovesPanelVPositionChange(radio); 
}));
document.getElementById("buttonLoadMoves").addEventListener("click", (event) => {
    LoadMoves();
});
document.getElementById("buttonManualMove").addEventListener("click", (event) => {
    ManualMove();
});

// ---- Information
document.getElementById("buttonShowThreatened").addEventListener("click", (event) => {
    ShowThreatened();
});
document.getElementById("buttonShowThreats").addEventListener("click", (event) => {
    ShowThreats();
});
document.getElementById("buttonHeuristic").addEventListener("click", (event) => {
    ShowHeuristic();
});
// document.getElementById("buttonSuggestMove").addEventListener("click", (event) => {
//     SuggestMove();
// });

// ---- Castling
document.getElementById("buttonCastling").addEventListener("click", (event) => {
    Castling();
});
document.querySelectorAll('input[type=radio][name="castlingContainerPosition"]').
    forEach(radio => radio.addEventListener('change', () => { 
        castlingContainerPositionChange(radio); 
}));
document.getElementById("cancelCastling").addEventListener("click", (event) => {
    cancelCastling();
});
document.getElementById("confirmCastling").addEventListener("click", (event) => {
    confirmCastling();
});

// ----- dialogConfirm
document.querySelector("#dialogConfirm>span.close").addEventListener("click", () => {
    CancelAction();    
});
document.getElementById("confirmAreaConfirm").addEventListener("click", (event) => {
    ConfirmAction();
});
document.getElementById("confirmAreaCancel").addEventListener("click", (event) => {
    CancelAction();
});
document.getElementById("grandCescacsConfirm").addEventListener("click", (event) => {
    GrandCescacs();
});

//dialogPromotion
document.querySelector("#dialogPromotion>span.close").addEventListener("click", () => {
    clearClickHex();
});
document.getElementById("promotionRegainableOptions").addEventListener("change", (event) => {
    activateConfirmPromotion();
});
document.getElementById("confirmPromotion").addEventListener("click", (event) => {
    confirmPromotion();
});

// Moves Panel
document.getElementById("buttonFirst").addEventListener("click", (event) => {
    showFirst();
});
document.getElementById("buttonPrevious").addEventListener("click", (event) => {
    showPrevious();
});
document.getElementById("buttonNext").addEventListener("click", (event) => {
    showNext();
});
document.getElementById("buttonLast").addEventListener("click", (event) => {
    showLast();
});
document.getElementById("buttonUndo").addEventListener("click", (event) => {
    UndoMove();
});
document.getElementById("buttonMoves").addEventListener("click", (event) => {
    GetMoves();
});




/* FIXME - Removed code */
// /* SECTION Worker functions */
// //TODO - Worker
// /* Initialize ! */
// const WINI = function () {
//     if (myWorker !== undefined) {
//         myWorker.postMessage(["INI", [game.isGrand, localStorage.getItem("cescacs")], game.movesJSON]);
//         console.log('Message INI posted to worker');
//     }
// }
// /* Pause the worker ? */
// const WP = function () {
//     if (myWorker !== undefined) {
//         myWorker.postMessage(["P", [game.isGrand, localStorage.getItem("cescacs")]]);
//         console.log('Message P posted to worker');
//     }
// }
// /* Resume the worker ? */
// const WON = function () {
//     if (myWorker !== undefined) {
//         myWorker.postMessage(["ON", [game.isGrand, localStorage.getItem("cescacs")]]);
//         console.log('Message ON posted to worker');
//     }
// }
// /* Inform a move ! */
// const WMOVE = function (turn, halfmoveNumber, move) {
//     if (myWorker !== undefined) {
//         myWorker.postMessage(["M", [game.isGrand, localStorage.getItem("cescacs")], [turn, halfmoveNumber, move]]);
//         console.log('Message M posted to worker');
//     }
// }
// /* Undo move ? */
// const WUNDO = function () {
//     if (myWorker !== undefined) {
//         myWorker.postMessage(["BK", [game.isGrand, localStorage.getItem("cescacs")]]);
//         console.log('Message BK posted to worker');
//     }
// }
// /* Require result ! */
// const WRQ = function () {
//     if (myWorker !== undefined) {
//         myWorker.postMessage(["RQ", [game.isGrand, localStorage.getItem("cescacs")]]);
//         console.log('Message RQ posted to worker');
//     }
// }

// /* !SECTION Worker functions */

function init() {
    const rootElement = document.getElementById("HEX");
    const children = rootElement.children;
    //add event handler on svg hexes
    for (let i = 0; i < children.length; i++) {
        const e = children[i];
        if (e.hasAttribute("id") && e.getAttribute("id").startsWith("HEX")) {
            e.onclick = function (event) { clickHex(this); }
            e.classList.add('board');
        }
        rootElement.classList.add('board');
    }
    //restore existing game from storage
    if (typeof (Storage) !== "undefined" && localStorage.getItem("cescacs") != null) {
        restoreGame();
    } else {
        saveGame();
    }
    //FIXME - removed code
    /*
    wPaused();
    if (!game.gameEnd) { WINI(); WON(); }
    */
    restoreBoard();
    //title
    const gameTitle = document.getElementById("gameTitle");
    if (grandParam) {
        const dialogGrandCescacs = document.getElementById("dialogGrandCescacs");
        gameTitle.innerHTML = "Grand<br>C'escacs";
        dialogGrandCescacs.showModal();
    } else gameTitle.innerHTML = "C'escacs";
    RestoreButtons();
    displayMoveStatus();
};

//FIXME - removed code
/*
var WorkingWorker = false;

function wPaused() {
    const buttonStopEngine = document.getElementById("buttonStopEngine");
    const buttonSuggestMove = document.getElementById("buttonSuggestMove");
    buttonStopEngine.classList.remove('w3-black');
    buttonStopEngine.classList.add('w3-red');
    buttonStopEngine.innerHTML = "Start Engine";
    if (suggestMoveContainer.style.display == 'block') SuggestMove();
    buttonSuggestMove.disabled = true;
    WorkingWorker = false;
}

function wWorking() {
    const buttonStopEngine = document.getElementById("buttonStopEngine");
    const buttonSuggestMove = document.getElementById("buttonSuggestMove");
    buttonStopEngine.classList.add('w3-black');
    buttonStopEngine.classList.remove('w3-red');
    buttonStopEngine.innerHTML = "Stop Engine";
    buttonSuggestMove.disabled = false;
    WorkingWorker = true;
}
*/

function placeSymbol(coord, pieceId) {
    const placeId = 'HEX' + coord;
    const color = (pieceId == pieceId.toUpperCase()) ? 'W' : 'B';
    const symbolId = '#' + color + pieceId.toUpperCase();
    const hexElement = document.getElementById(placeId);
    if (hexElement != null) {
        const node = document.createElementNS("http://www.w3.org/2000/svg", 'use');
        node.setAttribute("href", symbolId);
        const x = hexElement.getAttribute("data-centerx") - 135;
        const y = hexElement.getAttribute("data-centery") - 135;
        node.setAttribute("x", x);
        node.setAttribute("y", y);
        node.style.opacity = "1.0";
        node.style.fillOpacity = "1.0";
        hexElement.appendChild(node);
    }
}
function removeSymbol(hexElement) {
    const lastChild = hexElement.lastChild;
    if (lastChild.nodeName == "use") hexElement.removeChild(lastChild);
}

var selecting = false;
/**
 * Main GUI function, triggered from svg clic
 *
 * @param {*} hexElement - the svg hex
 * @return {*} 
 */
function clickHex(hexElement) {
    if (!isExecutingAction() && !game.gameEnd) {
        if (clickHex.svg === undefined) {
            clickHex.svg = new Set(); clickHex.item = null;
        }
        const lastChild = (hexElement ?? clickHex.hexElement).lastChild;
        const gameStatus = document.getElementById("gameStatus");
        if (selecting) {
            if (hexElement.classList.contains('highlight')) {
                const src = clickHex.item.getAttribute("id").slice(3);
                const dest = hexElement.getAttribute("id").slice(3);
                const piece = game.getHexPiece(src);
                if (piece != null) {
                    for (const e of clickHex.svg) {
                        e.classList.remove('highlight');
                    }
                    removeSymbol(clickHex.item); //piece to move
                    removeSymbol(hexElement); //may be a captured piece
                    placeSymbol(dest, game.turn == 'w' ? piece.symbol : piece.symbol.toLowerCase());
                    clickHex.item.classList.remove("selected");
                    const destCoord = cescacs.PositionHelper.parse(dest);
                    if (piece.symbol == 'P'
                        && cescacs.PositionHelper.isPromotionHex(destCoord, piece.color)
                        && game.hasRegainablePieces(cescacs.PositionHelper.hexColor(destCoord))) {
                        clickHex.hexElement = hexElement; //pawn position
                        showPromotionDialog(destCoord);
                    } else {
                        clickHex.item = null;
                        try {
                            game.doMove(src, dest);
                            const enPassantPos = game.enPassantCaptureCoordString;
                            if (enPassantPos != null) {
                                removeSymbol(document.getElementById("HEX" + enPassantPos));
                            }
                            // if (game.lastMove != null) {
                            //     WMOVE(cescacs.cscnv.otherSide(game.turn), game.topHalfMove - 1, cescacs.csmv.fullMoveNotation(game.lastMove, false));
                            // }
                            displayMoveStatus();
                            saveMoves();
                        } catch (e) {
                            console.log("doMove: ", e);
                            document.getElementById("gameStatus").textContent = (e instanceof Error ? e.message : "");
                            document.getElementById("resultString").textContent = 'ERROR';
                        }
                    }
                } else gameStatus.textContent = dest + ' ERROR!';
            }
            else if (hexElement.classList.contains('selected')
                && lastChild.nodeName == "use"
                && hexElement === clickHex.item) {
                clearClickHex();
            }
            selecting = false;
        } else {
            if (lastChild.nodeName == "use") {
                const strCoord = hexElement.getAttribute("id").slice(3);
                const piece = game.getHexPiece(strCoord);
                if (piece == null) return;
                else if (piece.color == game.turn) {
                    if (!game.checked && game.isAwaitingPromotion && game.hasAwaitingRegainablePieces()) {
                        gameStatus.textContent = "Promotion rq";
                        if (cescacs.cspty.isPawn(piece) && piece.awaitingPromotion != null) {
                            hexElement.classList.add('selected');
                            lastChild.classList.add('selected');
                            clickHex.item = hexElement;
                            clickHex.hexElement = hexElement; //pawn position
                            const destCoord = cescacs.PositionHelper.parse(hexElement.getAttribute("id").slice(3));
                            showPromotionDialog(destCoord, true);
                        }
                    }
                    else {
                        hexElement.classList.add('selected');
                        lastChild.classList.add('selected');
                        clickHex.item = hexElement;
                        for (const pos of game.pieceMoves(piece)) {
                            const p = cescacs.PositionHelper.toString(pos);
                            const e = document.getElementById("HEX" + p);
                            e.classList.add('highlight');
                            clickHex.svg.add(e);
                        }
                        const src = hexElement.getAttribute("id").slice(3);
                        const symbol = piece.symbol == 'P' ? "" : piece.symbol;
                        gameStatus.textContent = symbol + src;
                        selecting = true;
                    }
                }
                else return;
            }
        }
    }
}
/**
 * Choose promotion piece
 *
 * @param {*} destCoord
 * @param {boolean} [closeable=false]
 */
function showPromotionDialog(destCoord, closeable = false) {
    const dialog = document.getElementById("dialogPromotion");
    const selector = document.getElementById("promotionRegainableOptions");
    const bishopColor = cescacs.PositionHelper.hexColor(destCoord);
    const regainablePieceNames = game.currentRegainablePieceNames(bishopColor);
    document.querySelector("#dialogPromotion>span.close").style.display = closeable ? "block" : "none";
    for (let i = 0; i < selector.options.length; i++) {
        selector.options[i].disabled = !regainablePieceNames.has(selector.options[i].value[0]);
    }
    dialog.showModal();
}
/**
 * On change of promotionRegainableOptions list
 *
 */
function activateConfirmPromotion() {
    const selector = document.getElementById("promotionRegainableOptions");
    const confirmButton = document.getElementById("confirmPromotion");
    confirmButton.disabled = (selector.value ?? "") == "";
}
function confirmPromotion() {
    const selector = document.getElementById("promotionRegainableOptions");
    if (selector.value === "") return;
    else {
        const dialog = document.getElementById("dialogPromotion");
        const pieceSymbol = selector.value;
        const src = clickHex.item.getAttribute("id").slice(3);
        const dest = clickHex.hexElement.getAttribute("id").slice(3);
        clickHex.item = null;
        //remove pawn, in promotion position
        removeSymbol(clickHex.hexElement);
        clickHex.hexElement = undefined;
        //put new piece
        placeSymbol(dest, game.turn == 'w' ? pieceSymbol : pieceSymbol.toLowerCase());
        try {
            game.doPromotePawn(src, dest, pieceSymbol);
            // if (game.lastMove != null) {
            //     WMOVE(cescacs.cscnv.otherSide(game.turn), game.topHalfMove - 1, cescacs.csmv.fullMoveNotation(game.lastMove, false));
            // }
            displayMoveStatus();
            saveMoves();
        } catch (e) {
            console.log("doPromotePawn: ", e);
            document.getElementById("gameStatus").textContent = (e instanceof Error ? e.message : "");
            document.getElementById("resultString").textContent = 'ERROR';
        }
        dialog.close();
    }
}
/**
 * clear move selection (highlighted and selected elements) and show game status
 *
 */
function clearClickHex() {
    const svg = clickHex.svg;
    if (svg != null) {
        for (const e of svg) { e.classList.remove('highlight'); }
        svg.clear();
        const item = clickHex.item;
        if (item != null) {
            item.classList.remove("selected");
            if (item.lastChild != null) item.lastChild.classList.remove("selected");
            clickHex.item = null;
        }
        clickHex.hexElement = undefined;
        displayMoveStatus();
    }
}
/**
 * only one action at a time; move selection not included in condition, as it will be cleared when other action begins
 *
 * @return {*} 
 */
function isExecutingAction() {
    if (boardTLPDStatus || loadNewGame || endingGameResign || endingGameDraw || showingThreatened || showingThreats) return true;
    else return document.getElementById("TLPD").style.display != 'none'
        || document.getElementById("castlingContainer").style.display != 'none'
        || document.getElementById("movesPanel").style.display != 'none'
        || document.getElementById("loadMovesPanel").style.display != 'none';
}
/**
 * Show moveText, Heuristic, and disable buttons on game end
 *
 */
function displayMoveStatus() {
    const buttonCastling = document.getElementById("buttonCastling");
    let moveText = game.strLastMove;
    if (game.gameEnd) {
        const buttonResign = document.getElementById("buttonResign");
        const buttonDraw = document.getElementById("buttonDraw");
        const buttonLoadMoves = document.getElementById("buttonLoadMoves");
        const buttonManualMove = document.getElementById("buttonManualMove");
        //const buttonStopEngine = document.getElementById("buttonStopEngine");
        const buttonSuggestMove = document.getElementById("buttonSuggestMove");
        buttonResign.disabled = true;
        buttonDraw.disabled = true;
        buttonLoadMoves.disabled = true;
        buttonManualMove.disabled = true;
        //buttonStopEngine.disabled = true;
        buttonSuggestMove.disabled = true;
        buttonCastling.disabled = true;
        if (moveText == null) moveText = '\xa0';
    } else {
        if (moveText == null) moveText = "Ready " + (game.turn == "w" ? "whites" : "blacks");
        buttonCastling.disabled = game.checked;
    }
    document.getElementById("gameStatus").textContent = moveText;
    document.getElementById("resultString").textContent = game.resultString ?? '\xa0';
    displayHeuristic();
}
/**
 * really part of displayMoveStatus
 *
 */
function displayHeuristic() {
    const turn = game.turn;
    const lblHeuristic = document.getElementById(turn == 'w' ? "HeuristicLabel1" : "HeuristicLabel2");
    const lblTurn = document.getElementById(turn == 'w' ? "whiteTurn" : "blackTurn");
    let heuristic = game.getHeuristicValue(game.currentHeuristic);
    let previousHeuristic = Number.parseFloat(lblHeuristic.textContent);
    lblHeuristic.textContent = heuristic.toString();
    lblTurn.textContent = isNaN(previousHeuristic) ? "" : " Δ: " + cescacs.round2hundredths(heuristic - previousHeuristic).toString();
}
/**
 * Show pieces on board (repaint)
 *
 */
function restoreBoard() {
    for (const item of document.querySelectorAll(`[id^="HEX"]`)) {
        removeSymbol(item)
    }
    for (const p of game.pieceList()) {
        placeSymbol(p.slice(1), p[0]);
    }
}

function saveGame() {
    try {
        localStorage.setItem("cescacs-grand", game.isGrand ? 'grand' : "");
        localStorage.setItem("cescacs", game.valueTLPD);
        localStorage.removeItem("cescacs-mv");
        if (game.gameEnd) localStorage.setItem("cescacs-end", game.resultString);
        else localStorage.removeItem("cescacs-end");
    } catch (e) {
        console.log("saveGame: ", e);
        document.getElementById("gameStatus").textContent = (e instanceof Error ? e.message : "");
        document.getElementById("resultString").textContent = 'ERROR';
    }
}

function saveMoves() {
    localStorage.setItem("cescacs-mv", game.movesJSON);
    if (game.gameEnd) localStorage.setItem("cescacs-end", game.resultString);
    else localStorage.removeItem("cescacs-end");
}

function restoreGame() {
    const isGrandStored = localStorage.getItem("cescacs-grand") == 'grand';
    if (game.isGrand == isGrandStored) {
        const movesGrid = document.getElementById("movesGrid");
        movesGrid.innerHTML = "";
        const statusTLPD = localStorage.getItem("cescacs");
        try {
            if (statusTLPD && (statusTLPD.trim().length > 12)) {
                game.loadTLPD(localStorage.getItem("cescacs"));
                if (localStorage.getItem("cescacs-mv") != null) {
                    game.restoreMovesJSON(localStorage.getItem("cescacs-mv"));
                }
                game.resultString = localStorage.getItem("cescacs-end");
            }
        } catch (e) {
            console.log("restoreGame: ", e);
            document.getElementById("gameStatus").textContent = (e instanceof Error ? e.message : "");
            document.getElementById("resultString").textContent = 'ERROR';
        }
    } else { //Never happens                
        const parser = new URL(window.location);
        if (isGrandStored) parser.searchParams.append('grand', "");
        else parser.searchParams.delete('grand');
        window.location = parser.href;
    }
}

//SECTION BUTTON ACTIONS
//------------- BUTTON ACTIONS IN UPPERCASE ------------------

var boardTLPDStatus = false;
function TLPDString() {
    clearClickHex();
    const x = document.getElementById("TLPD");
    const l = document.getElementById("TLPDStringLabel");
    if (x.style.display === "none") {
        const sepGameStatus = document.getElementById("sepGameStatus");
        const buttonTLPD = document.getElementById("buttonTLPD");
        x.readOnly = true;
        x.value = game.valueTLPD;
        HideButtons();
        sepGameStatus.style.display = "block";
        buttonTLPD.classList.remove("halfbutton");
        buttonTLPD.classList.add("fullbutton");
        buttonTLPD.textContent = "Got";
        buttonTLPD.style.display = "block";
        x.style.display = "block";
        l.style.display = "block";
        x.select();
        x.setSelectionRange(0, 99999); /* For mobile devices */
        navigator.clipboard.writeText(x.value);
        boardTLPDStatus = true;
    } else if (boardTLPDStatus) {
        x.value = "";
        x.style.display = "none";
        l.style.display = "none";
        RestoreButtons();
        const buttonTLPD = document.getElementById("buttonTLPD");
        buttonTLPD.textContent = "Get";
        buttonTLPD.classList.remove("fullbutton");
        buttonTLPD.classList.add("halfbutton");
        boardTLPDStatus = false;
    }
}
function LoadTLPD() {
    if (!boardTLPDStatus) {
        clearClickHex();
        const x = document.getElementById("TLPD");
        const l = document.getElementById("loadTLPDLabel");
        if (x.style.display === "none") {
            const sepGameStatus = document.getElementById("sepGameStatus");
            const buttonLoad = document.getElementById("buttonLoad");
            x.readOnly = false;
            HideButtons();
            sepGameStatus.style.display = "block";
            buttonLoad.classList.remove("halfbutton");
            buttonLoad.classList.add("fullbutton");
            buttonLoad.style.display = "block";
            x.style.display = "block";
            l.style.display = "block";
        } else {
            const buttonLoad = document.getElementById("buttonLoad");
            const textContent = x.value.trim();
            if (textContent.length == 0) {
                x.style.display = "none";
                l.style.display = "none";
                RestoreButtons();
                buttonLoad.classList.remove("fullbutton");
                buttonLoad.classList.add("halfbutton");
            } else if (textContent.length > 10) {
                try {
                    const movesGrid = document.getElementById("movesGrid");
                    const result = game.loadTLPD(textContent);
                    movesGrid.innerHTML = "";
                    x.style.display = "none";
                    l.style.display = "none";
                    RestoreButtons();
                    buttonLoad.classList.remove("fullbutton");
                    buttonLoad.classList.add("halfbutton");
                    restoreBoard();
                    //cescacs-grand is preserved
                    saveGame();
                    displayMoveStatus();
                } catch (e) {
                    console.log("LoadTLPD: ", x.value, e);
                    x.value = ("LoadTLPD: " + e instanceof Error ? e.toString() : String(e)) + "\n\n" + x.value;
                    document.getElementById("gameStatus").textContent = (e instanceof Error ? e.message : "");
                    document.getElementById("resultString").textContent = 'ERROR';
                }
            }
        }
    }
}

var loadNewGame = false;
var endingGameResign = false;
var endingGameDraw = false;
function LoadNewGame() {
    const confirmDialog = document.getElementById("dialogConfirm");
    const confirmLbl = document.getElementById("confirmationLabel");
    const grandCescacs = document.getElementById("grandCescacs");
    clearClickHex();
    HideButtons();
    confirmLbl.textContent = "\u00A0Start a new game?";
    grandCescacs.style.display = "block";
    loadNewGame = true;
    confirmDialog.showModal();
}
function Resign() {
    const confirmDialog = document.getElementById("dialogConfirm");
    const confirmLbl = document.getElementById("confirmationLabel");
    clearClickHex();
    HideButtons();
    confirmLbl.textContent = "\u00A0Do you give up?";
    endingGameResign = true;
    confirmDialog.showModal();
}
function Draw() {
    const confirmDialog = document.getElementById("dialogConfirm");
    const confirmLblPrevi = document.getElementById("confirmLblPrevi");
    const confirmLbl = document.getElementById("confirmationLabel");
    clearClickHex();
    HideButtons();
    confirmLblPrevi.textContent = `\u00A0Has ${game.turn == 'w' ? 'Black' : 'White'} asked for a draw,`;
    confirmLbl.textContent = "\u00A0and you accept?";
    endingGameDraw = true;
    confirmDialog.showModal();
}
function ConfirmAction() {
    document.getElementById("dialogConfirm").close();
    RestoreButtons();
    if (loadNewGame) {
        loadNewGame = false;
        localStorage.removeItem("cescacs");
        localStorage.removeItem("cescacs-mv");
        localStorage.removeItem("cescacs-end");
        localStorage.removeItem("cescacs-grand");
        const parser = new URL(window.location);
        parser.searchParams.delete('grand');
        window.location = parser.href;
    } else if (endingGameResign) {
        endingGameResign = false;
        game.resign = true;
        displayMoveStatus();
        localStorage.setItem("cescacs-end", game.resultString);
    } else if (endingGameDraw) {
        endingGameDraw = false;
        game.draw = true;
        displayMoveStatus();
        localStorage.setItem("cescacs-end", game.resultString);
    }
}

function CancelAction() {
    document.getElementById("dialogConfirm").close();
    RestoreButtons();
    loadNewGame = false;
    endingGameResign = false;
    endingGameDraw = false;
}
function GrandCescacs() {
    document.getElementById("dialogConfirm").close();
    RestoreButtons();
    loadNewGame = false;
    localStorage.removeItem("cescacs");
    localStorage.removeItem("cescacs-mv");
    localStorage.removeItem("cescacs-end");
    localStorage.setItem("cescacs-grand", 'grand');
    const parser = new URL(window.location);
    parser.searchParams.set('grand', '');
    window.location = parser.href;
}

function ShowMoves() {
    const movesPanel = document.getElementById("movesPanel");
    if (movesPanel.style.display == "none") {
        const movesGrid = document.getElementById("movesGrid");
        clearClickHex();
        HideButtons();
        const n = movesGrid.childElementCount;
        for (const mv of game.moves(n)) {
            const newdiv = document.createElement('div');
            newdiv.textContent = cescacs.csmv.fullMoveNotation(mv);
            if (cescacs.csmv.undoStatusId(mv) != "") {
                newdiv.setAttribute("id", cescacs.csmv.undoStatusId(mv));
                newdiv.onclick = function () { showId(this, this.getAttribute("id")); }
            }
            movesGrid.appendChild(newdiv);
        }
        if (movesGrid.childElementCount > 0) {
            movesGrid.lastChild.classList.add("selected");
            document.getElementById("buttonUndo").disabled = false;
        } else {
            document.getElementById("buttonUndo").disabled = true;
        }
        const showMovesLeft = document.getElementById("showMovesLeft");
        const showMovesFooterLeft = document.getElementById("showMovesFooterLeft");
        const showMovesRight = document.getElementById("showMovesRight");
        const showMovesFooterRight = document.getElementById("showMovesFooterRight");
        const showMovesPanelVUp = document.getElementById("showMovesPanelVUp");
        const showMovesPanelRight = document.getElementById("showMovesPanelRight");
        movesPanel.style.display = "block";
        movesPanel.style.position = "fixed";
        movesPanel.style.bottom = "initial";
        movesPanel.style.left = "initial";
        movesPanel.style.top = "0px";
        movesPanel.style.right = "0px";
        showMovesRight.style.display = "none";
        showMovesFooterRight.style.display = "none";
        showMovesPanelVUp.checked = true;
        showMovesPanelRight.checked = true;
        if (window.innerWidth <= 1024) {
            showMovesLeft.style.display = "inline-block";
            showMovesFooterLeft.style.display = "inline-block";
        } else {
            showMovesLeft.style.display = "none"; 
            showMovesFooterLeft.style.display = "none"; 
        }
        movesGrid.scrollTop = 10000;
    } else {
        movesPanel.style.display = "none";
        for (const item of movesGrid.children) item.classList.remove("selected");
        game.moveTop();
        restoreBoard();
        RestoreButtons();
        displayMoveStatus();
    }
}


function showMovesPanelPositionChange(radio) {
    if (radio && window.innerWidth <= 1024) {
        const movesPanel = document.getElementById("movesPanel");
        const showMovesLeft = document.getElementById("showMovesLeft");
        const showMovesFooterLeft = document.getElementById("showMovesFooterLeft");
        const showMovesRight = document.getElementById("showMovesRight");
        const showMovesFooterRight = document.getElementById("showMovesFooterRight");
        if (radio.value == "left") {
            movesPanel.style.right = "initial";
            movesPanel.style.left = "0px";
            showMovesLeft.style.display = "none";
            showMovesFooterLeft.style.display = "none";
            showMovesRight.style.display = "inline-block";
            showMovesFooterRight.style.display = "inline-block";
        } else if (radio.value == "right") {
            movesPanel.style.left = "initial";
            movesPanel.style.right = "0px";
            showMovesLeft.style.display = "inline-block";
            showMovesFooterLeft.style.display = "inline-block";
            showMovesRight.style.display = "none";
            showMovesFooterRight.style.display = "none";
        }
    }
}

function showMovesPanelVPositionChange(radio) {
    if (radio && window.innerHeight <= 640) {
        const movesPanel = document.getElementById("movesPanel");
        if (radio.value == "top") {
            movesPanel.style.bottom = "initial";
            movesPanel.style.top = "0px";
        } else if (radio.value == "bottom") {
            movesPanel.style.top = "initial";
            movesPanel.style.bottom = "0px";
        }
    }
}

//SECTION Options inside Show Moves

function UndoMove() {
    const movesGrid = document.getElementById("movesGrid");
    movesGrid.lastElementChild.remove();
    game.popMove();
    if (movesGrid.childElementCount > 0 && movesGrid.lastElementChild.hasAttribute("id")) {
        movesGrid.lastElementChild.classList.add("selected");
    } else document.getElementById("buttonUndo").disabled = true;
    restoreBoard();
    displayMoveStatus();
    saveMoves();
}

function showId(element, id) {
    if (id != null) {
        game.moveBottom();
        while (game.topMoveId != id) {
            game.moveForward();
        }
        restoreBoard();
        for (const item of movesGrid.children) {
            item.classList.remove("selected");
        }
        element.classList.add("selected");
        buttonUndo.disabled = element.nextElementSibling != null;
        document.getElementById("gameStatus").textContent = game.strLastMove ?? '\xa0';
        document.getElementById("resultString").textContent = game.resultString ?? '\xa0';
    }
}

function showFirst() {
    const movesGrid = document.getElementById("movesGrid");
    const buttonUndo = document.getElementById("buttonUndo");
    try {
        game.moveBottom();
        restoreBoard();
        document.getElementById("gameStatus").textContent = game.strLastMove ?? '\xa0';
        document.getElementById("resultString").textContent = game.resultString ?? '\xa0';
        posGridMoves(movesGrid);
        movesGrid.scrollTop = 0;
    } catch (e) {
        console.log("showFirst: ", e);
        document.getElementById("gameStatus").textContent = (e instanceof Error ? e.message : "");
        document.getElementById("resultString").textContent = 'ERROR';
    }
}


function showPrevious() {
    const movesGrid = document.getElementById("movesGrid");
    const buttonUndo = document.getElementById("buttonUndo");
    try {
        game.moveBackward();
        restoreBoard();
        document.getElementById("gameStatus").textContent = game.strLastMove ?? '\xa0';
        document.getElementById("resultString").textContent = game.resultString ?? '\xa0';
        posGridMoves(movesGrid);
    } catch (e) {
        console.log("showFirst: ", e);
        document.getElementById("gameStatus").textContent = (e instanceof Error ? e.message : "");
        document.getElementById("resultString").textContent = 'ERROR';
    }
}

function showNext() {
    const movesGrid = document.getElementById("movesGrid");
    const buttonUndo = document.getElementById("buttonUndo");
    try {
        game.moveForward();
        restoreBoard();
        document.getElementById("gameStatus").textContent = game.strLastMove ?? '\xa0';
        document.getElementById("resultString").textContent = game.resultString ?? '\xa0';
        posGridMoves(movesGrid);
    } catch (e) {
        console.log("showFirst: ", e);
        document.getElementById("gameStatus").textContent = (e instanceof Error ? e.message : "");
        document.getElementById("resultString").textContent = 'ERROR';
    }
}

function showLast() {
    const movesGrid = document.getElementById("movesGrid");
    const buttonUndo = document.getElementById("buttonUndo");
    try {
        game.moveTop();
        restoreBoard();
        document.getElementById("gameStatus").textContent = game.strLastMove ?? '\xa0';
        document.getElementById("resultString").textContent = game.resultString ?? '\xa0';
        posGridMoves(movesGrid);
        movesGrid.scrollTop = 10000;
    } catch (e) {
        console.log("showFirst: ", e);
        document.getElementById("gameStatus").textContent = (e instanceof Error ? e.message : "");
        document.getElementById("resultString").textContent = 'ERROR';
    }
}

function posGridMoves(movesGrid) {
    const elementId = game.topMoveId;
    if (elementId != "") {
        const element = document.getElementById(elementId);
        for (const item of movesGrid.children) {
            item.classList.remove("selected");
        }
        element.classList.add("selected");
        buttonUndo.disabled = element.nextElementSibling != null;
    }
}

/**
 * Get the moves as a string
 *
 */
function GetMoves() {
    const buttonShowMoves = document.getElementById("buttonShowMoves");
    const buttonMoves = document.getElementById("buttonMoves");
    const buttonUndo = document.getElementById("buttonUndo");
    const movesPanelTgl1 = document.getElementById("movesPanelTgl1");
    const movesPanelTgl2 = document.getElementById("movesPanelTgl2");
    if (movesPanelTgl1.style.display == 'none') {
        buttonMoves.textContent = "Copy moves";
        buttonShowMoves.style.display = 'block';
        buttonUndo.style.display = 'block';
        movesPanelTgl1.style.display = 'block';
        movesPanelTgl2.style.display = 'none';
    } else {
        const movesArea = document.getElementById("movesArea");
        buttonMoves.textContent = "Got";
        buttonShowMoves.style.display = 'none';
        buttonUndo.style.display = 'none';
        movesPanelTgl1.style.display = 'none';
        movesPanelTgl2.style.display = 'block';
        movesArea.value = game.strMoves();
        movesArea.select();
        movesArea.setSelectionRange(0, 99999); /* For mobile devices */
        navigator.clipboard.writeText(movesArea.value);
    }
}

//!SECTION Options inside Show Moves

/**
 * Load a string with the next moves
 *
 */
function LoadMoves() {
    const buttonLoadMoves = document.getElementById("buttonLoadMoves");
    const loadMovesPanel = document.getElementById("loadMovesPanel");
    if (loadMovesPanel.style.display == "none") {
        const sepMoves = document.getElementById("sepMoves");
        clearClickHex();
        HideButtons();
        sepMoves.style.display = "block";
        buttonLoadMoves.classList.remove("halfbutton");
        buttonLoadMoves.classList.add("fullbutton");
        buttonLoadMoves.textContent = "Apply";
        buttonLoadMoves.style.display = "block";
        loadMovesPanel.style.display = "block";
    } else {
        const text = lMovesArea.value.trim();
        if (text.length == 0) {
            loadMovesPanel.style.display = "none";
            RestoreButtons();
            buttonLoadMoves.textContent = "Load mvs";
            buttonLoadMoves.classList.remove("fullbutton");
            buttonLoadMoves.classList.add("halfbutton");
        } else if (text.length >= 6) {
            try {
                game.applyMoveSq(text);
                loadMovesPanel.style.display = "none";
                RestoreButtons();
                buttonLoadMoves.textContent = "Load mvs";
                buttonLoadMoves.classList.remove("fullbutton");
                buttonLoadMoves.classList.add("halfbutton");
                restoreBoard();
                displayMoveStatus();
                saveMoves();
            } catch (e) {
                console.log("LoadMoves: ", e);
                lMovesArea.value = ("LoadMoves: " + e instanceof Error ? e.toString() : String(e)) + "\n\n" + text;
                document.getElementById("gameStatus").textContent = (e instanceof Error ? e.message : "");
                document.getElementById("resultString").textContent = 'ERROR';
            }
        }
    }
}

/**
 * Enter a move string (string input using prompt). There is the LoadMoves proc also.
 *
 */
function ManualMove() {
    let move = window.prompt("Next move?");
    if (move != null && move.length >= 2) {
        game.applyStringMove(move);
        // if (game.lastMove != null) {
        //     WMOVE(cescacs.cscnv.otherSide(game.turn), game.topHalfMove - 1, cescacs.csmv.fullMoveNotation(game.lastMove, false));
        // }
        restoreBoard();
        saveMoves();
    }
}

// //TODO: Stop Engine
// function StopEngine() {
//     const buttonStopEngine = document.getElementById("buttonStopEngine");
//     if (buttonStopEngine.classList.contains("w3-red")) {
//         WON();
//     } else {
//         WP();
//     }
// }

var showingThreatened = false;
var showingThreats = false;
function ShowThreatened() {
    if (ShowThreatened.svg === undefined) {
        ShowThreatened.svg = new Set();
    }
    const buttonShowThreatened = document.getElementById("buttonShowThreatened");
    if (showingThreatened) {
        for (const e of ShowThreatened.svg) {
            e.classList.remove('highlight');
        }
        RestoreButtons();
        buttonShowThreatened.classList.add('w3-black');
        buttonShowThreatened.classList.remove('w3-red');
        buttonShowThreatened.textContent = "Threatened";
        buttonShowThreatened.textContent = "Threatened"
        buttonShowThreatened.style.position = 'static';
        buttonShowThreatened.style.removeProperty("visibility");
        showingThreatened = false;
    } else {
        clearClickHex();
        let n = 0;
        for (const s of game.threatenedPieceStringPositions()) {
            const e = document.getElementById("HEX" + s);
            e.classList.add('highlight');
            ShowThreatened.svg.add(e);
            n++;
        }
        HideButtons();
        buttonShowThreatened.classList.add('w3-red');
        buttonShowThreatened.classList.remove('w3-black');
        buttonShowThreatened.style.setProperty("display", "block", "important");
        buttonShowThreatened.style.setProperty("position", "fixed", "important");
        buttonShowThreatened.style.setProperty("visibility","visible", "important");
        buttonShowThreatened.style.top = 0;
        buttonShowThreatened.style.right = 0;
        if (n==0) {
            buttonShowThreatened.style.fontSize = "";
            buttonShowThreatened.innerHTML = "<span style='font-size:x-small'>None's threatened</span>";
        }
        showingThreatened = true;
    }
}
function ShowThreats() {
    if (ShowThreats.svg === undefined) {
        ShowThreats.svg = new Set();
    }
    const buttonShowThreats = document.getElementById("buttonShowThreats");
    if (showingThreats) {
        for (const e of ShowThreats.svg) {
            e.classList.remove('highlight');
        }
        RestoreButtons();
        buttonShowThreats.classList.add('w3-black');
        buttonShowThreats.classList.remove('w3-red');
        buttonShowThreats.textContent = "Threats";
        buttonShowThreats.style.position = 'static';
        buttonShowThreats.style.removeProperty("visibility");
        showingThreats = false;
    } else {
        clearClickHex();
        let n = 0;
        for (const s of game.threatsPieceStringPositions()) {
            const e = document.getElementById("HEX" + s);
            e.classList.add('highlight');
            ShowThreats.svg.add(e);
            n++;
        }
        HideButtons();
        buttonShowThreats.classList.add('w3-red');
        buttonShowThreats.classList.remove('w3-black');
        buttonShowThreats.style.setProperty("display", "block", "important");
        buttonShowThreats.style.setProperty("position", "fixed", "important");
        buttonShowThreats.style.setProperty("visibility","visible", "important");
        buttonShowThreats.style.top = 0;
        buttonShowThreats.style.right = 0;
        if (n==0) buttonShowThreats.textContent = "No threats";
        showingThreats = true;
    }
}

function ShowHeuristic() {
    clearClickHex();
    const dialog = document.getElementById("dialogHeuristic");
    const title = document.getElementById("dialogHeuristicTurn");
    title.textContent = game.turn == 'w' ? 'White' : 'Black'
    const h = game.preMoveHeuristic;
    {
        const hPieces0 = document.getElementById("hPieces0");
        const hPieces1 = document.getElementById("hPieces1");
        const hSpace0 = document.getElementById("hSpace0");
        const hSpace1 = document.getElementById("hSpace1");
        const hPositioning = document.getElementById("hPositioning");
        const hMobility = document.getElementById("hMobility");
        const hKing = document.getElementById("hKing");
        hPieces0.textContent = cescacs.round2hundredths(h.pieces[0]);
        hPieces1.textContent = cescacs.round2hundredths(h.pieces[1]);
        hSpace0.textContent = cescacs.round2hundredths(h.space[0]);
        hSpace1.textContent = cescacs.round2hundredths(h.space[1]);
        hPositioning.textContent = cescacs.round2hundredths(h.positioning);
        hMobility.textContent = cescacs.round2hundredths(h.mobility);
        hKing.textContent = cescacs.round2hundredths(h.king);
    }
    dialog.showModal();
}

//FIXME - Removed code
/*
function SuggestMove() {
    const buttonSuggestMove = document.getElementById("buttonSuggestMove");
    const suggestContainer = document.getElementById("suggestMoveContainer");
    const suggestMoveWaiting = document.getElementById("suggestMoveWaiting");
    const suggestMoveResult = document.getElementById("suggestMoveResult");
    if (suggestMoveContainer.style.display == 'none') {
        clearClickHex();
        HideButtons();
        buttonSuggestMove.classList.add('w3-red');
        buttonSuggestMove.classList.add("fullbutton");
        buttonSuggestMove.classList.remove('w3-black');
        buttonSuggestMove.classList.remove("halfbutton");
        buttonSuggestMove.style.display = 'block';
        suggestMoveContainer.style.display = 'block';
        suggestMoveWaiting.style.display = "block";
        suggestMoveResult.style.display = "none";
        WRQ();
    } else {
        RestoreButtons();
        buttonSuggestMove.classList.add('halfbutton');
        buttonSuggestMove.classList.add('w3-black');
        buttonSuggestMove.classList.remove('fullbutton');
        buttonSuggestMove.classList.remove('w3-red');
        suggestMoveContainer.style.display = 'none';
        suggestMoveWaiting.style.display = "none";
        suggestMoveResult.style.display = "block";
    }
}
*/

function Castling() {
    if (!game.checked) {
        const currentColor = game.turn;
        const castlingContainer = document.getElementById("castlingContainer");
        if (castlingContainer.style.display == 'none') {
            const castlingContainerContent = document.getElementById("castlingContainerContent");
            const castlingStatusLbl = document.getElementById("castlingStatusLbl");
            clearClickHex();
            HideButtons();
            document.getElementById("confirmCastling").disabled = true;
            const playerCastlingStatus = game.playerCastlingStatus();
            castlingStatusLbl.textContent = playerCastlingStatus;
            if (playerCastlingStatus.length > 1) {
                for (const col of ['I', 'H', 'F', 'E', 'D']) {
                    const lbl = eval("castling" + col + "Lbl");
                    const btnContainer = eval("castling" + col + "Btns");
                    const [pos, status] = game.playerCastlingPositionStatus(col);
                    lbl.textContent = cescacs.PositionHelper.toString(pos) + ':';
                    if (status == '') {
                        const kmove = game.castlingKingPosition(col);
                        if (kmove != null) {
                            for (const m of game.castlingStrMoves(currentColor, kmove)) {
                                const btn = document.createElement("button");
                                btn.setAttribute("id", m);
                                btn.setAttribute("title", m);
                                btn.setAttribute("class", "w3-button w3-round w3-small");
                                btn.textContent = m;
                                btn.onclick = function () { previewCastling(this.id); };
                                btnContainer.appendChild(btn);
                            }
                        }
                    } else lbl.textContent += ' ' + status;
                }
                castlingContainerContent.style.display = "block";
            } else castlingContainerContent.style.display = "none";
            castlingContainer.style.display = "block";
            const castlingDown = document.getElementById("castlingDown");
            const castlingRight = document.getElementById("castlingRight");
            if (window.outerWidth > 1024) {
                castlingContainer.style.position = "static";
                castlingRight.style.display = "none";
                castlingDown.style.display = "none";
            } else {
                const castlingContainerPositionItems = document.querySelectorAll(`input[name="castlingContainerPosition"]`);
                if (currentColor == 'w') {
                    castlingContainer.style.position = "static";
                    castlingContainerPositionItems.forEach(element => {
                        if(element.value === "left") {
                            element.checked = true;
                        }
                    });
                    castlingRight.style.display = "none";
                    castlingDown.style.display = "inline-block";
                } else {
                    castlingContainer.style.position = "fixed";
                    castlingContainer.style.bottom = "0px";
                    castlingContainer.style.left = "0px";
                    castlingContainerPositionItems.forEach(element => {
                        if(element.value === "up") {
                            element.checked = true;
                        }
                    });
                    castlingRight.style.display = "inline-block";
                    castlingDown.style.display = "none";
                }
            }
        }
    }
}

function castlingContainerPositionChange(radio) {
    if(radio && window.outerWidth <= 1024) {
        const castlingDown = document.getElementById("castlingDown");
        const castlingRight = document.getElementById("castlingRight");
        if (radio.value == "left") {
            castlingContainer.style.position = "static";
            castlingRight.style.display = "none";
            castlingDown.style.display = "inline-block";
        } else if (radio.value == "up") {
            castlingContainer.style.position = "fixed";
            castlingContainer.style.bottom = "0px";
            castlingContainer.style.left = "0px";
            castlingRight.style.display = "inline-block";
            castlingDown.style.display = "none";
        }
    }
}

function cancelCastling() {
    const castlingStatusLbl = document.getElementById("castlingStatusLbl");
    const castlingContainer = document.getElementById("castlingContainer");
    if (castlingContainer.style.display != 'none') {
        previewCastling(); //clean when call without parameter
        castlingStatusLbl.textContent = "";
        castlingContainer.style.display = "none";
        for (const col of ['I', 'H', 'F', 'E', 'D']) {
            const lbl = eval("castling" + col + "Lbl");
            const btnContainer = eval("castling" + col + "Btns");
            lbl.textContent = "";
            btnContainer.textContent = "";
        }
        RestoreButtons();
    }
}

function previewCastling(value) {
    const currentColor = game.turn;
    const kingSymbol = currentColor == 'w' ? 'K' : 'k';
    const rookSymbol = currentColor == 'w' ? 'R' : 'r';
    const confirmCastlingButton = document.getElementById("confirmCastling");
    if (value === undefined) {
        previewCastling.move = undefined;
        confirmCastlingButton.disabled = true;
        if (previewCastling.k !== undefined) {
            removeSymbol(document.getElementById("HEX" + previewCastling.k));
            const kPos = cescacs.PositionHelper.toString(currentColor == "w" ?
                cescacs.PositionHelper.whiteKingInitPosition
                : cescacs.PositionHelper.blackKingInitPosition);
            placeSymbol(kPos, kingSymbol);
            previewCastling.k = undefined;
            if (previewCastling.rk !== undefined && previewCastling.rk !== null) {
                removeSymbol(document.getElementById("HEX" + previewCastling.rk));
                const pos = cescacs.PositionHelper.initialKingSideRookPosition(currentColor, game.isGrand);
                placeSymbol(cescacs.PositionHelper.toString(pos), rookSymbol);
                previewCastling.rk = undefined;
            }
            if (previewCastling.rq !== undefined && previewCastling.rq !== null) {
                removeSymbol(document.getElementById("HEX" + previewCastling.rq));
                const pos = cescacs.PositionHelper.initialQueenSideRookPosition(currentColor, game.isGrand);
                placeSymbol(cescacs.PositionHelper.toString(pos), rookSymbol);
                previewCastling.rq = undefined;
            }
        }
    } else {
        previewCastling.move = value;
        confirmCastlingButton.disabled = false;
        if (previewCastling.k === undefined) {
            previewCastling.k = cescacs.PositionHelper.toString(currentColor == "w" ?
                cescacs.PositionHelper.whiteKingInitPosition
                : cescacs.PositionHelper.blackKingInitPosition);
            const krpos = cescacs.PositionHelper.initialKingSideRookPosition(currentColor, game.isGrand);
            const qrpos = cescacs.PositionHelper.initialQueenSideRookPosition(currentColor, game.isGrand);
            const krook = game.getPiece(krpos);
            const qrook = game.getPiece(qrpos);
            if (krook != null && krook.color == currentColor && krook.symbol == 'R' && !krook.moved) {
                previewCastling.rk = cescacs.PositionHelper.toString(krpos);
            } else {
                previewCastling.rk = null;
            }
            if (qrook != null && qrook.color == currentColor && qrook.symbol == 'R' && !qrook.moved) {
                previewCastling.rq = cescacs.PositionHelper.toString(qrpos);
            } else {
                previewCastling.rq = null;
            }
        }
        const cmove = value.split("-");
        const side = cmove[0][2] == 'R' ? 'K' : cmove[0][2];
        const kCol = cmove[1][0];
        const rCol = cmove[1][1];
        const rCol2 = cmove[1].length == 3 && cmove[1][2] != 'O' ? cmove[1][2] : undefined;
        const singleStep = cmove[1].length > 3 ? false : cmove[1].length == 3 && cmove[1][2] == 'O' ? true : undefined;
        const kPos = cescacs.PositionHelper.toString(game.castlingKingPosition(kCol));
        const rPos = cescacs.PositionHelper.toString(game.castlingRookPosition(kCol, rCol, side, singleStep));
        const r2Pos = (rCol2 !== undefined) ?
            cescacs.PositionHelper.toString(game.castlingRookPosition(kCol, rCol2, 'D', singleStep)) : undefined;
        removeSymbol(document.getElementById("HEX" + previewCastling.k));
        previewCastling.k = kPos;
        if (side == 'K') {
            removeSymbol(document.getElementById("HEX" + previewCastling.rk));
            previewCastling.rk = rPos;
            if (r2Pos === undefined) {
                if (previewCastling.rq != null) {
                    const rqPos = cescacs.PositionHelper.toString(cescacs.PositionHelper.initialQueenSideRookPosition(currentColor, game.isGrand));
                    removeSymbol(document.getElementById("HEX" + previewCastling.rq));
                    previewCastling.rq = rqPos;
                    placeSymbol(rqPos, rookSymbol);
                }
            } else {
                removeSymbol(document.getElementById("HEX" + previewCastling.rq));
                previewCastling.rq = r2Pos;
                placeSymbol(r2Pos, rookSymbol);
            }
        } else {
            if (previewCastling.rk != null) {
                const rkPos = cescacs.PositionHelper.toString(cescacs.PositionHelper.initialKingSideRookPosition(currentColor, game.isGrand));
                removeSymbol(document.getElementById("HEX" + previewCastling.rk));
                previewCastling.rk = rkPos;
                placeSymbol(rkPos, rookSymbol);
            }
            removeSymbol(document.getElementById("HEX" + previewCastling.rq));
            previewCastling.rq = rPos;
        }
        placeSymbol(kPos, kingSymbol);
        placeSymbol(rPos, rookSymbol);
    }
}

function confirmCastling() {
    const buttonCastling = document.getElementById("buttonCastling");
    const castlingContainer = document.getElementById("castlingContainer");
    const castlingStatusLbl = document.getElementById("castlingStatusLbl");
    castlingStatusLbl.textContent = "";
    castlingContainer.style.display = "none";
    for (const col of ['I', 'H', 'F', 'E', 'D']) {
        const lbl = eval("castling" + col + "Lbl");
        const btnContainer = eval("castling" + col + "Btns");
        lbl.textContent = "";
        btnContainer.textContent = "";
    }
    game.doCastling(previewCastling.move);
    previewCastling.move = undefined;
    previewCastling.k = undefined;
    previewCastling.rk = undefined;
    previewCastling.rq = undefined;
    RestoreButtons();
    // if (game.lastMove != null) {
    //     WMOVE(cescacs.cscnv.otherSide(game.turn), game.topHalfMove - 1, cescacs.csmv.fullMoveNotation(game.lastMove, false));
    // }
    displayMoveStatus();
    saveMoves();
}

//!SECTION BUTTON ACTIONS

function HideButtons() {
    const buttonTLPD = document.getElementById("buttonTLPD");
    const buttonLoad = document.getElementById("buttonLoad");
    const buttonNew = document.getElementById("buttonNew");
    const buttonShowMoves = document.getElementById("buttonShowMoves");
    const buttonLoadMoves = document.getElementById("buttonLoadMoves");
    const buttonManualMove = document.getElementById("buttonManualMove");
    const buttonStopEngine = document.getElementById("buttonStopEngine");
    const buttonResign = document.getElementById("buttonResign");
    const buttonDraw = document.getElementById("buttonDraw");
    const buttonSuggestMove = document.getElementById("buttonSuggestMove");
    const buttonHeuristic = document.getElementById("buttonHeuristic");
    const buttonShowThreatened = document.getElementById("buttonShowThreatened");
    const buttonShowThreats = document.getElementById("buttonShowThreats");
    const buttonCastling = document.getElementById("buttonCastling");
    const sepGameStatus = document.getElementById("sepGameStatus");
    const sepMoves = document.getElementById("sepMoves");
    const sepInfo = document.getElementById("sepInfo");
    const sepCastling = document.getElementById("sepCastling");
    const messagesContainer = document.getElementById("messagesContainer");
    const heuristicContainer = document.getElementById("heuristicContainer");
    {
        const toggler = document.getElementById("toggler")
        toggler.classList.add("disabled");
        toggler.style.pointerEvents = "none";
    }
    document.querySelector("div.hamenu").classList.remove("hamburger");
    buttonTLPD.style.display = "none";
    buttonLoad.style.display = "none";
    buttonNew.style.display = "none";
    buttonShowMoves.style.display = "none";
    buttonLoadMoves.style.display = "none";
    buttonManualMove.style.display = "none";
    buttonStopEngine.style.display = "none";
    buttonResign.style.display = "none";
    buttonDraw.style.display = "none";
    buttonSuggestMove.style.display = "none";
    buttonHeuristic.style.display = "none";
    buttonShowThreatened.style.display = "none";
    buttonShowThreats.style.display = "none";
    buttonCastling.style.display = "none";
    sepGameStatus.style.display = "none";
    sepMoves.style.display = "none";
    sepInfo.style.display = "none";
    sepCastling.style.display = "none";
    messagesContainer.style.display = "none";
    heuristicContainer.style.display = "none";
}

function RestoreButtons() {
    const buttonTLPD = document.getElementById("buttonTLPD");
    const buttonLoad = document.getElementById("buttonLoad");
    const buttonNew = document.getElementById("buttonNew");
    const buttonShowMoves = document.getElementById("buttonShowMoves");
    const buttonLoadMoves = document.getElementById("buttonLoadMoves");
    const buttonManualMove = document.getElementById("buttonManualMove");
    const buttonStopEngine = document.getElementById("buttonStopEngine");
    const buttonResign = document.getElementById("buttonResign");
    const buttonDraw = document.getElementById("buttonDraw");
    const buttonSuggestMove = document.getElementById("buttonSuggestMove");
    const buttonHeuristic = document.getElementById("buttonHeuristic");
    const buttonShowThreatened = document.getElementById("buttonShowThreatened");
    const buttonShowThreats = document.getElementById("buttonShowThreats");
    const buttonCastling = document.getElementById("buttonCastling");
    const sepGameStatus = document.getElementById("sepGameStatus");
    const sepMoves = document.getElementById("sepMoves");
    const sepInfo = document.getElementById("sepInfo");
    const sepCastling = document.getElementById("sepCastling");
    const confirmLblPrevi = document.getElementById("confirmLblPrevi");
    const confirmLbl = document.getElementById("confirmationLabel");
    const grandCescacs = document.getElementById("grandCescacs");
    const messagesContainer = document.getElementById("messagesContainer");
    const heuristicContainer = document.getElementById("heuristicContainer");
    grandCescacs.style.display = "none";
    confirmLblPrevi.textContent = "";
    confirmLbl.textContent = "";
    buttonTLPD.style.display = "block";
    buttonLoad.style.display = "block";
    buttonNew.style.display = "block";
    buttonShowMoves.style.display = "block";
    buttonLoadMoves.style.display = "block";
    buttonManualMove.style.display = "block";
    buttonStopEngine.style.display = "block";
    buttonResign.style.display = "block";
    buttonDraw.style.display = "block";
    buttonSuggestMove.style.display = "block";
    buttonHeuristic.style.display = "block";
    buttonShowThreatened.style.display = "block";
    buttonShowThreats.style.display = "block";
    buttonCastling.style.display = "block";
    sepGameStatus.style.display = "block";
    sepMoves.style.display = "block";
    sepInfo.style.display = "block";
    sepCastling.style.display = "block";
    messagesContainer.style.display = "block";
    heuristicContainer.style.display = "block";
    document.querySelector("div.hamenu").classList.add("hamburger");
    {
        const toggler = document.getElementById("toggler");
        toggler.classList.remove("disabled");
        toggler.style.pointerEvents = "auto";
        if (toggler.checked) toggler.checked = false;
    }
}
