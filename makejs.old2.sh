#!/bin/bash

# needs:
# sudo npm install -g uglify-js

tsc
if [ $? -eq 0 ] 
then 
#	uglifyjs dist/src/cescacs.js -c -m -o dist/cescacs.js
#	uglifyjs dist/src/cescacs.types.js -c -m -o dist/cescacs.types.js
#	uglifyjs dist/src/cescacs.positionHelper.js -c -m -o dist/cescacs.positionHelper.js
#	uglifyjs dist/src/cescacs.piece.js -c -m -o dist/cescacs.piece.js
#	uglifyjs dist/src/cescacs.moves.js -c -m -o dist/cescacs.moves.js
#	uglifyjs dist/src/ts.general.js -c -m -o dist/ts.general.js

	cp dist/src/cescacs.js dist/cescacs.js
	cp dist/src/cescacs.types.js dist/cescacs.types.js
	cp dist/src/cescacs.positionHelper.js dist/cescacs.positionHelper.js
	cp dist/src/cescacs.piece.js dist/cescacs.piece.js
	cp dist/src/cescacs.moves.js dist/cescacs.moves.js
	cp dist/src/ts.general.js dist/ts.general.js

	sed -i 's/\(from[ ]*"[^"]*\)";/\1.js";/g' dist/cescacs.js
	sed -i 's/\(from[ ]*"[^"]*\)";/\1.js";/g' dist/cescacs.types.js
	sed -i 's/\(from[ ]*"[^"]*\)";/\1.js";/g' dist/cescacs.positionHelper.js
	sed -i 's/\(from[ ]*"[^"]*\)";/\1.js";/g' dist/cescacs.piece.js
	sed -i 's/\(from[ ]*"[^"]*\)";/\1.js";/g' dist/cescacs.moves.js
	sed -i 's/\(from[ ]*"[^"]*\)";/\1.js";/g' dist/ts.general.js

fi

