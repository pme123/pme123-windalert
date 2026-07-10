const DB_NAME    = 'windalert-fs'
const STORE_NAME  = 'handles'
const HANDLE_KEY  = 'configDir'
export const CONFIG_FILENAME = 'windalert-config.json'

export function isFsSyncSupported(): boolean {
  return 'showDirectoryPicker' in window
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME)
    req.onsuccess = () => resolve(req.result)
    req.onerror   = () => reject(req.error)
  })
}

async function idbSet(key: string, val: unknown): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(val, key)
    tx.oncomplete = () => resolve()
    tx.onerror    = () => reject(tx.error)
  })
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).get(key)
    req.onsuccess = () => resolve(req.result)
    req.onerror   = () => reject(req.error)
  })
}

async function idbDel(key: string): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(key)
    tx.oncomplete = () => resolve()
    tx.onerror    = () => reject(tx.error)
  })
}

export async function getStoredHandle(): Promise<FileSystemDirectoryHandle | undefined> {
  return idbGet<FileSystemDirectoryHandle>(HANDLE_KEY)
}

export async function storeHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  await idbSet(HANDLE_KEY, handle)
}

export async function clearStoredHandle(): Promise<void> {
  await idbDel(HANDLE_KEY)
}

export async function verifyPermission(
  handle: FileSystemDirectoryHandle,
  requestIfNeeded: boolean
): Promise<boolean> {
  const opts = { mode: 'readwrite' as const }
  if ((await handle.queryPermission(opts)) === 'granted') return true
  if (requestIfNeeded && (await handle.requestPermission(opts)) === 'granted') return true
  return false
}

export async function pickDirectory(): Promise<FileSystemDirectoryHandle> {
  const handle = await window.showDirectoryPicker({ id: 'windalert-config', mode: 'readwrite' })
  await storeHandle(handle)
  return handle
}

export async function readConfigFile(handle: FileSystemDirectoryHandle): Promise<string | null> {
  try {
    const fileHandle = await handle.getFileHandle(CONFIG_FILENAME)
    const file        = await fileHandle.getFile()
    return await file.text()
  } catch (_e) {
    return null
  }
}

export async function writeConfigFile(handle: FileSystemDirectoryHandle, text: string): Promise<void> {
  const fileHandle = await handle.getFileHandle(CONFIG_FILENAME, { create: true })
  const writable   = await fileHandle.createWritable()
  await writable.write(text)
  await writable.close()
}
