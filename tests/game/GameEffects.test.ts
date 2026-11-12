import { describe, it, expect, vi } from 'vitest'

vi.mock('phaser', () => ({ default: {} }))

import { GameEffects, MAX_ACTIVE_FLOATING_TEXTS } from '../../src/game/GameEffects'

interface FakeText {
  text: string
  color: string
  visible: boolean
  x: number
  y: number
  setPosition: (x: number, y: number) => FakeText
  setText: (text: string) => FakeText
  setColor: (color: string) => FakeText
  setAlpha: (alpha: number) => FakeText
  setVisible: (visible: boolean) => FakeText
  setOrigin: () => FakeText
  destroy: () => void
}

const createText = (): FakeText => {
  const fake: FakeText = {
    text: '',
    color: '',
    visible: false,
    x: 0,
    y: 0,
    setPosition: (x, y) => {
      fake.x = x
      fake.y = y
      return fake
    },
    setText: (text) => {
      fake.text = text
      return fake
    },
    setColor: (color) => {
      fake.color = color
      return fake
    },
    setAlpha: () => fake,
    setVisible: (visible) => {
      fake.visible = visible
      return fake
    },
    setOrigin: () => fake,
    destroy: () => undefined,
  }
  return fake
}

const createEffects = () => {
  const texts: FakeText[] = []
  const scene = {
    add: {
      text: () => {
        const text = createText()
        texts.push(text)
        return text
      },
    },
  } as unknown as ConstructorParameters<typeof GameEffects>[0]
  return { effects: new GameEffects(scene), texts }
}

describe('GameEffects floating text', () => {
  it('colours coins and damage differently', () => {
    const { effects, texts } = createEffects()
    effects.showFloatingText(10, 10, '+12¢', 'coin')
    effects.showFloatingText(10, 10, '-3', 'damage')

    expect(texts[0].color).toBe('#fbbf24')
    expect(texts[1].color).toBe('#fca5a5')
  })

  it('caps active damage popups', () => {
    const { effects, texts } = createEffects()
    for (let i = 0; i < MAX_ACTIVE_FLOATING_TEXTS + 5; i++) {
      effects.showFloatingText(10, 10, `-${i}`, 'damage')
    }

    expect(texts).toHaveLength(MAX_ACTIVE_FLOATING_TEXTS)
    expect(texts.every((text) => text.visible)).toBe(true)
  })

  it('lets a coin popup replace the oldest damage popup at the cap', () => {
    const { effects, texts } = createEffects()
    for (let i = 0; i < MAX_ACTIVE_FLOATING_TEXTS; i++) {
      effects.showFloatingText(10, 10, `-${i}`, 'damage')
    }

    effects.showFloatingText(20, 20, '+9¢', 'coin')

    expect(texts.filter((text) => text.visible)).toHaveLength(MAX_ACTIVE_FLOATING_TEXTS)
    expect(texts.some((text) => text.text === '-0' && text.visible)).toBe(false)
    expect(texts.some((text) => text.text === '+9¢' && text.visible)).toBe(true)
  })

  it('returns expired popups to the pool', () => {
    const { effects, texts } = createEffects()
    effects.showFloatingText(10, 10, '-1', 'damage')
    effects.updateFloatingTexts(2000)
    effects.showFloatingText(10, 10, '-2', 'damage')

    expect(texts).toHaveLength(1)
    expect(texts[0].text).toBe('-2')
    expect(texts[0].visible).toBe(true)
  })
})
