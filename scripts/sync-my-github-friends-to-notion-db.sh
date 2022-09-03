#!/bin/bash

source .env

jsonUrl=$DATA_GITHUB_FRIEND_LINK_LIST_JSON
notionDbId=$NOTION_FRIEND_LINK_LIST_DB_ID
notionTokenEnvName='NOTION_TOKEN'
lhsPrimaryKey='link'
rhsPrimaryKey='Link'

ts-node scripts/sync-json-to-notion-db.ts \
  --jsonUrl $jsonUrl \
  --notionDbId $notionDbId \
  --notionTokenEnvName $notionTokenEnvName \
  --lhsPrimaryKey $lhsPrimaryKey \
  --rhsPrimaryKey $rhsPrimaryKey \
  --lhsField 'title:string' \
  --lhsField 'description:string' \
  --lhsField 'avatar:string' \
  --lhsField 'addDate:string' \
  --lhsField 'link:string' \
  --rhsField 'Title:title' \
  --rhsField 'Description:rich_text' \
  --rhsField 'Avatar:url' \
  --rhsField 'AddDate:date' \
  --rhsField 'Link:url' \
  --association 'title:Title' \
  --association 'description:Description' \
  --association 'avatar:Avatar' \
  --association 'addDate:AddDate' \
  --association 'link:Link' 
