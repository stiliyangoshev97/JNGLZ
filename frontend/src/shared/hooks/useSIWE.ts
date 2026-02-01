import { useState, useCallback } from 'react'
import { useAccount, useSignMessage } from 'wagmi'

interface SIWESession {
  address: string
  message: string
  signature: string
  expiresAt: number
}

const SIWE_STORAGE_KEY = 'jnglz_siwe_session'
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Generate a random nonce for SIWE message
 */
function generateNonce(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Create a SIWE message string
 */
function createSIWEMessage(params: {
  domain: string
  address: string
  statement: string
  uri: string
  chainId: number
  nonce: string
  expirationMinutes?: number
}): string {
  const now = new Date()
  const expiry = new Date(now.getTime() + (params.expirationMinutes || 60 * 24) * 60 * 1000)
  
  return `${params.domain} wants you to sign in with your Ethereum account:
${params.address}

${params.statement}

URI: ${params.uri}
Version: 1
Chain ID: ${params.chainId}
Nonce: ${params.nonce}
Issued At: ${now.toISOString()}
Expiration Time: ${expiry.toISOString()}`
}

/**
 * Get stored SIWE session from localStorage
 */
function getStoredSession(): SIWESession | null {
  try {
    const stored = localStorage.getItem(SIWE_STORAGE_KEY)
    if (!stored) return null
    
    const session: SIWESession = JSON.parse(stored)
    
    // Check if expired
    if (session.expiresAt < Date.now()) {
      localStorage.removeItem(SIWE_STORAGE_KEY)
      return null
    }
    
    return session
  } catch {
    return null
  }
}

/**
 * Store SIWE session in localStorage
 */
function storeSession(session: SIWESession): void {
  localStorage.setItem(SIWE_STORAGE_KEY, JSON.stringify(session))
}

/**
 * Clear SIWE session from localStorage
 */
function clearSession(): void {
  localStorage.removeItem(SIWE_STORAGE_KEY)
}

/**
 * Hook for managing SIWE authentication
 */
export function useSIWE() {
  const { address, chainId } = useAccount()
  const { signMessageAsync } = useSignMessage()
  
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Check if user has a valid session
  const getSession = useCallback((): SIWESession | null => {
    const session = getStoredSession()
    
    // Verify session matches current wallet
    if (session && address && session.address.toLowerCase() !== address.toLowerCase()) {
      clearSession()
      return null
    }
    
    return session
  }, [address])
  
  // Check if user is authenticated
  const isAuthenticated = useCallback((): boolean => {
    return !!getSession()
  }, [getSession])
  
  // Sign in with SIWE
  const signIn = useCallback(async (): Promise<SIWESession | null> => {
    if (!address || !chainId) {
      setError('Wallet not connected')
      return null
    }
    
    // Check if already have valid session
    const existingSession = getSession()
    if (existingSession) {
      return existingSession
    }
    
    setIsSigningIn(true)
    setError(null)
    
    try {
      const nonce = generateNonce()
      const domain = window.location.host
      const uri = window.location.origin
      
      const message = createSIWEMessage({
        domain,
        address,
        statement: 'Sign in to JNGLZ.FUN to use chat features.',
        uri,
        chainId,
        nonce,
        expirationMinutes: 60 * 24, // 24 hours
      })
      
      const signature = await signMessageAsync({ message })
      
      const session: SIWESession = {
        address: address.toLowerCase(),
        message,
        signature,
        expiresAt: Date.now() + SESSION_DURATION_MS,
      }
      
      storeSession(session)
      
      return session
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in'
      setError(errorMessage)
      console.error('SIWE sign in error:', err)
      return null
    } finally {
      setIsSigningIn(false)
    }
  }, [address, chainId, getSession, signMessageAsync])
  
  // Sign out
  const signOut = useCallback(() => {
    clearSession()
  }, [])
  
  return {
    signIn,
    signOut,
    isAuthenticated,
    getSession,
    isSigningIn,
    error,
  }
}
