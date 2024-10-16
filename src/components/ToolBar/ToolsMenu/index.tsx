import Button from '@mui/material/Button'
import { useRef, useState } from 'react'
import { DropdownMenuProps } from '../DropdownMenuProps'
import { MergeNetwork } from './MergeNetwork'
import { PrimeReactProvider } from 'primereact/api'
import { OverlayPanel } from 'primereact/overlaypanel'
import { TieredMenu } from 'primereact/tieredmenu'
import { useAppStore } from '../../../store/AppStore'
import { ServiceApp } from '../../../models/AppModel/ServiceApp'
import {
  Box,
  Checkbox,
  Dialog,
  FormControlLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import {
  ParameterUIType,
  ServiceAppParameter,
} from '../../../models/AppModel/ServiceAppParameter'
import { useTableStore } from '../../../store/TableStore'
import { useUiStateStore } from '../../../store/UiStateStore'
import { IdType } from '../../../models'

interface AppMenuItemProps {
  handleClose: () => void
  app: ServiceApp
  open: boolean
}

export const AppMenuItemDialog: React.FC<AppMenuItemProps> = ({
  handleClose,
  app,
  open,
}) => {
  const [formValues, setFormValues] = useState<{ [key: string]: any }>({})

  const handleInputChange = (name: string, value: any) => {
    setFormValues((prevValues) => ({
      ...prevValues,
      [name]: value,
    }))
  }

  const renderParameter = (parameter: ServiceAppParameter) => {
    const activeNetworkId: IdType = useUiStateStore(
      (state) => state.ui.activeNetworkView,
    )
    const nodeColumns =
      useTableStore(
        (state) => state.tables?.[activeNetworkId]?.nodeTable?.columns,
      ) ?? []

    const edgeColumns =
      useTableStore(
        (state) => state.tables?.[activeNetworkId]?.nodeTable?.columns,
      ) ?? []
    switch (parameter.type) {
      case ParameterUIType.Text:
        return (
          <TextField
            label={parameter.displayName}
            value={formValues[parameter.displayName] || ''}
            onChange={(e) =>
              handleInputChange(parameter.displayName, e.target.value)
            }
            helperText={parameter.description}
          />
        )
      case ParameterUIType.DropDown:
        return (
          <Select
            label={parameter.displayName}
            value={formValues[parameter.displayName] || ''}
          >
            {parameter.valueList.map((value, i) => (
              <MenuItem
                key={i}
                onClick={() => handleInputChange(parameter.displayName, value)}
              >
                {value}
              </MenuItem>
            ))}
          </Select>
        )
      case ParameterUIType.Radio:
        return (
          <RadioGroup
            value={formValues[parameter.displayName] || ''}
            onChange={(e) =>
              handleInputChange(parameter.displayName, e.target.value)
            }
          >
            {parameter.valueList.map((value, i) => (
              <FormControlLabel
                key={i}
                value={value}
                control={<Radio />}
                label={value}
              />
            ))}
          </RadioGroup>
        )
      case ParameterUIType.CheckBox:
        return (
          <FormControlLabel
            control={
              <Checkbox
                checked={formValues[parameter.displayName] || false}
                onChange={(e) =>
                  handleInputChange(parameter.displayName, e.target.checked)
                }
              />
            }
            label={parameter.displayName}
          />
        )

      case ParameterUIType.NodeColumn:
        return (
          <Select
            label={parameter.displayName}
            value={formValues[parameter.displayName] || ''}
          >
            {nodeColumns.map((column, i) => (
              <MenuItem
                key={i}
                onClick={() => handleInputChange(parameter.displayName, column)}
              >
                {column.name}
              </MenuItem>
            ))}
          </Select>
        )
      case ParameterUIType.EdgeColumn:
        return (
          <Select
            label={parameter.displayName}
            value={formValues[parameter.displayName] || ''}
          >
            {edgeColumns.map((column, i) => (
              <MenuItem
                key={i}
                onClick={() => handleInputChange(parameter.displayName, column)}
              >
                {column.name}
              </MenuItem>
            ))}
          </Select>
        )
      default:
        return null
    }
  }

  const handleSubmit = () => {
    console.log('Form Values:', formValues)
    handleClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      onKeyDown={(e) => {
        e.stopPropagation()
      }}
      onClick={(e) => {
        e.stopPropagation()
      }}
    >
      <Box style={{ padding: '20px' }}>
        <Typography>{app.name}</Typography>
        <Box>
          {app.parameters.map((parameter: ServiceAppParameter) => (
            <Box key={parameter.displayName} style={{ marginBottom: '20px' }}>
              {renderParameter(parameter)}
            </Box>
          ))}
          <Button onClick={handleSubmit} color="primary" variant="contained">
            Submit
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}

export const AppMenuItem: React.FC<{
  handleClose: () => void
  app: ServiceApp
}> = (props: AppMenuItemProps) => {
  const [openDialog, setOpenDialog] = useState<boolean>(false)

  const { handleClose, app } = props
  const handleOpenDialog = (): void => {
    setOpenDialog(true)
  }

  const handleCloseDialog = (): void => {
    setOpenDialog(false)
    handleClose() // Call handleClose from props if needed
  }

  return (
    <>
      <MenuItem onClick={() => handleOpenDialog()}>{app.name}</MenuItem>
      <AppMenuItemDialog
        open={openDialog}
        handleClose={handleCloseDialog}
        app={app}
      />
    </>
  )
}

export const ToolsMenu: React.FC<DropdownMenuProps> = (
  props: DropdownMenuProps,
) => {
  const { label } = props
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const serviceApps = useAppStore((state) => state.serviceApps)
  const app = serviceApps[Object.keys(serviceApps)?.[0]]
  console.log(serviceApps)

  const handleClose = (): void => {
    setAnchorEl(null)
  }

  const op = useRef(null)

  const menuItems = [
    {
      label: 'Merge Networks',
      template: <MergeNetwork handleClose={handleClose} />,
    },
    {
      label: 'Example Service App',
      items: [
        {
          label: 'Add Column to Network',
          template: <AppMenuItem handleClose={handleClose} app={app} />,
        },
      ],
    },
  ]

  return (
    <PrimeReactProvider>
      <Button
        sx={{
          color: 'white',
          textTransform: 'none',
        }}
        id={label}
        aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={(e) => (op.current as any)?.toggle(e)}
      >
        {label}
      </Button>
      <OverlayPanel ref={op} unstyled>
        <TieredMenu model={menuItems} />
      </OverlayPanel>
    </PrimeReactProvider>
  )
}
