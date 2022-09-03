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
  { lhsFieldName: 'title', rhsFieldName: 'Title' },
  { lhsFieldName: 'description', rhsFieldName: 'Description' },
  { lhsFieldName: 'avatar', rhsFieldName: 'Avatar' },
  { lhsFieldName: 'addDate', rhsFieldName: 'AddDate' },
  { lhsFieldName: 'link', rhsFieldName: 'Link' },
];

/** JSON 文件中的日期的格式 */
export const dateFormatInJsonFile = 'yyyy-MM-dd';
export const defaultDateLocaleObject = { code: 'zh-CN' };

// 我们现有的以 json 格式存储的数据的日期格式是不够规范的，因此需要一个专门的解析函数
function parseYYYYMMDDDateString(dateString: string): Date {
  return new Date(`${dateString.slice(0, 4+1+2+1+2)}T00:00:00+08:00`);
}

/** 比较器，如果没有对应的比较器，默认是直接比 */
export const fieldComparators: Array<FieldComparator> = [
  {
    lhsFieldType: "string",
    rhsFieldType: "date",
    isEqual: (a, b) => {
      const dateA = parseYYYYMMDDDateString(a);

      // 两个时刻相差在 24h 内就算是一样的
      return Math.abs(dateA.valueOf() - b.valueOf()) < 24 * 60 * 60 * 1000;
    },
  },
];

/** 同步方式，从 JSON 值到 Notion DB 值 */
export const fieldReconcilers: Array<FieldReconciler> = [
  {
    lhsFieldType: "string",
    rhsFieldType: "date",
    fromLhsToRhs: (lhs: any) => {
      return parseYYYYMMDDDateString(lhs);
    },
  },
];
