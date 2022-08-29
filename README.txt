CONTENTS:

1) cescacs.html is the web page to play the game. There you'd find
- HTML structure
- SVG board
- SGV pieces (SVG symbol)
- SVG embedded CSS
- javascript page code

2) the typescript code is on ts/src folder
- cescacs.ts has the Board, Game classes
- cescacs.piece.ts has the code for different pieces
- cescacs.types.ts has different types used
- cescacs.positionHelper.ts has some functions related with the type Position
- ts.general.ts are a few usable general Typescript functions

3) tsconfig.json is the typescript transpiler configuration

4) makeCescacs.sh is a shell script which transpiles the code
- The result of the tsc transpiler is the javascript on dist
- It needs to call browserify to make dist/src/cescacs.js javascript code callable from HTML
- The result is the file dist/bundle.js
- uglifyjs minimizes dist/bundle.js size in the final dist/bundle.min.js
- uglifyjs does nothing at all, but minimizing size, so, dist/bundle.js can be copied as dist/bundle.min.js
- dist/bundle.min.js is the only file needed to run cescacs.html

5) savedGames.txt are some game states I've used to debug incidences and specific cases.
- File is unusable; you must take inside content from it.
- Each game status is stored as a line in the text file.