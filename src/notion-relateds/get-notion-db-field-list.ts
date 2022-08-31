import { FieldDescriptor, NotionDBFieldDescriptor } from "./types";
import { Client } from "@notionhq/client";

/** 用于获取 Notion 数据库的字段列表 */
export async function getNotionDatabaseFieldList(
  notion: Client,
  databaseId: string
): Promise<{
  fields: Array<NotionDBFieldDescriptor>;
  title: string;
  url: string;
  uuid: string;
}> {
  const dbFieldListResponse = await notion.databases.retrieve({
    database_id: databaseId,
  });

  // console.log('Field list:', dbFieldListResponse);

  const title = (dbFieldListResponse as any)?.title[0]?.plain_text;
  const url = (dbFieldListResponse as any)?.url;
  const uuid = (dbFieldListResponse as any)?.id;
  let fields: Array<NotionDBFieldDescriptor> = [];
  for (const propKey in dbFieldListResponse.properties) {
    const prop = dbFieldListResponse.properties[propKey];
    const fieldName = prop.name;
    const fieldType = prop.type;
    const fieldId = prop.id;
    fields.push({ fieldName, fieldType, fieldId });
  }

  fields.sort((a, b) => a.fieldName.localeCompare(b.fieldName));

  return { title, url, uuid, fields };
}
