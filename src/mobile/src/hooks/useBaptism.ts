import { useState } from 'react'

export const useBaptism = () => {
  const [isBaptised, setIsBaptised] = useState(false)
  const [baptismalNumber, setBaptismalNumber] = useState('')

  const setIsBaptised = (value: boolean) => {
    setIsBaptised(value)
    if (!value) {
      setBaptismalNumber('')
    }
  }

  const setBaptismalNumberValue = (value: string) => {
    setBaptismalNumber(value)
  }

  return { isBaptised, setIsBaptised, baptismalNumber, setBaptismalNumber: setBaptismalNumberValue }
}

export type { useBaptism }