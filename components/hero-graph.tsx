"use client"

import { useEffect, useState } from "react"
import { Check, Circle, CircleDot } from "lucide-react"
import { cn } from "@/lib/utils"

interface Node {
  id: string
  label: string
  x: number
  y: number
  status: "completed" | "learning" | "not-started"
  importance: "required" | "important" | "optional"
}

// Designed manually to evoke an LLM Engineer skill tree.
const nodes: Node[] = [
  { id: "root", label: "LLM Engineer", x: 50, y: 50, status: "learning", importance: "required" },

  { id: "py", label: "Python", x: 18, y: 22, status: "completed", importance: "required" },
  { id: "la", label: "Linear Algebra", x: 14, y: 50, status: "learning", importance: "required" },
  { id: "nn", label: "Neural Nets", x: 18, y: 78, status: "learning", importance: "required" },

  { id: "tf", label: "Transformers", x: 50, y: 14, status: "not-started", importance: "required" },
  { id: "rag", label: "RAG", x: 82, y: 22, status: "not-started", importance: "required" },
  { id: "ft", label: "Fine-Tuning", x: 86, y: 50, status: "not-started", importance: "required" },
  { id: "vec", label: "Vector DBs", x: 82, y: 78, status: "not-started", importance: "important" },
  { id: "ev", label: "Evals", x: 50, y: 86, status: "not-started", importance: "important" },
]

const edges: [string, string][] = [
  ["root", "py"],
  ["root", "la"],
  ["root", "nn"],
  ["root", "tf"],
  ["root", "rag"],
  ["root", "ft"],
  ["root", "vec"],
  ["root", "ev"],
  ["py", "nn"],
  ["nn", "tf"],
  ["tf", "rag"],
  ["rag", "vec"],
  ["ft", "ev"],
]

const statusStyles: Record<Node["status"], string> = {
  completed: "border-success/60 bg-success/10 text-success",
  learning: "border-primary/60 bg-primary/10 text-primary",
  "not-started": "border-border bg-card text-muted-foreground",
}

export function HeroGraph() {
  const [activeIndex, setActiveIndex] = useState(0)

  // Subtle pulse cycling through nodes for a "live" feel.
  useEffect(() => {
    const id = setInterval(() => {
      setActiveIndex((i) => (i + 1) % nodes.length)
    }, 1800)
    return () => clearInterval(id)
  }, [])

  const findNode = (id: string) => nodes.find((n) => n.id === id)!

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border bg-card/60">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-grid bg-grid-fade opacity-40" aria-hidden="true" />

      {/* Edges */}
      <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
        {edges.map(([a, b], i) => {
          const na = findNode(a)
          const nb = findNode(b)
          return (
            <line
              key={i}
              x1={`${na.x}%`}
              y1={`${na.y}%`}
              x2={`${nb.x}%`}
              y2={`${nb.y}%`}
              stroke="currentColor"
              className="text-border"
              strokeWidth={1}
              strokeDasharray={a === "root" ? "0" : "3 4"}
            />
          )
        })}
      </svg>

      {/* Nodes */}
      {nodes.map((node, idx) => {
        const isActive = idx === activeIndex
        const isRoot = node.id === "root"
        return (
          <div
            key={node.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium backdrop-blur-sm transition-all duration-500",
                statusStyles[node.status],
                isRoot && "px-3 py-1.5 text-xs font-semibold border-primary bg-primary/15 text-primary",
                isActive && !isRoot && "scale-110 shadow-lg shadow-primary/10 border-primary/80",
              )}
            >
              {node.status === "completed" ? (
                <Check className="size-3" />
              ) : node.status === "learning" ? (
                <CircleDot className="size-3" />
              ) : (
                <Circle className="size-3" />
              )}
              <span className="whitespace-nowrap font-mono">{node.label}</span>
            </div>
            {isActive && !isRoot && (
              <span
                className="absolute inset-0 -z-10 animate-ping rounded-full bg-primary/30"
                aria-hidden="true"
              />
            )}
          </div>
        )
      })}

      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex flex-wrap gap-2 text-[10px] font-mono text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-success" /> Completed
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-primary" /> Learning
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-muted-foreground/60" /> Not started
        </span>
      </div>
    </div>
  )
}
