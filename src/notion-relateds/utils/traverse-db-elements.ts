import { Client } from "@notionhq/client";
import { slowDown } from '../../../src/utils/slow';
import { readPropertyMethods } from "../write-property-templates";
import { traverseNotionDbPages } from "./traverse-db-pages";

/** 分页遍历 Notion 数据库的每一条数据 */
export async function traverseDbElementWise(
  notion: Client,
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
