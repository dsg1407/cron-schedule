import { describe, expect, it } from 'vitest'
import { CronerSchedulerAdapter } from '../../../../src/infra/scheduler/croner-scheduler.adapter.js'

describe('CronerSchedulerAdapter & Cron Syntax Validation', () => {
  const scheduler = new CronerSchedulerAdapter()

  it('validates standard 5-field POSIX cron expressions', () => {
    expect(scheduler.validateCronExpression('*/5 * * * *', 'America/Sao_Paulo')).toBe(true)
    expect(scheduler.validateCronExpression('0 0 * * *', 'UTC')).toBe(true)
    expect(scheduler.validateCronExpression('0 12 * * 1-5', 'America/Sao_Paulo')).toBe(true)
  })

  it('strictly rejects 6-field sub-minute cron expressions to prevent 1-second DoS executions', () => {
    // 6-field cron has seconds field at the beginning
    expect(scheduler.validateCronExpression('* * * * * *', 'America/Sao_Paulo')).toBe(false)
    expect(scheduler.validateCronExpression('*/5 * * * * *', 'UTC')).toBe(false)
    expect(scheduler.validateCronExpression('0 * * * * *', 'America/Sao_Paulo')).toBe(false)
  })

  it('rejects invalid or malformed cron expressions', () => {
    expect(scheduler.validateCronExpression('invalid cron', 'America/Sao_Paulo')).toBe(false)
    expect(scheduler.validateCronExpression('60 * * * *', 'America/Sao_Paulo')).toBe(false)
    expect(scheduler.validateCronExpression('* * *', 'America/Sao_Paulo')).toBe(false)
  })

  it('computes next run ISO timestamp for valid 5-field cron expressions', () => {
    const nextIso = scheduler.getNextRunIso('0 0 * * *', 'UTC')
    expect(nextIso).not.toBeNull()
    expect(typeof nextIso).toBe('string')
    expect(new Date(nextIso!).getTime()).toBeGreaterThan(Date.now())
  })

  it('returns null for next run ISO if expression has 6 fields', () => {
    const nextIso = scheduler.getNextRunIso('* * * * * *', 'UTC')
    expect(nextIso).toBeNull()
  })
})
