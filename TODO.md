## TODO list
### 1. The Check indication for *adjoining check* uses ^+ instead of +^
### 2. The Check indication for *check from afar* uses a single + instead of +∞
### 3. It names *SingleCheck* the *check from afar*; It'd be better *RemoteCheck*, or *CheckFromAfar*.
### 3. It names *KnightOrCloseCheck* the *adjoining check*; rename it as *AdjoiningCheck*.
### 4. Warn errors when entering moves: specific cases of Labels, Coments and Variations; display error in the text box is not a convenient way to do it (see TODO about applyStringMove).
### 5. Button access from movile device. Case of moves, specific Undo move.
### 6. Problem on orgfree.com; freewha image (problem with the 100% width div, the last div before body, may be use a javascript hack to remove the width)
  - last div: document.querySelector('body > div:last-of-type').css('width', '');
  - (done) Check result
### 7. Check applyStringMove and applyMoveSq with move valoration
### 8. Firebase !!! It would be interesting to call from orgfree.com, but it needs the freewha image problem solved.
### 9. Firebase planning. Fitxa d'usuari
### 10. See Firebase planning. Program a PDTL viewer
### 11. Firebase planning. Program a move viewer (from a PDTL position). Implement move valorations.

## Firebase planning
### 1. Button DB
  * Partida en format PGN (amb etiquetes)
  * Carregar PGN
  * Fitxa d'usuari
### 2. Visor PGN (projecte independent)
  * Program a PDTL viewer
  * Program a move viewer (from a PDTL position). Implement move valorations.
### 3. Partides
  * Desar
  * Recuperar

## Fitxa d'usuari
  * AnnotatorId (públic) - Same as playerId?
  * PlayerNA: no mostrar (privat)
  * Seleccionar dades públiques
  * Dates:
    * Última modificació fitxa
    * Última partida (from query?)
  * Puntuació de l'usuari
    * Les partides borrador tenen coeficient total 0.5.
    * Les partides d'un usuari no registrat tenen coeficient 0.5 per jugador, per tant, el mateix per a cada jugador que un borrador.
    * Les partides d'un jugador registrat coeficient 1.
    * Aquest coeficient es multiplica pel valor de la partida (inferior a 1)
    * Com a jugador (sempre públic): partides en que s'ha jugat
    * Com a annotator (opció públic / privat): partides que s'han registrat
      * Partides borrador
      * Partides d'altres jugadors no registrats
        * Compta doble partides entre dos jugadors no registrats
      * Partides d'altres jugadors registrats
        * Compta doble partides entre dos altres jugadors registrats
  * Nom
    * Públic/Privat
    * Públic només en fitxa (no en partides)
  * Alies (sempre públic)

### Fitxes jugadors no registrats
  * Per a jugadors *premium* (cal haver desat mínim de 4 borradors acabats; però es comptarà per punts)
  * Un jugador *premium* pot definir contrincants no registrats
  * Si un contrincant es dona d'alta l'annotator li pot trespassar les partides
  * Caldrà tenir un enllaç que obtindrà el contrincant i ha de fer servir l'annotator que li trespassa les partides.
  * En la fitxa només es definirà un nom (que es podrà canviar)
  * Inclourà un comptador de partides i una valoració (puntuació)
  * Clau `[@usuari]no-reg-usercode`

## Desar partida
### 1. Partida acabada
### 2. Borrador en curs
  * Modes:
    * Entre jugadors registrats (annotator)
    * Entre jugador i un jugador no registrat
      * Mode annotator
      * Mode partida
    * Entre jugadors no registats
    * Borrador pur (només juga usuari, amb blanques i negres)
  * Clau: ***`usuari:+:usuari`***
  * El mode partida només permet a l'usuari que té el turn registrar un moviment; l'altre té permís de lectura.
    * Cal establir el protocol per a iniciar la partida (enllaç enviat des de l'annotator)
  * No permet repetició de la clau, ni fent la inversa
    * L'ordre dels usuaris en la clau és sempre el mateix: S'haurà d'indicar usuari blanques i usuari negres.
  * Dades:
    * Usuari blanques / Usuari negres
    * Turn
    * Data inici
    * Data últim moviment
    * Posició actual
    * Número moviments
    * Moviments de la partida

## Recuperació de partides
