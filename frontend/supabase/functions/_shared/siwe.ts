import { verifyMessage } from 'https://esm.sh/viem@2.21.0'

export interface SIWEMessage {
  domain: string
  address: string
  statement: string
  uri: string
  version: string
  chainId: number
  nonce: string
  issuedAt: string
  expirationTime?: string
}

/**
 * Parse a SIWE message string into its components
 */
export function parseSIWEMessage(message: string): SIWEMessage {
  const lines = message.split('\n')
  const result: Partial<SIWEMessage> = {}
  
  // First line: "domain wants you to sign in with your Ethereum account:"
  const domainMatch = lines[0]?.match(/^(.+) wants you to sign in/)
  if (domainMatch) {
    result.domain = domainMatch[1]
  }
  
  // Second line: address
  result.address = lines[1]?.trim()
  
  // Parse key-value pairs
  for (const line of lines) {
    if (line.startsWith('Statement:')) {
      result.statement = line.replace('Statement:', '').trim()
    } else if (line.startsWith('URI:')) {
      result.uri = line.replace('URI:', '').trim()
    } else if (line.startsWith('Version:')) {
      result.version = line.replace('Version:', '').trim()
    } else if (line.startsWith('Chain ID:')) {
      result.chainId = parseInt(line.replace('Chain ID:', '').trim())
    } else if (line.startsWith('Nonce:')) {
      result.nonce = line.replace('Nonce:', '').trim()
    } else if (line.startsWith('Issued At:')) {
      result.issuedAt = line.replace('Issued At:', '').trim()
    } else if (line.startsWith('Expiration Time:')) {
      result.expirationTime = line.replace('Expiration Time:', '').trim()
    }
  }
  
  return result as SIWEMessage
}

/**
 * Verify a SIWE signature
 */
export async function verifySIWE(
  message: string,
  signature: `0x${string}`,
  expectedAddress: string
): Promise<boolean> {
  try {
    const isValid = await verifyMessage({
      address: expectedAddress as `0x${string}`,
      message,
      signature,
    })
    
    if (!isValid) {
      return false
    }
    
    // Parse and validate the message
    const parsed = parseSIWEMessage(message)
    
    // Check expiration
    if (parsed.expirationTime) {
      const expiry = new Date(parsed.expirationTime)
      if (expiry < new Date()) {
        console.log('SIWE message expired')
        return false
      }
    }
    
    // Check issued at is not in the future
    if (parsed.issuedAt) {
      const issued = new Date(parsed.issuedAt)
      if (issued > new Date(Date.now() + 60000)) { // 1 minute grace
        console.log('SIWE message issued in the future')
        return false
      }
    }
    
    return true
  } catch (error) {
    console.error('SIWE verification error:', error)
    return false
  }
}

/**
 * Create a SIWE message for signing
 */
export function createSIWEMessage(params: {
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
