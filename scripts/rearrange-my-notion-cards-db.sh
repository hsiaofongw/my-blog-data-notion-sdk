#!/bin/bash

# 部署到目标机器时，.env 文件不会（也不应该）出现，仅仅是测试的时候用
# source .env

notionDbId=$NOTION_FRIEND_LINK_LIST_DB_ID
notionTokenEnvName='NOTION_TOKEN'

NODE_OPTIONS="-r ts-node/register --no-warnings" node \
  scripts/rearrange-database-order.ts \
  --notionDbId $notionDbId \
  --notionTokenEnvName $notionTokenEnvName \
  --orderKey 'order'
