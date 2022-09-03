import { Client } from "@notionhq/client";
import dotenv from "dotenv";
import { getNotionDatabaseFieldList } from "../src/notion-relateds/get-notion-db-field-list";
import { writePropertyTemplates } from "../src/notion-relateds/write-property-templates";
import { slowDown } from "../src/utils/slow";
import { traverseNotionDbPages } from "../src/notion-relateds/utils/traverse-db-pages";
import {
  parseCommandlineArguments,
} from "../src/utils/parse";
import { parseISO } from "date-fns";
import { generateRandomArrangement } from "../src/utils/generate-random-arrangement";

dotenv.config();

async function getKeysInNaturalOrder(notion: Client, notionDbId: string) {
  let results: Array<{ objectId: string; created: Date }> = [];

  await traverseNotionDbPages(
    notion,
    notionDbId,
    50,
    async (pagedResp, hasMore) => {
      for (const obj of pagedResp.results) {
        results.push({
          objectId: obj.id,
          created: parseISO((obj as any).created_time),
        });
      }

      if (hasMore) {
        await slowDown(400);
      }
    }
  );

  results.sort((a, b) => a.created.valueOf() - b.created.valueOf());

  return results;
}

async function tryCreateOrderProperty(
  notion: Client,
  notionDbId: string,
  orderKey: string
) {
  const orderKeyInfo = `(${notionDbId}, ${orderKey})`;
  console.log("Try create order key:", orderKeyInfo);
  const dbMetaData = await getNotionDatabaseFieldList(notion, notionDbId);

  if (
    dbMetaData.fields.find(
      (field) => field.fieldName === orderKey && field.fieldType === "number"
    )
  ) {
    console.log("Order key already exist:", orderKeyInfo);
    return;
  }

  console.log("Creating:", orderKeyInfo);
  await notion.databases
    .update({
      database_id: notionDbId,
      properties: { [orderKey]: { number: {} } },
    })
    .then((resp) => {
      console.log(`Order key created:`, orderKeyInfo);
      return resp.properties[orderKey].id;
    });

  console.log("Populating initial values in order key:", orderKeyInfo);
  await traverseNotionDbPages(
    notion,
    notionDbId,
    50,
    async (pagedResp, hasMore) => {
      for (const pageObj of pagedResp.results) {
        await notion.pages.update({
          page_id: pageObj.id,
          properties: {
            [orderKey]: (writePropertyTemplates as any)["number"](0),
          },
        });
        console.log(`Populated at (${notionDbId}, ${pageObj.id}, ${orderKey})`);
        await slowDown(400);
      }

      await slowDown(400);
    }
  );
  console.log("Populated:", orderKeyInfo);
}

async function reAssignOrder(
  notion: Client,
  pageKeys: string[],
  orderKey: string
) {
  const arrangement = generateRandomArrangement(pageKeys.length);
  for (let i = 0; i < pageKeys.length; i++) {
    const pageId = pageKeys[i];
    const order = arrangement[i];
    console.log('Assigning order:', `(${pageId}, ${orderKey}, ${order})`);
    await notion.pages.update({
      page_id: pageId,
      properties: { [orderKey]: (writePropertyTemplates as any)["number"](order) },
    }).then(() => {
      console.log('Order assigned:', `(${pageId}, ${orderKey}, ${order})`);
    });
    await slowDown(400);
  }
}

async function main() {
  const parsedArg = parseCommandlineArguments(process.argv, [
    "--notionDbId", 
    "--orderKey", 
    "--notionTokenEnvName",
  ]);

  const notionDbId = parsedArg["--notionDbId"][0] ?? "";
  const orderKey = parsedArg["--orderKey"][0] ?? "";
  const notionTokenEnvName = parsedArg["--notionTokenEnvName"][0] ?? "";

  if (orderKey && notionDbId && notionTokenEnvName) {
    const notionToken = process.env[notionTokenEnvName] as string;
    if (!notionToken) {
      console.error("Notion token not found.");
      return;
    }

    console.log("Database Id:", notionDbId);
    const notion = new Client({
      auth: notionToken,
    });


    await tryCreateOrderProperty(notion, notionDbId, orderKey);
    const keys = await getKeysInNaturalOrder(notion, notionDbId).then(result => result.map(datum => datum.objectId));
    await reAssignOrder(notion, keys, orderKey);
  } else {
    console.log("Missing required arguments.");
  }
}

main();
