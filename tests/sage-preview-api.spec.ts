import { expect, request as playwrightRequest, test } from '@playwright/test'
import type { APIRequestContext } from '@playwright/test'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

const { createPreviewServer } = require('../scripts/serve-sage-preview.js')

let baseUrl = ''
let api: APIRequestContext
let previewServer: any
let closePreviewServer: undefined | (() => Promise<void>)

test.describe('Sage preview API', () => {
  test.beforeAll(async () => {
    const preview = createPreviewServer()
    previewServer = preview.server
    closePreviewServer = preview.close

    await new Promise<void>((resolve) => {
      previewServer.listen(0, '127.0.0.1', resolve)
    })

    const address = previewServer.address()
    if (!address || typeof address === 'string') {
      throw new Error('Failed to bind sage preview server')
    }

    baseUrl = `http://127.0.0.1:${address.port}`
    api = await playwrightRequest.newContext({
      baseURL: baseUrl,
    })
  })

  test.afterAll(async () => {
    await api?.dispose()
    if (!previewServer) {
      return
    }

    await closePreviewServer?.()
  })

  test('serves seeded zone, spawn, grid, and npc data', async () => {
    const zonesResponse = await api.get('/api/v1/zones')
    expect(zonesResponse.ok()).toBeTruthy()
    const zones = await zonesResponse.json()
    const tutorial = zones.find((zone: any) => zone.short_name === 'tutorial')

    expect(tutorial).toBeTruthy()

    const spawnsResponse = await api.get(
      `/api/v1/spawn_2s?where=zone__tutorial.version__${tutorial.version}&includes=Spawnentries.NpcType`
    )
    expect(spawnsResponse.ok()).toBeTruthy()
    const spawns = await spawnsResponse.json()

    expect(spawns).toHaveLength(1)
    expect(spawns[0].spawnentries[0].npc_type.name).toBe('Preview Guard')

    const npcResponse = await api.get('/api/v1/npc_types?where=name_like_preview')
    expect(npcResponse.ok()).toBeTruthy()
    const npcs = await npcResponse.json()
    expect(npcs.map((npc: any) => npc.name)).toEqual([
      'Preview Guard',
      'Preview Rogue',
      'Preview Caster',
    ])

    const gridResponse = await api.get(
      `/api/v1/grid_entries?where=zoneid__${tutorial.zoneidnumber}&orderBy=gridid.number`
    )
    expect(gridResponse.ok()).toBeTruthy()
    const gridEntries = await gridResponse.json()
    expect(gridEntries.map((entry: any) => entry.number)).toEqual([1, 2])
  })

  test('supports spawn, spawnentry, and grid CRUD flows used by the editor', async () => {
    const freeGridIdResponse = await api.get('/api/v1/query/free-id-ranges/grid/id')
    expect(freeGridIdResponse.ok()).toBeTruthy()
    const freeGridIdPayload = await freeGridIdResponse.json()
    const nextGridId = freeGridIdPayload.data[0].start_id

    const spawngroupCreateResponse = await api.put('/api/v1/spawngroup', {
      data: { name: 'preview_new_group' },
    })
    expect(spawngroupCreateResponse.ok()).toBeTruthy()
    const spawngroup = await spawngroupCreateResponse.json()
    expect(spawngroup.id).toBeTruthy()

    const spawnCreateResponse = await api.put('/api/v1/spawn_2', {
      data: {
        zone         : 'tutorial',
        version      : 0,
        x            : 99,
        y            : 101,
        z            : 3,
        spawngroup_id: spawngroup.id,
      },
    })
    expect(spawnCreateResponse.ok()).toBeTruthy()
    const spawn = await spawnCreateResponse.json()
    expect(spawn.zone).toBe('tutorial')
    expect(spawn.spawnentries).toEqual([])

    const spawnentryCreateResponse = await api.put('/api/v1/spawnentry', {
      data: {
        chance       : 100,
        npc_id       : 1002,
        spawngroup_id: spawngroup.id,
      },
    })
    expect(spawnentryCreateResponse.ok()).toBeTruthy()
    const spawnentry = await spawnentryCreateResponse.json()
    expect(spawnentry.npc_type.name).toBe('Preview Rogue')

    const spawnListResponse = await api.get(
      `/api/v1/spawn_2s?where=id__${spawn.id}&includes=Spawnentries.NpcType`
    )
    expect(spawnListResponse.ok()).toBeTruthy()
    const [hydratedSpawn] = await spawnListResponse.json()
    expect(hydratedSpawn.spawnentries[0].npc_type.name).toBe('Preview Rogue')

    const gridCreateResponse = await api.put('/api/v1/grid', {
      data: {
        id     : nextGridId,
        type   : 0,
        type_2 : 1,
        zoneid : 183,
      },
    })
    expect(gridCreateResponse.ok()).toBeTruthy()
    const grid = await gridCreateResponse.json()

    const spawnUpdateResponse = await api.patch(`/api/v1/spawn_2/${spawn.id}`, {
      data: {
        ...spawn,
        pathgrid: grid.id,
      },
    })
    expect(spawnUpdateResponse.ok()).toBeTruthy()
    const updatedSpawn = await spawnUpdateResponse.json()
    expect(updatedSpawn.pathgrid).toBe(grid.id)

    const gridEntryCreateResponse = await api.put('/api/v1/grid_entry', {
      data: {
        gridid : grid.id,
        number : 1,
        heading: 64,
        pause  : 0,
        x      : 99,
        y      : 101,
        z      : 3,
        zoneid : 183,
      },
    })
    expect(gridEntryCreateResponse.ok()).toBeTruthy()

    const gridEntryUpdateResponse = await api.patch(
      `/api/v1/grid_entry/${grid.id}?where=number__1.zoneid__183.gridid__${grid.id}`,
      {
        data: {
          gridid : grid.id,
          number : 1,
          heading: 128,
          pause  : 15,
          x      : 110,
          y      : 120,
          z      : 4,
          zoneid : 183,
        },
      }
    )
    expect(gridEntryUpdateResponse.ok()).toBeTruthy()
    const updatedGridEntry = await gridEntryUpdateResponse.json()
    expect(updatedGridEntry.heading).toBe(128)
    expect(updatedGridEntry.pause).toBe(15)

    const gridEntriesResponse = await api.get(
      `/api/v1/grid_entries?where=gridid__${grid.id}.zoneid__183&orderBy=number`
    )
    expect(gridEntriesResponse.ok()).toBeTruthy()
    const gridEntries = await gridEntriesResponse.json()
    expect(gridEntries).toHaveLength(1)
    expect(gridEntries[0].x).toBe(110)

    const gridEntryDeleteResponse = await api.delete(
      `/api/v1/grid_entry/${grid.id}?where=number__1.zoneid__183.gridid__${grid.id}`
    )
    expect(gridEntryDeleteResponse.ok()).toBeTruthy()

    const emptyGridEntriesResponse = await api.get(
      `/api/v1/grid_entries?where=gridid__${grid.id}.zoneid__183`
    )
    expect(emptyGridEntriesResponse.ok()).toBeTruthy()
    expect(await emptyGridEntriesResponse.json()).toEqual([])
  })

  test('supports door CRUD flows used by the embedded drawer', async () => {
    const createResponse = await api.put('/api/v1/door', {
      data: {
        doorid : 10,
        heading: 90,
        name   : 'IT64_ACTORDEF',
        pos_x  : 50,
        pos_y  : 60,
        pos_z  : 5,
        size   : 125,
        version: 0,
        zone   : 'tutorial',
      },
    })
    expect(createResponse.ok()).toBeTruthy()
    const createdDoor = await createResponse.json()

    const updateResponse = await api.patch(`/api/v1/door/${createdDoor.id}`, {
      data: {
        ...createdDoor,
        heading: 180,
        pos_x  : 75,
      },
    })
    expect(updateResponse.ok()).toBeTruthy()
    const updatedDoor = await updateResponse.json()
    expect(updatedDoor.heading).toBe(180)
    expect(updatedDoor.pos_x).toBe(75)

    const listResponse = await api.get(
      '/api/v1/doors?where=zone__tutorial.version__0&orderBy=doorid'
    )
    expect(listResponse.ok()).toBeTruthy()
    const doors = await listResponse.json()
    expect(doors.some((door: any) => door.id === createdDoor.id)).toBeTruthy()

    const deleteResponse = await api.delete(`/api/v1/door/${createdDoor.id}`)
    expect(deleteResponse.ok()).toBeTruthy()

    const deletedDoorResponse = await api.get(
      `/api/v1/doors?where=id__${createdDoor.id}`
    )
    expect(deletedDoorResponse.ok()).toBeTruthy()
    expect(await deletedDoorResponse.json()).toEqual([])
  })

  test('serves local Sage filesystem bridge endpoints', async () => {
    const eqRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'spire-sage-eq-'))
    const cacheFile = path.join(eqRoot, 'eqsage', 'data', 'version.json')

    try {
      await fs.promises.writeFile(path.join(eqRoot, 'eqgame.exe'), '')
      await fs.promises.writeFile(path.join(eqRoot, 'tutorial.s3d'), new Uint8Array([0, 1, 2, 3]))

      const validateResponse = await api.post('/api/v1/app/sage-fs/validate', {
        data: { root: eqRoot },
      })
      expect(validateResponse.ok()).toBeTruthy()
      const validatePayload = await validateResponse.json()
      expect(validatePayload.root.replace(/\\/g, '/')).toBe(eqRoot.replace(/\\/g, '/'))

      const readdirParams = new URLSearchParams({ root: eqRoot, path: eqRoot })
      const readdirResponse = await api.get(`/api/v1/app/sage-fs/readdir?${readdirParams}`)
      expect(readdirResponse.ok()).toBeTruthy()
      const entries = await readdirResponse.json()
      expect(entries.map((entry: any) => entry.name)).toEqual(
        expect.arrayContaining(['eqgame.exe', 'tutorial.s3d'])
      )

      const writeParams = new URLSearchParams({ root: eqRoot, path: cacheFile })
      const writeResponse = await api.post(`/api/v1/app/sage-fs/write-file?${writeParams}`, {
        data: JSON.stringify({ version: 2.05 }),
      })
      expect(writeResponse.ok()).toBeTruthy()

      const readResponse = await api.get(`/api/v1/app/sage-fs/read-file?${writeParams}`)
      expect(readResponse.ok()).toBeTruthy()
      expect((await readResponse.body()).toString('utf8')).toBe('{"version":2.05}')
    } finally {
      await fs.promises.rm(eqRoot, { force: true, recursive: true })
    }
  })
})
