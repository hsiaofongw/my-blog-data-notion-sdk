#!/bin/bash

# 部署到目标机器时，.env 文件不会（也不应该）出现，仅仅是测试的时候用
# source .env

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
