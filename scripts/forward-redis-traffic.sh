#!/bin/sh

redisJumpServer=$1

ssh \
  -v \
  -N \
  -T \
  -L 127.0.0.1:6379:10.152.183.8:6379 \
  -o ServerAliveInterval=3 $redisJumpServer 
