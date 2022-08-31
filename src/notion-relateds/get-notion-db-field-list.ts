import { FieldDescriptor } from "./types";
import { Client } from "@notionhq/client";

export async function getNotionDatabaseFieldList(notion: Client, databaseId: string): Promise<{ fields: Array<FieldDescriptor>, title: string, url: string, uuid: string }> {
  const dbFieldListResponse = await notion.databases.retrieve({
    database_id: databaseId,
  });

  const title = (dbFieldListResponse as any)?.title[0]?.plain_text;
  const url = (dbFieldListResponse as any)?.url;
  const uuid = (dbFieldListResponse as any)?.id;
  let fields: Array<FieldDescriptor> = [];
  for (const propKey in dbFieldListResponse.properties) {
    const prop = dbFieldListResponse.properties[propKey];
    const fieldName = prop.name;
    const fieldType = prop.type;
    fields.push({ fieldName, fieldType });
  }

  fields.sort((a, b) => a.fieldName.localeCompare(b.fieldName));
  
  return { title, url, uuid, fields };
}
