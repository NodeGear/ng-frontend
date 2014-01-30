#!/bin/bash

# $1 HOME
# $2 UID

mkdir -p ${1}${2}/logs
useradd -d ${1}${2} -m ${2}

chown -R ${2}:${2} ${1}${2}
chmod -R 770 ${1}${2}
