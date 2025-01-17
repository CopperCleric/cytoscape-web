import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { CyApp } from '../models/AppModel/CyApp'
import { AppStore } from '../models/StoreModel/AppStoreModel'
import {
  deleteServiceAppFromDb,
  getAllServiceAppsFromDb,
  getAppFromDb,
  putAppToDb,
  putServiceAppToDb,
} from './persist/db'
import { AppStatus } from '../models/AppModel/AppStatus'
import { serviceFetcher } from '../utils/service-fetcher'
import { ServiceAppTask } from '../models/AppModel/ServiceAppTask'

export const useAppStore = create(
  immer<AppStore>((set, get) => ({
    apps: {},
    serviceApps: {},
    currentTask: undefined,

    restore: async (appIds: string[]) => {
      const apps = await Promise.all(
        appIds.map(async (id) => {
          const cached = await getAppFromDb(id)
          return { id, cached }
        }),
      )

      const serviceApps = await getAllServiceAppsFromDb()

      set((state) => {
        apps.forEach(({ id, cached }) => {
          if (cached !== undefined) {
            state.apps[id] = cached
            console.log('* Restored from cached', cached)
          }
        })

        serviceApps.forEach((serviceApp) => {
          state.serviceApps[serviceApp.url] = serviceApp
        })
      })
    },

    add: (app: CyApp) => {
      set((state) => {
        const { id } = app

        // Add app only when it is not already present
        if (state.apps[app.id] === undefined) {
          state.apps[id] = app
          // Will be activated by default
          state.apps[id].status = AppStatus.Active
          console.info(`App registered: ${app.id}`)
          putAppToDb(app)
        } else {
          console.info(`App already registered: ${app.id}`)
        }
      })
    },

    addService: async (url: string) => {
      try {
        const serviceApp = await serviceFetcher(url)
        await putServiceAppToDb(serviceApp)

        set((state) => {
          state.serviceApps[url] = serviceApp
        })
      } catch (error) {
        console.error(`Failed to fetch service metadata from ${url}`, error)
      }
    },

    removeService: (url: string) => {
      set((state) => {
        delete state.serviceApps[url]
        deleteServiceAppFromDb(url).catch((error) => {
          console.error(`Failed to delete service metadata from ${url}`, error)
        })
      })
    },

    setStatus: (id: string, status: AppStatus) => {
      set((state) => {
        state.apps[id].status = status
      })

      const newAppState = { ...get().apps[id] }
      putAppToDb(newAppState)
    },

    setCurrentTask: (task: ServiceAppTask) => {
      set((state) => {
        state.currentTask = task
      })
    },

    clearCurrentTask: () => {
      set((state) => {
        state.currentTask = undefined
      })
    },
  })),
)
