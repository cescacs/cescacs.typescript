# CONTENTS

### 1. `cescacs.game.html` is the web page to play the game. There you'd find
+ HTML structure
+ SVG board embedded within the HTML
+ SGV pieces (SVG symbol) embedded as symbols within the SVG
+ SVG embedded CSS
+ It has dependence from some external CSS files:
  * `w3.css` a small modern CSS framework with built-in responsivenes
    https://www.w3schools.com/w3css/4/w3.css
    also available at https://cescacs.github.io/w3.css
  * `w3-colors-win8.css` w3schools Windows8 color extension
    https://www.w3schools.com/lib/w3-colors-win8.css
    also available at https://cescacs.github.io/w3-colors-win8.css
  * `cescacs.css` is shared with the web site with the c'escacs rules
    https://cescacs.github.io/cescacs.css

### 2. its page specific javascript and css files
* `cescacs.game.js`
* `cescacs.game.css`

### 3. The files needed to run
* The thre cescacs.game files (.html, .js and .css)
* The three referenced external css files, which must be downloaded, and are expected to be in the upper directory **`..`** This is because it is expected to belong to the *C'escacs* site.
* The files in the **`dist`** dirtectory: `cescacs.js`, `cescacs.moves.js`, `cescacs.positionHelper.js`, `cescacs.types.js` and `ts.general.js`.
* Those files are generated by the `ts` transpiler into the `dist/src` directory, and optimized or copied directly into the `dist` directory by the `makejs.sh` script, which previously calls the `ts` transpiler.

### 4. the typescript source code is on ts/src folder
* `cescacs.ts` has the Board, Game classes
* `cescacs.piece.ts` has the code for different pieces
* `cescacs.moves.ts` has storable representation for game moves and related functions
* `cescacs.types.ts` has different specific types and conversions used
* `cescacs.positionHelper.ts` has some functions related with the type Position
* `ts.general.ts` are a few usable general Typescript functions

### 5. `tsconfig.json` is the typescript transpiler configuration

### 6. `makejs.sh` is a shell script which transpiles the code
* The result of the tsc transpiler is the javascript on the `dist` directory
* It allows the -o (optimize) option, but then it needs ***uglify-js*** to be installed:
  `$ npm install -g uglify-js`
* uglifyjs minimizes the distribution javascript files.
* The shell script also calls `sed` to solve a problem on javascript module call names.
* The source and destination folders used by the script can be easely modified editing the script. It uses the base directory `/srv/http/cescacs/cescacs.typescript/` with the subdirectories `ts/src` containing the typescript code, and `dist/src` with the result of the transpiled javascript code. The final, possibly minimized, code will be placed directly at the `dist` directory.

### 7. Other files.
- `cescacs-pointy.svg` is not used
- `rotateTheDisplay.png` is a warning for movile unsupported display position. Running on a movile device has stil several problems.
- `savedGames.txt` has several unusable cases. I've used that file as a case backup to program some tests; there are several game status lines saved there, and also some game moves.

## [TODO](./TODO.md)
