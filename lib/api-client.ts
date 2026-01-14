/**
 * API Client for connecting to NestJS Backend
 * Handles authentication, error handling, and request formatting
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

interface ApiResponse<T = any> {
  success?: boolean
  data?: T
  error?: string
  message?: string
}

class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

class ApiClient {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('accessToken')
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('refreshToken')
  }

  private async refreshAccessToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken()
    if (!refreshToken) return null

    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })

      if (!response.ok) {
        // Refresh failed, clear tokens
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        return null
      }

      const data = await response.json()
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken)
        return data.accessToken
      }
    } catch (error) {
      console.error('[API] Token refresh failed:', error)
    }

    return null
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken()
    const url = `${API_BASE}${endpoint}`

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    }

    let response = await fetch(url, {
      ...options,
      headers,
    })

    // Handle token refresh on 401
    if (response.status === 401 && token) {
      const newToken = await this.refreshAccessToken()
      if (newToken) {
        // Retry with new token
        headers.Authorization = `Bearer ${newToken}`
        response = await fetch(url, {
          ...options,
          headers,
        })
      } else {
        // Refresh failed, redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login'
        }
        throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required')
      }
    }

    const data: ApiResponse<T> = await response.json().catch(() => ({} as ApiResponse<T>))

    if (!response.ok) {
      throw new ApiError(
        response.status,
        data.error || 'UNKNOWN_ERROR',
        data.message || `Request failed with status ${response.status}`,
        data
      )
    }

    return (data.data ?? data) as T
  }

  // ============================================================================
  // AUTHENTICATION
  // ============================================================================
  auth = {
    login: async (email: string, password: string) => {
      const data = await this.request<{
        user: { id: string; name: string; email: string; role: string }
        accessToken: string
        refreshToken: string
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })

      // Store tokens
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('refreshToken', data.refreshToken)
        localStorage.setItem('autoserve_user', JSON.stringify(data.user))
      }

      return data
    },

    register: async (userData: {
      email: string
      password: string
      firstName?: string
      lastName?: string
      phoneNumber?: string
      role?: 'CUSTOMER' | 'MECHANIC'
    }) => {
      const data = await this.request<{
        user: { id: string; name: string; email: string; role: string }
        accessToken: string
        refreshToken: string
      }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      })

      // Store tokens
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('refreshToken', data.refreshToken)
        localStorage.setItem('autoserve_user', JSON.stringify(data.user))
      }

      return data
    },

    logout: async () => {
      const refreshToken = this.getRefreshToken()
      if (refreshToken) {
        try {
          await this.request('/auth/logout', {
            method: 'POST',
            body: JSON.stringify({ refreshToken }),
          })
        } catch (error) {
          console.error('[API] Logout error:', error)
        }
      }

      // Clear local storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('autoserve_user')
      }
    },

    refresh: async () => {
      return this.refreshAccessToken()
    },
  }

  // ============================================================================
  // BOOKINGS
  // ============================================================================
  bookings = {
    getAll: async (filters?: {
      status?: string
      page?: number
      limit?: number
    }) => {
      const params = new URLSearchParams()
      if (filters?.status) params.append('status', filters.status)
      if (filters?.page) params.append('page', filters.page.toString())
      if (filters?.limit) params.append('limit', filters.limit.toString())

      return this.request<{
        data: any[]
        meta: { total: number; page: number; limit: number }
      }>(`/bookings?${params.toString()}`)
    },

    getById: async (id: string) => {
      return this.request(`/bookings/${id}`)
    },

    create: async (bookingData: {
      serviceId: string
      scheduledAt: string
      pickupLatitude: number
      pickupLongitude: number
      pickupAddress: string
      pickupLocationNotes?: string
    }) => {
      return this.request('/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData),
      })
    },

    search: async (searchData: {
      vehicleId?: string
      services: string[]
      location: {
        lat: number
        lng: number
        address: string
      }
      urgency?: 'standard' | 'urgent' | 'emergency'
    }) => {
      return this.request<{
        jobId: string
        status: 'searching'
        estimatedMatchTime: number
      }>('/bookings/search', {
        method: 'POST',
        body: JSON.stringify(searchData),
      })
    },

    updateStatus: async (id: string, status: string) => {
      return this.request(`/bookings/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      })
    },

    cancel: async (id: string) => {
      return this.request(`/bookings/${id}/cancel`, {
        method: 'PUT',
      })
    },
  }

  // ============================================================================
  // MECHANICS
  // ============================================================================
  mechanics = {
    getProfile: async (id?: string) => {
      const endpoint = id ? `/mechanic/profile?id=${id}` : '/mechanic/profile'
      return this.request(endpoint)
    },

    getNearby: async (lat: number, lng: number, radiusKm = 20) => {
      return this.request<Array<{
        id: string
        name: string
        rating: number
        distance: number
        location: { lat: number; lng: number }
        services: string[]
        isAvailable: boolean
      }>>(`/mechanics/nearby?lat=${lat}&lng=${lng}&radius=${radiusKm}`)
    },

    getServices: async (mechanicId?: string) => {
      const endpoint = mechanicId
        ? `/mechanic/services?mechanicId=${mechanicId}`
        : '/mechanic/services'
      return this.request(endpoint)
    },

    updateProfile: async (data: {
      shopName?: string
      bio?: string
      serviceRadiusKm?: number
      isEvSpecialist?: boolean
      skills?: string[]
    }) => {
      return this.request('/mechanic/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      })
    },
  }

  // ============================================================================
  // DISPATCH (Job Matching)
  // ============================================================================
  dispatch = {
    accept: async (dispatchId: string) => {
      return this.request(`/dispatch/${dispatchId}/accept`, {
        method: 'PATCH',
      })
    },

    reject: async (dispatchId: string, reason?: string) => {
      return this.request(`/dispatch/${dispatchId}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      })
    },
  }

  // ============================================================================
  // LOCATION & TRACKING
  // ============================================================================
  location = {
    update: async (lat: number, lng: number) => {
      return this.request('/location/update', {
        method: 'POST',
        body: JSON.stringify({ lat, lng }),
      })
    },

    getTracking: async (bookingId: string) => {
      return this.request<{
        mechanicLocation: { lat: number; lng: number }
        customerLocation: { lat: number; lng: number }
        eta: number
        distance: number
        status: 'en_route' | 'arrived' | 'in_progress'
      }>(`/tracking/${bookingId}`)
    },
  }

  // ============================================================================
  // ADMIN
  // ============================================================================
  admin = {
    getDispatchMap: async () => {
      return this.request<{
        activeJobs: Array<{
          id: string
          customerLocation: { lat: number; lng: number }
          mechanicLocation: { lat: number; lng: number } | null
          status: string
          eta: number
          customerName: string
          serviceType: string
        }>
        availableMechanics: Array<{
          id: string
          location: { lat: number; lng: number }
          status: string
          name: string
        }>
      }>('/admin/dispatch-map')
    },

    getDisputes: async (filters?: { status?: string; page?: number }) => {
      const params = new URLSearchParams()
      if (filters?.status) params.append('status', filters.status)
      if (filters?.page) params.append('page', filters.page.toString())

      return this.request(`/admin/disputes?${params.toString()}`)
    },

    resolveDispute: async (id: string, resolution: {
      status: 'RESOLVED' | 'REJECTED'
      resolution?: string
      resolvedAmount?: number
    }) => {
      return this.request(`/admin/disputes/${id}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify(resolution),
      })
    },
  }

  // ============================================================================
  // PAYMENTS & WALLET
  // ============================================================================
  payments = {
    getHistory: async (filters?: { page?: number; limit?: number }) => {
      const params = new URLSearchParams()
      if (filters?.page) params.append('page', filters.page.toString())
      if (filters?.limit) params.append('limit', filters.limit.toString())

      return this.request<{
        data: Array<{
          id: string
          amount: number
          status: string
          createdAt: string
          bookingId?: string
          gateway: string
        }>
        meta: { total: number; page: number; limit: number }
      }>(`/payments?${params.toString()}`)
    },

    process: async (paymentData: {
      bookingId: string
      amount: number
      method: 'PAYSTACK' | 'FLUTTERWAVE' | 'WALLET'
    }) => {
      return this.request('/payments/process', {
        method: 'POST',
        body: JSON.stringify(paymentData),
      })
    },
  }

  wallet = {
    getBalance: async () => {
      return this.request<{
        balance: number
        pending: number
      }>('/wallet')
    },

    getTransactions: async (filters?: { page?: number }) => {
      const params = new URLSearchParams()
      if (filters?.page) params.append('page', filters.page.toString())

      return this.request(`/wallet/transactions?${params.toString()}`)
    },
  }

  // ============================================================================
  // VEHICLES (Garage)
  // ============================================================================
  vehicles = {
    getAll: async () => {
      return this.request<Array<{
        id: string
        make: string
        model: string
        year: number
        licensePlate: string
        vin?: string
        createdAt: string
      }>>('/vehicles')
    },

    getById: async (id: string) => {
      return this.request(`/vehicles/${id}`)
    },

    create: async (vehicleData: {
      make: string
      model: string
      year: number
      licensePlate: string
      vin?: string
    }) => {
      return this.request('/vehicles', {
        method: 'POST',
        body: JSON.stringify(vehicleData),
      })
    },

    update: async (id: string, vehicleData: {
      make?: string
      model?: string
      year?: number
      licensePlate?: string
      vin?: string
    }) => {
      return this.request(`/vehicles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(vehicleData),
      })
    },

    delete: async (id: string) => {
      return this.request(`/vehicles/${id}`, {
        method: 'DELETE',
      })
    },

    getServiceHistory: async (id: string) => {
      return this.request<Array<{
        id: string
        date: string
        service: string
        cost: number
        mechanic: string
        bookingId: string
      }>>(`/vehicles/${id}/history`)
    },
  }
}

export const api = new ApiClient()
export { ApiError }
