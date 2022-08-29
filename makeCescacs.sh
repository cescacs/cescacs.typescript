#!/bin/bash
tsc
browserify dist/src/cescacs.js --standalone cescacs -o dist/bundle.js
uglifyjs bundle.js -c -m -o bundle.min.js
