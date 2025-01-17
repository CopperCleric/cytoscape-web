import { ReactElement } from 'react'
import { Box, LinearProgress } from '@mui/material'

interface MessagePanelProps {
  message: string
  subMessage?: string
  showProgress?: boolean
}

export const MessagePanel = (props: MessagePanelProps): ReactElement => {
  return (
    <Box
      sx={{ width: '100%', height: '100%', display: 'grid', padding: '1em' }}
    >
      <Box sx={{ margin: 'auto' }}>
        <h2>{props.message}</h2>
        <h6>{props.subMessage}</h6>
        {props.showProgress ?? false ? <LinearProgress /> : null}
      </Box>
    </Box>
  )
}
