/**
 * Datum for a D3 tree node for Circle Packing layout
 *
 * This will be
 */
export interface D3TreeNode {
  id: string // Unique ID of the node
  originalId?: string // Original ID of the node (used for duplicate nodes)
  parentId: string //
  name: string // Name of the node to be used as label
  value: number // Numeric value of the node to be used for circle size
  members: string[] // members assigned to this node
}
