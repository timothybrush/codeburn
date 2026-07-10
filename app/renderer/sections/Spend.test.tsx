// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { MenubarPayload, SpendFlow } from '../lib/types'
import { Spend } from './Spend'

const { getOverview, getSpendFlow } = vi.hoisted(() => ({
  getOverview: vi.fn<(period: string, provider: string) => Promise<MenubarPayload>>(),
  getSpendFlow: vi.fn<(period: string, provider: string) => Promise<SpendFlow>>(),
}))
vi.mock('../lib/ipc', async orig => {
  const actual = await orig<typeof import('../lib/ipc')>()
  return { ...actual, codeburn: { getOverview, getSpendFlow } }
})

function daily(date: string, cost: number, models: Array<{ name: string; cost: number }>) {
  return {
    date,
    cost,
    savingsUSD: 0,
    calls: 10,
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    topModels: models.map(m => ({
      name: m.name,
      cost: m.cost,
      savingsUSD: 0,
      calls: 5,
      inputTokens: 0,
      outputTokens: 0,
    })),
  }
}

function makePayload(now: Date): MenubarPayload {
  return {
    generated: now.toISOString(),
    current: {
      label: 'Last 30 days',
      cost: 612.48,
      calls: 1220,
      sessions: 88,
      oneShotRate: null,
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
      cacheHitPercent: 0,
      codexCredits: 0,
      topActivities: [{ name: 'coding', cost: 42, savingsUSD: 0, turns: 12, oneShotRate: null }],
      topModels: [],
      localModelSavings: { totalUSD: 0, calls: 0, byModel: [], byProvider: [] },
      providers: {},
      topProjects: [
        {
          name: 'codeburn',
          cost: 246.1,
          savingsUSD: 0,
          sessions: 124,
          avgCostPerSession: 1.98,
          sessionDetails: [],
        },
        {
          name: 'agentseal-dash',
          cost: 141.3,
          savingsUSD: 0,
          sessions: 74,
          avgCostPerSession: 1.91,
          sessionDetails: [],
        },
      ],
      modelEfficiency: [],
      topSessions: [],
      retryTax: { totalUSD: 0, retries: 0, editTurns: 0, byModel: [] },
      routingWaste: { totalSavingsUSD: 0, baselineModel: '', baselineCostPerEdit: 0, byModel: [] },
      tools: [{ name: 'Read', calls: 30 }],
      skills: [{ name: 'imagegen', turns: 3, cost: 1.25 }],
      subagents: [{ name: 'reviewer', calls: 2, cost: 2.5 }],
      mcpServers: [{ name: 'filesystem', calls: 9 }],
    },
    optimize: { findingCount: 0, savingsUSD: 0, topFindings: [] },
    history: {
      daily: [
        daily('2026-06-30', 11, [{ name: 'claude-opus-4', cost: 11 }]),
        daily('2026-07-01', 12, [{ name: 'gpt-5.5-codex', cost: 12 }]),
        daily('2026-07-04', 13, [{ name: 'claude-opus-4', cost: 9 }, { name: 'claude-sonnet-5', cost: 4 }]),
        daily('2026-07-06', 8, [{ name: 'claude-haiku-4', cost: 8 }]),
        daily('2026-07-10', 15, [{ name: 'gpt-5.5-codex', cost: 15 }]),
      ],
    },
  }
}

function makeFlow(): SpendFlow {
  return {
    period: { label: 'Last 7 days', start: '2026-07-04', end: '2026-07-10' },
    models: [
      { id: 'claude-opus-4', label: 'Opus 4.8', cost: 22 },
      { id: 'gpt-5.5-codex', label: 'GPT-5.5 Codex', cost: 18 },
    ],
    projects: [
      { id: 'codeburn', label: 'codeburn', cost: 30 },
      { id: '__other__', label: 'Other', cost: 10 },
    ],
    links: [
      { model: 'claude-opus-4', project: 'codeburn', cost: 18 },
      { model: 'claude-opus-4', project: '__other__', cost: 4 },
      { model: 'gpt-5.5-codex', project: 'codeburn', cost: 12 },
      { model: 'gpt-5.5-codex', project: '__other__', cost: 6 },
    ],
  }
}

describe('Spend', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 6, 10, 12, 0, 0))
    getOverview.mockReset()
    getSpendFlow.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('slices stacked spend bars to the selected period, renders projects, and draws one Sankey ribbon per link', async () => {
    getOverview.mockResolvedValue(makePayload(new Date()))
    getSpendFlow.mockResolvedValue(makeFlow())

    const { container } = render(<Spend period="week" provider="all" />)

    expect(await screen.findByText('codeburn')).toBeInTheDocument()
    expect(screen.getByText('$246.10')).toBeInTheDocument()
    expect(screen.getByText('agentseal-dash')).toBeInTheDocument()

    const barColumns = container.querySelectorAll('.sbars .c')
    expect(barColumns).toHaveLength(3)
    expect([...barColumns].map(col => col.getAttribute('data-date'))).toEqual([
      '2026-07-04',
      '2026-07-06',
      '2026-07-10',
    ])

    expect(container.querySelectorAll('[data-testid="sankey-ribbon"]')).toHaveLength(makeFlow().links.length)
  })
})
