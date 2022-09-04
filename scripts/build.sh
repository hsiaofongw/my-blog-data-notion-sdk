#!/bin/sh

packageName="get-notion-rss-feeds"
githubUserName="hsiaofongw"
tagName="$1"
fullTagName="ghcr.io/$githubUserName/$packageName:$tagName"
platform="linux/amd64"

echo "Full tag name is $fullTagName"

docker buildx build \
  --platform=$platform \
  --push \
  -t $fullTagName .
