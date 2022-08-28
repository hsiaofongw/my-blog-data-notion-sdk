#!/bin/sh

packageName="my-redis"
githubUserName="hsiaofongw"
fullTagName="ghcr.io/$githubUserName/$packageName:$1"
platform="linux/amd64"

echo "Full tag name is $fullTagName"

docker buildx build \
  --platform=$platform \
  --push \
  -t $fullTagName .
