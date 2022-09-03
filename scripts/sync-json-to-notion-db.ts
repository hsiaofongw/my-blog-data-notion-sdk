import { Client } from "@notionhq/client";
import dotenv from "dotenv";
import { getNotionDatabaseFieldList } from "../src/notion-relateds/get-notion-db-field-list";
import { writePropertyTemplates } from "../src/notion-relateds/write-property-templates";
import {
  FieldComparator,
  FieldMappingRequest,
  FieldReconciler,
} from "../src/notion-relateds/types";
import {
  githubFriendLinkListFields,
  notionFriendLinkListFields,
  fieldAssociations,
  fieldComparators,
  fieldReconcilers,
} from "../src/notion-relateds/fields-config";
import { makeLevel2Map } from "../src/utils/make-level2-map";
import { makeL1Map } from "../src/utils/make-level1-map";
import { slowDown } from "../src/utils/slow";
import { traverseDbElementWise } from "../src/notion-relateds/utils/traverse-db-elements";
import { getFromL2 } from "../src/utils/get-from-l2-map";
import axios from "axios";

dotenv.config();

async function syncListToNotionDb(
  sourceData: Array<any>,
  notion: Client,
  notionDbId: string,
  fieldMappingRequest: FieldMappingRequest
) {
  const sourcePrimaryKey = fieldMappingRequest.lhsPrimaryKey;
  const targetPrimaryKey = fieldMappingRequest.rhsPrimaryKey;

  const lhsFieldMap = makeL1Map(
    fieldMappingRequest.lhsFields,
    (datum) => datum.fieldName,
    (datum) => datum
  );
  const rhsFieldMap = makeL1Map(
    fieldMappingRequest.rhsFields,
    (datum) => datum.fieldName,
    (datum) => datum
  );

  console.log("Notion Database Id:", notionDbId);
  console.log("Destination table primary key:", targetPrimaryKey);

  console.log("Getting source data...");
  console.log("Source date length:", sourceData.length);
  console.log("Source table primary key:", sourcePrimaryKey);

  console.log("Getting Notion database metadata...");
  const dbMetadata = await getNotionDatabaseFieldList(notion, notionDbId);
  console.log("Notion database title:", dbMetadata.title);
  console.log("Notion database URL:", dbMetadata.url);
  console.log("Notion database UUID:", dbMetadata.uuid);
  console.log("Notion database fields:");

  const notionFieldNameToType: Record<string, string> = makeL1Map(
    dbMetadata.fields,
    (datum) => datum.fieldName,
    (datum) => datum.fieldType
  );
  console.log(
    "Notion field name to field type mapping:",
    notionFieldNameToType
  );

  const fieldComparatorMap: Record<
    string,
    Record<string, FieldComparator>
  > = makeLevel2Map(
    fieldComparators,
    (datum) => datum.lhsFieldType,
    (datum) => datum.rhsFieldType
  );

  const reconcilerMap: Record<
    string,
    Record<string, FieldReconciler>
  > = makeLevel2Map(
    fieldReconcilers,
    (datum) => datum.lhsFieldType,
    (datum) => datum.rhsFieldType
  );

  // 为原表建立索引 HashMap[主键 -> 元素]
  const sourceDataIndex: Record<string, any> = makeL1Map(
    sourceData,
    (datum: any) => datum[sourcePrimaryKey],
    (datum) => datum
  );

  // deleteList 的每个元素是 notion block id（page 也是 block）
  let deleteList = new Set<string>();

  // 每个元素是一个 { page_id: xxx, properties: { [PropertyName]: propertyValue } }
  let updateList: any[] = [];

  // addList 的每个元素是 lhs table 的 key 值
  let addList = new Set<string>();

  // 遍历 Notion DB，得出以下信息（把它们组合在一起也叫做 Patch）：
  // 1. 哪条记录的哪个字段需要更新
  // 2. 哪条记录需要删除
  // 3. 哪条记录需要插入
  // 注意：我们只是在这个函数里面收集 1,2,3，并不真正地去执行更新/删除/插入操作，这些操作的执行是在后面。
  // 这是一种思想：把更新过程拆分为两个相对独立的子过程，分别是 Diff 过程 和 Apply 过程，
  // Diff 过程负责生成 Patch, Apply 过程负责应用 Patch.
  // 这样做的好处是什么？方便后续的维护、扩展和开发过程中的调试。
  await traverseDbElementWise(
    notion,
    notionDbId,
    20,
    async (pageId, pageObject, datum, hasMore) => {
      const key = datum[targetPrimaryKey];

      console.log(`Check ${pageId},${key}`);

      if (key && sourceDataIndex[key]) {
        console.log("Primary key exist both on rhs and lhs");
        const lhs = sourceDataIndex[key];
        const rhs = datum;
        const associations = fieldMappingRequest.associations;
        for (const association of associations) {
          const lhsField = lhsFieldMap[association.lhsFieldName];
          const rhsField = rhsFieldMap[association.rhsFieldName];

          const equalQ: FieldComparator["isEqual"] = getFromL2(
            fieldComparatorMap,
            lhsField.fieldType,
            rhsField.fieldType,
            (datum) => datum.isEqual,
            (a: any, b: any) => a === b
          );

          const l = lhs[lhsField.fieldName];
          const r = rhs[rhsField.fieldName];
          const isEqual = equalQ(l, r);
          console.log(
            `Check equal: (${lhsField.fieldName}, ${l}) -- (${rhsField.fieldName}, ${r}) => ${isEqual}`
          );
          if (!isEqual) {
            const reconcilerOperator = getFromL2(
              reconcilerMap,
              lhsField.fieldType,
              rhsField.fieldType,
              (datum) => datum.fromLhsToRhs,
              (x: any) => x
            );
            const desiredRhsValue = reconcilerOperator(l);

            const writeTemplate = (writePropertyTemplates as any)[
              rhsField.fieldType
            ];
            if (writeTemplate) {
              console.log(
                `Update ${pageId}, ${key}: (${rhsField.fieldName}, ${r}) -> ${desiredRhsValue}`
              );
              updateList.push({
                page_id: pageId,
                properties: {
                  [rhsField.fieldName]: writeTemplate(desiredRhsValue),
                },
              });
            }
          }
        }
        delete sourceDataIndex[key];
      } else {
        deleteList.add(pageId);
        console.log(`Delete ${pageId}:`, datum);
      }

      if (hasMore) {
        await slowDown(400);
      }
    }
  );

  for (const key in sourceDataIndex) {
    console.log(`Create ${key}`);
    addList.add(key);
  }

  for (const prop of updateList) {
    console.log("Updating:", prop);
    const resp = await notion.pages.update(prop);
    console.log("Updated:", resp.id);
  }

  for (const pageId of deleteList) {
    console.log("Deleting:", pageId);
    const resp = await notion.blocks.delete({ block_id: pageId });
    console.log("Deleted:", resp.id);
  }

  for (const key of addList) {
    const datum = sourceDataIndex[key];
    console.log("Creating:", key);
    let properties: any = {};
    for (const association of fieldMappingRequest.associations) {
      const lhsField = lhsFieldMap[association.lhsFieldName];
      const rhsField = rhsFieldMap[association.rhsFieldName];
      const reconcilerOperator = getFromL2(
        reconcilerMap,
        lhsField.fieldType,
        rhsField.fieldType,
        (datum) => datum.fromLhsToRhs,
        (x: any) => x
      );

      const rhsValue = reconcilerOperator(datum[lhsField.fieldName]);
      const writeTemplate = (writePropertyTemplates as any)[rhsField.fieldType];
      if (writeTemplate) {
        properties[rhsField.fieldName] = writeTemplate(rhsValue);
      } else {
        console.error('No write template for type:', rhsField.fieldType);
      }
    }

    const resp = await notion.pages.create({
      parent: { type: "database_id", database_id: notionDbId },
      properties,
    });
    console.log("Created:", resp.id);
    await slowDown(400);
  }
}

async function main() {
  // Get db id from commandline argv,
  // It is assume that this code execute via ts-node <modulepath> <dbId>

  const testDbId = "63d3f33b481b438f87c055710d30df8b";

  const dbId = testDbId ?? (process.env["NOTION_DB_ID"] as string);
  const notionToken = process.env["NOTION_TOKEN"] as string;
  const jsonUrl = process.env["DATA_GITHUB_FRIEND_LINK_LIST_JSON"] as string;

  console.log("Database Id:", dbId);
  console.log("JSON URL:", jsonUrl);

  const notion = new Client({
    auth: notionToken,
  });

  const sourceData = await axios.get(jsonUrl).then((resp) => resp.data);

  await syncListToNotionDb(sourceData, notion, dbId, {
    lhsFields: githubFriendLinkListFields,
    rhsFields: notionFriendLinkListFields,
    lhsPrimaryKey: "link",
    rhsPrimaryKey: "Link",
    associations: fieldAssociations,
  });
}

main();
