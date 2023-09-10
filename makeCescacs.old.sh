#!/bin/bash
tsc
if [ $? -eq 0 ] 
then 
	browserify dist/src/cescacs.js --standalone cescacs -o dist/bundle.js
	uglifyjs dist/bundle.js -c -m -o dist/bundle.min.js
	browserify dist/src/alpha-beta.js --standalone cescacs-worker -o dist/bundle-worker.js
	uglifyjs dist/bundle-worker.js -c -m -o dist/bundle-worker.min.js
	clear
	NOW=$(date +"%H:%M.%S")
	echo "Cescacs make $NOW"
fi
