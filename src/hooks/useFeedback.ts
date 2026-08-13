import { useCallback, useState } from 'react'

export function useFeedback() {
  const [message, setMessage] = useState('')

  const show = useCallback((text = 'Alterações salvas ✓') => {
    setMessage(text)
    window.setTimeout(() => setMessage(''), 2800)
  }, [])

  return { message, show }
}
