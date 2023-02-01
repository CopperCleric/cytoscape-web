import { IdType } from '../models/IdType'
import {
  VisualPropertyName,
  VisualPropertyValueType,
  VisualStyle,
} from '../models/VisualStyleModel'

import create from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { ValueType } from '../models/TableModel'
import { DiscreteMappingFunction } from '../models/VisualStyleModel/VisualMappingFunction'

/**
//  * Visual Style State manager based on zustand
//  */
interface VisualStyleState {
  visualStyles: Record<IdType, VisualStyle>
}

/**
 * Actions to mutate visual style structure
 */
interface UpdateVisualStyleAction {
  setDefault: (
    networkId: IdType,
    vpName: VisualPropertyName,
    vpValue: VisualPropertyValueType,
  ) => void
  setBypass: (
    networkId: IdType,
    vpName: VisualPropertyName,
    elementIds: IdType[],
    vpValue: VisualPropertyValueType,
  ) => void
  deleteBypass: (
    networkId: IdType,
    vpName: VisualPropertyName,
    elementIds: IdType[],
  ) => void
  setDiscreteMappingValue: (
    networkId: IdType,
    vpName: VisualPropertyName,
    value: ValueType,
    vpValue: VisualPropertyValueType,
  ) => void
  deleteDiscreteMappingValue: (
    networkId: IdType,
    vpName: VisualPropertyName,
    value: ValueType,
  ) => void
  // setMapping: () // TODO
}

interface VisualStyleAction {
  set: (networkId: IdType, visualStyle: VisualStyle) => void
  //   reset: () => void

  //   add: (network: Network) => void
  //   delete: (networkId: IdType) => void
  //   deleteAll: () => void
}

export const useVisualStyleStore = create(
  immer<VisualStyleState & VisualStyleAction & UpdateVisualStyleAction>(
    (set) => ({
      visualStyles: {},

      set: (networkId: IdType, visualStyle: VisualStyle) => {
        set((state) => {
          state.visualStyles[networkId] = visualStyle
          return state
        })
      },

      setDefault: (
        networkId: IdType,
        vpName: VisualPropertyName,
        vpValue: VisualPropertyValueType,
      ) => {
        set((state) => {
          state.visualStyles[networkId][vpName].defaultValue = vpValue
          return state
        })
      },

      setBypass: (
        networkId: IdType,
        vpName: VisualPropertyName,
        elementIds: IdType[],
        vpValue: VisualPropertyValueType,
      ) => {
        set((state) => {
          const bypassMap = state.visualStyles[networkId][vpName].bypassMap

          elementIds.forEach((eleId) => {
            bypassMap.set(eleId, vpValue)
          })

          return state
        })
      },
      deleteBypass(networkId, vpName, elementIds: IdType[]) {
        set((state) => {
          const bypassMap = state.visualStyles[networkId][vpName].bypassMap
          elementIds.forEach((eleId) => {
            bypassMap.delete(eleId)
          })

          return state
        })
      },
      setDiscreteMappingValue: (networkId, vpName, value, vpValue) => {
        set((state) => {
          const mapping = state.visualStyles[networkId][vpName]
            .mapping as DiscreteMappingFunction
          if (mapping?.vpValueMap != null) {
            mapping?.vpValueMap.set(value, vpValue)
          }
        })
      },
      deleteDiscreteMappingValue: (networkId, vpName, value) => {
        set((state) => {
          const mapping = state.visualStyles[networkId][vpName]
            .mapping as DiscreteMappingFunction
          if (mapping?.vpValueMap != null) {
            mapping?.vpValueMap.delete(value)
          }
        })
      },
    }),
  ),
)