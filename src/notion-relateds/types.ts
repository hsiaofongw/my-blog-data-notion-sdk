/** 字段描述 */
export type FieldDescriptor = { fieldName: string; fieldType: string };

/** Notion Database 字段描述 */
export type NotionDBFieldDescriptor = FieldDescriptor & { fieldId: string };

/** 字段对应关系 */
export type FieldAssociation = {
  /** 源表字段下标，例如 i 对应 sourceTableKeys[i] */
  lhsFieldName: string;

  /** 目标表字段下标，例如 j 对应 destinationTableKeys[j] */
  rhsFieldName: string;
};

/** 字段映射请求 */
export type FieldMappingRequest = {
  /** 源表字段列表 */
  lhsFields: Array<FieldDescriptor>;

  /** 目标表字段列表 */
  rhsFields: Array<FieldDescriptor>;

  /** 源表主键下标 */
  lhsPrimaryKey: string;

  /** 目标表主键下标 */
  rhsPrimaryKey: string;

  /** 字段对应关系 */
  associations: Array<FieldAssociation>;
};

/** 字段比较器 */
export type FieldComparator = {
  lhsFieldType: string;
  rhsFieldType: string;
  isEqual: (lhs: any, rhs: any) => boolean;
};

/** 字段同步器 */
export type FieldReconciler = {
  lhsFieldType: string;
  rhsFieldType: string;
  fromLhsToRhs: (lhs: any) => any;
};
