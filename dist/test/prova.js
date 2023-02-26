import { Game } from "../src/cescacs";
const cescacs = new Game();
cescacs.loadTLPD("/28:v/27:dk/26:gjg/25:rnnr/24:pejep/23:ppeepp/22:2pjp2/7:3PP3/6:2PJP2/5:PPEEPP/4:PEJEP/3:RNNR/2:GJG/1:DK/0:V/ w RKRrkr - 0 1");
console.log(cescacs.valueTLPD);
