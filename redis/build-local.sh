#!/bin/sh

packageName="my-redis"
tagName="$1"
fullTagName="$packageName:$tagName"

echo "Full tag name is $fullTagName"

docker build -t $fullTagName .
