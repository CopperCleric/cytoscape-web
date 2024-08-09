import { SxProps, Box } from '@mui/material'

import {
  NodeVisualPropertyNames,
  VisualProperty,
  VisualPropertyValueType,
} from '../../../models/VisualStyleModel'
import { IdType } from '../../../models/IdType'

import { useVisualStyleStore } from '../../../store/VisualStyleStore'

import { VisualPropertyValueForm } from './VisualPropertyValueForm'

export function DefaultValueForm(props: {
  visualProperty: VisualProperty<VisualPropertyValueType>
  currentNetworkId: IdType
  sx?: SxProps
}): React.ReactElement {
  const { visualProperty, currentNetworkId } = props
  const setDefault = useVisualStyleStore((state) => state.setDefault)

  return (
    <Box sx={props.sx ?? {}}>
      <VisualPropertyValueForm
        title={`Default ${visualProperty.displayName}`}
        visualProperty={visualProperty}
        currentValue={visualProperty.defaultValue}
        currentNetworkId={currentNetworkId}
        showCheckbox={true}
        onValueChange={(newValue) =>
          setDefault(currentNetworkId, visualProperty.name, newValue)
        }
      />
    </Box>
  )
}
