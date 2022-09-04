#!/bin/sh

packageName="get-notion-rss-feeds"
tagName="$1"
fullTagName="$packageName:$tagName"

echo "Full tag name is $fullTagName"

docker build -t $fullTagName .
