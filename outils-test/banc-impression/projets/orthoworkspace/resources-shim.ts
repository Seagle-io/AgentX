// Shim de @/api/resources : vrai module, sauf resolveMedia.
// Chaque mot lié par le banc (exercises-shim) → image `/stimuli/images/<mot>.webp`
// (servie ferme.webp par shot.mjs). Pas de famille : même image quelle que soit la famille.
import { bancWordById } from './exercises-shim'
export * from '@/api/resources.ts'

export async function resolveMedia(stimulusIds: string[]): Promise<Record<string, { image?: string; audio?: string }>> {
	return Object.fromEntries(stimulusIds.map(id => [id, { image: `/stimuli/images/${bancWordById.get(id)}.webp` }]))
}
