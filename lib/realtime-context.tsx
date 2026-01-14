"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useAuth } from './auth-context'
import { io, Socket } from 'socket.io-client'

interface RealtimeContextType {
  // Connection state
  isConnected: boolean
  connect: () => void
  disconnect: () => void
  
  // Job matching (for customers)
  currentJob: JobMatch | null
  jobStatus: 'idle' | 'searching' | 'matched' | 'accepted' | 'in_progress' | 'completed'
  
  // Job requests (for mechanics)
  pendingJobs: JobRequest[]
  
  // Live tracking
  trackingData: TrackingData | null
  
  // Actions
  searchForMechanic: (data: SearchRequest) => Promise<void>
  acceptJob: (dispatchId: string) => Promise<void>
  updateLocation: (lat: number, lng: number) => Promise<void>
}

interface JobMatch {
  id: string
  mechanic: {
    id: string
    name: string
    rating: number
    distance: number
    eta: number
  }
  status: string
}

interface JobRequest {
  id: string
  dispatchId: string
  bookingId: string
  customer: {
    name: string
    phone: string
  }
  vehicle: {
    make: string
    model: string
    color: string
  }
  location: {
    lat: number
    lng: number
    address: string
  }
  distance: number
  services: string[]
  urgency: 'standard' | 'urgent' | 'emergency'
  createdAt: string
  eta?: number
}

interface SearchRequest {
  vehicleId?: string
  services: string[]
  location: {
    lat: number
    lng: number
    address: string
  }
  urgency?: 'standard' | 'urgent' | 'emergency'
}

interface TrackingData {
  mechanicLocation: {
    lat: number
    lng: number
  }
  customerLocation: {
    lat: number
    lng: number
  }
  eta: number
  distance: number
  status: 'en_route' | 'arrived' | 'in_progress'
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined)

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [currentJob, setCurrentJob] = useState<JobMatch | null>(null)
  const [jobStatus, setJobStatus] = useState<'idle' | 'searching' | 'matched' | 'accepted' | 'in_progress' | 'completed'>('idle')
  const [pendingJobs, setPendingJobs] = useState<JobRequest[]>([])
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null)

  const connect = useCallback(() => {
    if (!user || socket?.connected) return
    if (typeof window === 'undefined') return

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000'
    const token = localStorage.getItem('accessToken')

    const newSocket = io(`${wsUrl}/notifications`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    newSocket.on('connect', () => {
      setIsConnected(true)
      console.log('[Realtime] Connected to Socket.io')
      
      // Join user-specific room
      newSocket.emit('join', { userId: user.id, role: user.role })
    })

    newSocket.on('disconnect', () => {
      setIsConnected(false)
      console.log('[Realtime] Disconnected from Socket.io')
    })

    newSocket.on('connect_error', (error) => {
      console.error('[Realtime] Connection error:', error)
      setIsConnected(false)
    })

    // Job matching events (for customers)
    newSocket.on('job:matched', (data: JobMatch) => {
      if (user.role === 'customer') {
        setCurrentJob(data)
        setJobStatus('matched')
      }
    })

    newSocket.on('job:accepted', (data: { jobId: string; mechanic: any }) => {
      if (user.role === 'customer') {
        setJobStatus('accepted')
        setCurrentJob(prev => prev ? { ...prev, status: 'accepted' } : null)
      }
    })

    // Job request events (for mechanics)
    newSocket.on('job:request', (data: JobRequest) => {
      if (user.role === 'mechanic') {
        setPendingJobs(prev => [data, ...prev])
      }
    })

    // Location tracking events
    newSocket.on('location:update', (data: TrackingData) => {
      setTrackingData(data)
    })

    // Dispatch updates (for admin)
    newSocket.on('dispatch:update', (data: any) => {
      console.log('[Realtime] Dispatch update:', data)
    })

    // Job status updates
    newSocket.on('job:status', (data: { jobId: string; status: string }) => {
      if (data.status === 'in_progress') {
        setJobStatus('in_progress')
      } else if (data.status === 'completed') {
        setJobStatus('completed')
      }
    })

    setSocket(newSocket)
  }, [user, socket])

  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect()
      setSocket(null)
      setIsConnected(false)
    }
  }, [socket])

  const searchForMechanic = async (data: SearchRequest) => {
    if (!user) return

    setJobStatus('searching')
    
    try {
      const { api } = await import('./api-client')
      const result = await api.bookings.search(data)
      
      if (result.jobId) {
        console.log('[Realtime] Search initiated, jobId:', result.jobId)
      }
    } catch (error) {
      console.error('[Realtime] Search error:', error)
      setJobStatus('idle')
    }
  }

  const acceptJob = async (dispatchId: string) => {
    if (!user || user.role !== 'mechanic') return

    try {
      const { api } = await import('./api-client')
      await api.dispatch.accept(dispatchId)
      
      setPendingJobs(prev => prev.filter(job => job.dispatchId !== dispatchId))
    } catch (error) {
      console.error('[Realtime] Accept error:', error)
    }
  }

  const updateLocation = async (lat: number, lng: number) => {
    if (!socket || !socket.connected) return

    socket.emit('location:update', { lat, lng })
    
    // Also update via REST API
    try {
      const { api } = await import('./api-client')
      await api.location.update(lat, lng)
    } catch (error) {
      console.error('[Realtime] Location update error:', error)
    }
  }

  useEffect(() => {
    if (user) {
      connect()
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [user, connect, disconnect])

  return (
    <RealtimeContext.Provider
      value={{
        isConnected,
        connect,
        disconnect,
        currentJob,
        jobStatus,
        pendingJobs,
        trackingData,
        searchForMechanic,
        acceptJob,
        updateLocation
      }}
    >
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtime() {
  const context = useContext(RealtimeContext)
  if (!context) {
    throw new Error('useRealtime must be used within RealtimeProvider')
  }
  return context
}
