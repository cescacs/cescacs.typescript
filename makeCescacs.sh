#!/bin/bash
tsc
browserify dist/src/cescacs.js --standalone cescacs -o dist/bundle.js
