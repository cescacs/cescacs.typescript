#!/bin/bash
tsc
browserify dist/src/cescacs.js --standalone cescacs -o dist/bundle.js
uglifyjs dist/bundle.js -c -m -o dist/bundle.min.js
clear
NOW=$(date +"%H:%M.%S")
echo "Cescacs make $NOW"
