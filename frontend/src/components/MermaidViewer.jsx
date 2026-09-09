// components/MermaidViewer.jsx — Renders Mermaid.js diagrams with error recovery
import { useEffect, useRef, useState, useId } from 'react'
import mermaid from 'mermaid'

mermaid.initialize({
  startOnLoad: false,
  theme: 'neutral',
  securityLevel: 'loose',
  fontFamily: 'Inter, system-ui, sans-serif',
  themeVariables: {
    primaryColor: '#e0e7ff',
    primaryBorderColor: '#6366f1',
    primaryTextColor: '#1e1b4b',
    lineColor: '#6366f1',
    secondaryColor: '#ccfbf1',
    tertiaryColor: '#fef3c7',
  }
})

export default function MermaidViewer({ chart }) {
  const containerRef = useRef(null)
  const [svgContent, setSvgContent] = useState('')
  const [error, setError] = useState(null)
  const uniqueId = useId().replace(/:/g, 'm_')

  useEffect(() => {
    let isMounted = true
    if (!chart || !chart.trim()) {
      setSvgContent('')
      setError(null)
      return
    }

    const renderChart = async () => {
      try {
        setError(null)
        // Clean up common markdown artifacts if any
        let cleanChart = chart.replace(/```mermaid/g, '').replace(/```/g, '').trim()
        if (!cleanChart) return

        const id = `mermaid_${uniqueId}_${Date.now()}`
        const { svg } = await mermaid.render(id, cleanChart)
        if (isMounted) {
          setSvgContent(svg)
        }
      } catch (err) {
        console.warn('Mermaid rendering error:', err)
        if (isMounted) {
          setError('Could not render diagram visually. Showing code structure instead.')
        }
      }
    }

    renderChart()

    return () => {
      isMounted = false
    }
  }, [chart, uniqueId])

  if (!chart) return null

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
        <p className="text-xs text-amber-600 font-medium mb-2">⚠️ Diagram Syntax Preview</p>
        <pre className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-100 overflow-x-auto font-mono">
          {chart}
        </pre>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="mermaid-container flex justify-center items-center p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-slate-200/80 shadow-sm overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  )
}
