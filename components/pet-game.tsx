'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import useSWR from 'swr'
import { Drumstick, Gamepad2, Moon, Sparkles } from 'lucide-react'
import {
  applyAction,
  applyDecay,
  getLevel,
  getLevelProgress,
  getMood,
  MOOD_PHRASES,
  MOOD_SPRITES,
  type PetAction,
  type PetMood,
  type PetState,
} from '@/lib/game'
import { fetchPet, postPetAction } from '@/lib/api/pet-client'
import { getInitDataRaw, hapticImpact, hapticSuccess } from '@/lib/telegram/client'
import { StatBar } from '@/components/stat-bar'

interface FloatingLabel {
  id: number
  text: string
}

function triggerHaptic(action: PetAction) {
  const style = action === 'play' ? 'medium' : action === 'feed' ? 'light' : 'soft'
  hapticImpact(style)
}

export function PetGame() {
  const [initDataRaw, setInitDataRaw] = useState<string | undefined>(undefined)
  const [bootstrapped, setBootstrapped] = useState(false)
  const [overrideMood, setOverrideMood] = useState<PetMood | null>(null)
  const [isBouncing, setIsBouncing] = useState(false)
  const [floats, setFloats] = useState<FloatingLabel[]>([])
  const [pendingAction, setPendingAction] = useState<PetAction | null>(null)
  const [displayPet, setDisplayPet] = useState<PetState | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const idRef = useRef(0)
  const moodTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const read = () => setInitDataRaw(getInitDataRaw())
    read()
    const t = window.setTimeout(() => {
      read()
      setBootstrapped(true)
    }, 100)
    return () => window.clearTimeout(t)
  }, [])

  const { data, error, isLoading, mutate } = useSWR(
    bootstrapped ? ['pet', initDataRaw ?? 'dev'] : null,
    () => fetchPet(initDataRaw),
    {
      revalidateOnFocus: true,
      refreshInterval: 30_000,
    },
  )

  useEffect(() => {
    if (data?.pet) setDisplayPet(data.pet)
  }, [data?.pet])

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayPet((p) => (p ? applyDecay(p) : p))
    }, 15_000)
    return () => clearInterval(interval)
  }, [])

  const pushFloat = useCallback((text: string) => {
    const id = ++idRef.current
    setFloats((f) => [...f, { id, text }])
    setTimeout(() => {
      setFloats((f) => f.filter((fl) => fl.id !== id))
    }, 1200)
  }, [])

  const showStatus = useCallback((message: string) => {
    setStatusMessage(message)
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current)
    statusTimerRef.current = setTimeout(() => setStatusMessage(null), 2200)
  }, [])

  const showGains = useCallback(
    (gains: Partial<Record<'hunger' | 'happiness' | 'energy' | 'xp', number>>, leveledUp?: boolean) => {
      const labels: string[] = []
      if (gains.hunger) labels.push(`+${gains.hunger} сытость`)
      if (gains.happiness) labels.push(`+${gains.happiness} радость`)
      if (gains.energy) labels.push(`+${gains.energy} энергия`)
      if (gains.xp) labels.push(`+${gains.xp} XP`)
      if (leveledUp) labels.push('LEVEL UP!')
      labels.forEach((text, i) => setTimeout(() => pushFloat(text), i * 220))
    },
    [pushFloat],
  )

  const playReaction = useCallback((action: PetAction) => {
    const reaction: PetMood = action === 'play' ? 'playing' : action === 'sleep' ? 'sleepy' : 'happy'
    setOverrideMood(reaction)
    setIsBouncing(true)
    if (moodTimerRef.current) clearTimeout(moodTimerRef.current)
    moodTimerRef.current = setTimeout(() => {
      setOverrideMood(null)
      setIsBouncing(false)
    }, 1400)
  }, [])

  async function handleAction(action: PetAction) {
    if (!displayPet || pendingAction) return

    const optimistic = applyAction(displayPet, action)
    if (!optimistic.gains.xp && optimistic.message && Object.keys(optimistic.gains).length === 0) {
      showStatus(optimistic.message)
      return
    }

    triggerHaptic(action)
    setPendingAction(action)

    const previous = displayPet
    setDisplayPet(optimistic.pet)
    showGains(optimistic.gains, optimistic.leveledUp)
    if (optimistic.leveledUp) hapticSuccess()
    if (optimistic.message) showStatus(optimistic.message)
    playReaction(action)

    try {
      await mutate(
        async () => {
          const result = await postPetAction(initDataRaw, action)
          setDisplayPet(result.pet)
          if (result.message && result.message !== optimistic.message) {
            showStatus(result.message)
          }
          return { pet: result.pet }
        },
        {
          optimisticData: { pet: optimistic.pet },
          rollbackOnError: true,
          populateCache: true,
          revalidate: false,
        },
      )
    } catch (err) {
      console.error(err)
      setDisplayPet(previous)
      showStatus('Что-то пошло не так, попробуй ещё раз')
      await mutate()
    } finally {
      setPendingAction(null)
    }
  }

  if ((!bootstrapped || isLoading) && !displayPet) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-5">
        <p className="text-sm font-bold text-muted-foreground">Буся просыпается…</p>
      </div>
    )
  }

  if (error && !displayPet) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-2 px-5 text-center">
        <p className="text-sm font-extrabold text-destructive">Не удалось загрузить питомца</p>
        <p className="text-xs font-semibold text-muted-foreground">{error.message}</p>
        <button
          type="button"
          onClick={() => mutate()}
          className="mt-2 rounded-2xl bg-primary px-4 py-2 text-xs font-extrabold text-primary-foreground"
        >
          Повторить
        </button>
      </div>
    )
  }

  if (!displayPet) return null

  const pet = displayPet
  const mood = overrideMood ?? getMood(pet)
  const level = getLevel(pet.xp)
  const levelProgress = getLevelProgress(pet.xp)
  const busy = pendingAction !== null
  const canPlay = pet.energy >= 8
  const phrase = statusMessage ?? MOOD_PHRASES[mood]

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom),var(--tg-viewport-safe-area-inset-bottom,0px))] pt-[max(1.25rem,env(safe-area-inset-top),var(--tg-viewport-safe-area-inset-top,0px))]">
      <header className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-2xl font-extrabold tracking-tight text-balance">{pet.name}</h1>
          <p className="text-sm font-semibold text-muted-foreground">Твой питомец</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="rounded-full bg-primary px-3.5 py-1 text-sm font-extrabold text-primary-foreground">
            Ур. {level}
          </span>
          <div
            role="progressbar"
            aria-label="Прогресс уровня"
            aria-valuenow={levelProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary"
          >
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
        </div>
      </header>

      <div className="relative flex flex-1 flex-col items-center justify-center py-6">
        <div
          aria-live="polite"
          className="pointer-events-none absolute inset-x-0 top-8 flex flex-col items-center gap-1"
        >
          {floats.map((f) => (
            <span
              key={f.id}
              className="animate-float-up rounded-full bg-accent px-3 py-1 text-sm font-extrabold text-accent-foreground shadow-sm"
            >
              {f.text}
            </span>
          ))}
        </div>

        <div
          className={`overflow-hidden rounded-[3rem] bg-card p-3 shadow-lg shadow-foreground/10 ${
            isBouncing ? 'animate-pet-bounce' : 'animate-pet-idle'
          }`}
        >
          <Image
            src={MOOD_SPRITES[mood] || '/placeholder.svg'}
            alt={`Питомец в настроении: ${phrase}`}
            width={248}
            height={248}
            priority
            className="rounded-[2.25rem]"
          />
        </div>

        <p className="mt-5 min-h-10 rounded-2xl bg-card px-5 py-2.5 text-center text-sm font-bold text-card-foreground shadow-sm text-pretty">
          {phrase}
        </p>
      </div>

      <section aria-label="Показатели питомца" className="flex flex-col gap-3.5 rounded-3xl bg-card p-5 shadow-sm">
        <StatBar
          label="Сытость"
          value={pet.hunger}
          icon={<Drumstick className="size-4" aria-hidden="true" />}
          barClassName="bg-stat-hunger"
        />
        <StatBar
          label="Радость"
          value={pet.happiness}
          icon={<Sparkles className="size-4" aria-hidden="true" />}
          barClassName="bg-stat-happiness"
        />
        <StatBar
          label="Энергия"
          value={pet.energy}
          icon={<Moon className="size-4" aria-hidden="true" />}
          barClassName="bg-stat-energy"
        />
      </section>

      <nav aria-label="Действия" className="mt-4 grid grid-cols-3 gap-3">
        <ActionButton
          label="Кормить"
          icon={<Drumstick className="size-5" aria-hidden="true" />}
          disabled={busy}
          onClick={() => handleAction('feed')}
        />
        <ActionButton
          label="Играть"
          icon={<Gamepad2 className="size-5" aria-hidden="true" />}
          disabled={busy || !canPlay}
          onClick={() => handleAction('play')}
        />
        <ActionButton
          label="Спать"
          icon={<Moon className="size-5" aria-hidden="true" />}
          disabled={busy}
          onClick={() => handleAction('sleep')}
        />
      </nav>
    </div>
  )
}

function ActionButton({
  label,
  icon,
  onClick,
  disabled,
}: {
  label: string
  icon: React.ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-1.5 rounded-2xl bg-primary py-3.5 text-primary-foreground shadow-sm transition-transform active:scale-95 disabled:pointer-events-none disabled:opacity-50"
    >
      {icon}
      <span className="text-xs font-extrabold">{label}</span>
    </button>
  )
}
