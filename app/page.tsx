"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Maximize2, X } from "lucide-react"

// Simple Handlebars compiler
function compileHandlebars(template: string, context: any = {}): string {
  try {
    // Replace {{variable}} with context values
    return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, variable) => {
      const keys = variable.trim().split(".")
      let value = context

      for (const key of keys) {
        if (value && typeof value === "object" && key in value) {
          value = value[key]
        } else {
          return match // Return original if not found
        }
      }

      return String(value ?? match)
    })
  } catch (error) {
    return `Error: ${error instanceof Error ? error.message : "Unknown error"}`
  }
}

// Default sample data
const defaultTemplate = `<!DOCTYPE html>
<html>
<head>
    <title>{{title}}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { color: {{theme.primaryColor}}; }
        .user-info { background: {{theme.backgroundColor}}; padding: 20px; }
    </style>
</head>
<body>
    <h1 class="header">Welcome {{user.name}}!</h1>
    <div class="user-info">
        <p>Email: {{user.email}}</p>
        <p>Role: {{user.role}}</p>
        <p>Last login: {{user.lastLogin}}</p>
    </div>
    <script>
        console.log('User: {{user.name}}');
    </script>
</body>
</html>`

const defaultContext = {
  title: "My Dashboard",
  user: {
    name: "John Doe",
    email: "john@example.com",
    role: "Admin",
    lastLogin: "2024-01-15",
  },
  theme: {
    primaryColor: "#2563eb",
    backgroundColor: "#f8fafc",
  },
}

export default function HBSVisualizer() {
  const [template, setTemplate] = useState(defaultTemplate)
  const [context, setContext] = useState(JSON.stringify(defaultContext, null, 2))
  const [mode, setMode] = useState<"raw" | "compiled">("raw")
  const [autoRecompile, setAutoRecompile] = useState(true)
  const [output, setOutput] = useState("")
  const [contextError, setContextError] = useState("")
  const [showCompiledHtml, setShowCompiledHtml] = useState(true)
  const [fullscreenModal, setFullscreenModal] = useState<{ type: "code" | "preview" | null; content: string }>({
    type: null,
    content: "",
  })

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isLongPressRef = useRef(false)

  const handleMouseDown = (type: "code" | "preview", content: string) => {
    isLongPressRef.current = false
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true
      setFullscreenModal({ type, content })
    }, 500) // 500ms for long press
  }

  const handleMouseUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  const handleClick = (type: "code" | "preview", content: string) => {
    if (!isLongPressRef.current) {
      setFullscreenModal({ type, content })
    }
  }

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }
    }
  }, [])

  const compileTemplate = useCallback(() => {
    try {
      const parsedContext = JSON.parse(context)
      setContextError("")

      if (mode === "raw") {
        setOutput(template)
      } else {
        const compiled = compileHandlebars(template, parsedContext)
        setOutput(compiled)
      }
    } catch (error) {
      setContextError("Invalid JSON context")
      setOutput(template)
    }
  }, [template, context, mode])

  useEffect(() => {
    if (!autoRecompile) return

    const timer = setTimeout(compileTemplate, 300)
    return () => clearTimeout(timer)
  }, [template, context, mode, autoRecompile, compileTemplate])

  const handleManualCompile = () => {
    compileTemplate()
  }

  useEffect(() => {
    compileTemplate()
  }, [compileTemplate])

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Handlebars Visualizer</h1>
          <p className="text-muted-foreground">Visualize your HBS templates in raw or compiled mode</p>
        </div>

        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Controls</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="mode-switch">Mode:</Label>
                  <Badge variant={mode === "raw" ? "default" : "secondary"}>
                    {mode === "raw" ? "Raw" : "Compiled"}
                  </Badge>
                  <Switch
                    id="mode-switch"
                    checked={mode === "compiled"}
                    onCheckedChange={(checked) => setMode(checked ? "compiled" : "raw")}
                  />
                </div>
                {mode === "compiled" && (
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="show-html">Show HTML:</Label>
                    <Switch id="show-html" checked={showCompiledHtml} onCheckedChange={setShowCompiledHtml} />
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Label htmlFor="auto-recompile">Auto-recompile:</Label>
                  <Switch id="auto-recompile" checked={autoRecompile} onCheckedChange={setAutoRecompile} />
                </div>
                {!autoRecompile && (
                  <Button onClick={handleManualCompile} size="sm">
                    Compile
                  </Button>
                )}
              </div>
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>HBS Template</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  placeholder="Paste your Handlebars template here..."
                  className="min-h-[300px] font-mono text-sm"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Context Data (JSON)</span>
                  {contextError && (
                    <Badge variant="destructive" className="text-xs">
                      {contextError}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Enter JSON context data..."
                  className="min-h-[200px] font-mono text-sm"
                />
              </CardContent>
            </Card>
          </div>

          {/* Output Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Output ({mode === "raw" ? "Raw Template" : "Compiled HTML"})</span>
                <Button
                  variant="outline"
                  size="sm"
                  onMouseDown={() => handleMouseDown("code", output)}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onClick={() => handleClick("code", output)}
                  className="flex items-center gap-1"
                >
                  <Maximize2 className="h-4 w-4" />
                  Fullscreen
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {showCompiledHtml && (
                  <Textarea value={output} readOnly className="min-h-[500px] font-mono text-sm bg-muted" />
                )}

                {mode === "compiled" && (
                  <div className="border rounded-lg p-4 bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium">Live Preview:</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onMouseDown={() => handleMouseDown("preview", output)}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onClick={() => handleClick("preview", output)}
                        className="flex items-center gap-1"
                      >
                        <Maximize2 className="h-4 w-4" />
                        Fullscreen
                      </Button>
                    </div>
                    <div
                      className="border rounded bg-white min-h-[200px] p-4 overflow-auto"
                      dangerouslySetInnerHTML={{ __html: output }}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fullscreen Modal */}
        <Dialog
          open={fullscreenModal.type !== null}
          onOpenChange={() => setFullscreenModal({ type: null, content: "" })}
        >
          <DialogContent className="w-[90vw] max-h-[95vh] h-full">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>{fullscreenModal.type === "code" ? "Code Output" : "Live Preview"} - Fullscreen</span>
                <Button variant="ghost" size="sm" onClick={() => setFullscreenModal({ type: null, content: "" })}>
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
              {fullscreenModal.type === "code" ? (
                <Textarea
                  value={fullscreenModal.content}
                  readOnly
                  className="w-full h-full font-mono text-sm bg-muted resize-none"
                />
              ) : (
                <div
                  className="w-full h-full border rounded bg-white overflow-auto p-4"
                  dangerouslySetInnerHTML={{ __html: fullscreenModal.content }}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
