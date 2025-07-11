import { toast } from '@/hooks/use-toast'
import { Preferences } from '@capacitor/preferences'

const memoryStore: Record<string, string> = {}
const memoryPrefs: Record<string, string> = {}
let warned = false

function warn() {
  if (!warned) {
    warned = true
    toast({
      title: 'Storage Warning',
      description: 'Falling back to in-memory storage due to an error.'
    })
  }
}

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key)
    } catch (e) {
      warn()
      return memoryStore[key] ?? null
    }
  },
  setItem(key: string, value: string) {
    try {
      localStorage.setItem(key, value)
      memoryStore[key] = value
    } catch (e) {
      warn()
      memoryStore[key] = value
    }
  },
  removeItem(key: string) {
    try {
      localStorage.removeItem(key)
    } catch (e) {
      warn()
    }
    delete memoryStore[key]
  }
}

export const safePreferences = {
  async get(options: { key: string }) {
    try {
      return await Preferences.get(options)
    } catch (e) {
      warn()
      return { value: memoryPrefs[options.key] ?? null }
    }
  },
  async set(options: { key: string; value: string }) {
    try {
      await Preferences.set(options)
      memoryPrefs[options.key] = options.value
    } catch (e) {
      warn()
      memoryPrefs[options.key] = options.value
    }
  },
  async remove(options: { key: string }) {
    try {
      await Preferences.remove(options)
    } catch (e) {
      warn()
    }
    delete memoryPrefs[options.key]
  }
}
