import { useEffect, useMemo, useRef, useState } from "react"

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error"

interface UseBinaryStreamResult {
  status: ConnectionStatus
  bytes: Uint8Array
  bytesReceived: number
  currentOffset: number
  error: string | null
}

export function useBinaryStream(wsUrl: string): UseBinaryStreamResult {
  const [status, setStatus] = useState<ConnectionStatus>("connecting")
  const [bytes, setBytes] = useState<Uint8Array>(new Uint8Array())
  const [bytesReceived, setBytesReceived] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const socketRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const socket = new WebSocket(wsUrl)
    socket.binaryType = "arraybuffer"
    socketRef.current = socket
    setStatus("connecting")
    setError(null)

    socket.onopen = () => {
      setStatus("connected")
    }

    socket.onmessage = (event) => {
      const chunk =
        event.data instanceof ArrayBuffer
          ? new Uint8Array(event.data)
          : new Uint8Array()

      if (chunk.length === 0) {
        return
      }

      setBytes((previous) => {
        const next = new Uint8Array(previous.length + chunk.length)
        next.set(previous, 0)
        next.set(chunk, previous.length)
        return next
      })
      setBytesReceived((previous) => previous + chunk.length)
    }

    socket.onerror = () => {
      setStatus("error")
      setError("WebSocket connection failed")
    }

    socket.onclose = () => {
      setStatus("disconnected")
    }

    return () => {
      socket.close()
      socketRef.current = null
    }
  }, [wsUrl])

  const currentOffset = useMemo(() => bytesReceived, [bytesReceived])

  return { status, bytes, bytesReceived, currentOffset, error }
}
