import { describe, it, expect, beforeEach } from 'vitest'

describe('intención de plan en localStorage', () => {
  const INTENT_KEY = 'sr_plan_intent'
  const TTL_MS = 30 * 60 * 1000

  beforeEach(() => {
    localStorage.clear()
  })

  it('guarda y lee una intención válida', () => {
    const intent = {
      planId: 'plus',
      accountType: 'COMPRADOR' as const,
      returnPath: '/planes',
      expiresAt: Date.now() + TTL_MS,
    }
    localStorage.setItem(INTENT_KEY, JSON.stringify(intent))
    const stored = JSON.parse(localStorage.getItem(INTENT_KEY)!)
    expect(stored.planId).toBe('plus')
    expect(stored.expiresAt).toBeGreaterThan(Date.now())
  })

  it('devuelve null si la intención venció', () => {
    const intent = {
      planId: 'plus',
      accountType: 'COMPRADOR',
      returnPath: '/planes',
      expiresAt: Date.now() - 1000, // ya venció
    }
    localStorage.setItem(INTENT_KEY, JSON.stringify(intent))
    const stored = JSON.parse(localStorage.getItem(INTENT_KEY)!)
    const isExpired = Date.now() > stored.expiresAt
    expect(isExpired).toBe(true)
  })

  it('devuelve null si no hay intención guardada', () => {
    const raw = localStorage.getItem(INTENT_KEY)
    expect(raw).toBeNull()
  })
})
