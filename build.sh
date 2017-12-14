#!/bin/sh

echo 'target: node 8+ ...'
npx tsc -m commonjs --outDir lib/node8
