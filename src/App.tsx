import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card"
import { ImageCanvas } from "./components/stream/ImageCanvas"
import { useBinaryStream } from "./hooks/useBinaryStream"

const WS_URL = import.meta.env.VITE_STREAM_WS_URL ?? "ws://localhost:8080/ws"

function App() {
  const { status, bytes, bytesReceived, currentOffset, error } = useBinaryStream(WS_URL)

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight">Real-time Progressive Binary Image Streamer</h1>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Connection</CardTitle>
              <CardDescription>WebSocket stream connectivity</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold capitalize">{status}</p>
              {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Metrics</CardTitle>
              <CardDescription>Incoming binary stream counters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>
                Bytes Received: <span className="font-semibold">{bytesReceived.toLocaleString()}</span>
              </p>
              <p>
                Current File Offset: <span className="font-semibold">{currentOffset.toLocaleString()}</span>
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Canvas Viewport</CardTitle>
            <CardDescription>Progressive grayscale paint based on streamed bytes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-video w-full">
              <ImageCanvas width={512} height={512} bytes={bytes} />
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

export default App
