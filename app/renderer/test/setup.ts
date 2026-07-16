import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'

// Only wire DOM cleanup in a browser-like (jsdom) environment; node-env tests
// (cli/main) have no document and must not import RTL's DOM cleanup.
if (typeof document !== 'undefined') {
  const { cleanup } = await import('@testing-library/react')
  afterEach(() => cleanup())
}
