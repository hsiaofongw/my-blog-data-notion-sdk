import { Client } from "@notionhq/client";
import dotenv from "dotenv";
import axios from "axios";
import { parse } from "date-fns";
import { getNotionDatabaseFieldList } from "../src/notion-relateds/get-notion-db-field-list";
import { writePropertyTemplates } from "../src/notion-relateds/write-property-templates";

dotenv.config();
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const slowDown = (ms: number): Promise<null> => {
  return new Promise((resolve) => {
    console.log(`Sleeping for ${ms} miliseconds...`);
    setTimeout(() => resolve(null), ms);
  });
};

function writeTitleToObject(
  currentObject: any,
  fieldName: string,
  content: string
) {
  currentObject[fieldName] = writePropertyTemplates.title(content);
}

async function writeTitle(pageId: string, fieldName: string, title: string) {
  let properties: any = {};
  writeTitleToObject(properties, fieldName, title);
  return notion.pages.update({ page_id: pageId, properties });
}

function writeDateToObject(
  currentObject: any,
  fieldName: string,
  content: Date
) {
  currentObject[fieldName] = writePropertyTemplates.date(content);
}

async function writeDate(pageId: string, fieldName: string, date: Date) {
  let properties: any = {};
  writeDateToObject(properties, fieldName, date);
  return notion.pages.update({ page_id: pageId, properties });
}

function writeUrlToObject(
  currentObject: any,
  fieldName: string,
  content: string
) {
  currentObject[fieldName] = writePropertyTemplates.url(content);
}

async function writeUrl(pageId: string, fieldName: string, url: string) {
  let properties: any = {};
  writeUrlToObject(properties, fieldName, url);
  return notion.pages.update({
    page_id: pageId,
    properties,
  });
}

function writeRichTextTypeTextToObject(
  currentObject: any,
  fieldName: string,
  content: string
) {
  currentObject[fieldName] = writePropertyTemplates.rich_text(content);
}

async function writeRichTextTypeText(
  pageId: string,
  fieldName: string,
  richTextContent: string
) {
  let properties: any = {};
  writeRichTextTypeTextToObject(properties, fieldName, richTextContent);
  return notion.pages.update({
    page_id: pageId,
    properties,
  });
}

function writeMultiSelectToObject(
  currentObject: any,
  fieldName: string,
  content: Array<string>
) {
  currentObject[fieldName] = writePropertyTemplates.multi_select(content);
}

async function writeMultiSelect(
  pageId: string,
  fieldName: string,
  options: Array<string>
) {
  let properties: any = {};
  writeMultiSelectToObject(properties, fieldName, options);
  return notion.pages.update({
    page_id: pageId,
    properties,
  });
}

async function traverseDbPageWise(
  notionDbId: string,
  pageSize: number,
  nextCursor?: string
) {
  let params = { database_id: notionDbId, page_size: pageSize };
  if (nextCursor) {
    params["start_cursor"] = nextCursor;
  }

  const pagedResponse = await notion.databases.query(params);

  for (const item of pagedResponse.results) {
    const objType = item.object;
    const id = item.id;
    const properties = (item as any).properties;
    const url = (item as any).url;

    const itemBrief = { objType, id, url };
    console.log('Item', itemBrief);

    for (const propertyKey in properties) {
      const property = properties[propertyKey];

      const propertyValueResp = await notion.pages.properties.retrieve({
        page_id: id,
        property_id: property.id,
      });

      console.log(propertyKey, propertyValueResp);
      await slowDown(1000);
    }
  }

  if (pagedResponse.has_more && pagedResponse.next_cursor) {
    console.log("Has more data, traverse next page after 1 seconds.");
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        traverseDbPageWise(
          notionDbId,
          pageSize,
          pagedResponse.next_cursor as string
        ).then(() => resolve(null)).catch((err) => reject(err));
      }, 1000);
    });
  }

}

function syncJsonDataToNotionDb(notionDbId: string) {
  traverseDbPageWise(notionDbId, 10);
}

function main() {
  // Get db id from commandline argv,
  // It is assume that this code execute via ts-node <modulepath> <dbId>
  const dbId = process.argv[2];
  console.log("Database Id:", dbId);

  syncJsonDataToNotionDb(dbId);
  return;
}

main();
