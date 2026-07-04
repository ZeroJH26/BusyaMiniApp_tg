export type PetMood = 'happy' | 'hungry' | 'sleepy' | 'sad' | 'playing'

export type PetAction = 'feed' | 'play' | 'sleep'

export interface PetState {
  name: string
  hunger: number // 0..100, 100 = сыт
  happiness: number // 0..100
  energy: number // 0..100
  xp: number
  updatedAt: number // ms timestamp
}

export const INITIAL_PET: PetState = {
  name: 'Буся',
  hunger: 90,
  happiness: 90,
  energy: 90,
  xp: 0,
  updatedAt: Date.now(),
}

// Медленная деградация — можно спокойно играть сессиями
const DECAY_PER_HOUR = {
  hunger: 4,
  happiness: 3,
  energy: 2.5,
} as const

const XP_PER_LEVEL = 50

const clamp = (v: number) => Math.min(100, Math.max(0, v))

/** Применяет деградацию статов за прошедшее время */
export function applyDecay(pet: PetState, now: number = Date.now()): PetState {
  const hours = Math.max(0, now - pet.updatedAt) / 3_600_000
  if (hours <= 0) return pet
  return {
    ...pet,
    hunger: clamp(pet.hunger - DECAY_PER_HOUR.hunger * hours),
    happiness: clamp(pet.happiness - DECAY_PER_HOUR.happiness * hours),
    energy: clamp(pet.energy - DECAY_PER_HOUR.energy * hours),
    updatedAt: now,
  }
}

export interface ActionResult {
  pet: PetState
  gains: Partial<Record<'hunger' | 'happiness' | 'energy' | 'xp', number>>
  leveledUp?: boolean
  message?: string
}

/** Применяет действие игрока к питомцу (после деградации) */
export function applyAction(
  pet: PetState,
  action: PetAction,
  now: number = Date.now(),
): ActionResult {
  const current = applyDecay(pet, now)
  const levelBefore = getLevel(current.xp)

  let result: ActionResult

  switch (action) {
    case 'feed': {
      const gained = Math.round(clamp(current.hunger + 30) - current.hunger)
      result = {
        pet: {
          ...current,
          hunger: clamp(current.hunger + 30),
          happiness: clamp(current.happiness + 6),
          xp: current.xp + 10,
        },
        gains: {
          ...(gained > 0 ? { hunger: gained } : {}),
          happiness: 6,
          xp: 10,
        },
        message: gained === 0 ? 'Буся уже сыт, но всё равно рад угощению!' : undefined,
      }
      break
    }
    case 'play': {
      if (current.energy < 8) {
        return {
          pet: current,
          gains: {},
          message: 'Буся слишком устал… пусть сначала поспит!',
        }
      }
      const gained = Math.round(clamp(current.happiness + 28) - current.happiness)
      result = {
        pet: {
          ...current,
          happiness: clamp(current.happiness + 28),
          energy: clamp(current.energy - 8),
          hunger: clamp(current.hunger - 3),
          xp: current.xp + 14,
        },
        gains: {
          ...(gained > 0 ? { happiness: gained } : {}),
          xp: 14,
        },
        message: gained === 0 ? 'Буся в восторге и так!' : undefined,
      }
      break
    }
    case 'sleep': {
      const gained = Math.round(clamp(current.energy + 40) - current.energy)
      result = {
        pet: {
          ...current,
          energy: clamp(current.energy + 40),
          hunger: clamp(current.hunger - 2),
          happiness: clamp(current.happiness + 4),
          xp: current.xp + 8,
        },
        gains: {
          ...(gained > 0 ? { energy: gained } : {}),
          happiness: 4,
          xp: 8,
        },
        message: gained === 0 ? 'Буся выспался и сладко улыбается!' : undefined,
      }
      break
    }
  }

  const levelAfter = getLevel(result.pet.xp)
  if (levelAfter > levelBefore) {
    result.leveledUp = true
    result.pet = {
      ...result.pet,
      hunger: clamp(result.pet.hunger + 10),
      happiness: clamp(result.pet.happiness + 10),
      energy: clamp(result.pet.energy + 10),
    }
    result.message = `Уровень ${levelAfter}! Буся стал сильнее!`
  }

  return result
}

export function getLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1
}

/** Прогресс до следующего уровня, 0..100 */
export function getLevelProgress(xp: number): number {
  return ((xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100
}

/** Настроение питомца, определяет спрайт */
export function getMood(pet: PetState): PetMood {
  if (pet.energy < 25) return 'sleepy'
  if (pet.hunger < 30) return 'hungry'
  const avg = (pet.hunger + pet.happiness + pet.energy) / 3
  if (avg < 40) return 'sad'
  return 'happy'
}

export const MOOD_SPRITES: Record<PetMood, string> = {
  happy: '/pet/happy.png',
  hungry: '/pet/hungry.png',
  sleepy: '/pet/sleepy.png',
  sad: '/pet/sad.png',
  playing: '/pet/playing.png',
}

export const MOOD_PHRASES: Record<PetMood, string> = {
  happy: 'Мне так хорошо с тобой!',
  hungry: 'Я проголодался... покорми меня!',
  sleepy: 'Глазки слипаются... пора спать.',
  sad: 'Мне грустно. Поиграй со мной?',
  playing: 'Ура! Играем!',
}
