#!/bin/bash

cd $1

git status
git add --all
git status

git commit -m "Run at `date +%Y%m%d":"%H:%M`"

git push origin master