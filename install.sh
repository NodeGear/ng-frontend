#!/bin/bash

set -o errexit
PATH=$PATH:./node_modules/.bin/

if [ ! -d "deps/ng-models" ]; then
	echo "You forgot to pull submodules. (deps/ng-models missing)"
	exit 1
fi

bower --allow-root install
grunt build

rm -rf node_modules/ng-models
ln -s ../deps/ng-models node_modules/ng-models

cd deps/ng-models
npm install
