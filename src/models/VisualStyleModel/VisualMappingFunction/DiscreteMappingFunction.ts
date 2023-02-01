import { ValueType } from '../../TableModel'

import { VisualPropertyValueType } from '../VisualPropertyValue'
import { VisualMappingFunction } from '.'

export interface DiscreteMappingFunction extends VisualMappingFunction {
  vpValueMap: Map<ValueType, VisualPropertyValueType>
  defaultValue: VisualPropertyValueType
}

// "NODE_BACKGROUND_COLOR": {
//   "definition": {
//     "attribute": "annot_source",
//     "map": [
//       {
//         "v": "CC",
//         "vp": "#CCFFFF"
//       },
//       {
//         "v": "HPA",
//         "vp": "#CCFFCC"
//       },
//       {
//         "v": "novel",
//         "vp": "#FFCCCC"
//       }
//     ]
//   },
//   "type": "DISCRETE"
// },