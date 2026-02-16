/**
 * XCALLY Phonebar API Integration
 * Documentation: https://wiki.xcallymotion.com
 * 
 * Default domain: xcally.outrisk.co.zw
 * Default port: 9888
 */

const XCALLY_DOMAIN = process.env.NEXT_PUBLIC_XCALLY_DOMAIN || 'xcally.outrisk.co.zw'
const XCALLY_PORT = process.env.NEXT_PUBLIC_XCALLY_PORT || '9888'
const XCALLY_BASE_URL = `http://${XCALLY_DOMAIN}:${XCALLY_PORT}`

// Call states from XCALLY documentation
export enum CallState {
  NULL = 0,
  IDLE = 1,
  CONNECTING = 2,      // OUTBOUND CALL IN PROGRESS
  ALERTING = 4,        // CALLED NUMBER IS RINGING
  ACTIVE = 8,          // ACTIVE CALL
  RELEASED = 16,       // CHANNEL RELEASED (eg. ON TRANSFER COMPLETE)
  INCOMING = 32,       // INCOMING CALL RINGING
  HOLDING = 64,        // ON HOLD
  TERMINATED = 128     // HANGUP
}

export interface XCallyCall {
  sessionId: string
  callingNumber: string
  duration: number
  stateId: CallState
  incoming: boolean
}

/**
 * Originate a new call to a phone number
 * @param number Phone number to call (e.g., "263771234567")
 * @returns Promise with call result
 */
export async function originateCall(number: string): Promise<{ success: boolean; sessionId?: string; error?: string }> {
  try {
    // Remove any spaces or special characters except +
    const cleanNumber = number.replace(/[^\d+]/g, '')
    
    const response = await fetch(`${XCALLY_BASE_URL}/api/originate/${cleanNumber}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`XCALLY API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    return {
      success: true,
      sessionId: data.sessionId || data.session_id
    }
  } catch (error: any) {
    console.error('Error originating call:', error)
    return {
      success: false,
      error: error.message || 'Failed to originate call'
    }
  }
}

/**
 * Hangup all active calls
 */
export async function hangupAllCalls(): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${XCALLY_BASE_URL}/api/hangup`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`XCALLY API error: ${response.status}`)
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error hanging up calls:', error)
    return {
      success: false,
      error: error.message || 'Failed to hangup calls'
    }
  }
}

/**
 * Hangup a specific call by session ID
 * @param sessionId The session ID of the call to hangup
 */
export async function hangupCall(sessionId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${XCALLY_BASE_URL}/api/hangup/${sessionId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`XCALLY API error: ${response.status}`)
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error hanging up call:', error)
    return {
      success: false,
      error: error.message || 'Failed to hangup call'
    }
  }
}

/**
 * Get list of active calls
 */
export async function getActiveCalls(): Promise<{ success: boolean; calls?: XCallyCall[]; error?: string }> {
  try {
    const response = await fetch(`${XCALLY_BASE_URL}/api/calls`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`XCALLY API error: ${response.status}`)
    }

    const data = await response.json()
    
    return {
      success: true,
      calls: data.calls || data || []
    }
  } catch (error: any) {
    console.error('Error getting active calls:', error)
    return {
      success: false,
      error: error.message || 'Failed to get active calls'
    }
  }
}

/**
 * Put a call on hold
 * @param sessionId Optional session ID, if not provided holds all calls
 */
export async function holdCall(sessionId?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const url = sessionId 
      ? `${XCALLY_BASE_URL}/api/hold/${sessionId}`
      : `${XCALLY_BASE_URL}/api/hold`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`XCALLY API error: ${response.status}`)
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error holding call:', error)
    return {
      success: false,
      error: error.message || 'Failed to hold call'
    }
  }
}

/**
 * Transfer a call to another number
 * @param number Number to transfer to
 * @param sessionId Optional session ID of specific call to transfer
 */
export async function transferCall(number: string, sessionId?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanNumber = number.replace(/[^\d+]/g, '')
    const url = sessionId
      ? `${XCALLY_BASE_URL}/api/transfer/${sessionId}?number=${cleanNumber}`
      : `${XCALLY_BASE_URL}/api/transfer?number=${cleanNumber}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`XCALLY API error: ${response.status}`)
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error transferring call:', error)
    return {
      success: false,
      error: error.message || 'Failed to transfer call'
    }
  }
}

/**
 * Check if XCALLY Phonebar is available
 */
export async function checkPhonebarStatus(): Promise<boolean> {
  try {
    const response = await fetch(`${XCALLY_BASE_URL}/api/calls`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })
    return response.ok
  } catch (error) {
    return false
  }
}
