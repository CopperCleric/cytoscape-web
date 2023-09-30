import { Box } from '@mui/material'
import * as d3Hierarchy from 'd3-hierarchy'
import * as d3Selection from 'd3-selection'
import * as d3Zoom from 'd3-zoom'
import { useEffect, useRef } from 'react'
import { Network } from '../../../../models/NetworkModel'
import { Table } from '../../../../models/TableModel'
import { createTreeLayout } from './CirclePackingLayout'
import { getColorMapper } from './CirclePackingUtils'
import { IdType } from '../../../../models/IdType'
import { D3TreeNode } from './D3TreeNode'

interface CirclePackingPanelProps {
  width: number
  height: number
  network?: Network
  nodeTable: Table
  selected?: IdType // Selected subsystem
}

// interface CirclePackingNode {
//   name: string
//   children?: CirclePackingNode[]
//   value?: number
//   x: number
//   y: number
//   r: number
// }
/**
 * Simple circle packing layout
 *
 * TODO: Add interactivity
 *
 * @param param0
 * @returns
 */
export const CirclePackingPanel = ({
  width,
  height,
  network,
  nodeTable,
  selected,
}: CirclePackingPanelProps): JSX.Element => {
  if (network === undefined) {
    return <></>
  }

  // Use this ref to access the SVG element generated by D3
  const ref = useRef(null)
  const initRef = useRef(false)
  const handleZoom = (e: any): void => {
    d3Selection.select('svg g').attr('transform', e.transform)
  }

  useEffect(() => {
    if (ref.current === null || initRef.current) return
    const rootNode: d3Hierarchy.HierarchyNode<D3TreeNode> = createTreeLayout(
      network,
      nodeTable,
    )
    console.log('rootNode', rootNode)

    const pack = d3Hierarchy.pack().size([width, height]).padding(3)
    pack(rootNode)

    const colorScale = getColorMapper([0, 1000])
    // Pick the base tag
    const svg = d3Selection.select(ref.current)
    const wrapper = svg.append('g').attr('class', 'circle-packing-wrapper')
    const zoom = d3Zoom.zoom().scaleExtent([0.1, 20]).on('zoom', handleZoom)

    svg.call(zoom)

    wrapper
      .append('g')
      .selectAll('circle')
      .data(rootNode.descendants())
      .join('circle')
      .attr('cx', (d: d3Hierarchy.HierarchyCircularNode<any>) => d.x)
      .attr('cy', (d: d3Hierarchy.HierarchyCircularNode<any>) => d.y)
      .attr('r', (d: d3Hierarchy.HierarchyCircularNode<any>) => d.r)
      .attr('stroke', (d: d3Hierarchy.HierarchyCircularNode<any>) =>
        d.data.id === selected || d.data.originalId === selected
          ? 'red'
          : '#777777',
      )
      .attr('stroke-width', (d: d3Hierarchy.HierarchyCircularNode<any>) =>
        d.data.id === selected || d.data.originalId === selected ? 5 : 0.5,
      )
      .attr('fill', (d) => {
        return colorScale(d.data.value)
      })

    wrapper
      .append('g')
      .selectAll('text')
      .data(rootNode.descendants())
      .join('text')

      .text((d: d3Hierarchy.HierarchyCircularNode<any>) => d.data.name)
      .attr('font-size', (d: d3Hierarchy.HierarchyCircularNode<any>) =>
        d.data.id === selected || d.data.originalId === selected
          ? '3em'
          : `${3 / d.depth}em`,
      )
      .attr('text-anchor', 'middle')
      .attr('x', (d: d3Hierarchy.HierarchyCircularNode<any>) => d.x)
      .attr('y', (d: d3Hierarchy.HierarchyCircularNode<any>) => d.y)
      .attr('dy', `${1 + Math.random()}em`)

    // Initialized
    initRef.current = true
  }, [])

  return (
    <Box sx={{ width: '100%', height: '100%', border: '2px solid red' }}>
      <svg ref={ref} width={width} height={height} />
    </Box>
  )
}
