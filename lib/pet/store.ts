import { Redis } from '@upstash/redis'
import type { PetState } from '@/lib/game'

const memory = new Map<string, PetState>()

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
}

const redis = getRedis()

function key(playerId: string) {
  return `pet:${playerId}`
}

function normalize(pet: PetState): PetState {
  return {
    ...pet,
    hunger: Math.round(pet.hunger),
    happiness: Math.round(pet.happiness),
    energy: Math.round(pet.energy),
  }
}

export function isPersistentStore(): boolean {
  return redis !== null
}

export async function loadPet(playerId: string): Promise<PetState | null> {
  if (redis) {
    return redis.get<PetState>(key(playerId))
  }
  return memory.get(playerId) ?? null
}

export async function savePet(playerId: string, pet: PetState): Promise<PetState> {
  const next = normalize(pet)
  if (redis) {
    await redis.set(key(playerId), next)
  } else {
    memory.set(playerId, next)
  }
  return next
}
