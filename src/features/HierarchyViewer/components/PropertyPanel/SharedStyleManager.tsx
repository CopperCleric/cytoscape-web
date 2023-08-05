import {
  Box,
  FormControlLabel,
  FormGroup,
  Switch,
  Theme,
  useTheme,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useVisualStyleSelectorStore } from '../../store/VisualStyleSelectorStore'
import { VisualStyle } from '../../../../models/VisualStyleModel'
import { useVisualStyleStore } from '../../../../store/VisualStyleStore'

interface SharedStyleManagerProps {
  networkId: string

  // This is the parent network ID and style's key
  rootNetworkId: string
}

export const SharedStyleManager = ({
  networkId,
  rootNetworkId,
}: SharedStyleManagerProps): JSX.Element => {
  const theme: Theme = useTheme()
  const [enable, setEnable] = useState<boolean>(true)

  const sharedStyles: Record<string, VisualStyle> = useVisualStyleSelectorStore(
    (state) => state.sharedVisualStyles,
  )
  const addSharedStyle = useVisualStyleSelectorStore((state) => state.add)

  const individualStyles: Record<string, VisualStyle> = useVisualStyleStore(
    (state) => state.visualStyles,
  )
  const addIndividualStyle = useVisualStyleStore((state) => state.add)

  const handleChange = (e: any): void => {
    setEnable(e.target.checked)
  }

  // Initialization. Check and apply shared style
  useEffect(() => {
    if (enable) {
      applySharedStyle()
    }
    return () => {
      if (enable) {
        // Copy the style as shared
        const editedStyle = individualStyles[networkId]
        if (editedStyle === undefined) {
          return
        }
        addSharedStyle(rootNetworkId, editedStyle)
      }
    }
  }, [])

  useEffect(() => {
    if (enable) {
      applySharedStyle()
    }
  }, [networkId])

  useEffect(() => {
    if (enable) {
      const editedStyle = individualStyles[networkId]
      if (editedStyle === undefined) {
        return
      }
      console.log('Visual style edited: ', editedStyle)
      addSharedStyle(rootNetworkId, editedStyle)
    }
  }, [individualStyles[networkId]])

  const applySharedStyle = (): void => {
    const sharedStyle = sharedStyles[rootNetworkId]
    if (sharedStyle === undefined) {
      return
    }

    addIndividualStyle(networkId, sharedStyle)
    console.log('*******************Shared Style applied: ', sharedStyle)
  }

  return (
    <Box sx={{ padding: theme.spacing(1) }}>
      <FormGroup>
        <FormControlLabel
          control={<Switch defaultChecked />}
          label="Use shared style"
          onChange={handleChange}
          checked={enable}
        />
      </FormGroup>
    </Box>
  )
}
