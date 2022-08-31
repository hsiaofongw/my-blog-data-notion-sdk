import { Client } from "@notionhq/client";
import dotenv from "dotenv";
import axios from "axios";
import { parse } from "date-fns";

dotenv.config();
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

/** 字段描述 */
type FieldDescriptor = { fieldName: string; fieldType: string };

/** 字段映射请求 */
type FieldMappingRequest = {
  /** 源表字段列表 */
  sourceTableKeys: Array<FieldDescriptor>;

  /** 目标表字段列表 */
  destinationTableKeys: Array<FieldDescriptor>;

  /** 源表主键字段下标，例如 i 对应 sourceTableKeys[i] */
  sourceTablePrimaryKeyIdx: number;

  /** 目标表主键字段下标，例如 j 对应 destinationTableKeys[j] */
  destinationTablePrimaryKeyIdx: number;
};

const slowDown = (ms: number): Promise<null> => {
  return new Promise((resolve) => {
    console.log(`Sleeping for ${ms} miliseconds...`);
    setTimeout(() => resolve(null), ms);
  });
};

const propertyTemplates = {
  title: (content: string) => ({ title: [{ type: 'text', text: { content: content }}] }),
  date: (content: Date) => ({ date: { start: content.toISOString() } }),
  url: (content: string) => ({ url: content }),
  rich_text: (content: string) => ({ rich_text: [{ type: 'text', text: { content }}] }),
  multi_select: (content: Array<string>) => ({ multi_select: content.map(option => ({ name: option })) }),
}

function writeTitleToObject(currentObject: any, fieldName: string, content: string) {
  currentObject[fieldName] = propertyTemplates.title(content);
}

async function writeTitle(pageId: string, fieldName: string, title: string) {
  let properties: any = {};
  writeTitleToObject(properties, fieldName, title);
  return notion.pages.update({ page_id: pageId, properties });
}

function writeDateToObject(currentObject: any, fieldName: string, content: Date) {
  currentObject[fieldName] = propertyTemplates.date(content);
}

async function writeDate(pageId: string, fieldName: string, date: Date) {
  let properties: any = {};
  writeDateToObject(properties, fieldName, date);
  return notion.pages.update({ page_id: pageId, properties, });
}

function writeUrlToObject(currentObject: any, fieldName: string, content: string) {
  currentObject[fieldName] = propertyTemplates.url(content);
}

async function writeUrl(pageId: string, fieldName: string, url: string) {
  let properties: any = {};
  writeUrlToObject(properties, fieldName, url);
  return notion.pages.update({
    page_id: pageId,
    properties,
  });
}

function writeRichTextTypeTextToObject(currentObject: any, fieldName: string, content: string) {
  currentObject[fieldName] = propertyTemplates.rich_text(content);
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

function writeMultiSelectToObject(currentObject: any, fieldName: string, content: Array<string>) {
  currentObject[fieldName] = propertyTemplates.multi_select(content);
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
  const dbFieldListResponse = await await notion.databases.retrieve({
    database_id: dbId,
  });
  console.log("Database UUID from query result: %s", dbFieldListResponse.id);
  console.log(
    "Database title: %s",
    (dbFieldListResponse as any)?.title[0]?.plain_text
  );
  console.log("Database URL: %s", (dbFieldListResponse as any)?.url);

  //   console.log('Field list query result:', dbFieldListResponse);
  let fieldDescriptors: Array<FieldDescriptor> = [];
  for (const propKey in dbFieldListResponse.properties) {
    const prop = dbFieldListResponse.properties[propKey];
    const fieldName = prop.name;
    const fieldType = prop.type;
    fieldDescriptors.push({ fieldName, fieldType });
  }

  fieldDescriptors.sort((a, b) => a.fieldName.localeCompare(b.fieldName));
  fieldDescriptors.forEach((field, fieldIdx) => {
    console.log("[%d]: %o", fieldIdx, field);
  });

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
