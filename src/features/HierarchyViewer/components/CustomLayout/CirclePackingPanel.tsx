import { Box, Tooltip } from '@mui/material'
import * as d3Hierarchy from 'd3-hierarchy'
import * as d3Selection from 'd3-selection'
import * as d3Zoom from 'd3-zoom'
import { useEffect, useRef, useState } from 'react'
import { Network } from '../../../../models/NetworkModel'
import { Table } from '../../../../models/TableModel'
import {
  CirclePackingType,
  createCirclePackingView,
  createTreeLayout,
} from './CirclePackingLayout'
import { getColorMapper } from './CirclePackingUtils'
// import { IdType } from '../../../../models/IdType'
import { D3TreeNode } from './D3TreeNode'
import { useViewModelStore } from '../../../../store/ViewModelStore'
import { NetworkView } from '../../../../models/ViewModel'
import { IdType } from '../../../../models/IdType'
import { CirclePackingView } from '../../model/CirclePackingView'

interface CirclePackingPanelProps {
  network: Network
  nodeTable: Table
  // selected?: IdType // Selected subsystem
}

/**
 * Circle Packing renderer as a variant of the network viewer
 *
 *
 */
export const CirclePackingPanel = ({
  network,
  nodeTable,
}: CirclePackingPanelProps): JSX.Element => {
  // Use this ref to access the SVG element generated by D3
  const ref = useRef(null)

  // Use this ref to access the parent element for checking the dimensions
  const refParent = useRef<HTMLDivElement>(null)

  // Check if the component is initialized
  const initRef = useRef(false)

  // Dimensions of the parent element
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  const networkId: IdType = network.id

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

  // Pick the first selected node
  const selected: string = circlePackingView?.selectedNodes[0]

  // For tooltip
  const [tooltipOpen, setTooltipOpen] = useState<boolean>(false)
  const [tooltipContent, setTooltipContent] = useState<string>('')
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

  /**
   * Setup listener for resizing the SVG element
   */
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      if (!Array.isArray(entries) || !entries.length) {
        return
      }
      const entry = entries[0]
      setDimensions({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      })
    })

    if (refParent.current) {
      observer.observe(refParent.current)
    }

    return () => {
      if (refParent.current) {
        observer.unobserve(refParent.current)
      }
    }
  }, [])

  /**
   * Based on the network data and original view model, create a Circle Packing view model
   */
  useEffect(() => {
    if (network === undefined) return
    const primaryView = getViewModel(network.id)
    if (primaryView === undefined) return

    const rootNode: d3Hierarchy.HierarchyNode<D3TreeNode> = createTreeLayout(
      network,
      nodeTable,
    )

    const cpViewModel: CirclePackingView = createCirclePackingView(
      primaryView,
      rootNode,
    )
    addViewModel(network.id, cpViewModel)
  }, [network])

  useEffect(() => {
    
    const handleZoom = (e: any): void => {
      d3Selection.select('svg g').attr('transform', e.transform)
    }
    
    if (
      ref.current === null ||
      initRef.current ||
      network === undefined ||
      dimensions.width === 0 ||
      dimensions.height === 0
    ) return

    if(circlePackingView === undefined) return

    // const rootNode: d3Hierarchy.HierarchyNode<D3TreeNode> = createTreeLayout(
    //   network,
    //   nodeTable,
    // )

    const rootNode: d3Hierarchy.HierarchyNode<D3TreeNode> = circlePackingView?.hierarchy as d3Hierarchy.HierarchyNode<D3TreeNode>
    const pack = d3Hierarchy
      .pack()
      .size([dimensions.width, dimensions.width])
      .padding(0)
    pack(rootNode)

    const colorScale = getColorMapper([0, 1000])
    // Pick the base tag
    const svg = d3Selection.select(ref.current)
    const wrapper = svg.append('g').attr('class', 'circle-packing-wrapper')
    const zoom = d3Zoom.zoom().scaleExtent([0.1, 20]).on('zoom', handleZoom)

    svg.call(zoom)

    let timeoutId: any = null
    wrapper
      .append('g')
      .selectAll('circle')
      .data(rootNode.descendants())
      .join('circle')
      .attr('cx', (d: d3Hierarchy.HierarchyCircularNode<any>) => d.x)
      .attr('cy', (d: d3Hierarchy.HierarchyCircularNode<any>) => d.y)
      .attr('r', (d: d3Hierarchy.HierarchyCircularNode<any>) => d.r)
      .attr('stroke', (d: d3Hierarchy.HierarchyCircularNode<any>) =>
        getViewModel(network.id)?.selectedNodes.includes(d.data.id)
          ? 'orange'
          : '#666',
      )
      .attr('stroke-width', (d: d3Hierarchy.HierarchyCircularNode<any>) =>
        d.data.id === selected || d.data.originalId === selected ? 1 : 0.04,
      )
      .attr('fill', (d) => {
        return colorScale(d.depth * 100)
      })
      .on('mouseenter', function (e, d) {
        if (timeoutId !== null) {
          clearTimeout(timeoutId)
        }

        // d3Selection.select(this).attr('stroke', 'red').attr('stroke-width', 1)
        timeoutId = setTimeout(() => {
          if (tooltipOpen === false) {
            setTooltipContent(`Tooltip content for ${d.data.name}`)
            setTooltipPosition({ x: e.clientX, y: e.clientY })
            setTooltipOpen(true)
          }
        }, 1000)
      })
      .on('mouseout', function () {
        if (timeoutId !== null) {
          clearTimeout(timeoutId)
        }
        d3Selection
          .select(this)
          // .attr('stroke', '#666')
          .attr('stroke-width', 0.1)

        setTooltipOpen(false)
      })
      .on('click', function (e, d) {
        console.log('click', e, d)
        if (d.height !== 0) {
          if (d.data.originalId !== undefined) {
            exclusiveSelect(network.id, [d.data.originalId], [])
          } else {
            exclusiveSelect(network.id, [d.data.id], [])
          }
        }
      })
      .on('mousemove', function (e) {
        setTooltipPosition({ x: e.clientX, y: e.clientY })
      })

    wrapper
      .append('g')
      .selectAll('text')
      .data(rootNode.descendants())
      .join('text')

      .text((d: d3Hierarchy.HierarchyCircularNode<any>) => d.data.name)
      .attr('font-size', (d: d3Hierarchy.HierarchyCircularNode<any>) =>
        // d.data.id === selected || d.data.originalId === selected
        d.height === 0
          ? '0em'
          : // : `0.05em`,
            // : 1,
            `${0.1 / d.depth}em`,
      )
      .attr('text-anchor', 'middle')
      .attr('x', (d: d3Hierarchy.HierarchyCircularNode<any>) => d.x)
      .attr('y', (d: d3Hierarchy.HierarchyCircularNode<any>) => d.y)

    // Initialized
    initRef.current = true
  }, [circlePackingView, dimensions])

  useEffect(() => {
    // Update the stroke color of the circles based on whether their node is selected
    d3Selection
      .select('.circle-packing-wrapper')
      .selectAll('circle')
      .attr('stroke', (d: d3Hierarchy.HierarchyCircularNode<any>) =>
        circlePackingView?.selectedNodes.includes(d.data.id) ? 'orange' : '#666',
      )
  }, [circlePackingView?.selectedNodes])

  return (
    <Box ref={refParent} sx={{ width: '100%', height: '100%' }}>
      {network !== undefined ? (
        <svg ref={ref} width={dimensions.width} height={dimensions.height} />
      ) : null}
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
    </Box>
  )
}
