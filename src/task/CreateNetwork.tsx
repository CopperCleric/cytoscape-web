import NetworkFn, { NetworkAttributes } from '../models/NetworkModel'
import {
  getBaseSummary,
  IdType,
  Network,
  NetworkView,
  Table,
  VisualStyle,
} from '../models'
import { v4 as uuidv4 } from 'uuid'
import TableFn from '../models/TableModel'
import ViewModelFn from '../models/ViewModel'
import VisualStyleFn from '../models/VisualStyleModel'
import { NetworkWithView } from '../models/NetworkWithViewModel'
import { useNetworkStore } from '../store/NetworkStore'
import { useTableStore } from '../store/TableStore'
import { useViewModelStore } from '../store/ViewModelStore'
import { useVisualStyleStore } from '../store/VisualStyleStore'
import { useCallback } from 'react'
import { NetworkStore } from '../models/StoreModel/NetworkStoreModel'
import { TableStore } from '../models/StoreModel/TableStoreModel'
import { useNetworkSummaryStore } from '../store/NetworkSummaryStore'

/**
 * Create an empty network object with generated ID
 *
 * @returns Network object
 *
 */
export const createEmptyNetwork = (): Network => {
  const id: IdType = uuidv4()
  return NetworkFn.createNetworkFromLists(id, [], [])
}

/**
 * Create a complete network object with view and style for the given network
 *
 * @param network
 *
 * @returns NetworkWithView object
 */
export const createViewForNetwork = (network: Network): NetworkWithView => {
  const networkId: IdType = network.id

  // Add base columns (e.g., name)
  const nodeTable: Table = TableFn.createTable(networkId)
  const edgeTable: Table = TableFn.createTable(networkId)
  const visualStyle: VisualStyle = VisualStyleFn.createVisualStyle()
  const networkView: NetworkView = ViewModelFn.createViewModel(network)
  const networkAttributes: NetworkAttributes = {
    id: networkId,
    attributes: {},
  }

  const withView: NetworkWithView = {
    network,
    nodeTable,
    edgeTable,
    visualStyle,
    networkViews: [networkView],
    networkAttributes,
  }

  return withView
}

interface CreateNetworkWithViewProps {
  name?: string
  description?: string
}

/**
 * Register all of the objects in the given networkWithView object
 *
 */
export const useCreateNetworkWithView = (): (({
  name,
  description,
}: CreateNetworkWithViewProps) => NetworkWithView) => {
  const addNetwork = useNetworkStore((state: NetworkStore) => state.add)
  const addTable = useTableStore((state: TableStore) => state.add)
  const addViewModel = useViewModelStore((state) => state.add)
  const addVisualStyle = useVisualStyleStore((state) => state.add)
  const addSummary = useNetworkSummaryStore((state) => state.add)

  const createNetworkWithView = useCallback(
    ({ name, description }: CreateNetworkWithViewProps) => {
      const network: Network = createEmptyNetwork()
      const withView: NetworkWithView = createViewForNetwork(network)
      const summary = getBaseSummary({
        uuid: network.id,
        name: name || '',
        description: description || '',
      })
      addNetwork(network)
      addVisualStyle(network.id, withView.visualStyle)
      addTable(network.id, withView.nodeTable, withView.edgeTable)
      addViewModel(network.id, withView.networkViews[0])
      addSummary(network.id, summary)

      return withView
    },
    [],
  )

  return createNetworkWithView
}
