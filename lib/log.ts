/**
 * Lightweight structured logging helper.
 * Usage: logError('ai/generate', 'OpenAI call failed', err, { type })
 */

type Context = Record<string, unknown>

function serializeError(err: unknown): Context {
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack }
  }
  return { value: err }
}

export function logError(scope: string, message: string, err?: unknown, context?: Context) {
  console.error(
    JSON.stringify({
      scope,
      message,
      ...(err !== undefined ? { error: serializeError(err) } : {}),
      ...(context ? { context } : {}),
    })
  )
}

export function logWarn(scope: string, message: string, context?: Context) {
  console.warn(JSON.stringify({ scope, message, ...(context ? { context } : {}) }))
}
