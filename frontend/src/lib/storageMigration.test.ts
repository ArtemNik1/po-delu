// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { migrateLegacyStorage } from './storageMigration'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

describe('legacy storage migration', () => {
  it('copies an old token once and does not restore it after logout', () => {
    localStorage.setItem('nexora.accessToken', 'old-token')
    migrateLegacyStorage()
    expect(localStorage.getItem('po-delu.accessToken')).toBe('old-token')
    expect(localStorage.getItem('nexora.accessToken')).toBeNull()

    localStorage.removeItem('po-delu.accessToken')
    migrateLegacyStorage()
    expect(localStorage.getItem('po-delu.accessToken')).toBeNull()
  })

  it('keeps a newer value and drops the old key', () => {
    localStorage.setItem('nexora.accessToken', 'old-token')
    localStorage.setItem('po-delu.accessToken', 'new-token')
    migrateLegacyStorage()
    expect(localStorage.getItem('po-delu.accessToken')).toBe('new-token')
    expect(localStorage.getItem('nexora.accessToken')).toBeNull()
  })

  it('moves cache, drafts and the focus session', () => {
    localStorage.setItem('nexora.cache.v2.user-1', '{"tasks":[]}')
    localStorage.setItem('nexora.language', 'ru')
    localStorage.setItem('nexora.sidebar.collapsed', '1')
    sessionStorage.setItem('nexora.focus.session', '{"taskId":"a"}')
    sessionStorage.setItem('nexora.drafts', '{"draft":"1"}')
    migrateLegacyStorage()

    expect(localStorage.getItem('po-delu.cache.v2.user-1')).toBe('{"tasks":[]}')
    expect(localStorage.getItem('nexora.cache.v2.user-1')).toBeNull()
    expect(localStorage.getItem('po-delu.language')).toBe('ru')
    expect(localStorage.getItem('po-delu.sidebar.collapsed')).toBe('1')
    expect(sessionStorage.getItem('po-delu.focus.session')).toBe('{"taskId":"a"}')
    expect(sessionStorage.getItem('nexora.focus.session')).toBeNull()
    expect(sessionStorage.getItem('po-delu.drafts')).toBe('{"draft":"1"}')
    expect(sessionStorage.getItem('nexora.drafts')).toBeNull()
  })
})
