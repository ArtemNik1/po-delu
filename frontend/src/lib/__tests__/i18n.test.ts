import { describe, expect, it } from 'vitest'
import { dictionaryFor, translationKeys, type Language, type Phrase } from '../i18n'

function flattenKeys(phrase: Phrase, prefix = ''): string[] {
  if (typeof phrase === 'string') return [prefix || '(root)']
  return Object.keys(phrase).map((form) => (prefix ? `${prefix}.${form}` : form))
}

describe('i18n dictionaries', () => {
  const languages: Language[] = ['en', 'ru']
  const keys = translationKeys()

  it('exposes the same translation keys for en and ru', () => {
    for (const language of languages) {
      const dict = dictionaryFor(language)
      expect(Object.keys(dict).sort()).toEqual([...keys].sort())
    }
  })

  it('keeps plural form shapes aligned between languages', () => {
    for (const key of keys) {
      const enPhrase = dictionaryFor('en')[key]
      const ruPhrase = dictionaryFor('ru')[key]
      const enIsPlural = typeof enPhrase !== 'string'
      const ruIsPlural = typeof ruPhrase !== 'string'
      expect(ruIsPlural, `${key} plural shape`).toBe(enIsPlural)
      if (enIsPlural && ruIsPlural) {
        expect(flattenKeys(ruPhrase).sort()).toEqual(
          expect.arrayContaining(['one', 'other']),
        )
        expect(flattenKeys(enPhrase).sort()).toEqual(
          expect.arrayContaining(['one', 'other']),
        )
      }
    }
  })

  it('does not leave empty translations', () => {
    for (const language of languages) {
      const dict = dictionaryFor(language)
      for (const key of keys) {
        const phrase = dict[key]
        if (typeof phrase === 'string') {
          expect(phrase.length, `${language}:${key}`).toBeGreaterThan(0)
        } else {
          expect(phrase.one.length, `${language}:${key}.one`).toBeGreaterThan(0)
          expect(phrase.other.length, `${language}:${key}.other`).toBeGreaterThan(0)
        }
      }
    }
  })
})
