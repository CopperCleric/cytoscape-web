import { Box } from '@mui/material'
import { grey } from '@mui/material/colors'
import { ReactElement, useEffect, useState } from 'react'
import { IdType } from '../../models/IdType'
import { Network } from '../../models/NetworkModel'
import { useNetworkStore } from '../../store/NetworkStore'
import { useWorkspaceStore } from '../../store/WorkspaceStore'
import { MessagePanel } from '../Messages'
import { CyjsRenderer } from './CyjsRenderer'

const NetworkPanel = (): ReactElement => {
  const currentNetworkId: IdType = useWorkspaceStore(
    (state) => state.workspace.currentNetworkId,
  )
  const networks: Map<IdType, Network> = useNetworkStore(
    (state) => state.networks,
  )

  const [isBusy, setIsBusy] = useState<boolean>(false)

  useEffect(() => {
    console.log('NetworkPanel: ID change useEffect', currentNetworkId)
    setIsBusy(true)
  }, [currentNetworkId])

  if (networks.size === 0) {
    return <MessagePanel message="No network selected" />
  }

  const targetNetwork: Network = networks.get(currentNetworkId) ?? {
    id: '', // an empty network
    nodes: [],
    edges: [],
  }

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      {isBusy ? (
        <Box
          sx={{
            zIndex: 200,
            background: grey[100],
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: '100%',
          }}
        >
          <MessagePanel message="Preparing network data..." />
        </Box>
      ) : null}
      <CyjsRenderer
        network={targetNetwork}
        setIsBusy={setIsBusy}
        isBusy={isBusy}
      />
    </Box>
  )
}

export default NetworkPanel
