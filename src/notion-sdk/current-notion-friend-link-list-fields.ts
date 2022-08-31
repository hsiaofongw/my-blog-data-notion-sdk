import { FieldDescriptor } from "./types";

export const friendLinkListFields: Array<FieldDescriptor> = [
  { fieldName: "AddDate", fieldType: "date" },
  { fieldName: "Avatar", fieldType: "url" },
  { fieldName: "Description", fieldType: "rich_text" },
  { fieldName: "Link", fieldType: "url" },
  { fieldName: "PreviousLinks", fieldType: "multi_select" },
  { fieldName: "Title", fieldType: "title" },
];
