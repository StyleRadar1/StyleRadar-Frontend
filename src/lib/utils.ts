import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combina clases condicionales de Tailwind CSS resolviendo conflictos automáticamente.
 * Compatible con componentes de shadcn/ui, Aceternity UI, Magic UI y v0.dev.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

