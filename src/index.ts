import { Client } from "@notionhq/client";
import dotenv from "dotenv";
import axios from 'axios';
import { parse } from 'date-fns';

dotenv.config();

const slowDown = (ms: number): Promise<null> => {
  return new Promise((resolve) => {
    console.log(`Sleeping for ${ms} miliseconds...`);
    setTimeout(() => resolve(null), ms);
  });
} 

async function main() {
  const notion = new Client({
    auth: process.env.NOTION_TOKEN,
  });

  const dbId = process.env.NOTION_DB_ID as string;
  const githubFriendJSONUrl = process.env.GITHUB_FRIEND_LINKS as string;

  const response = await notion.databases.retrieve({
    database_id: dbId,
  });
  console.log('Database Id:', dbId);
  console.log('Github friend links URL:', githubFriendJSONUrl);

  const expectedProperties = {
    Title: {
      id: 'title',
      type: 'title',
      name: 'Title',
      title: {},
    },
    Description: {
      id: 'description',
      type: 'rich_text',
      name: 'Description',
      rich_text: {}
    },
    Avatar: {
      id: 'avatar',
      type: 'url',
      name: 'Avatar',
      url: {},
    },
    Link: {
      id: 'link',
      type: 'url',
      name: 'Link',
      url: {},
    },
    PreviousLinks: {
      id: 'previousLinks',
      type: 'multi_select',
      name: 'PreviousLinks',
      multi_select: {
        options: []
      }
    },
    AddDate: {
      id: 'addDate',
      type: 'date',
      name: 'AddDate',
      date: {}
    }
  }

  if (!response) {
    return;
  }

  let keysToBeInserted = new Set<string>();
  let properties = response.properties;
  for (const propertyKey in properties) {
    const property = response.properties[propertyKey];
    if (property.type === 'title') {
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
    properties
  });
  console.log('Updated properties:', properties);
  console.log('Schema patch response:', databaseSchemaPatchResponse);

  const items = await notion.databases.query({
    database_id: dbId,
  })
  console.log('Database items:', items);
  if (!items) {
    return;
  }
  for (const item of items.results) {
    const resp = await notion.blocks.delete({ block_id: item.id });
    console.log('Deleted:', resp);
    await slowDown(400);
  }

  const githubFriendLinkContentResp = await axios.get(githubFriendJSONUrl);
  if (!githubFriendLinkContentResp) {
    return;
  }
  let githubFriends: any[] = githubFriendLinkContentResp.data;

  const randIntFromZeroToNInc = (n: number) => {
    return Math.floor(Math.random() * n);
  }

  for (let i = 0; i < githubFriends.length; i++) {
    const j = i + randIntFromZeroToNInc(githubFriends.length-i);
    const temp = githubFriends[i];
    githubFriends[i] = githubFriends[j];
    githubFriends[j] = temp;
  }

  console.log('GitHub Friends:', githubFriends);

  for (const friend of githubFriends) {
    const title = friend.title;
    const avatar = friend.avatar;
    const description = friend.description;
    const link = friend.link;
    const previousLinks = friend.previousLinks ?? [];
    const addDate: string = friend.addDate ?? '';
    let pageProperties = {
      Title: {
        title: [{ text: { content: title } }]
      },
      Description: {
        rich_text:[{ text: { content: description } }]
      },
      Avatar: {
        url: avatar
      },
      Link: {
        url: link,
      },
      PreviousLinks: {
        multi_select: previousLinks.map((link: string) => ({ name: link }))
      },
    };
    if (addDate) {
      (pageProperties as any)['AddDate'] = { date: { start: parse(addDate, 'yyyy-MM-dd', new Date(0)).toISOString() } };
    }
    const addPageResponse = await notion.pages.create({
      parent: {
        type: 'database_id',
        database_id: dbId,
      },
      properties: pageProperties,
      cover: {
        type: 'external',
        external: {
          url: avatar
        }
      }
    });
    console.log('Added item:', addPageResponse);
    await slowDown(400);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
