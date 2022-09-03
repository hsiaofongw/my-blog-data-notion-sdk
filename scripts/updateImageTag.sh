#!/bin/sh

packageName=$1
tagName=$2

kubectl \
  patch \
  deployment $packageName $tagName \
  -p ""
