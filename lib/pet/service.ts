import {
  applyAction,
  applyDecay,
  INITIAL_PET,
  type ActionResult,
  type PetAction,
  type PetState,
} from '@/lib/game'
import { loadPet, savePet } from '@/lib/pet/store'

/** Loads pet for player, creating one if needed. Applies time-based decay. */
export async function getOrCreatePet(playerId: string): Promise<PetState> {
  const existing = await loadPet(playerId)
  if (!existing) {
    const initial: PetState = { ...INITIAL_PET, updatedAt: Date.now() }
    return savePet(playerId, initial)
  }

  const decayed = applyDecay(existing)
  if (decayed.updatedAt === existing.updatedAt) return existing
  return savePet(playerId, decayed)
}

/** Applies a player action and persists the result. */
export async function performPetAction(
  playerId: string,
  action: PetAction,
): Promise<ActionResult> {
  const current = await getOrCreatePet(playerId)
  const result = applyAction(current, action)
  const pet = await savePet(playerId, result.pet)
  return { pet, gains: result.gains, leveledUp: result.leveledUp, message: result.message }
}
