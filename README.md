# CONTENTS

## 1. cescacs.game.html is the web page to play the game. There you'd find
+ HTML structure
+ SVG board embedded within the HTML
+ SGV pieces (SVG symbol) embedded as symbols within the SVG
+ SVG embedded CSS
+ It has dependence from some external CSS files:
  * w3.css a small modern CSS framework with built-in responsivenes
    https://www.w3schools.com/w3css/4/w3.css
    also available at https://cescacs.github.io/w3.css
  * w3-colors-win8.css w3schools Windows8 color extension
    https://www.w3schools.com/lib/w3-colors-win8.css
    also available at https://cescacs.github.io/w3-colors-win8.css
  * cescacs.css is shared with the web site with the c'escacs rules
    https://cescacs.github.io/cescacs.css

## 2. its page specific javascript and css files
- cescacs.game.js
- cescacs.game.css

3. the typescript code is on ts/src folder
- cescacs.ts has the Board, Game classes
- cescacs.piece.ts has the code for different pieces
- cescacs.moves.ts has storable representation for game moves and related functions
- cescacs.types.ts has different specific types and conversions used
- cescacs.positionHelper.ts has some functions related with the type Position
- ts.general.ts are a few usable general Typescript functions

4. tsconfig.json is the typescript transpiler configuration

5. makeCescacs.sh is a shell script which transpiles the code
- The result of the tsc transpiler is the javascript on dist
- It needs to call browserify to make dist/src/cescacs.js javascript code callable from HTML
- The result is the file dist/bundle.js
- uglifyjs minimizes dist/bundle.js size in the final dist/bundle.min.js
- uglifyjs does nothing at all, but minimizing size, so, dist/bundle.js can be copied as dist/bundle.min.js
- dist/bundle.min.js and cescacs.js are the only js files needed to run cescacs.html

6. savedGames.txt are some game states I've used to debug incidences and specific cases.
- File is unusable; you must take inside content from it, but you'd not find there nothing interesting at all.
- Each game status is stored as a line in the text file.
