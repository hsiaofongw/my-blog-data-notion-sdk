import { Client } from "@notionhq/client";
import { QueryDatabaseParameters, QueryDatabaseResponse } from "@notionhq/client/build/src/api-endpoints";

async function doTraverseNotionPages(
  notionClient: Client,
  notionDbId: string,
  pageSize: number,
  callAtEachPage: (pagedResponse: QueryDatabaseResponse, hasMore: boolean) => Promise<any>,
  nextCursor?: string
) {
  let params: QueryDatabaseParameters = { database_id: notionDbId, page_size: pageSize };
  if (nextCursor) {
    params.start_cursor = nextCursor;
  }

  const pagedResponse: QueryDatabaseResponse = await notionClient.databases.query(params);
  const hasMore = pagedResponse.has_more && (!!pagedResponse.next_cursor);
  await callAtEachPage(pagedResponse, hasMore);
  if (hasMore) {
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        doTraverseNotionPages(notionClient, notionDbId, pageSize, callAtEachPage, pagedResponse.next_cursor).then((_) => resolve(_)).catch(err => reject(err));
      });
    });
  }
}

export async function traverseNotionDbPages(
  notionClient: Client,
  notionDbId: string,
  pageSize: number,
  callAtEachPage: (pageResponse: QueryDatabaseResponse, hasMore: boolean) => Promise<any>
) {
  await doTraverseNotionPages(notionClient, notionDbId, pageSize, callAtEachPage);
}
