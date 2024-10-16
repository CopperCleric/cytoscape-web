import { ValueType, ValueTypeName } from '../TableModel'

export const ParameterUIType = {
  Text: 'text',
  DropDown: 'dropDown',
  Radio: 'radio',
  CheckBox: 'checkBox',
  NodeColumn: 'nodeColumn',
  EdgeColumn: 'edgeColumn',
} as const
export type ParameterUIType =
  (typeof ParameterUIType)[keyof typeof ParameterUIType]

export type ColumnTypeFilter = 'number' | 'list' | ValueTypeName

export interface ServiceAppParameter {
  // Key of the parameter, used as the label
  displayName: string

  // Tooltip or hint
  description: string

  type: ParameterUIType

  valueList: ValueType[] // Applicable when type="dropDown"
  defaultValue: ValueType // Default or selected value
  validationType: ValueTypeName // Data type is only used for text field or data type. It is ignored for other input types.
  columnTypeFilter: ColumnTypeFilter //Only for node or edge column type.
  //Can be one of the cx2 supported datatype, number(for long or integer) or list(for any list type)

  validationHelp: string
  validationRegex: string // Ignored for certain types
  minValue?: number // Applies to numeric textBox
  maxValue?: number // Applies to numeric textBox
}
