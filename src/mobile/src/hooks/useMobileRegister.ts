import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'

export const useMobileRegister = () => {
  const queryClient = useQueryClient()
  const lastTapRef = useRef(Date.now())
  const [isSubmitting, setIsSubmitting] = useState(false)

  const mutation = useMutation({
    mutationFn: async (data: {
      username: string
      password: string
      churchId: string
      isBaptised: boolean
      baptismalNumber?: string
    }) => {
      const lastTap = lastTapRef.current
      const now = Date.now()
      if (now - lastTap < 1000) {
        setIsSubmitting(true)
        return Promise.reject(new Error('Double tap detected, please wait'))
      }
      lastTapRef.current = now
      setIsSubmitting(false)
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Registration failed')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member', 'current'] })
    },
  })

  const register = async (data: {
    username: string
    password: string
    churchId: string
    isBaptised: boolean
    baptismalNumber?: string
  }) => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      await mutation.mutateAsync(data)
    } finally {
      setIsSubmitting(false)
    }
  }

  return { register, isSubmitting, mutation }
}