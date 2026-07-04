import type { ActionResult, PetAction, PetState } from '@/lib/game'

export interface PetResponse {
  pet: PetState
}

function authHeaders(initDataRaw: string | undefined): HeadersInit {
  if (!initDataRaw) return { 'Content-Type': 'application/json' }
  return {
    'Content-Type': 'application/json',
    Authorization: `tma ${initDataRaw}`,
  }
}

export async function fetchPet(initDataRaw: string | undefined): Promise<PetResponse> {
  const res = await fetch('/api/pet', {
    headers: authHeaders(initDataRaw),
    cache: 'no-store',
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? `Failed to load pet (${res.status})`)
  }
  return res.json() as Promise<PetResponse>
}

export async function postPetAction(
  initDataRaw: string | undefined,
  action: PetAction,
): Promise<ActionResult> {
  const res = await fetch('/api/pet/action', {
    method: 'POST',
    headers: authHeaders(initDataRaw),
    body: JSON.stringify({ action }),
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? `Action failed (${res.status})`)
  }
  return res.json() as Promise<ActionResult>
}
