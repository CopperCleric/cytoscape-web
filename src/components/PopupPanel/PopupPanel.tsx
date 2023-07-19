import { Card } from '@mui/material'
import { ReactElement } from 'react'
import { GraphObjectPropertyPanel } from './GraphObjectPropertyPanel'
import { useViewModelStore } from '../../store/ViewModelStore'
import { useWorkspaceStore } from '../../store/WorkspaceStore'
import { useTableStore } from '../../store/TableStore'
import { Table, ValueType } from '../../models/TableModel'

interface PopupPanelProps {
  visible: boolean
  position: [number, number]
  setVisible: (visible: boolean) => void
}

export const PopupPanel = ({
  visible,
  position: [x, y],
  setVisible,
}: PopupPanelProps): ReactElement => {
  const networkId: string = useWorkspaceStore(
    (state) => state.workspace.currentNetworkId,
  )

  const tables = useTableStore((state) => state.tables)
  const nodeTable: Table = tables[networkId]?.nodeTable

  const { selectedNodes } =
    useViewModelStore((state) => state.viewModels[networkId]) ?? {}

  if (!visible || selectedNodes === undefined || selectedNodes.length === 0) {
    return <></>
  } else if (selectedNodes.length > 1) {
    // This will be displayed only when single node is selected
    return <></>
  }

  const selectedNodeId = selectedNodes[0]
  const { rows } = nodeTable
  const row: Record<string, ValueType> = rows.get(selectedNodeId) ?? {}

  return (
    <Card
      variant="outlined"
      sx={{
        position: 'fixed',
        top: y,
        left: x,
        borderRadius: '0.5em',
        maxHeight: '20vh',
        maxWidth: '20em',
        overflow: 'auto',
        padding: 0,
      }}
      onClick={(event) => {
        event.stopPropagation()
        setVisible(false)
      }}
    >
      <GraphObjectPropertyPanel row={row} />
    </Card>
  )
}