import { useState, useEffect, useCallback, useRef } from 'react'
import { StreamingResponse } from '@/lib/ai-streaming'

export interface StreamingState {
  isStreaming: boolean
  content: string
  isComplete: boolean
  error?: string
  metadata?: any
  streamId?: string
}

export interface UseTrinityStreamingOptions {
  onPartialUpdate?: (content: string, metadata?: any) => void
  onComplete?: (content: string, metadata?: any) => void
  onError?: (error: string) => void
  autoConnect?: boolean
}

export function useTrinityStreaming(options: UseTrinityStreamingOptions = {}) {
  const [state, setState] = useState<StreamingState>({
    isStreaming: false,
    content: '',
    isComplete: false
  })
  
  const eventSourceRef = useRef<EventSource | null>(null)
  const streamIdRef = useRef<string | null>(null)

  // Start streaming
  const startStream = useCallback(async (
    agentType: 'oracle' | 'sentinel' | 'sage',
    query: string,
    userId: string,
    sessionId: string,
    context?: any
  ) => {
    if (state.isStreaming) {
      console.warn('Stream already active')
      return
    }

    try {
      setState(prev => ({
        ...prev,
        isStreaming: true,
        content: '',
        isComplete: false,
        error: undefined
      }))

      // Start the streaming request
      const response = await fetch('/api/trinity/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          agentType,
          query,
          sessionId,
          context
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      if (!response.body) {
        throw new Error('No response body for streaming')
      }

      // Set up EventSource for streaming
      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read()
            
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6)) as StreamingResponse
                  
                  if (data.type === 'partial') {
                    setState(prev => ({
                      ...prev,
                      content: data.content,
                      metadata: data.metadata,
                      streamId: data.id
                    }))
                    options.onPartialUpdate?.(data.content, data.metadata)
                    
                  } else if (data.type === 'complete') {
                    setState(prev => ({
                      ...prev,
                      content: data.content,
                      isComplete: true,
                      isStreaming: false,
                      metadata: data.metadata
                    }))
                    options.onComplete?.(data.content, data.metadata)
                    
                  } else if (data.type === 'error') {
                    setState(prev => ({
                      ...prev,
                      error: data.content,
                      isStreaming: false
                    }))
                    options.onError?.(data.content)
                  }
                } catch (parseError) {
                  console.error('Failed to parse streaming data:', parseError)
                }
              }
            }
          }
        } catch (streamError) {
          console.error('Stream processing error:', streamError)
          const errorMessage = streamError instanceof Error ? streamError.message : 'Stream processing failed'
          setState(prev => ({
            ...prev,
            error: errorMessage,
            isStreaming: false
          }))
          options.onError?.(errorMessage)
        }
      }

      processStream()

    } catch (error) {
      console.error('Failed to start stream:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to start stream'
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isStreaming: false
      }))
      options.onError?.(errorMessage)
    }
  }, [state.isStreaming, options])

  // Stop streaming
  const stopStream = useCallback(async () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    if (streamIdRef.current) {
      try {
        await fetch(`/api/trinity/stream?streamId=${streamIdRef.current}`, {
          method: 'DELETE'
        })
      } catch (error) {
        console.error('Failed to cancel stream:', error)
      }
      streamIdRef.current = null
    }

    setState(prev => ({
      ...prev,
      isStreaming: false
    }))
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream()
    }
  }, [stopStream])

  // Reset state
  const reset = useCallback(() => {
    setState({
      isStreaming: false,
      content: '',
      isComplete: false,
      error: undefined,
      metadata: undefined,
      streamId: undefined
    })
  }, [])

  return {
    ...state,
    startStream,
    stopStream,
    reset
  }
}

// Hook for managing multiple concurrent streams
export function useTrinityMultiStreaming() {
  const [streams, setStreams] = useState<Map<string, StreamingState>>(new Map())

  const addStream = useCallback((streamKey: string, initialState?: Partial<StreamingState>) => {
    setStreams(prev => new Map(prev).set(streamKey, {
      isStreaming: false,
      content: '',
      isComplete: false,
      ...initialState
    }))
  }, [])

  const updateStream = useCallback((streamKey: string, updates: Partial<StreamingState>) => {
    setStreams(prev => {
      const newMap = new Map(prev)
      const current = newMap.get(streamKey)
      if (current) {
        newMap.set(streamKey, { ...current, ...updates })
      }
      return newMap
    })
  }, [])

  const removeStream = useCallback((streamKey: string) => {
    setStreams(prev => {
      const newMap = new Map(prev)
      newMap.delete(streamKey)
      return newMap
    })
  }, [])

  const getStream = useCallback((streamKey: string): StreamingState | undefined => {
    return streams.get(streamKey)
  }, [streams])

  const getAllStreams = useCallback(() => {
    return Array.from(streams.entries())
  }, [streams])

  return {
    streams,
    addStream,
    updateStream,
    removeStream,
    getStream,
    getAllStreams
  }
}