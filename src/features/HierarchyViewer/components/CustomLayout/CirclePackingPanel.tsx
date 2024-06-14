import { Tooltip } from '@mui/material'
import * as d3Hierarchy from 'd3-hierarchy'
import * as d3Selection from 'd3-selection'
import * as d3Zoom from 'd3-zoom'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Network } from '../../../../models/NetworkModel'
import {
  CirclePackingType,
  createCirclePackingView,
  createTreeLayout,
} from './CirclePackingLayout'
import {
  CpDefaults,
  displaySelectedNodes,
  findHierarchyNode,
  getColorMapper,
  getFontSize,
  getLabel,
  getWordLines,
} from './CirclePackingUtils'
import { D3TreeNode } from './D3TreeNode'
import { useViewModelStore } from '../../../../store/ViewModelStore'
import { NetworkView } from '../../../../models/ViewModel'
import { IdType } from '../../../../models/IdType'
import { CirclePackingView } from '../../model/CirclePackingView'
import { useVisualStyleStore } from '../../../../store/VisualStyleStore'
import { VisualStyle } from '../../../../models/VisualStyleModel'
import { applyVisualStyle } from '../../../../models/VisualStyleModel/impl/VisualStyleFnImpl'
import { useSubNetworkStore } from '../../store/SubNetworkStore'
import { useTableStore } from '../../../../store/TableStore'
import { SearchState } from '../../../../models/FilterModel/SearchState'
import { useFilterStore } from '../../../../store/FilterStore'
import { useRendererFunctionStore } from '../../../../store/RendererFunctionStore'

interface CirclePackingPanelProps {
  rendererId: string
  network: Network
  visible: boolean
  initialSize?: { w: number; h: number }
}

const CP_WRAPPER_CLASS = 'circle-packing-wrapper'

// Color scale for the circles in the view
const colorScale = getColorMapper([0, 5])

/**
 * Circle Packing renderer as a variant of the network viewer
 *
 *
 */
export const CirclePackingPanel = ({
  rendererId,
  network,
  initialSize,
  visible,
}: CirclePackingPanelProps): JSX.Element => {
  // Use this ref to access the SVG element generated by D3
  const ref = useRef<SVGSVGElement>(null)

  // Reference to check the Circle Packing is initialized or not
  const initRef = useRef(false)

  const zoomRef = useRef<d3Zoom.ZoomBehavior<Element, any> | null>(null)

  // Keep the transform state for zooming
  const [transform, setTransform] = useState(d3Zoom.zoomIdentity)

  // Check the state of the search result
  const searchState: SearchState = useFilterStore((state) => state.search.state)

  const [lastNetworkId, setLastNetworkId] = useState<IdType>('')

  // Expand all circles if the search result is shown
  const [expandAll, setExpandAll] = useState<boolean>(false)

  // For keeping track of the selected leaf node which does not exist in the original network
  const [selectedLeaf, setSelectedLeaf] = useState<string>('')

  // ID of the network to be rendered
  const networkId: IdType = network.id
  const tables = useTableStore((state) => state.tables)

  // Tables associated with the network
  const { nodeTable, edgeTable } = tables[networkId] ?? {}

  // Use visual style store for getting the visual style
  const visualStyles: Record<string, VisualStyle> = useVisualStyleStore(
    (state) => state.visualStyles,
  )

  // VS for the current network view
  const visualStyle: VisualStyle = visualStyles[networkId]

  // For adding newly created Circle Packing view model
  const addViewModel = useViewModelStore((state) => state.add)
  const getViewModel = useViewModelStore((state) => state.getViewModel)
  const viewModelMap: Record<IdType, NetworkView[]> = useViewModelStore(
    (state) => state.viewModels,
  )
  const views: NetworkView[] = viewModelMap[networkId] ?? []

  // For updating the selected nodes
  const exclusiveSelect = useViewModelStore((state) => state.exclusiveSelect)

  // Find CP View Model
  const circlePackingView: CirclePackingView | undefined = views.find(
    (view) => view.type === CirclePackingType,
  ) as CirclePackingView

  // Selected circle(s). Only the first one is used for now
  const selectedNodes: IdType[] = circlePackingView?.selectedNodes ?? []
  const selectedNodeSet = new Set<string>(selectedNodes)

  // For keeping track of the selected node's depth in the hierarchy
  const selectedDepthRef = useRef(0)
  // Keep the last zoom level for comparison
  const lastZoomLevelRef = useRef(0)

  // For fit function
  const getRendererFunction = useRendererFunctionStore(
    (state) => state.getFunction,
  )
  const setRendererFunction = useRendererFunctionStore(
    (state) => state.setFunction,
  )

  useEffect(() => {
    console.log('# Network View Visibility changed', visible, initialSize)
    if (!visible) return

    if (selectedNodes.length > 0) {
      const targetNode: IdType = selectedNodes[0]
      const rootNode =
        circlePackingView.hierarchy as d3Hierarchy.HierarchyCircularNode<D3TreeNode>
      const circleNode = findHierarchyNode(targetNode, rootNode)
      if (circleNode === undefined) {
        console.warn(
          'Node selected in primary view is not found in Circle Packing view',
        )
        return
      }

      const depth: number = circleNode.depth
      selectedDepthRef.current = depth
      updateForZoom(depth)
      lastZoomLevelRef.current = depth
    }

    // Move to center
    const fitFunction = getRendererFunction(rendererId, 'fit')
    if (fitFunction === undefined) {
      console.log('Registering fit function for CP renderer')
      setRendererFunction(rendererId, 'fit', fitCircle)
    }
    if (initialSize !== undefined && initialSize.w > 0 && initialSize.h > 0) {
      fitCircle()
    }
  }, [visible])

  /**
   * Fit the circle to the view port
   *
   * @returns
   */
  const fitCircle = () => {
    if (ref.current === null) return

    const { width, height } = ref.current.getBoundingClientRect()
    const parentWidth = width
    const parentHeight = height

    const wrapper = d3Selection.select(
      `g.${CP_WRAPPER_CLASS}`,
    ) as d3Selection.Selection<Element, any, any, any>
    if (wrapper === null) return

    const node = wrapper.node() as SVGGraphicsElement
    if (node === null) return

    const bbox = node.getBBox()
    const wrapperWidth = bbox.width
    const wrapperHeight = bbox.height

    const scaleX = parentWidth / wrapperWidth
    const scaleY = parentHeight / wrapperHeight
    const scale = Math.min(scaleX, scaleY) // Fit to the smaller dimension

    const scaledWidth = wrapperWidth * scale
    const scaledHeight = wrapperHeight * scale

    let translateX = 0
    let translateY = 0

    if (parentWidth > parentHeight) {
      // Wider rectangle area. Fit to the height to display the whole area
      translateX = 0
      translateY = (parentHeight - scaledHeight) / 2
    } else {
      // Tall area.
      translateX = (parentWidth - scaledWidth) / 2
      translateY = 0
    }

    console.log('Scaling factor::', scale, translateX, translateY)
    const newTransform = d3Zoom.zoomIdentity
      .translate(translateX, translateY)
      .scale(scale)

    if (zoomRef.current === null) return

    setTransform(newTransform)
    zoomRef.current.transform(wrapper, newTransform)
  }

  const handleZoom = (e: any): void => {
    const selectedArea = d3Selection.select(`g.${CP_WRAPPER_CLASS}`)
    selectedArea.attr('transform', e.transform)
    const currentZoomLevel = e.transform.k
    const maxDepth = Math.ceil(currentZoomLevel)

    if (selectedDepthRef.current > maxDepth) {
      lastZoomLevelRef.current = selectedDepthRef.current
    } else {
      lastZoomLevelRef.current = maxDepth
      updateForZoom(maxDepth)
    }
  }
  useEffect(() => {
    if (zoomRef.current !== null && ref.current !== null) {
      const selection = d3Selection.select(ref.current)
      selection.call(zoomRef.current.transform, d3Zoom.zoomIdentity)
    }
  }, [transform])

  useEffect(() => {
    updateForZoom(lastZoomLevelRef.current)
  }, [expandAll])

  useEffect(() => {
    if (searchState === SearchState.DONE) {
      setExpandAll(true)
    } else {
      setExpandAll(false)
    }
    updateForZoom(lastZoomLevelRef.current)
  }, [searchState])

  useEffect(() => {
    if (ref.current === null) return
    if (zoomRef.current !== null) {
      return
    }

    const svg: any = d3Selection.select(ref.current)
    const zoomBehavior: d3Zoom.ZoomBehavior<Element, any> = d3Zoom
      .zoom()
      .scaleExtent([0.1, 40])
      .on('zoom', handleZoom)

    // Share zoom behavior as a state
    zoomRef.current = zoomBehavior
    d3Selection.select(ref.current).call(zoomRef.current)
    return () => {
      svg.on('zoom', null)
    }
  }, [])

  // For tooltip
  const [tooltipOpen, setTooltipOpen] = useState<boolean>(false)
  const [tooltipContent, setTooltipContent] = useState<string>('')
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

  const [hoveredEnter, setHoveredEnter] = useState<D3TreeNode>()

  // For selecting nodes in the sub network view
  const setSelectedNodes = useSubNetworkStore((state) => state.setSelectedNodes)

  // For selecting leaf nodes from the selection in the linked interaction network
  const selectedHierarchyNodeNames = useSubNetworkStore(
    (state) => state.selectedHierarchyNodeNames,
  )

  useEffect(() => {
    if (selectedHierarchyNodeNames.length === 0) return
    setSelectedLeaf(selectedHierarchyNodeNames[0])
  }, [selectedHierarchyNodeNames])

  const showObjects = (
    d: d3Hierarchy.HierarchyNode<D3TreeNode>,
    maxDepth: number,
  ): string => {
    // Always display all subsystems/genes if the search result is shown
    if (expandAll || d.depth === 0 || d.depth <= maxDepth) {
      return 'inline'
    } else {
      return 'none'
    }
  }

  const updateForZoom = (maxDepth: number): void => {
    d3Selection
      .selectAll('circle')
      .style('display', (d: d3Hierarchy.HierarchyNode<D3TreeNode>): string =>
        showObjects(d, maxDepth),
      )

    d3Selection
      .selectAll('text')
      .style('display', (d: d3Hierarchy.HierarchyNode<D3TreeNode>): string => {
        // Zooming logic:
        // 1. If the node is the root node, always hide the label
        // 2. If leaf node, hide the label if the zoom level is below the threshold
        // 3. If non-leaf node, show the label based on the expansion level
        const isLeaf: boolean = d.height === 0

        if (d.depth !== 0 && d.depth === maxDepth) {
          return 'inline'
        } else if (isLeaf && d.depth < maxDepth) {
          return 'inline'
        } else {
          return 'none'
        }
      })
  }

  const draw = (rootNode: d3Hierarchy.HierarchyNode<D3TreeNode>): void => {
    // Pick the base tag
    const svg: any = d3Selection.select(ref.current)
    svg.selectAll('*').remove()

    const wrapper = svg.append('g').attr('class', CP_WRAPPER_CLASS)

    wrapper
      .append('g')
      .selectAll('circle')
      .data(rootNode.descendants())
      .join('circle')
      .attr('cx', (d: d3Hierarchy.HierarchyCircularNode<any>) => d.x)
      .attr('cy', (d: d3Hierarchy.HierarchyCircularNode<any>) => d.y)
      .attr('r', (d: d3Hierarchy.HierarchyCircularNode<any>) => d.r)
      .attr('stroke', (d: d3Hierarchy.HierarchyCircularNode<any>) =>
        selectedNodeSet.has(d.data.id)
          ? CpDefaults.selectedBorderColor
          : CpDefaults.borderColor,
      )
      .attr('stroke-width', (d: d3Hierarchy.HierarchyCircularNode<any>) => {
        // return d.data.id === selected || d.data.originalId === selected
        return selectedNodeSet.has(d.data.id) ||
          selectedNodeSet.has(d.data.originalId)
          ? CpDefaults.borderWidthHover
          : CpDefaults.borderWidth
      })
      .attr('fill', (d: d3Hierarchy.HierarchyNode<D3TreeNode>) => {
        return colorScale(d.depth)
        // return colorScale(d.depth * 200)
      })
      .on(
        'mouseenter',
        function (e: any, d: d3Hierarchy.HierarchyCircularNode<D3TreeNode>) {
          setHoveredEnter(d.data)
        },
      )
      .on('click', function (e: any, d: d3Hierarchy.HierarchyNode<D3TreeNode>) {
        if (d.height !== 0) {
          if (d.data.originalId !== undefined) {
            exclusiveSelect(network.id, [d.data.originalId], [])
          } else {
            exclusiveSelect(network.id, [d.data.id], [])
          }
        } else {
          // This is a leaf node

          // Set always one node by clicking on the leaf node
          setSelectedNodes([d.data.name])

          // Select the parent node instead
          const { parent } = d
          if (parent === null || parent === undefined) return

          const selectedChild = d.data.originalId ?? d.data.id
          setSelectedLeaf(selectedChild)

          if (parent.data.originalId !== undefined) {
            exclusiveSelect(network.id, [parent.data.originalId], [])
          } else {
            exclusiveSelect(network.id, [parent.data.id], [])
          }
        }
      })
      .on('mousemove', function (e: any) {
        setTooltipPosition({ x: e.clientX + 20, y: e.clientY + 20 })
      })

    // Add the text labels
    wrapper
      .append('g')
      .selectAll('text')
      .data(rootNode.descendants())
      .join('text')
      .each(function (d: d3Hierarchy.HierarchyCircularNode<D3TreeNode>) {
        // Add the label on top of the circle
        const label: string = getLabel(
          d.data.id,
          circlePackingView,
          d.data.name,
        )
        const fontSize = getFontSize(d, label)
        const newStrings: string[] = getWordLines(label)
        const textHeight: number = newStrings.length * fontSize

        newStrings.forEach((word: string, lineNumber: number) => {
          const element = d3Selection.select(this)
          const y: number =
            d.y + lineNumber * fontSize - textHeight / 2 + fontSize / 2
          addLabels(element, word, fontSize, d.x, y)
        })
      })
      .style('display', (d: d3Hierarchy.HierarchyNode<D3TreeNode>): string => {
        const isLeaf: boolean = d.height === 0
        const isRoot: boolean = d.depth === 0
        return isLeaf || isRoot ? 'none' : 'inline'
      })

    // Now this should work
    // const zoom = d3Zoom.zoom().scaleExtent([0.1, 40]).on('zoom', handleZoom)
    // svg.call(zoom)
    updateForZoom(1)
    // fitCircle()
  }

  const addLabels = (
    element: any,
    word: string,
    fontSize: number,
    x: number,
    y: number,
  ) => {
    element
      .append('tspan')
      .text(word)
      .attr('font-size', fontSize)
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'middle')
      .attr('text-align', 'center')
      .attr('x', x)
      .attr('y', y)
      .style('user-select', 'none')
  }

  /**
   * Redraw the circle packing layout when the view model has been updated
   */
  useEffect(() => {
    if (circlePackingView === undefined) return

    updateViewModel()
  }, [visualStyle])

  const updateViewModel = (): void => {
    if (network === undefined || nodeTable === undefined) return
    const primaryView = getViewModel(networkId)

    // Primary view is not ready yet.
    if (primaryView === undefined) return

    let rootNode: d3Hierarchy.HierarchyNode<D3TreeNode> =
      circlePackingView?.hierarchy as d3Hierarchy.HierarchyNode<D3TreeNode>

    if (rootNode === undefined) {
      rootNode = createTreeLayout(network, nodeTable)
    }

    const updatedView = applyVisualStyle({
      network: network,
      visualStyle: visualStyle,
      nodeTable: nodeTable,
      edgeTable: edgeTable,
      networkView: primaryView,
    })

    // Create a new Circle Packing view model
    // const width = ref.current?.clientWidth ?? 0
    // const height = ref.current?.clientHeight ?? 0
    const width = initialSize?.w ?? 0
    const height = initialSize?.h ?? 0
    const cpViewModel: CirclePackingView = createCirclePackingView(
      updatedView,
      rootNode,
      width,
      height,
    )

    // Register the new view model
    addViewModel(network.id, cpViewModel)
  }

  /**
   * Based on the network data and original view model, create a Circle Packing view model
   */
  useEffect(() => {
    if (ref.current === null) {
      return
    }

    // updateViewModel()
  }, [network])

  useEffect(() => {
    if (circlePackingView === undefined) return

    const isInitialized: boolean = initRef.current
    const rootNode: d3Hierarchy.HierarchyNode<D3TreeNode> =
      circlePackingView.hierarchy as d3Hierarchy.HierarchyNode<D3TreeNode>

    if (!isInitialized || networkId !== lastNetworkId) {
      draw(rootNode)
      //This should be called only once.
      initRef.current = true
      setLastNetworkId(networkId)
    } else {
      // Need to update the existing view, e.g., when the visual style is changed

      d3Selection
        .select(`.${CP_WRAPPER_CLASS}`)
        .selectAll('text')
        .data(rootNode.descendants())
        .join('text')
        .each(function (d: d3Hierarchy.HierarchyCircularNode<D3TreeNode>) {
          const textSelection = d3Selection.select(this)
          textSelection.selectAll('*').remove()

          // Add the label on top of the circle
          const label: string = getLabel(
            d.data.id,
            circlePackingView,
            d.data.name,
          )
          const fontSize = getFontSize(d, label)
          const newStrings: string[] = getWordLines(label)
          const textHeight: number = newStrings.length * fontSize

          newStrings.forEach((word: string, lineNumber: number) => {
            const element = d3Selection.select(this)
            const y: number =
              d.y + lineNumber * fontSize - textHeight / 2 + fontSize / 2
            addLabels(element, word, fontSize, d.x, y)
          })
        })
    }
  }, [circlePackingView])

  useEffect(() => {
    if (hoveredEnter === undefined) {
      setTooltipOpen(false)
      return
    }

    const label: string = getLabel(
      hoveredEnter.id,
      circlePackingView,
      hoveredEnter.name,
    )
    setTooltipContent(label)
    setTooltipOpen(true)
    const timeoutId = setTimeout(() => {
      setTooltipOpen(false)
    }, 3000)

    // Clear the timeout when the component unmounts
    return () => {
      clearTimeout(timeoutId)
    }
  }, [hoveredEnter])

  /**
   * Update the stroke color of the circles based on whether their node is selected
   */
  useEffect(() => {
    displaySelectedNodes(selectedNodeSet, selectedLeaf)

    // Expand circles to the level of the selected node and zoom in to that circle
    if (selectedNodes.length > 0) {
      // updateForZoom(9)
      // lastZoomLevelRef.current = 9
    }
  }, [selectedNodes, selectedLeaf])

  useEffect(() => {
    if (initialSize !== undefined && initialSize.w > 0 && initialSize.h > 0) {
      updateViewModel()
    }
  }, [initialSize])

  return (
    <>
      <svg id={'cpView'} ref={ref} width={'100%'} height={'100%'} />
      <Tooltip
        open={tooltipOpen}
        title={tooltipContent}
        style={{
          position: 'fixed',
          top: tooltipPosition.y,
          left: tooltipPosition.x,
        }}
      >
        <div />
      </Tooltip>
    </>
  )
}
