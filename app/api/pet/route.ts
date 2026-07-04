import { authenticateRequest, authErrorResponse } from '@/lib/telegram/auth'
import { getOrCreatePet } from '@/lib/pet/service'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { playerId } = authenticateRequest(request)
    const pet = await getOrCreatePet(playerId)
    return Response.json({ pet })
  } catch (error) {
    return authErrorResponse(error)
  }
}
