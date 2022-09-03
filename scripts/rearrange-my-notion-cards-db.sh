#!/bin/bash

source .env

notionDbId=$NOTION_FRIEND_LINK_LIST_DB_ID
notionTokenEnvName='NOTION_TOKEN'

ts-node scripts/sync-json-to-notion-db.ts \
  --notionDbId $notionDbId \
  --notionTokenEnvName $notionTokenEnvName \
  --orderKey 'order'
