// Adaptateur registre (banc:registre) : 1 entrée par code de format, lue par shot.mjs via ?list.
import { EXERCISE_REGISTRY } from '@/modules/exercises/exercises.registry'

export const codes = EXERCISE_REGISTRY.flatMap(def => def.formats.map(code => ({ code, print: Boolean(def.PrintComponent), demo: Boolean(def.demoItems?.length), noMaterial: Boolean(def.noMaterial), correction: def.hasCorrection !== false })))
