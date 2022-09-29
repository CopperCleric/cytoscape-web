import * as React from 'react'
import { Allotment } from 'allotment'
import { Box } from '@mui/material'
import TableBrowser from './Tabs'

export const WorkSpaceEditor: React.FC = () => {
  return (
    <Box sx={{ height: 'calc(100vh - 48px)' }}>
      <Allotment vertical>
        <Allotment.Pane>
          <Allotment>
            <Allotment.Pane preferredSize="30%">Side Panel</Allotment.Pane>
            <Allotment.Pane>Network View</Allotment.Pane>
          </Allotment>
        </Allotment.Pane>
        <Allotment.Pane minSize={38} preferredSize={38}>
          <TableBrowser />
        </Allotment.Pane>
      </Allotment>
    </Box>
  )
}
