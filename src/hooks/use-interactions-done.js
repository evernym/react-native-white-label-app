// @flow

import { useState, useEffect } from 'react'

export function useInteractionDone() {
  const [interactionDone, setInteractionDone] = useState(false)

  useEffect(() => {
    let timeOutId

    timeOutId = setTimeout(() => {
      setInteractionDone(true)
    }, 500)

    return () => clearTimeout(timeOutId)
  }, [])

  return [interactionDone]
}
