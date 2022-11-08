import { VisualStyle } from '..'
import { Cx2 } from '../../../utils/cx/Cx2'
import { VisualStyleChangeSet } from '../VisualStyleFn'

const defaultVisualStyle: VisualStyle = {
  nodeShape: {
    name: 'nodeShape',
    default: 'ellipse',
    mapping: null,
    bypassMap: {},
  },
  nodeBorderColor: {
    name: 'nodeBorderColor',
    default: '#000000',
    mapping: null,
    bypassMap: {},
  },
  nodeBorderLineType: {
    name: 'nodeBorderLineType',
    default: 'solid',
    mapping: null,
    bypassMap: {},
  },
  nodeBorderWidth: {
    name: 'nodeBorderWidth',
    default: 1,
    mapping: null,
    bypassMap: {},
  },
  nodeBorderOpacity: {
    name: 'nodeBorderOpacity',
    default: 1.0,
    mapping: null,
    bypassMap: {},
  },
  nodeHeight: {
    name: 'nodeHeight',
    default: 40,
    mapping: null,
    bypassMap: {},
  },
  nodeWidth: {
    name: 'nodeWidth',
    default: 40,
    mapping: null,
    bypassMap: {},
  },
  nodeBackgroundColor: {
    name: 'nodeBackgroundColor',
    default: '#FFFFFF',
    mapping: null,
    bypassMap: {},
  },
  nodeLabel: {
    name: 'nodeLabel',
    default: '',
    mapping: null,
    bypassMap: {},
  },
  nodeLabelColor: {
    name: 'nodeLabelColor',
    default: '#000000',
    mapping: null,
    bypassMap: {},
  },
  nodeLabelFontSize: {
    name: 'nodeLabelFontSize',
    default: 12,
    mapping: null,
    bypassMap: {},
  },
  nodeLabelFont: {
    name: 'nodeLabelFont',
    default: 'Arial',
    mapping: null,
    bypassMap: {},
  },
  nodeLabelPosition: {
    name: 'nodeLabelPosition',
    default: 'center',
    mapping: null,
    bypassMap: {},
  },
  nodeLabelRotation: {
    name: 'nodeLabelRotation',
    default: 0,
    mapping: null,
    bypassMap: {},
  },
  nodeLabelOpacity: {
    name: 'nodeLabelOpacity',
    default: 1.0,
    mapping: null,
    bypassMap: {},
  },
  nodePosition: {
    name: 'nodePosition',
    default: { x: 0, y: 0 },
    mapping: null,
    bypassMap: {},
  },
  nodeOpacity: {
    name: 'nodeOpacity',
    default: 1.0,
    mapping: null,
    bypassMap: {},
  },
  nodeVisibility: {
    name: 'nodeVisibility',
    default: true,
    mapping: null,
    bypassMap: {},
  },
  edgeLineColor: {
    name: 'edgeLineColor',
    default: '#000000',
    mapping: null,
    bypassMap: {},
  },
  edgeLineType: {
    name: 'edgeLineType',
    default: 'solid',
    mapping: null,
    bypassMap: {},
  },
  edgeOpacity: {
    name: 'edgeOpacity',
    default: 1.0,
    mapping: null,
    bypassMap: {},
  },
  edgeSourceArrowColor: {
    name: 'edgeSourceArrowColor',
    default: '#000000',
    mapping: null,
    bypassMap: {},
  },
  edgeSourceArrowShape: {
    name: 'edgeSourceArrowShape',
    default: 'none',
    mapping: null,
    bypassMap: {},
  },
  edgeTargetArrowColor: {
    name: 'edgeTargetArrowColor',
    default: '#000000',
    mapping: null,
    bypassMap: {},
  },
  edgeTargetArrowShape: {
    name: 'edgeTargetArrowShape',
    default: 'none',
    mapping: null,
    bypassMap: {},
  },
  edgeLabel: {
    name: 'edgeLabel',
    default: '',
    mapping: null,
    bypassMap: {},
  },
  edgeLabelColor: {
    name: 'edgeLabelColor',
    default: '#000000',
    mapping: null,
    bypassMap: {},
  },
  edgeLabelFontSize: {
    name: 'edgeLabelFontSize',
    default: 12,
    mapping: null,
    bypassMap: {},
  },
  edgeLabelFont: {
    name: 'edgeLabelFont',
    default: 'Arial',
    mapping: null,
    bypassMap: {},
  },
  edgeLabelRotation: {
    name: 'edgeLabelRotation',
    default: 0,
    mapping: null,
    bypassMap: {},
  },
  edgeLabelOpacity: {
    name: 'edgeLabelOpacity',
    default: 1.0,
    mapping: null,
    bypassMap: {},
  },
  edgeLabelAutoRotation: {
    name: 'edgeLabelAutoRotation',
    default: true,
    mapping: null,
    bypassMap: {},
  },
  edgeWidth: {
    name: 'edgeWidth',
    default: 1,
    mapping: null,
    bypassMap: {},
  },
  edgeVisibility: {
    name: 'edgeVisibility',
    default: true,
    mapping: null,
    bypassMap: {},
  },
  networkBackgroundColor: {
    name: 'networkBackgroundColor',
    default: '#FFFFFF',
    mapping: null,
    bypassMap: {},
  },
}

export const createVisualStyle = (visualStyle: VisualStyle): VisualStyle => {
  return defaultVisualStyle
}

export const createVisualStyleFromCx = (cx: Cx2): VisualStyle => {
  return defaultVisualStyle
}

export const nodeVisualProperties = (visualStyle: VisualStyle) => {
  return Object.keys(visualStyle).filter((key) => key.startsWith('node'))
}

export const edgeVisualProperties = (visualStyle: VisualStyle) => {
  return Object.keys(visualStyle).filter((key) => key.startsWith('edge'))
}

export const networkVisualProperties = (visualStyle: VisualStyle) => {
  return Object.keys(visualStyle).filter((key) => key.startsWith('network'))
}

export const setVisualStyle = (
  visualStyle: VisualStyle,
  changeSet: VisualStyleChangeSet,
) => {
  return { ...visualStyle, ...changeSet }
}
