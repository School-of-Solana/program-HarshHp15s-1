"use client"

import { useEffect, useRef } from "react"

interface Node {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  connections: number[]
}

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nodesRef = useRef<Node[]>([])
  const animationRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const createNodes = () => {
      const nodeCount = Math.floor((canvas.width * canvas.height) / 15000)
      nodesRef.current = []

      for (let i = 0; i < nodeCount; i++) {
        nodesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 3 + 1,
          opacity: Math.random() * 0.5 + 0.2,
          connections: [],
        })
      }
    }

    const updateNodes = () => {
      nodesRef.current.forEach((node, i) => {
        node.x += node.vx
        node.y += node.vy

        if (node.x < 0 || node.x > canvas.width) node.vx *= -1
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1

        node.x = Math.max(0, Math.min(canvas.width, node.x))
        node.y = Math.max(0, Math.min(canvas.height, node.y))

        // Find connections
        node.connections = []
        nodesRef.current.forEach((otherNode, j) => {
          if (i !== j) {
            const dx = node.x - otherNode.x
            const dy = node.y - otherNode.y
            const distance = Math.sqrt(dx * dx + dy * dy)
            if (distance < 150) {
              node.connections.push(j)
            }
          }
        })
      })
    }

    const drawNodes = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw connections
      nodesRef.current.forEach((node, i) => {
        node.connections.forEach((connectionIndex) => {
          const connectedNode = nodesRef.current[connectionIndex]
          const dx = node.x - connectedNode.x
          const dy = node.y - connectedNode.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          const opacity = (1 - distance / 150) * 0.3

          ctx.beginPath()
          ctx.moveTo(node.x, node.y)
          ctx.lineTo(connectedNode.x, connectedNode.y)
          ctx.strokeStyle = `rgba(220, 38, 38, ${opacity})`
          ctx.lineWidth = 0.5
          ctx.stroke()
        })
      })

      // Draw nodes
      nodesRef.current.forEach((node) => {
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2)

        // Create gradient for glow effect
        const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.size * 3)
        gradient.addColorStop(0, `rgba(245, 158, 11, ${node.opacity})`)
        gradient.addColorStop(0.5, `rgba(220, 38, 38, ${node.opacity * 0.5})`)
        gradient.addColorStop(1, "rgba(220, 38, 38, 0)")

        ctx.fillStyle = gradient
        ctx.fill()

        // Draw core
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.size * 0.3, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(245, 158, 11, ${node.opacity + 0.3})`
        ctx.fill()
      })
    }

    const animate = () => {
      updateNodes()
      drawNodes()
      animationRef.current = requestAnimationFrame(animate)
    }

    resizeCanvas()
    createNodes()
    animate()

    const handleResize = () => {
      resizeCanvas()
      createNodes()
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }} />
}
