import { Client } from "@notionhq/client";
import dotenv from "dotenv";
import axios from "axios";
import { isEqual, parse } from "date-fns";
import { getNotionDatabaseFieldList } from "../src/notion-relateds/get-notion-db-field-list";
import {
  readPropertyMethods,
  writePropertyTemplates,
} from "../src/notion-relateds/write-property-templates";
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
import { traverseNotionDbPages } from "../src/notion-relateds/utils/traverse-db-pages";

dotenv.config();
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const slowDown = (ms: number): Promise<null> => {
  return new Promise((resolve) => {
    // console.log(`Sleeping for ${ms} miliseconds...`);
    setTimeout(() => resolve(null), ms);
  });
};

/** 分页遍历 Notion 数据库的每一条数据 */
async function traverseDbElementWise(
  notionDbId: string,
  pageSize: number,
  callAtEachDatum: (
    pageId: string,
    pageObject: any,
    datum: any,
    hasMore: boolean
  ) => Promise<any>
) {
  await traverseNotionDbPages(
    notion,
    notionDbId,
    pageSize,
    async (dbSliceObject, hasMore) => {
      const len = dbSliceObject.results.length;
      for (let i = 0; i < len; i++) {
        const page = dbSliceObject.results[i] as any;
        let datum: any = {};
        const properties = page.properties;
        for (const propKey in properties) {
          const prop = properties[propKey];
          const value = await notion.pages.properties
            .retrieve({ page_id: page.id, property_id: prop.id })
            .then((valueObject) =>
              (readPropertyMethods as any)[prop.type](valueObject)
            );
          datum[propKey] = value;
          await slowDown(400);
        }

        await callAtEachDatum(page.id, page, datum, i < len - 1);
      }

      if (hasMore) {
        await slowDown(400);
      }
    }
  );
}

async function syncJsonDataToNotionDb(
  notionDbId: string,
  sourceJsonUrl: string,
  fieldMappingRequest: FieldMappingRequest
) {
  const sourceFields = fieldMappingRequest.sourceTableKeys;
  const sourcePrimaryKey =
    sourceFields[fieldMappingRequest.sourceTablePrimaryKeyIndex].fieldName;
  const targetFields = fieldMappingRequest.destinationTableKeys;
  const targetPrimaryKey =
    targetFields[fieldMappingRequest.destinationTablePrimaryKeyIndex].fieldName;
  console.log("Notion Database Id:", notionDbId);
  console.log("Destination table primary key:", targetPrimaryKey);

  console.log("Getting source data...");
  const sourceResp = await axios.get(sourceJsonUrl);
  const sourceData = sourceResp.data;
  console.log("Source table URL:", sourceJsonUrl);
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

  let deleteList = new Set<string>();
  await traverseDbElementWise(
    notionDbId,
    20,
    async (pageId, pageObject, datum, hasMore) => {
      console.log(pageId + ':', pageObject);
      const key = datum[targetPrimaryKey];
      console.log(key + ':', datum);

      if (key && sourceDataIndex[key]) {
        const lhs = sourceDataIndex[key];
        const rhs = datum;
        const associations = fieldMappingRequest.associations;
        for (const association of associations) {
          const lhsField = fieldMappingRequest.sourceTableKeys[association.sourceTableKeyIdx];
          const rhsField = fieldMappingRequest.destinationTableKeys[association.destinationTableKeyIdx];

          let equalQ: FieldComparator['isEqual'] = (a: any, b: any) => a === b;
          if (fieldComparatorMap[lhsField.fieldType]) {
            if (fieldComparatorMap[lhsField.fieldType][rhsField.fieldType]) {
              equalQ = fieldComparatorMap[lhsField.fieldType][rhsField.fieldType].isEqual;
            }
          }

          const l = lhs[lhsField.fieldName];
          const r = rhs[rhsField.fieldName];
          console.log(`lhs: (${lhsField.fieldName}, ${l})`);
          console.log(`rhs: (${rhsField.fieldName}, ${r})`);
          console.log(`isEqual: ${equalQ(l, r)}`)
        }
      } else {
        deleteList.add(pageId);
      }

      if (hasMore) {
        await slowDown(400);
      }
    }
  );

  const traverser = async (notionObjectId: string, datum: any) => {
    console.log(notionObjectId + ":", datum);

    const key = datum[targetPrimaryKey];
    console.log("Value of primary key in the target table:", key);

    if (!key) {
      // 目标表主键缺失
      console.log("Primary key missing in target table.");
      deleteList.add(notionObjectId);
    }

    const lhs = sourceDataIndex[key];

    if (!lhs) {
      // 该条记录在原表中已被删除
      console.log("Deleted in the source table.");
      deleteList.add(notionObjectId);
    }

    console.log("Lhs", lhs);
    const rhs = datum;
    console.log("Rhs", rhs);

    console.log("Comparing...");
    for (const association of fieldMappingRequest.associations) {
      const lhsKeyIdx = association.sourceTableKeyIdx;
      const lhsField = fieldMappingRequest.sourceTableKeys[lhsKeyIdx];
      const lhsValue = (lhs as any)[lhsField.fieldName];
      const rhsKeyIdx = association.destinationTableKeyIdx;
      const rhsField = fieldMappingRequest.destinationTableKeys[rhsKeyIdx];
      const rhsValue = (rhs as any)[rhsField.fieldName];

      let equal: FieldComparator["isEqual"] = (a: any, b: any) => a === b;
      if (fieldComparatorMap[lhsField.fieldType]) {
        const fieldComparator =
          fieldComparatorMap[lhsField.fieldType][rhsField.fieldType];
        if (fieldComparator) {
          equal = fieldComparator.isEqual;
        }
      }

      const isEqual = equal(lhsValue, rhsValue);

      console.log(
        `Compare: (${lhsField.fieldName}, ${lhsValue}) -- (${rhsField.fieldName}, ${rhsValue}) ==> ${isEqual}`
      );
      if (!isEqual) {
        let desiredRhsValue = lhsValue;
        console.log("Desired rhs value:", desiredRhsValue);

        if (reconcilerMap[lhsField.fieldType]) {
          const reconcilerOperator =
            reconcilerMap[lhsField.fieldType][rhsField.fieldType].fromLhsToRhs;
          if (reconcilerOperator) {
            desiredRhsValue = reconcilerOperator(lhsValue);
          }
        }

        let writeTemplate = (writePropertyTemplates as any)[rhsField.fieldType];
        if (writeTemplate) {
          console.log("Updating...");
          const updatePropertyResponse = await notion.pages.update({
            page_id: notionObjectId,
            properties: {
              [rhsField.fieldName]: writeTemplate(desiredRhsValue),
            },
          });
          console.log("Updated:", updatePropertyResponse.id);
          await slowDown(400);
        }
      }
    }
  };

  // traverseDbElementWise(notionDbId, 10, traverser);
}

function main() {
  // Get db id from commandline argv,
  // It is assume that this code execute via ts-node <modulepath> <dbId>
  const dbId = process.argv[2];
  console.log("Database Id:", dbId);

  const jsonUrl = process.env["DATA_GITHUB_FRIEND_LINK_LIST_JSON"] as string;

  let sourceTablePrimaryKeyIndex = 0;
  let destinationTablePrimaryKeyIndex = 0;
  for (let i = 0; i < githubFriendLinkListFields.length; i++) {
    if (githubFriendLinkListFields[i].fieldName === "link") {
      sourceTablePrimaryKeyIndex = i;
      break;
    }
  }

  for (let i = 0; i < notionFriendLinkListFields.length; i++) {
    if (notionFriendLinkListFields[i].fieldName === "Link") {
      destinationTablePrimaryKeyIndex = i;
      break;
    }
  }

  const fieldMappingRequest: FieldMappingRequest = {
    sourceTableKeys: githubFriendLinkListFields,
    destinationTableKeys: notionFriendLinkListFields,
    sourceTablePrimaryKeyIndex: sourceTablePrimaryKeyIndex,
    destinationTablePrimaryKeyIndex: destinationTablePrimaryKeyIndex,
    associations: fieldAssociations,
  };

  syncJsonDataToNotionDb(dbId, jsonUrl, fieldMappingRequest);
  return;
}

main();
