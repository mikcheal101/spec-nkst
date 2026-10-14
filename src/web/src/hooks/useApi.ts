export async function unwrap<T>(promise: Promise<{ data?: T; error?: string }>): Promise<T> {
  const res = await promise
  if (res.error) throw new Error(res.error)
  return res.data as T
}
