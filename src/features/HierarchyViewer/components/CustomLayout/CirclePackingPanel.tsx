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

const CpDefaults = {
  borderColor: '#666',
  selectedBorderColor: 'orange',
  hoverBorderColor: 'teal',
  borderWidth: 0.05,
  borderWidthHover: 1,
} as const

const CP_WRAPPER_CLASS = 'circle-packing-wrapper'

// type CpDefaultsType = typeof CpDefaults[keyof typeof CpDefaults]

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
    const primaryView = getViewModel(networkId)
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
    if (
      ref.current === null ||
      initRef.current ||
      network === undefined ||
      dimensions.width === 0 ||
      dimensions.height === 0
    )
      return

    if (circlePackingView === undefined) return

    const rootNode: d3Hierarchy.HierarchyNode<D3TreeNode> =
      circlePackingView?.hierarchy as d3Hierarchy.HierarchyNode<D3TreeNode>
    const pack = d3Hierarchy
      .pack()
      .size([dimensions.width, dimensions.width])
      .padding(0)
    pack(rootNode)

    const colorScale = getColorMapper([0, 1000])
    // Pick the base tag
    const svg = d3Selection.select(ref.current)
    const wrapper = svg.append('g').attr('class', CP_WRAPPER_CLASS)

    const showObjects = (
      d: d3Hierarchy.HierarchyNode<D3TreeNode>,
      maxDepth: number,
    ): string => {
      if (d.depth === 0 || d.depth <= maxDepth) {
        return 'inline'
      } else {
        return 'none'
      }
    }

    /**
     * Control labels
     * @param e
     */
    const handleZoom = (e: any): void => {
      d3Selection.select('svg g').attr('transform', e.transform)

      const currentZoomLevel = e.transform.k
      const maxDepth = Math.ceil(currentZoomLevel)

      d3Selection
        .selectAll('circle')
        .style('display', (d: d3Hierarchy.HierarchyNode<D3TreeNode>): string =>
          showObjects(d, maxDepth),
        )

      d3Selection
        .selectAll('text')
        .style(
          'display',
          (d: d3Hierarchy.HierarchyNode<D3TreeNode>): string => {
            // Zooming logic:
            // 1. If the node is the root node, always hide the label
            // 2. If leaf node, hide the label if the zoom level is below the threshold
            // 3. If non-leaf node, show the label based on the expansion level
            const isLeaf: boolean = d.height === 0
            // if (isLeaf) {
            //   return 'none'
            // }

            if (d.depth !== 0 && d.depth === maxDepth) {
              return 'inline'
            } else if (isLeaf && d.depth < maxDepth) {
              return 'inline'
            } else {
              return 'none'
            }
          },
        )
    }
    const zoom = d3Zoom.zoom().scaleExtent([0.1, 40]).on('zoom', handleZoom)

    svg.call(zoom).on('dblclick.zoom', () => {
      svg.call(zoom, d3Zoom.zoomIdentity)
    })

    wrapper
      .append('g')
      .selectAll('circle')
      .data(rootNode.descendants())
      .join('circle')
      .attr('cx', (d: d3Hierarchy.HierarchyCircularNode<any>) => d.x)
      .attr('cy', (d: d3Hierarchy.HierarchyCircularNode<any>) => d.y)
      .attr('r', (d: d3Hierarchy.HierarchyCircularNode<any>) => d.r)
      .attr('stroke', (d: d3Hierarchy.HierarchyCircularNode<any>) =>
        selected === d.data.id ? 'orange' : '#666',
      )
      .attr('stroke-width', (d: d3Hierarchy.HierarchyCircularNode<any>) => {
        return d.data.id === selected || d.data.originalId === selected
          ? 1
          : CpDefaults.borderWidth
      })
      .attr('fill', (d) => {
        return colorScale(d.depth * 200)
      })
      .on(
        'mouseenter',
        function (e, d: d3Hierarchy.HierarchyCircularNode<D3TreeNode>) {
          setHoveredEnter(d.data)
        },
      )
      .on('click', function (e, d) {
        if (d.height !== 0) {
          if (d.data.originalId !== undefined) {
            exclusiveSelect(network.id, [d.data.originalId], [])
          } else {
            exclusiveSelect(network.id, [d.data.id], [])
          }
        }
      })
      .on('mousemove', function (e) {
        setTooltipPosition({ x: e.clientX + 20, y: e.clientY + 20 })
      })

    wrapper
      .append('g')
      .selectAll('text')
      .data(rootNode.descendants())
      .join('text')
      .each(function (d: d3Hierarchy.HierarchyCircularNode<D3TreeNode>) {
        const row = nodeTable.rows.get(d.data.id)
        let label = d.data.name
        if (row !== undefined) {
          label = row['FINAL ANSWER ROUND 1'] as string
        }

        if (label === undefined) {
          label = d.data.name
        }

        // Split the label into words
        const words = label.split(' ')

        const fontSize = getFontSize(d)
        // Calculate the total height of the text
        const textHeight: number = words.length * fontSize
        // Create a tspan for each word
        words.forEach((word: string, lineNumber: number) => {
          d3Selection
            .select(this)
            .append('tspan')
            .text(word)
            .attr('x', d.x)
            .attr(
              'y',
              d.y + (lineNumber * fontSize * 1.2) - textHeight / 2 + fontSize / 2,
            ) // Adjust the y position based on the line number
        })
        // if (row === undefined) return d.data.name
        // const label = row['FINAL ANSWER ROUND 1']
        // return label === undefined ? d.data.name : label
      })
      .attr(
        'font-size',
        (d: d3Hierarchy.HierarchyCircularNode<any>) => `${d.r / 70}em`,
      )
      .attr('text-anchor', 'middle')
      .attr('x', (d: d3Hierarchy.HierarchyCircularNode<any>) => d.x)
      .attr('y', (d: d3Hierarchy.HierarchyCircularNode<any>) => d.y)
      .style('display', (d: d3Hierarchy.HierarchyNode<D3TreeNode>): string => {
        const isLeaf: boolean = d.height === 0
        return isLeaf ? 'none' : 'inline'
      })

    // Initialized
    initRef.current = true
  }, [circlePackingView, dimensions])

  const getFontSize = (d: d3Hierarchy.HierarchyCircularNode<any>): number => {
    return (d.r / 90) * 16
  }

  const [hoveredEnter, setHoveredEnter] = useState<D3TreeNode>()
  useEffect(() => {
    setTooltipContent(`${hoveredEnter?.name}`)
    setTooltipOpen(true)
    const timeoutId = setTimeout(() => {
      setTooltipOpen(false)
    }, 2000)

    // Clear the timeout when the component unmounts
    return () => {
      clearTimeout(timeoutId)
    }
  }, [hoveredEnter])

  useEffect(() => {
    // Update the stroke color of the circles based on whether their node is selected
    d3Selection
      .select('.circle-packing-wrapper')
      .selectAll('circle')
      .attr('stroke', (d: d3Hierarchy.HierarchyCircularNode<D3TreeNode>) =>
        d.data.id === selected
          ? CpDefaults.selectedBorderColor
          : CpDefaults.borderColor,
      )
      .attr(
        'stroke-width',
        (d: d3Hierarchy.HierarchyCircularNode<D3TreeNode>) =>
          d.data.id === selected
            ? CpDefaults.borderWidthHover
            : CpDefaults.borderWidth,
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
