import { parse, parseISO } from "date-fns";
import {
  FieldComparator,
  FieldDescriptor as FieldDescriptor,
  FieldMappingRequest,
  FieldReconciler,
} from "./types";

/** Notion 数据库中的字段 */
export const notionFriendLinkListFields: Array<FieldDescriptor> = [
  { fieldName: "Title", fieldType: "title" },
  { fieldName: "Description", fieldType: "rich_text" },
  { fieldName: "Avatar", fieldType: "url" },
  { fieldName: "AddDate", fieldType: "date" },
  { fieldName: "Link", fieldType: "url" },
];

/** JSON 文件链接 */
export const githubFriendLinksJSONUrl =
  process.env["DATA_GITHUB_FRIEND_LINK_LIST_JSON"];

/** JSON 文件中的字段 */
export const githubFriendLinkListFields: Array<FieldDescriptor> = [
  { fieldName: "title", fieldType: "string" },
  { fieldName: "description", fieldType: "string" },
  { fieldName: "avatar", fieldType: "string" },
  { fieldName: "addDate", fieldType: "string" },
  { fieldName: "link", fieldType: "string" },
];

/** 字段对应关系 */
export const fieldAssociations: FieldMappingRequest['associations'] = [
  { sourceTablePrimaryKeyIdx: 0, destinationTablePrimaryKeyIdx: 0 },
  { sourceTablePrimaryKeyIdx: 1, destinationTablePrimaryKeyIdx: 1 },
  { sourceTablePrimaryKeyIdx: 2, destinationTablePrimaryKeyIdx: 2 },
  { sourceTablePrimaryKeyIdx: 3, destinationTablePrimaryKeyIdx: 3 },
  { sourceTablePrimaryKeyIdx: 4, destinationTablePrimaryKeyIdx: 4 },
];

/** JSON 文件中的日期的格式 */
export const dateFormatInJsonFile = 'yyyy-MM-dd';

/** 比较器，如果没有对应的比较器，默认是直接比 */
export const fieldComparators: Array<FieldComparator> = [
  {
    lhsFieldType: "string",
    rhsFieldType: "date",
    isEqual: (a, b) => {
      const dateA = parse(a, dateFormatInJsonFile, new Date());
      const dateB = parseISO(b);
      // 两个时刻相差在 +-60s 内就算是一样的
      return Math.abs(dateA.valueOf() - dateB.valueOf()) < 60_000;
    },
  },
];

/** 同步方式，从 JSON 值到 Notion DB 值 */
export const fieldReconciler: Array<FieldReconciler> = [
  {
    lhsFieldType: "string",
    rhsFieldType: "date",
    fromLhsToRhs: (lhs: any) => {
      return parse(lhs, dateFormatInJsonFile, new Date());
    },
  },
];
