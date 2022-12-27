import {
  FieldDescriptor,
  FieldMappingRequest,
} from "src/notion-relateds/types";

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
export const fieldAssociations: FieldMappingRequest["associations"] = [
  { lhsFieldName: "title", rhsFieldName: "Title" },
  { lhsFieldName: "description", rhsFieldName: "Description" },
  { lhsFieldName: "avatar", rhsFieldName: "Avatar" },
  { lhsFieldName: "addDate", rhsFieldName: "AddDate" },
  { lhsFieldName: "link", rhsFieldName: "Link" },
];
