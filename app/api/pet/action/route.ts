import { authenticateRequest, authErrorResponse } from '@/lib/telegram/auth'
import { performPetAction } from '@/lib/pet/service'
import type { PetAction } from '@/lib/game'

export const dynamic = 'force-dynamic'

const ACTIONS = new Set<PetAction>(['feed', 'play', 'sleep'])

export async function POST(request: Request) {
  try {
    const { playerId } = authenticateRequest(request)

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const action = (body as { action?: unknown })?.action
    if (typeof action !== 'string' || !ACTIONS.has(action as PetAction)) {
      return Response.json(
        { error: 'Invalid action. Expected feed, play, or sleep.' },
        { status: 400 },
      )
    }

    const result = await performPetAction(playerId, action as PetAction)
    return Response.json(result)
  } catch (error) {
    return authErrorResponse(error)
  }
}
