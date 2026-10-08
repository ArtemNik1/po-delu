import type { Profile, UserSettings } from '../types/database'
import { api } from './api'

export interface AuthUserDto {
  id: string
  email: string
  displayName: string | null
}

export interface AuthResponse {
  accessToken: string
  user: AuthUserDto
}

export interface MeResponse {
  id: string
  email: string
  displayName: string | null
  profile: Profile
  settings: UserSettings | null
}

export const authApi = {
  register(payload: { email: string; password: string; displayName?: string }) {
    return api.post<AuthResponse>('/auth/register', payload).then((res) => res.data)
  },

  login(payload: { email: string; password: string }) {
    return api.post<AuthResponse>('/auth/login', payload).then((res) => res.data)
  },

  me() {
    return api.get<MeResponse>('/auth/me').then((res) => res.data)
  },

  updateProfile(payload: { displayName?: string }) {
    return api.patch<MeResponse>('/users/me', payload).then((res) => res.data)
  },

  updateSettings(payload: Record<string, unknown>) {
    return api.patch<MeResponse>('/users/me/settings', payload).then((res) => res.data)
  },
}
