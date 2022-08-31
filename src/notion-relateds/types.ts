/** 字段描述 */
export type FieldDescriptor = { fieldName: string; fieldType: string };

/** 字段映射请求 */
export type FieldMappingRequest = {
  /** 源表字段列表 */
  sourceTableKeys: Array<FieldDescriptor>;

  /** 目标表字段列表 */
  destinationTableKeys: Array<FieldDescriptor>;

  /** 源表主键字段下标，例如 i 对应 sourceTableKeys[i] */
  sourceTablePrimaryKeyIdx: number;

  /** 目标表主键字段下标，例如 j 对应 destinationTableKeys[j] */
  destinationTablePrimaryKeyIdx: number;
};
