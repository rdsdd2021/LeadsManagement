'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function RealtimeStatus() {
  const [status, setStatus] = useState<string>('disconnected')
  const [lastEvent, setLastEvent] = useState<any>(null)
  const [eventCount, setEventCount] = useState(0)
  const [userRole, setUserRole] = useState<string>('loading...')

  useEffect(() => {
    // Check user role
    const checkUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()
        setUserRole(data?.role || 'unknown')
      }
    }
    checkUserRole()

    console.log('🔍 Testing realtime connection...')

    const channel = supabase
      .channel('realtime-test')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
        },
        (payload) => {
          console.log('🔔 Realtime event received:', payload)
          setLastEvent(payload)
          setEventCount(prev => prev + 1)
        }
      )
      .subscribe((status, err) => {
        console.log('📊 Realtime status:', status, err)
        setStatus(status)
      })

    return () => {
      console.log('🔌 Cleaning up realtime test')
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          Realtime Status
          <Badge variant={status === 'SUBSCRIBED' ? 'default' : 'secondary'}>
            {status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-2">
        <div>User Role: <Badge variant="outline">{userRole}</Badge></div>
        <div>Events received: {eventCount}</div>
        {lastEvent && (
          <div className="bg-muted p-2 rounded">
            <div>Type: {lastEvent.eventType}</div>
            <div>Table: {lastEvent.table}</div>
            <div>Time: {new Date().toLocaleTimeString()}</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
