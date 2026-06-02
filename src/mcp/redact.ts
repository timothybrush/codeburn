import { createHash } from 'node:crypto'
import type { MenubarPayload } from '../menubar-json.js'

export function pseudonym(name: string): string {
  return `project-${createHash('sha256').update(name).digest('hex').slice(0, 6)}`
}

export function redactProjectNames(payload: MenubarPayload, includeNames: boolean): MenubarPayload {
  if (includeNames) return payload
  return {
    ...payload,
    current: {
      ...payload.current,
      topProjects: payload.current.topProjects.map(p => ({ ...p, name: pseudonym(p.name) })),
      topSessions: payload.current.topSessions.map(s => ({ ...s, project: pseudonym(s.project) })),
    },
  }
}
