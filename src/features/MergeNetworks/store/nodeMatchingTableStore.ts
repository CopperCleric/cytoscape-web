import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { IdType } from '../../../models/IdType';
import { Column, ValueTypeName } from '../../../models/TableModel';
import { MatchingTableRow } from '../models/MatchingTable';
import { filterRows, getMergedType } from '../utils/helper-functions';
import { NetworkRecord } from '../models/DataInterfaceForMerge';
import { getResonableCompatibleConvertionType } from '../utils/attributes-operations';

interface NodeMatchingTableState {
    rows: MatchingTableRow[];
    networkIds: Set<IdType>;
}

interface NodeMatchingTableActions {
    setAllRows: (newRows: MatchingTableRow[]) => void;
    setRow: (rowIndex: number, updatedRow: MatchingTableRow) => void;
    addRow: (newRow: MatchingTableRow) => void
    updateRow: (rowIndex: number, netId: string, col: Column) => void;
    resetStore: () => void;
    addNetworkToTable: (networkId: IdType, netRecord: NetworkRecord, matchingCol: Column) => void
    addNetworksToTable: (networkIds: IdType[], networkRecords: Record<IdType, NetworkRecord>, matchingCols: Record<string, Column>) => void
    removeNetworksFromTable: (networkIds: IdType[]) => void
}

type NodeMatchingTableStore = NodeMatchingTableState & NodeMatchingTableActions

const addNetwork = (state: NodeMatchingTableStore, networkId: IdType, netRecord: NetworkRecord, matchingCol: Column) => {
    const netCols = netRecord.nodeTable.columns;
    const sharedCols = new Set<string>();
    if (state.rows.length > 0) {
        state.rows = state.rows.map((row, id) => {
            let typeCheck = true
            if (id === 0) {
                row.nameRecord[networkId] = matchingCol.name || 'None';
                row.typeRecord[networkId] = matchingCol.type || 'None';
            }
            else {
                if (netCols.some(nc => nc.name === row.mergedNetwork)) {
                    sharedCols.add(row.mergedNetwork);
                    row.nameRecord[networkId] = row.mergedNetwork;
                    row.typeRecord[networkId] = netCols.find(nc => nc.name === row.mergedNetwork)?.type || 'None';
                } else {
                    row.nameRecord[networkId] = 'None';
                    row.typeRecord[networkId] = 'None';
                    typeCheck = false;
                }
            }
            if (typeCheck) {
                const { hasConflicts, mergedType } = getMergedType(row.typeRecord);
                row.hasConflicts = hasConflicts;
                row.type = mergedType;
            }
            return row;
        });
    } else {
        state.rows.push({
            id: 0,
            mergedNetwork: 'Matching.Attribute',
            type: matchingCol.type || 'None',
            nameRecord: { [networkId]: matchingCol.name || 'None' },
            typeRecord: { [networkId]: matchingCol.type || 'None' },
            hasConflicts: false
        });
    }

    // Add new rows for columns not in sharedCols
    netCols.forEach(col => {
        if (!sharedCols.has(col.name)) {
            state.rows.push({
                id: state.rows.length,
                mergedNetwork: col.name,
                type: col.type,
                nameRecord: { ...Array.from(state.networkIds).reduce((acc, key) => ({ ...acc, [key]: 'None' }), {}), [networkId]: col.name },
                typeRecord: { ...Array.from(state.networkIds).reduce((acc, key) => ({ ...acc, [key]: 'None' }), {}), [networkId]: col.type },
                hasConflicts: false
            });
        }
    });
    // Update network IDs
    state.networkIds.add(networkId);
};

const addNetworks = (state: NodeMatchingTableStore, networkIds: IdType[], networkRecords: Record<IdType, NetworkRecord>, matchingCols: Record<string, Column>) => {
    const sharedColsRecord: Record<IdType, Set<string>> = {};
    networkIds.forEach(netId => sharedColsRecord[netId] = new Set());
    if (state.rows.length > 0) {
        state.rows = state.rows.map((row, id) => {
            let typeCheck = false;
            if (id === 0) {
                for (const netId of networkIds) {
                    //Todo: whether it is necessary to throw error here since it should not be none
                    row.nameRecord[netId] = matchingCols[netId]?.name || 'None';
                    row.typeRecord[netId] = matchingCols[netId]?.type || 'None';
                    typeCheck = true;
                }
            } else {
                for (const netId of networkIds) {
                    const netCols = networkRecords[netId].nodeTable.columns;
                    if (netCols.some(nc => nc.name === row.mergedNetwork)) {
                        row.nameRecord[netId] = row.mergedNetwork;
                        //Todo: whether it is necessary to throw error here since the type should not be none in this case
                        row.typeRecord[netId] = netCols.find(nc => nc.name === row.mergedNetwork)?.type || 'None';
                        typeCheck = true;
                        sharedColsRecord[netId].add(row.mergedNetwork);
                    } else {
                        row.nameRecord[netId] = 'None';
                        row.typeRecord[netId] = 'None';
                    }
                }
            }
            if (typeCheck) {
                const { hasConflicts, mergedType } = getMergedType(row.typeRecord);
                row.hasConflicts = hasConflicts;
                row.type = mergedType;
            }
            return row;
        });
    } else {
        const matchingColRow: MatchingTableRow = {
            id: 0,
            mergedNetwork: 'Matching.Attribute',
            type: 'None',
            nameRecord: {},
            typeRecord: {},
            hasConflicts: false
        };
        const typeSet: Set<ValueTypeName> = new Set();
        for (const netId of networkIds) {
            //Todo: whether it is necessary to throw error here since it should not be none
            matchingColRow.nameRecord[netId] = matchingCols[netId]?.name || 'None';
            const colType = (matchingCols[netId]?.type as ValueTypeName | 'None') || 'None';
            matchingColRow.typeRecord[netId] = colType;
            if (colType !== 'None') typeSet.add(matchingCols[netId]?.type || 'None');
        }
        matchingColRow.hasConflicts = typeSet.size > 1;
        matchingColRow.type = getResonableCompatibleConvertionType(typeSet);
        state.rows.push(matchingColRow);
    }
    const originalNetworkIds = Array.from(state.networkIds);
    networkIds.forEach((net1, index1) => {
        state.networkIds.add(net1);
        networkRecords[net1]?.nodeTable.columns.forEach(col => {
            if (!sharedColsRecord[net1]?.has(col.name)) {
                const matchCols: Record<string, string> = {};
                const typeRecord: Record<string, ValueTypeName | 'None'> = {};
                matchCols[net1] = col.name;
                const typeSet = new Set<ValueTypeName>();
                typeSet.add(col.type);
                typeRecord[net1] = col.type;
                (originalNetworkIds.concat(networkIds.slice(0, index1) ?? [])).forEach(net => {
                    matchCols[net] = 'None';
                    typeRecord[net] = 'None';
                });
                networkIds.slice(index1 + 1).forEach(net2 => {
                    if (networkRecords[net2]?.nodeTable.columns.some(nc => nc.name === col.name)) {
                        const newSharedCols = new Set(sharedColsRecord[net2]);
                        newSharedCols.add(col.name);
                        sharedColsRecord[net2] = newSharedCols;
                        matchCols[net2] = col.name;
                        const colType = networkRecords[net2]?.nodeTable.columns.find(nc => nc.name === col.name)?.type;
                        if (colType !== undefined) {
                            typeSet.add(colType);
                            typeRecord[net2] = colType;
                        }
                    } else {
                        matchCols[net2] = 'None';
                        typeRecord[net2] = 'None';
                    }
                });
                state.rows.push({
                    id: state.rows.length,
                    mergedNetwork: col.name,
                    type: getResonableCompatibleConvertionType(typeSet),
                    typeRecord: typeRecord,
                    nameRecord: matchCols,
                    hasConflicts: typeSet.size > 1
                });
            }
        });
    });
}

const removeNetworks = (state: NodeMatchingTableStore, networkIds: IdType[]) => {
    for (const tableRow of state.rows) {
        let needRecheck = false;
        for (const netId of networkIds) {
            if (tableRow.nameRecord.hasOwnProperty(netId) || tableRow.typeRecord.hasOwnProperty(netId)) {
                delete tableRow.nameRecord[netId];
                delete tableRow.typeRecord[netId];
                needRecheck = true;
            }
        }
        if (needRecheck) {
            const { hasConflicts, mergedType } = getMergedType(tableRow.typeRecord);
            tableRow.hasConflicts = hasConflicts;
            tableRow.type = mergedType;
        }
    }
    networkIds.forEach(netId => state.networkIds.delete(netId));
    state.rows = filterRows(state.rows);
}

const useNodeMatchingTableStore = create(immer<NodeMatchingTableStore>((set) => ({
    rows: [],
    networkIds: new Set(),
    setAllRows: (newRows) => set((state) => {
        state.rows = filterRows(newRows)
    }),
    setRow: (rowIndex, updatedRow) => set((state) => {
        if (rowIndex < 0 || rowIndex >= state.rows.length) return;
        state.rows[rowIndex] = updatedRow;
        state.rows = filterRows(state.rows);
    }),
    addRow: (newRow) => set((state) => {
        state.rows.push(newRow);
    }),
    updateRow: (rowIndex, netId, col) => set((state) => {
        if (rowIndex < 0 || rowIndex >= state.rows.length) return;
        const row = state.rows[rowIndex];
        if (row.nameRecord.hasOwnProperty(netId) && row.typeRecord.hasOwnProperty(netId)) {
            row.nameRecord[netId] = col.name;
            row.typeRecord[netId] = col.type;
            const typeSet: Set<ValueTypeName> = new Set();
            for (const colType of Object.values(row.typeRecord)) {
                if (colType !== 'None') typeSet.add(colType);
            }
            row.hasConflicts = typeSet.size > 1;
            row.type = getResonableCompatibleConvertionType(typeSet);
        }
    }),
    resetStore: () => set(() => ({
        rows: [],
        networkIds: new Set(),
    })),
    addNetworkToTable: (networkId, netRecord, matchingCol) => set(state => { addNetwork(state, networkId, netRecord, matchingCol) }),
    addNetworksToTable: (networkIds, networkRecords, matchingCols) => set(state => { addNetworks(state, networkIds, networkRecords, matchingCols) }),
    removeNetworksFromTable: (networkIds) => set(state => { removeNetworks(state, networkIds) })
})));

export default useNodeMatchingTableStore;