import {
  Box,
  Button,
  FormControlLabel,
  Checkbox,
  TextField,
  DialogActions,
} from '@mui/material'
import { ReactElement, useState } from 'react'
//@ts-expect-error
import { saveAs } from 'file-saver'
import { ExportImageFormatProps } from './ExportNetworkToImageMenuItem'
import { useRendererFunctionStore } from '../../../../store/RendererFunctionStore'
import { IdType } from '../../../../models/IdType'
import { useUiStateStore } from '../../../../store/UiStateStore'
import { useWorkspaceStore } from '../../../../store/WorkspaceStore'

export const SvgExportForm = (props: ExportImageFormatProps): ReactElement => {
  const [loading, setLoading] = useState(false)
  const [fullBg, setFullBg] = useState(true)
  const [fileName, setFileName] = useState<string>('network')

  const activeNetworkId: IdType = useUiStateStore(
    (state) => state.ui.activeNetworkView,
  )
  const currentNetworkId: IdType = useWorkspaceStore(
    (state) => state.workspace.currentNetworkId,
  )

  const targetNetworkId: IdType =
    activeNetworkId === undefined || activeNetworkId === ''
      ? currentNetworkId
      : activeNetworkId

  const svgFunction = useRendererFunctionStore((state) =>
    state.getFunction('cyjs', 'exportSvg', targetNetworkId),
  )

  return (
    <Box sx={{ p: 1 }}>
      <Box>
        <TextField
          size="small"
          label="File name"
          type="text"
          value={fileName}
          onChange={(e) => {
            setFileName(e.target.value)
          }}
          InputLabelProps={{
            shrink: true,
          }}
        ></TextField>
      </Box>

      <Box sx={{ p: 1 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={fullBg}
              onChange={(e) => setFullBg(e.target.checked)}
            />
          }
          label="Export full network image"
        />
      </Box>
      <DialogActions>
        <Button color="error" onClick={props.handleClose}>
          Cancel
        </Button>
        <Button
          disabled={loading}
          onClick={async () => {
            setLoading(true)
            const result = await svgFunction?.()
            const blob = new Blob([result], { type: 'image/svg+xml' })
            saveAs(blob, `${fileName}.svg`)
            setLoading(false)
            props.handleClose()
          }}
        >
          Confirm
        </Button>
      </DialogActions>
    </Box>
  )
}