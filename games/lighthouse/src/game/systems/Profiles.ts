import type { IStorage } from '@sa/core'
import { ScopedStorage } from './ScopedStorage.js'

export interface ProfileMeta {
  readonly id: string
  readonly name: string
  readonly createdAt: number
}

interface Registry {
  active: string
  list: ProfileMeta[]
}

const REGISTRY_KEY = 'profiles.v1'
const SHARED_KEYS = new Set([REGISTRY_KEY, 'audio.muted', 'audio.level', 'music.level'])
const PREFIX = 'profile.'

export const MAX_PROFILES = 5
export const MAX_PROFILE_NAME = 20

const cleanName = (name: string, fallback: string): string => {
  const trimmed = name.trim().replace(/\s+/g, ' ').slice(0, MAX_PROFILE_NAME)
  return trimmed || fallback
}

export class Profiles {
  private readonly base: IStorage
  private registry: Registry

  constructor(base: IStorage) {
    this.base = base
    const stored = base.get<Registry | null>(REGISTRY_KEY, null)
    if (stored && stored.list.length > 0) {
      const active = stored.list.some((profile) => profile.id === stored.active) ? stored.active : (stored.list[0] as ProfileMeta).id
      this.registry = { active, list: [...stored.list] }
      return
    }
    const first = this.makeProfile('Профіль 1')
    this.adoptLegacy(first.id)
    this.registry = { active: first.id, list: [first] }
    this.save()
  }

  get list(): readonly ProfileMeta[] {
    return this.registry.list
  }

  get active(): ProfileMeta {
    return this.registry.list.find((profile) => profile.id === this.registry.active) ?? (this.registry.list[0] as ProfileMeta)
  }

  get canCreate(): boolean {
    return this.registry.list.length < MAX_PROFILES
  }

  nextName(): string {
    const taken = new Set(this.registry.list.map((profile) => profile.name))
    let index = this.registry.list.length + 1
    while (taken.has(`Профіль ${index}`)) index += 1
    return `Профіль ${index}`
  }

  storage(id: string = this.registry.active): IStorage {
    return new ScopedStorage(this.base, `${PREFIX}${id}.`)
  }

  create(name: string): ProfileMeta | null {
    if (!this.canCreate) return null
    const profile = this.makeProfile(cleanName(name, this.nextName()))
    this.registry.list.push(profile)
    this.save()
    return profile
  }

  rename(id: string, name: string): void {
    this.registry.list = this.registry.list.map((profile) =>
      profile.id === id ? { ...profile, name: cleanName(name, profile.name) } : profile,
    )
    this.save()
  }

  activate(id: string): void {
    if (!this.registry.list.some((profile) => profile.id === id)) return
    this.registry.active = id
    this.save()
  }

  reset(id: string): void {
    this.storage(id).clear()
  }

  remove(id: string): void {
    this.storage(id).clear()
    this.registry.list = this.registry.list.filter((profile) => profile.id !== id)
    if (this.registry.list.length === 0) this.registry.list.push(this.makeProfile('Профіль 1'))
    if (this.registry.active === id) this.registry.active = (this.registry.list[0] as ProfileMeta).id
    this.save()
  }

  private makeProfile(name: string): ProfileMeta {
    const id = `${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`
    return { id, name, createdAt: Date.now() }
  }

  private adoptLegacy(id: string): void {
    const target = this.storage(id)
    for (const key of this.base.keys()) {
      if (SHARED_KEYS.has(key) || key.startsWith(PREFIX)) continue
      target.set(key, this.base.get<unknown>(key, null))
      this.base.remove(key)
    }
  }

  private save(): void {
    this.base.set(REGISTRY_KEY, this.registry)
  }
}
