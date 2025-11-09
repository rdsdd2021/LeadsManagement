'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

interface UseRealtimeOptions {
  table: string
  queryKey: (string | object)[]
  enabled?: boolean
  filter?: string
}

export function useRealtime({
  table,
  queryKey,
  enabled = true,
  filter,
}: UseRealtimeOptions) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled) return

    console.log('📡 Setting up realtime subscription for:', table)

    let channel: RealtimeChannel

    // Build channel configuration
    const channelConfig: any = {
      event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
      schema: 'public',
      table: table,
    }

    // Add filter if provided
    if (filter) {
      channelConfig.filter = filter
    }

    // Create event handler inline to capture current queryKey
    const eventHandler = (payload: any) => {
      console.log('🔔 Realtime event received:', payload)
      queryClient.invalidateQueries({ queryKey })
    }

    // Subscribe to changes
    // Use a stable but unique channel name per table
    const channelName = `realtime-${table}`
    
    channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        channelConfig,
        eventHandler
      )
      .subscribe((status, err) => {
        console.log('📊 Realtime subscription status:', status)

        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime connected for:', table)
        } else if (status === 'CHANNEL_ERROR') {
          console.warn('⚠️ Realtime connection failed for:', table, err)
          console.warn('Continuing without realtime updates. Data will refresh on manual actions.')
        } else if (status === 'TIMED_OUT') {
          console.warn('⚠️ Realtime connection timed out for:', table)
        } else if (status === 'CLOSED') {
          console.log('🔌 Realtime connection closed for:', table)
        }
      })

    // Cleanup function
    return () => {
      console.log('🔌 Cleaning up realtime subscription for:', table)
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
    // Only re-run when table, filter, or enabled changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, filter, enabled])
}