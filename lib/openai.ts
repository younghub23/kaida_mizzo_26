import OpenAI from 'openai'

let _openai: OpenAI | undefined

export const openai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    if (!_openai) {
      _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    }
    return Reflect.get(_openai, prop, _openai)
  },
})
