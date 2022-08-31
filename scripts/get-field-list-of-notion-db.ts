import { Client } from "@notionhq/client";
import dotenv from "dotenv";
import axios from "axios";
import { parse } from "date-fns";
import { FieldDescriptor, FieldMappingRequest } from "../src/notion-relateds/types";
import { getNotionDatabaseFieldList } from "../src/notion-relateds/get-notion-db-field-list";
import { writePropertyTemplates } from '../src/notion-relateds/write-property-templates';

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

async function main() {
  // Get db id from commandline argv,
  // It is assume that this code execute via ts-node <modulepath> <dbId>
  const dbId = process.argv[2];
  console.log("Database Id:", dbId);

  // Query db field list from Notion api server
  const dbInfo = await getNotionDatabaseFieldList(notion, dbId);

  console.log("Database UUID from query result: %s", dbInfo.uuid);
  console.log("Database title: %s", dbInfo.title);
  console.log("Database URL: %s", dbInfo.url);

  const fields = dbInfo.fields;
  fields.forEach((field, fieldIdx) => {
    console.log("[%d]: %o", fieldIdx, field);
  });

  console.log(JSON.stringify(fields));

  return;

  const githubFriendJSONUrl = process.env.GITHUB_FRIEND_LINKS as string;

  console.log("Github friend links URL:", githubFriendJSONUrl);

  const expectedProperties = {
    Title: {
      id: "title",
      type: "title",
      name: "Title",
      title: {},
    },
    Description: {
      id: "description",
      type: "rich_text",
      name: "Description",
      rich_text: {},
    },
    Avatar: {
      id: "avatar",
      type: "url",
      name: "Avatar",
      url: {},
    },
    Link: {
      id: "link",
      type: "url",
      name: "Link",
      url: {},
    },
    PreviousLinks: {
      id: "previousLinks",
      type: "multi_select",
      name: "PreviousLinks",
      multi_select: {
        options: [],
      },
    },
    AddDate: {
      id: "addDate",
      type: "date",
      name: "AddDate",
      date: {},
    },
  };

  const response = await await notion.databases.retrieve({
    database_id: dbId,
  });
  if (!response) {
    return;
  }

  let keysToBeInserted = new Set<string>();
  let properties = response.properties;
  for (const propertyKey in properties) {
    const property = response.properties[propertyKey];
    if (property.type === "title") {
      property.id = expectedProperties.Title.id;
      property.name = expectedProperties.Title.name;
      continue;
    }

    if (propertyKey in expectedProperties) {
      properties[propertyKey] = (expectedProperties as any)[propertyKey];
    }

    if (!(propertyKey in expectedProperties)) {
      (properties as any)[propertyKey] = null;
    }
  }

  for (const key in expectedProperties) {
    if (!(key in properties)) {
      keysToBeInserted.add(key);
    }
  }
  for (const key of keysToBeInserted) {
    properties[key] = (expectedProperties as any)[key];
  }

  const databaseSchemaPatchResponse = await notion.databases.update({
    database_id: dbId,
    properties,
  });
  console.log("Updated properties:", properties);
  console.log("Schema patch response:", databaseSchemaPatchResponse);

  const items = await notion.databases.query({
    database_id: dbId,
  });
  console.log("Database items:", items);
  if (!items) {
    return;
  }
  for (const item of items.results) {
    const resp = await notion.blocks.delete({ block_id: item.id });
    console.log("Deleted:", resp);
    await slowDown(400);
  }

  const githubFriendLinkContentResp = await axios.get(githubFriendJSONUrl);
  if (!githubFriendLinkContentResp) {
    return;
  }
  let githubFriends: any[] = githubFriendLinkContentResp.data;

  const randIntFromZeroToNInc = (n: number) => {
    return Math.floor(Math.random() * n);
  };

  for (let i = 0; i < githubFriends.length; i++) {
    const j = i + randIntFromZeroToNInc(githubFriends.length - i);
    const temp = githubFriends[i];
    githubFriends[i] = githubFriends[j];
    githubFriends[j] = temp;
  }

  console.log("GitHub Friends:", githubFriends);

  for (const friend of githubFriends) {
    const title = friend.title;
    const avatar = friend.avatar;
    const description = friend.description;
    const link = friend.link;
    const previousLinks = friend.previousLinks ?? [];
    const addDate: string = friend.addDate ?? "";
    let pageProperties = {
      Title: {
        title: [{ text: { content: title } }],
      },
      Description: {
        rich_text: [{ text: { content: description } }],
      },
      Avatar: {
        url: avatar,
      },
      Link: {
        url: link,
      },
      PreviousLinks: {
        multi_select: previousLinks.map((link: string) => ({ name: link })),
      },
    };
    if (addDate) {
      (pageProperties as any)["AddDate"] = {
        date: {
          start: parse(addDate, "yyyy-MM-dd", new Date(0)).toISOString(),
        },
      };
    }
    const addPageResponse = await notion.pages.create({
      parent: {
        type: "database_id",
        database_id: dbId,
      },
      properties: pageProperties,
      cover: {
        type: "external",
        external: {
          url: avatar,
        },
      },
    });
    console.log("Added item:", addPageResponse);
    await slowDown(400);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
