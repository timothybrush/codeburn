import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

import { describe, expect, it } from 'vitest'

function runCli(args: string[], home: string) {
  return spawnSync(process.execPath, ['--import', 'tsx', 'src/cli.ts', ...args], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      CLAUDE_CONFIG_DIR: join(home, '.claude'),
      HOME: home,
      TZ: 'UTC',
    },
    encoding: 'utf-8',
    timeout: 30_000,
  })
}

function userLine(sessionId: string, timestamp: string): string {
  return JSON.stringify({
    type: 'user',
    sessionId,
    timestamp,
    message: { role: 'user', content: 'do the thing' },
  })
}

function assistantLine(sessionId: string, timestamp: string, messageId: string): string {
  return JSON.stringify({
    type: 'assistant',
    sessionId,
    timestamp,
    message: {
      id: messageId,
      type: 'message',
      role: 'assistant',
      model: 'claude-sonnet-4-5',
      content: [
        { type: 'text', text: 'done' },
        { type: 'tool_use', id: 'tu-1', name: 'Edit', input: { file_path: '/tmp/x', old_string: 'a', new_string: 'b' } },
      ],
      usage: { input_tokens: 500, output_tokens: 50 },
    },
  })
}

describe('codeburn status --format menubar-json', () => {
  it('returns valid MenubarPayload with expected top-level fields', async () => {
    const home = await mkdtemp(join(tmpdir(), 'codeburn-menubar-'))

    try {
      const projectDir = join(home, '.claude', 'projects', 'myapp')
      await mkdir(projectDir, { recursive: true })

      const today = new Date()
      const ymd = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}-${String(today.getUTCDate()).padStart(2, '0')}`

      await writeFile(
        join(projectDir, 'session.jsonl'),
        [
          userLine('s1', `${ymd}T10:00:00Z`),
          assistantLine('s1', `${ymd}T10:01:00Z`, 'msg-1'),
          userLine('s1', `${ymd}T11:00:00Z`),
          assistantLine('s1', `${ymd}T11:01:00Z`, 'msg-2'),
        ].join('\n'),
      )

      const result = runCli([
        'status',
        '--format', 'menubar-json',
        '--period', 'today',
        '--provider', 'all',
        '--no-optimize',
      ], home)

      expect(result.status, `stderr: ${result.stderr}`).toBe(0)

      const payload = JSON.parse(result.stdout) as Record<string, unknown>

      expect(payload).toHaveProperty('generated')
      expect(payload).toHaveProperty('current')
      expect(payload).toHaveProperty('optimize')
      expect(payload).toHaveProperty('history')

      const current = payload['current'] as Record<string, unknown>
      expect(current['cost']).toBeGreaterThan(0)
      expect(current['calls']).toBe(2)
      expect(current['sessions']).toBe(1)
      expect(current).toHaveProperty('oneShotRate')
      expect(current).toHaveProperty('topActivities')
      expect(current).toHaveProperty('topModels')
      expect(current).toHaveProperty('providers')

      const history = payload['history'] as { daily: unknown[] }
      expect(Array.isArray(history.daily)).toBe(true)
    } finally {
      await rm(home, { recursive: true, force: true })
    }
  })
})
