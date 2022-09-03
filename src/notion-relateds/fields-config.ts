import {
  FieldComparator,
  FieldReconciler,
} from "./types";

/** JSON 文件中的日期的格式 */
export const dateFormatInJsonFile = "yyyy-MM-dd";
export const defaultDateLocaleObject = { code: "zh-CN" };

// 我们现有的以 json 格式存储的数据的日期格式是不够规范的，因此需要一个专门的解析函数
function parseYYYYMMDDDateString(dateString: string): Date {
  return new Date(`${dateString.slice(0, 4 + 1 + 2 + 1 + 2)}T00:00:00+08:00`);
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
