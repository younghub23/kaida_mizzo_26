import Anthropic from '@anthropic-ai/sdk'

let _anthropic: Anthropic | undefined

export const anthropic = new Proxy({} as Anthropic, {
  get(_target, prop) {
    if (!_anthropic) {
      _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    }
    return Reflect.get(_anthropic, prop, _anthropic)
  },
})
