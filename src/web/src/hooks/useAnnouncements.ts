import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { announcementApi } from '../services/api'
import { unwrap } from './useApi'

export function useAnnouncementsList() {
  return useQuery({
    queryKey: ['announcements'],
    queryFn: () => unwrap(announcementApi.list()),
  })
}

export function useEventsList() {
  return useQuery({
    queryKey: ['events'],
    queryFn: () => unwrap(announcementApi.listEvents()),
  })
}

export function useCreateAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => unwrap(announcementApi.create(data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
  })
}

export function useUpdateAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => unwrap(announcementApi.update(id, data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
  })
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => unwrap(announcementApi.delete(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
  })
}

export function useCreateEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => unwrap(announcementApi.createEvent(data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  })
}

export function useUpdateEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => unwrap(announcementApi.updateEvent(id, data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  })
}

export function useDeleteEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => unwrap(announcementApi.deleteEvent(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  })
}
