'use strict';
const urlParams = new URLSearchParams(window.location.search);
const grandParam = urlParams.get('grand') != null ||
    typeof (Storage) !== "undefined" && localStorage.getItem("cescacs-grand") == 'grand';
const game = new cescacs.Game(grandParam);

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
    //add close function to dialogs
    for (const span of document.getElementsByClassName("close")) {
        span.onclick = function () { span.parentElement.close(); }
    }
    document.querySelector("#dialogPromotion>span.close").addEventListener("click", () => {
        clearClickHex();
    });
    //restore existing game from storage
    if (typeof (Storage) !== "undefined" && localStorage.getItem("cescacs") != null) {
        restoreGame();
    } else {
        restoreBoard();
        displayMoveStatus();
    }
    //title
    const gameTitle = document.getElementById("gameTitle");
    if (grandParam) {
        gameTitle.innerHTML = "Grand C'escacs";
        dialogGrandCescacs.showModal();
    } else gameTitle.innerHTML = "C'escacs";
    RestoreButtons();
};

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
                            displayMoveStatus();
                            //TODO: SaveGame()
                        } catch (e) {
                            console.log("doMove: ", e);
                            document.getElementById("gameStatus").innerHTML = (e instanceof Error ? e.message : "");
                            document.getElementById("resultString").innerHTML = 'ERROR';
                        }
                    }
                } else gameStatus.innerHTML = dest + ' ERROR!';
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
                        gameStatus.innerHTML = "Promotion rq";
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
                        gameStatus.innerHTML = symbol + src;
                        selecting = true;
                    }
                }
                else return;
            }
        }
    }
}
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
function isExecutingAction() {
    if (boardTLPDStatus || loadNewGame || endingGameResign || endingGameDraw || showingThreatened || showingThreats) return true;
    else return document.getElementById("TLPD").style.display != 'none'
        || document.getElementById("castlingContainer").style.display != 'none'
        || document.getElementById("movesPanel").style.display != 'none'
        || document.getElementById("loadMovesPanel").style.display != 'none';
}
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
            displayMoveStatus();
            //TODO: SaveGame()
        } catch (e) {
            console.log("doPromotePawn: ", e);
            document.getElementById("gameStatus").innerHTML = (e instanceof Error ? e.message : "");
            document.getElementById("resultString").innerHTML = 'ERROR';
        }
        dialog.close();
    }
}
function confirmCastling() {
    const buttonCastling = document.getElementById("buttonCastling");
    const castlingContainer = document.getElementById("castlingContainer");
    const castlingStatusLbl = document.getElementById("castlingStatusLbl");
    castlingStatusLbl.innerHTML = "";
    castlingContainer.style.display = "none";
    for (const col of ['I', 'H', 'F', 'E', 'D']) {
        const lbl = eval("castling" + col + "Lbl");
        const btnContainer = eval("castling" + col + "Btns");
        lbl.innerHTML = "";
        btnContainer.innerHTML = "";
    }
    buttonCastling.innerHTML = "Castling";
    game.doCastling(previewCastling.move);
    previewCastling.move = undefined;
    previewCastling.k = undefined;
    previewCastling.rk = undefined;
    previewCastling.rq = undefined;
    RestoreButtons();
    displayMoveStatus();
    //TODO: SaveGame()
}

function displayMoveStatus() {
    let moveText = game.lastMove;
    if (game.gameEnd) {
        const buttonResign = document.getElementById("buttonResign");
        const buttonDraw = document.getElementById("buttonDraw");
        const buttonCastling = document.getElementById("buttonCastling");
        const buttonSugestMove = document.getElementById("buttonSugestMove");
        buttonResign.disabled = true;
        buttonDraw.disabled = true;
        buttonCastling.disabled = true;
        buttonSugestMove.disabled = true;
        if (moveText == null) moveText = '\xa0';
    } else {
        if (moveText == null) moveText = "Ready " + (game.turn == "w" ? "whites" : "blacks");
        buttonCastling.disabled = game.checked;
    }
    document.getElementById("gameStatus").innerHTML = moveText;
    document.getElementById("resultString").innerHTML = game.resultString ?? '\xa0';
    displayHeuristic();
    //TODO: Remove SaveGame
    saveGame(); //ensure to preserve status
}
function displayHeuristic() {
    const turn = game.turn;
    const lblHeuristic = document.getElementById(turn == 'w' ? "HeuristicLabel1" : "HeuristicLabel2");
    const lblTurn = document.getElementById(turn == 'w' ? "whiteTurn" : "blackTurn");
    let heuristic = game.getHeuristicValue(game.currentHeuristic);
    let previousHeuristic = Number.parseFloat(lblHeuristic.innerHTML);
    lblHeuristic.innerHTML = heuristic.toString();
    lblTurn.innerHTML = isNaN(previousHeuristic) ? "" : " Δ: " + cescacs.round2hundredths(heuristic - previousHeuristic).toString();
}

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
        localStorage.setItem("cescacs", game.valueTLPD);
        localStorage.setItem("cescacs-mv", game.movesJSON);
        if (game.gameEnd) localStorage.setItem("cescacs-end", game.resultString);
        else localStorage.removeItem("cescacs-end");
        localStorage.setItem("cescacs-grand", game.isGrand ? 'grand' : "");
    } catch (e) {
        console.log("saveGame: ", e);
        document.getElementById("gameStatus").innerHTML = (e instanceof Error ? e.message : "");
        document.getElementById("resultString").innerHTML = 'ERROR';
    }
}

function restoreGame() {
    const isGrandStored = localStorage.getItem("cescacs-grand") == 'grand';
    if (game.isGrand == isGrandStored) {
        const movesGrid = document.getElementById("movesGrid");
        movesGrid.innerHTML = "";
        try {
            game.loadTLPD(localStorage.getItem("cescacs"));
            game.restoreMovesJSON(localStorage.getItem("cescacs-mv"))
            restoreBoard();
            const gend = localStorage.getItem("cescacs-end");
            game.resultString = gend;
            displayMoveStatus();
        } catch (e) {
            console.log("restoreGame: ", e);
            document.getElementById("gameStatus").innerHTML = (e instanceof Error ? e.message : "");
            document.getElementById("resultString").innerHTML = 'ERROR';
        }
    } else { //Never happens                
        const parser = new URL(window.location);
        if (isGrandStored) parser.searchParams.append('grand', "");
        else parser.searchParams.delete('grand');
        window.location = parser.href;
    }
}

////////////////// BUTTON ACTIONS IN UPPERCASE /////////////

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
        buttonTLPD.innerHTML = "Got";
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
        buttonTLPD.innerHTML = "Get";
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
                    localStorage.removeItem("cescacs");
                    localStorage.removeItem("cescacs-mv");
                    localStorage.removeItem("cescacs-end");
                    //cescacs-grand is preserved
                    displayMoveStatus();
                } catch (e) {
                    console.log("LoadTLPD: ", x.value, e);
                    x.value = ("LoadTLPD: " + e instanceof Error ? e.toString() : String(e)) + "\n\n" + x.value;
                    document.getElementById("gameStatus").innerHTML = (e instanceof Error ? e.message : "");
                    document.getElementById("resultString").innerHTML = 'ERROR';
                }
            }
        }
    }
}

var loadNewGame = false;
var endingGameResign = false;
var endingGameDraw = false;
function LoadNewGame() {
    const confirmLbl = document.getElementById("confirmationLabel");
    const confirm = document.getElementById("confirmationArea");
    const grandCescacs = document.getElementById("grandCescacs");
    clearClickHex();
    HideButtons();
    confirmLbl.innerHTML = "\u00A0Start a new game?";
    confirm.style.display = "block";
    grandCescacs.style.display = "block";
    loadNewGame = true;
}
function Resign() {
    const confirmLbl = document.getElementById("confirmationLabel");
    const confirm = document.getElementById("confirmationArea");
    clearClickHex();
    HideButtons();
    confirmLbl.innerHTML = "\u00A0Do you give up?";
    confirm.style.display = "block";
    endingGameResign = true;
}
function Draw() {
    const confirmLblPrevi = document.getElementById("confirmLblPrevi");
    const confirmLbl = document.getElementById("confirmationLabel");
    const confirm = document.getElementById("confirmationArea");
    clearClickHex();
    HideButtons();
    confirmLblPrevi.innerHTML = `\u00A0Has ${game.turn == 'w' ? 'Black' : 'White'} asked for a draw,`;
    confirmLbl.innerHTML = "\u00A0and you accept?";
    confirm.style.display = "block";
    endingGameDraw = true;
}
function ConfirmAction() {
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
        //TODO: SaveGame()
    } else if (endingGameDraw) {
        endingGameDraw = false;
        game.draw = true;
        displayMoveStatus();
        //TODO: SaveGame()
    }
}
function CancelAction() {
    RestoreButtons();
    loadNewGame = false;
    endingGameResign = false;
    endingGameDraw = false;
}
function GrandCescacs() {
    loadNewGame = false;
    localStorage.removeItem("cescacs");
    localStorage.removeItem("cescacs-mv");
    localStorage.removeItem("cescacs-end");
    localStorage.setItem("cescacs-grand", 'grand');
    const parser = new URL(window.location);
    parser.searchParams.set('grand', '');
    window.location = parser.href;
}

function ShowHeuristic() {
    clearClickHex();
    const dialog = document.getElementById("dialogHeuristic");
    const title = document.getElementById("dialogHeuristicTurn");
    title.innerHTML = game.turn == 'w' ? 'White' : 'Black'
    const h = game.preMoveHeuristic;
    {
        const hPieces0 = document.getElementById("hPieces0");
        const hPieces1 = document.getElementById("hPieces1");
        const hSpace0 = document.getElementById("hSpace0");
        const hSpace1 = document.getElementById("hSpace1");
        const hPositioning = document.getElementById("hPositioning");
        const hMobility = document.getElementById("hMobility");
        const hKing = document.getElementById("hKing");
        hPieces0.innerHTML = cescacs.round2hundredths(h.pieces[0]);
        hPieces1.innerHTML = cescacs.round2hundredths(h.pieces[1]);
        hSpace0.innerHTML = cescacs.round2hundredths(h.space[0]);
        hSpace1.innerHTML = cescacs.round2hundredths(h.space[1]);
        hPositioning.innerHTML = cescacs.round2hundredths(h.positioning);
        hMobility.innerHTML = cescacs.round2hundredths(h.mobility);
        hKing.innerHTML = cescacs.round2hundredths(h.king);
    }
    dialog.showModal();
}

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
        buttonShowThreatened.classList.add('halfbutton');
        buttonShowThreatened.classList.add('w3-black');
        buttonShowThreatened.classList.remove('fullbutton');
        buttonShowThreatened.classList.remove('w3-red');
        displayMoveStatus();
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
        const sepInfo = document.getElementById("sepInfo");
        sepInfo.style.display = 'block';
        buttonShowThreatened.classList.add('w3-red');
        buttonShowThreatened.classList.add("fullbutton");
        buttonShowThreatened.classList.remove('w3-black');
        buttonShowThreatened.classList.remove("halfbutton");
        buttonShowThreatened.style.display = 'block';
        if (n == 0 && !game.gameEnd) document.getElementById("gameStatus").innerHTML = "None's threatened";
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
        buttonShowThreats.classList.add('halfbutton');
        buttonShowThreats.classList.add('w3-black');
        buttonShowThreats.classList.remove('fullbutton');
        buttonShowThreats.classList.remove('w3-red');
        displayMoveStatus();
        showingThreats = false;
    } else {
        clearClickHex();
        let n = 0;
        for (const s of game.ownThreatsPieceStringPositions()) {
            const e = document.getElementById("HEX" + s);
            e.classList.add('highlight');
            ShowThreats.svg.add(e);
            n++;
        }
        HideButtons();
        const sepInfo = document.getElementById("sepInfo");
        sepInfo.style.display = 'block';
        buttonShowThreats.classList.add('w3-red');
        buttonShowThreats.classList.add("fullbutton");
        buttonShowThreats.classList.remove('w3-black');
        buttonShowThreats.classList.remove("halfbutton");
        buttonShowThreats.style.display = 'block';
        if (n == 0 && !game.gameEnd) document.getElementById("gameStatus").innerHTML = "No threats";
        showingThreats = true;
    }
}

function Castling() {
    if (!game.checked) {
        const currentColor = game.turn;
        const buttonCastling = document.getElementById("buttonCastling");
        const castlingContainer = document.getElementById("castlingContainer");
        const castlingStatusLbl = document.getElementById("castlingStatusLbl");
        if (castlingContainer.style.display == 'none') {
            clearClickHex();
            HideButtons();
            buttonCastling.innerHTML = "Cancel";
            buttonCastling.style.display = "block";
            const playerCastlingStatus = game.playerCastlingStatus();
            castlingStatusLbl.innerHTML = playerCastlingStatus;
            if (playerCastlingStatus.length > 1) {
                for (const col of ['I', 'H', 'F', 'E', 'D']) {
                    const lbl = eval("castling" + col + "Lbl");
                    const btnContainer = eval("castling" + col + "Btns");
                    const [pos, status] = game.playerCastlingPositionStatus(col);
                    lbl.innerHTML = cescacs.PositionHelper.toString(pos) + ':';
                    if (status == '') {
                        const kmove = game.castlingKingPosition(col);
                        if (kmove != null) {
                            for (const m of game.castlingStrMoves(currentColor, kmove)) {
                                const btn = document.createElement("button");
                                btn.setAttribute("id", m);
                                btn.setAttribute("title", m);
                                btn.setAttribute("class", "w3-button w3-round w3-small")
                                btn.innerHTML = m;
                                btn.onclick = function () { previewCastling(this.id); };
                                btnContainer.appendChild(btn);
                            }
                        }
                    } else lbl.innerHTML += ' ' + status;
                }
                castlingContainerContent.style.display = "block";
            } else castlingContainerContent.style.display = "none";
            castlingContainer.style.display = "block";
        } else {
            previewCastling(); //clean when call without parameter
            castlingStatusLbl.innerHTML = "";
            castlingContainer.style.display = "none";
            for (const col of ['I', 'H', 'F', 'E', 'D']) {
                const lbl = eval("castling" + col + "Lbl");
                const btnContainer = eval("castling" + col + "Btns");
                lbl.innerHTML = "";
                btnContainer.innerHTML = "";
            }
            buttonCastling.innerHTML = "Castling";
            RestoreButtons();
        }
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

function ShowMoves() {
    const buttonShowMoves = document.getElementById("buttonShowMoves");
    const movesPanel = document.getElementById("movesPanel");
    if (movesPanel.style.display == "none") {
        const sepMoves = document.getElementById("sepMoves");
        const movesGrid = document.getElementById("movesGrid");
        clearClickHex();
        HideButtons();
        sepMoves.style.display = "block";
        buttonShowMoves.classList.remove("halfbutton");
        buttonShowMoves.classList.add("fullbutton");
        buttonShowMoves.innerHTML = "Go on"
        buttonShowMoves.style.display = "block";
        const n = movesGrid.childElementCount;
        for (const mv of game.moves(n)) {
            const newdiv = document.createElement('div');
            newdiv.innerHTML = cescacs.csmv.fullMoveNotation(mv);
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
        movesPanel.style.display = "block";
        movesGrid.scrollTop = 10000;
    } else {
        movesPanel.style.display = "none";
        for (const item of movesGrid.children) item.classList.remove("selected");
        game.moveTop();
        restoreBoard();
        RestoreButtons();
        buttonShowMoves.innerHTML = "Show mvs"
        buttonShowMoves.classList.remove("fullbutton");
        buttonShowMoves.classList.add("halfbutton");
        displayMoveStatus();
    }
}

function UndoMove() {
    const movesGrid = document.getElementById("movesGrid");
    movesGrid.lastElementChild.remove();
    game.popMove();
    if (movesGrid.childElementCount > 0 && movesGrid.lastElementChild.hasAttribute("id")) {
        movesGrid.lastElementChild.classList.add("selected");
    } else document.getElementById("buttonUndo").disabled = true;
    restoreBoard();
    displayMoveStatus();
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
        document.getElementById("gameStatus").innerHTML = game.lastMove ?? '\xa0';
        document.getElementById("resultString").innerHTML = game.resultString ?? '\xa0';
    }
}

function showFirst() {
    const movesGrid = document.getElementById("movesGrid");
    const buttonUndo = document.getElementById("buttonUndo");
    try {
        game.moveBottom();
        restoreBoard();
        document.getElementById("gameStatus").innerHTML = game.lastMove ?? '\xa0';
        document.getElementById("resultString").innerHTML = game.resultString ?? '\xa0';
        posGridMoves(movesGrid);
        movesGrid.scrollTop = 0;
    } catch (e) {
        console.log("showFirst: ", e);
        document.getElementById("gameStatus").innerHTML = (e instanceof Error ? e.message : "");
        document.getElementById("resultString").innerHTML = 'ERROR';
    }
}


function showPrevious() {
    const movesGrid = document.getElementById("movesGrid");
    const buttonUndo = document.getElementById("buttonUndo");
    try {
        game.moveBackward();
        restoreBoard();
        document.getElementById("gameStatus").innerHTML = game.lastMove ?? '\xa0';
        document.getElementById("resultString").innerHTML = game.resultString ?? '\xa0';
        posGridMoves(movesGrid);
    } catch (e) {
        console.log("showFirst: ", e);
        document.getElementById("gameStatus").innerHTML = (e instanceof Error ? e.message : "");
        document.getElementById("resultString").innerHTML = 'ERROR';
    }
}

function showNext() {
    const movesGrid = document.getElementById("movesGrid");
    const buttonUndo = document.getElementById("buttonUndo");
    try {
        game.moveForward();
        restoreBoard();
        document.getElementById("gameStatus").innerHTML = game.lastMove ?? '\xa0';
        document.getElementById("resultString").innerHTML = game.resultString ?? '\xa0';
        posGridMoves(movesGrid);
    } catch (e) {
        console.log("showFirst: ", e);
        document.getElementById("gameStatus").innerHTML = (e instanceof Error ? e.message : "");
        document.getElementById("resultString").innerHTML = 'ERROR';
    }
}

function showLast() {
    const movesGrid = document.getElementById("movesGrid");
    const buttonUndo = document.getElementById("buttonUndo");
    try {
        game.moveTop();
        restoreBoard();
        document.getElementById("gameStatus").innerHTML = game.lastMove ?? '\xa0';
        document.getElementById("resultString").innerHTML = game.resultString ?? '\xa0';
        posGridMoves(movesGrid);
        movesGrid.scrollTop = 10000;
    } catch (e) {
        console.log("showFirst: ", e);
        document.getElementById("gameStatus").innerHTML = (e instanceof Error ? e.message : "");
        document.getElementById("resultString").innerHTML = 'ERROR';
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

function GetMoves() {
    const buttonShowMoves = document.getElementById("buttonShowMoves");
    const buttonMoves = document.getElementById("buttonMoves");
    const buttonUndo = document.getElementById("buttonUndo");
    const movesPanelTgl1 = document.getElementById("movesPanelTgl1");
    const movesPanelTgl2 = document.getElementById("movesPanelTgl2");
    if (movesPanelTgl1.style.display == 'none') {
        buttonMoves.innerHTML = "Copy moves";
        buttonShowMoves.style.display = 'block';
        buttonUndo.style.display = 'block';
        movesPanelTgl1.style.display = 'block';
        movesPanelTgl2.style.display = 'none';
    } else {
        const movesArea = document.getElementById("movesArea");
        buttonMoves.innerHTML = "Got";
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
        buttonLoadMoves.innerHTML = "Apply";
        buttonLoadMoves.style.display = "block";
        loadMovesPanel.style.display = "block";
    } else {
        const text = lMovesArea.value.trim();
        if (text.length == 0) {
            loadMovesPanel.style.display = "none";
            RestoreButtons();
            buttonLoadMoves.innerHTML = "Load mvs";
            buttonLoadMoves.classList.remove("fullbutton");
            buttonLoadMoves.classList.add("halfbutton");
        } else if (text.length >= 6) {
            try {
                game.applyMoveSq(text);
                loadMovesPanel.style.display = "none";
                RestoreButtons();
                buttonLoadMoves.innerHTML = "Load mvs";
                buttonLoadMoves.classList.remove("fullbutton");
                buttonLoadMoves.classList.add("halfbutton");
                restoreBoard();
                displayHeuristic();
                saveGame(); //ensure to preserve status
            } catch (e) {
                console.log("LoadMoves: ", e);
                lMovesArea.value = ("LoadMoves: " + e instanceof Error ? e.toString() : String(e)) + "\n\n" + text;
                document.getElementById("gameStatus").innerHTML = (e instanceof Error ? e.message : "");
                document.getElementById("resultString").innerHTML = 'ERROR';
            }
        }
    }
}

function ManualMove() {
    let move = window.prompt("Next move?");
    if (move != null && move.length >= 2) {
        game.applyStringMove(move);
        restoreBoard();
    }
}

function HideButtons() {
    const buttonTLPD = document.getElementById("buttonTLPD");
    const buttonLoad = document.getElementById("buttonLoad");
    const buttonNew = document.getElementById("buttonNew");
    const buttonShowMoves = document.getElementById("buttonShowMoves");
    const buttonLoadMoves = document.getElementById("buttonLoadMoves");
    const buttonManualMove = document.getElementById("buttonManualMove");
    const buttonResign = document.getElementById("buttonResign");
    const buttonDraw = document.getElementById("buttonDraw");
    const buttonSugestMove = document.getElementById("buttonSugestMove");
    const buttonHeuristic = document.getElementById("buttonHeuristic");
    const buttonShowThreatened = document.getElementById("buttonShowThreatened");
    const buttonShowThreats = document.getElementById("buttonShowThreats");
    const buttonCastling = document.getElementById("buttonCastling");
    const sepGameStatus = document.getElementById("sepGameStatus");
    const sepMoves = document.getElementById("sepMoves");
    const sepInfo = document.getElementById("sepInfo");
    const sepCastling = document.getElementById("sepCastling");
    const heuristicContainer = document.getElementById("heuristicContainer");
    buttonTLPD.style.display = "none";
    buttonLoad.style.display = "none";
    buttonNew.style.display = "none";
    buttonShowMoves.style.display = "none";
    buttonLoadMoves.style.display = "none";
    buttonManualMove.style.display = "none";
    buttonResign.style.display = "none";
    buttonDraw.style.display = "none";
    buttonSugestMove.style.display = "none";
    buttonHeuristic.style.display = "none";
    buttonShowThreatened.style.display = "none";
    buttonShowThreats.style.display = "none";
    buttonCastling.style.display = "none";
    sepGameStatus.style.display = "none";
    sepMoves.style.display = "none";
    sepInfo.style.display = "none";
    sepCastling.style.display = "none";
    heuristicContainer.style.display = "none";
}

function RestoreButtons() {
    const buttonTLPD = document.getElementById("buttonTLPD");
    const buttonLoad = document.getElementById("buttonLoad");
    const buttonNew = document.getElementById("buttonNew");
    const buttonShowMoves = document.getElementById("buttonShowMoves");
    const buttonLoadMoves = document.getElementById("buttonLoadMoves");
    const buttonManualMove = document.getElementById("buttonManualMove");
    const buttonResign = document.getElementById("buttonResign");
    const buttonDraw = document.getElementById("buttonDraw");
    const buttonSugestMove = document.getElementById("buttonSugestMove");
    const buttonHeuristic = document.getElementById("buttonHeuristic");
    const buttonShowThreatened = document.getElementById("buttonShowThreatened");
    const buttonShowThreats = document.getElementById("buttonShowThreats");
    const buttonCastling = document.getElementById("buttonCastling");
    const sepGameStatus = document.getElementById("sepGameStatus");
    const sepMoves = document.getElementById("sepMoves");
    const sepInfo = document.getElementById("sepInfo");
    const sepCastling = document.getElementById("sepCastling");
    const confirm = document.getElementById("confirmationArea");
    const confirmLblPrevi = document.getElementById("confirmLblPrevi");
    const confirmLbl = document.getElementById("confirmationLabel");
    const grandCescacs = document.getElementById("grandCescacs");
    const heuristicContainer = document.getElementById("heuristicContainer");
    grandCescacs.style.display = "none";
    confirm.style.display = "none";
    confirmLblPrevi.innerHTML = "";
    confirmLbl.innerHTML = "";
    buttonTLPD.style.display = "block";
    buttonLoad.style.display = "block";
    buttonNew.style.display = "block";
    buttonShowMoves.style.display = "block";
    buttonLoadMoves.style.display = "block";
    buttonManualMove.style.display = "block";
    buttonResign.style.display = "block";
    buttonDraw.style.display = "block";
    buttonSugestMove.style.display = "block";
    buttonHeuristic.style.display = "block";
    buttonShowThreatened.style.display = "block";
    buttonShowThreats.style.display = "block";
    buttonCastling.style.display = "block";
    sepGameStatus.style.display = "block";
    sepMoves.style.display = "block";
    sepInfo.style.display = "block";
    sepCastling.style.display = "block";
    heuristicContainer.style.display = "block";
}
