type TokenCache = {
  token: string | null
  expiresAt: number
}

export const tokenCache: TokenCache = {
  token: null,
  expiresAt: 0
}

export function isTokenValid(): boolean {
  return !!tokenCache.token && Date.now() < tokenCache.expiresAt
}

export function setToken(token: string, expiresInSeconds = 3600) {
  tokenCache.token = token
  tokenCache.expiresAt = Date.now() + (expiresInSeconds - 60) * 1000
}