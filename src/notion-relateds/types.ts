/** 字段描述 */
export type FieldDescriptor = { fieldName: string; fieldType: string };

/** Notion Database 字段描述 */
export type NotionDBFieldDescriptor = FieldDescriptor & { fieldId: string };

/** 字段映射请求 */
export type FieldMappingRequest = {
  /** 源表字段列表 */
  sourceTableKeys: Array<FieldDescriptor>;

  /** 目标表字段列表 */
  destinationTableKeys: Array<FieldDescriptor>;

  /** 字段对应关系 */
  associations: Array<{
    /** 源表主键字段下标，例如 i 对应 sourceTableKeys[i] */
    sourceTablePrimaryKeyIdx: number;

    /** 目标表主键字段下标，例如 j 对应 destinationTableKeys[j] */
    destinationTablePrimaryKeyIdx: number;
  }>;
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
