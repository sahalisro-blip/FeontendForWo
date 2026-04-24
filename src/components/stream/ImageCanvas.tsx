import { useEffect, useRef } from "react"

interface ImageCanvasProps {
  width: number
  height: number
  bytes: Uint8Array
}

export function ImageCanvas({ width, height, bytes }: ImageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext("2d")
    if (!context) return

    const imageData = context.createImageData(width, height)
    const pixelCount = width * height
    const maxPixelsToPaint = Math.min(pixelCount, bytes.length)

    for (let i = 0; i < maxPixelsToPaint; i += 1) {
      const brightness = bytes[i]
      const rgbaOffset = i * 4
      imageData.data[rgbaOffset] = brightness
      imageData.data[rgbaOffset + 1] = brightness
      imageData.data[rgbaOffset + 2] = brightness
      imageData.data[rgbaOffset + 3] = 255
    }

    context.putImageData(imageData, 0, 0)
  }, [bytes, width, height])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="h-full w-full max-h-[70vh] rounded-md border bg-black object-contain"
    />
  )
}
