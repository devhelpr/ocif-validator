import { useState, useCallback } from 'react'
import Ajv, { ErrorObject } from 'ajv'
import JSON5 from 'json5'
import schema from '../schema.json'
import { ExportButton } from './components/molecules/ExportButton'

// Define the OCIF JSON type based on the schema
type OCIFJson = {
  version: string;
  nodes?: {
    [key: string]: {
      id: string;
      position?: [number, number];
      size?: [number, number];
      resource?: {
        text?: string;
      };
      text?: string;
      data?: Array<{
        type: '@ocwg/node/oval' | '@ocwg/node/rectangle' | '@ocwg/node/arrow';
        strokeWidth?: number;
        strokeColor?: string;
        fillColor?: string;
      }>;
    };
  };
  relations?: Array<{
    id: string;
    data: Array<{
      type: string;
      start: string;
      end: string;
      rel: string;
      node: string;
    }>;
  }>;
};

const ajv = new Ajv({ allErrors: true, verbose: true })
const validate = ajv.compile(schema)

interface ValidationError {
  path: string;
  message: string;
  line: number;
  column: number;
  details?: string;
  context?: string;
}

function getSchemaDetails(error: ErrorObject): string {
  switch (error.keyword) {
    case 'type':
      return `Expected type: ${error.params.type}`
    case 'enum':
      return `Allowed values: ${(error.params.allowedValues as string[]).join(', ')}`
    case 'required':
      return `Required property missing: ${error.params.missingProperty}`
    case 'pattern':
      return `Should match pattern: ${error.params.pattern}`
    case 'format':
      return `Should match format: ${error.params.format}`
    case 'const':
      return `Expected value: ${JSON.stringify(error.params.allowedValue)}`
    case 'minimum':
    case 'maximum':
    case 'minLength':
    case 'maxLength':
      return `${error.message} (${JSON.stringify(error.params)})`
    default:
      if (error.message?.startsWith('must be equal to constant')) {
        return ''
      }
      return error.message || ''
  }
}

function findLineColumn(jsonString: string, path: string): { line: number; column: number } {
  const lines = jsonString.split('\n')
  const currentPath: string[] = []
  let inString = false
  let escapeNext = false
  let currentKey = ''
  let collectingKey = false
  
  for (let line = 0; line < lines.length; line++) {
    const lineContent = lines[line]
    for (let col = 0; col < lineContent.length; col++) {
      const char = lineContent[col]
      
      if (escapeNext) {
        escapeNext = false
        continue
      }

      if (char === '\\') {
        escapeNext = true
        continue
      }

      if (char === '"' && !escapeNext) {
        inString = !inString
        if (!inString && collectingKey) {
          collectingKey = false
          currentPath.push(currentKey)
          currentKey = ''
        }
        continue
      }

      if (inString) {
        if (collectingKey) {
          currentKey += char
        }
        continue
      }

      if (char === ':') {
        collectingKey = false
        continue
      }

      if (char === '{' || char === '[') {
        if (char === '{') {
          collectingKey = true
        }
        continue
      }

      if (char === '}' || char === ']' || char === ',') {
        if (currentPath.length > 0) {
          currentPath.pop()
        }
        if (char === ',') {
          collectingKey = true
        }
        continue
      }

      const currentPathStr = '/' + currentPath.join('/')
      if (currentPathStr === path) {
        // Look ahead to find the actual value position
        const restOfLine = lineContent.slice(col)
        const valueMatch = restOfLine.match(/:\s*"?([^"]*)"?/)
        if (valueMatch) {
          const valueStart = col + valueMatch.index! + valueMatch[0].indexOf(valueMatch[1])
          return { line: line + 1, column: valueStart + 1 }
        }
        return { line: line + 1, column: col + 1 }
      }
    }
  }
  
  return { line: 1, column: 1 }
}

function App() {
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors?: ValidationError[];
  } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [currentJson, setCurrentJson] = useState<OCIFJson | null>(null)

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      let json
      
      try {
        // First try standard JSON parse
        json = JSON.parse(text)
      } catch {
        try {
          // If standard JSON fails, try JSON5
          json = JSON5.parse(text)
        } catch {
          throw new Error('Invalid JSON/JSON5 format')
        }
      }

      setCurrentJson(json)
      const isValid = validate(json)

      if (!isValid && validate.errors) {
        const errors: ValidationError[] = validate.errors.map(error => {
          const path = error.instancePath || '/'
          const { line, column } = findLineColumn(text, path)
          
          // Get context from the file
          const lines = text.split('\n')
          const contextLine = lines[line - 1] || ''
          const context = contextLine.trim()

          return {
            path: path === '' ? '/' : path,
            message: error.message || 'Unknown error',
            line,
            column,
            details: getSchemaDetails(error),
            context
          }
        })

        setValidationResult({
          isValid: false,
          errors
        })
      } else {
        setValidationResult({
          isValid: true
        })
      }
    } catch {
      setCurrentJson(null)
      setValidationResult({
        isValid: false,
        errors: [{
          path: '/',
          message: 'Invalid JSON/JSON5 format',
          line: 1,
          column: 1,
          details: 'The file contains invalid JSON/JSON5 syntax'
        }]
      })
    }
  }, [])

  const handleExport = useCallback(() => {
    if (!currentJson || !validationResult?.isValid) return;

    // Create SVG content based on OCIF data
    const svgContent = generateSVG(currentJson);
    
    // Create blob and download
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ocif-export.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [currentJson, validationResult]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && (file.type === 'application/json' || file.name.toLowerCase().endsWith('.json') || file.name.toLowerCase().endsWith('.json5'))) {
      const input = document.getElementById('file-upload') as HTMLInputElement
      if (input) {
        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(file)
        input.files = dataTransfer.files
        const event = new Event('change', { bubbles: true }) as unknown as React.ChangeEvent<HTMLInputElement>
        Object.defineProperty(event, 'target', { value: input })
        handleFileUpload(event)
      }
    }
  }, [handleFileUpload])

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 p-4 sm:p-8 md:p-12">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-white rounded-3xl shadow-xl shadow-zinc-200/50 backdrop-blur-sm animate-fade-in">
          <div className="px-6 py-8 sm:px-8 sm:py-10">
            <div className="text-center mb-12">
              <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 inline-block text-transparent bg-clip-text mb-4">
                OCIF JSON Validator
              </h1>
              <p className="text-zinc-600">
                Upload your JSON file to validate against the OCIF schema
              </p>
              <p className="text-sm text-zinc-500 mt-2">
                Currently supporting OCIF specification v0.4
              </p>
            </div>
            
            <div className="mt-8">
              <div 
                className={`border-2 border-dashed rounded-2xl p-8 transition-all duration-300 ${
                  isDragging 
                    ? 'border-indigo-400 bg-indigo-50' 
                    : 'border-zinc-200 hover:border-indigo-300'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="space-y-6 text-center">
                  <div className="relative">
                    <svg
                      className="mx-auto h-16 w-16 text-indigo-400 transition-transform duration-300 group-hover:scale-110"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div className="flex flex-col items-center space-y-4">
                    <label
                      htmlFor="file-upload"
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium flex items-center gap-2 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/25"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept=".json,.json5"
                        onChange={handleFileUpload}
                      />
                    </label>
                    <p className="text-zinc-600">or drag and drop</p>
                    <p className="text-sm text-zinc-500">JSON and JSON5 files</p>
                  </div>
                </div>
              </div>
            </div>

            {validationResult && (
              <div 
                className={`mt-8 p-8 rounded-2xl transition-all duration-300 transform animate-slide-in ${
                  validationResult.isValid 
                    ? 'bg-teal-50 border border-teal-200' 
                    : 'bg-rose-50 border border-rose-200'
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  {validationResult.isValid ? (
                    <svg className="w-8 h-8 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <h3 className={`text-xl font-semibold ${
                    validationResult.isValid 
                      ? 'text-teal-800' 
                      : 'text-rose-800'
                  }`}>
                    {validationResult.isValid 
                      ? 'Validation Successful!' 
                      : 'Validation Failed'}
                  </h3>
                </div>
                {validationResult.errors && (
                  <ul className="space-y-4 mt-6">
                    {validationResult.errors.map((error, index) => (
                      <li key={index} className="flex flex-col gap-1">
                        <div className="flex items-start gap-2">
                          <span className="text-rose-500 mt-1 flex-shrink-0">•</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-rose-700 font-medium flex flex-wrap gap-2 items-baseline">
                              <span>Error at {error.path}</span>
                              <span className="text-zinc-600 font-normal text-sm">
                                (line {error.line}, column {error.column})
                              </span>
                            </p>
                            {error.context && (
                              <pre className="mt-2 p-2 bg-white/50 border border-rose-200 rounded-lg text-sm font-mono text-zinc-700 whitespace-pre-wrap break-all max-h-[6.5rem] overflow-y-auto">
                                {error.context}
                              </pre>
                            )}
                            <p className="text-rose-600 mt-2 break-words">{error.message}</p>
                            {error.details && (
                              <p className="text-zinc-600 text-sm mt-1 break-words">{error.details}</p>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {validationResult?.isValid && (
              <div className="mt-8 flex justify-center">
                <ExportButton 
                  onExport={handleExport}
                  disabled={!currentJson || !validationResult?.isValid}
                  variant="subtle"
                />
              </div>
            )}
          </div>
          <div className="mt-8 px-6 py-6 sm:px-8 border-t border-zinc-100">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-zinc-500">
              <span>Learn more about OCIF:</span>
              <div className="flex items-center gap-4">
                <a 
                  href="https://canvasprotocol.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-indigo-600 transition-colors duration-200"
                >
                  Homepage
                </a>
                <span>•</span>
                <a 
                  href="https://canvasprotocol.org/spec" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-indigo-600 transition-colors duration-200"
                >
                  Specification
                </a>
                <span>•</span>
                <a 
                  href="/hello-world.ocif.json" 
                  download="hello-world.ocif.json"
                  className="hover:text-indigo-600 transition-colors duration-200"
                >
                  Example File
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface Node {
  id: string;
  type: 'rectangle' | 'oval';
  width: number;
  height: number;
  x: number;
  y: number;
  text?: string;
  style: {
    type: 'rectangle' | 'oval';
    strokeWidth: number;
    strokeColor: string;
    fillColor: string;
  };
}

interface Relation {
  from: string;
  to: string;
  path: string;
  type: string;
  rel: string;
}

function generateSVG(json: OCIFJson): string {
  const width = 1200;
  const height = 800;
  const padding = 50;
  const nodeSpacing = 100;
  
  // Extract nodes and their properties
  const nodes: Node[] = [];
  const relations: Relation[] = [];
  
  // Helper function to get text from linked resource
  const getNodeText = (node: NonNullable<OCIFJson['nodes']>[string]): string => {
    if (node.resource?.text) return node.resource.text;
    if (typeof node.text === 'string') return node.text;
    return 'Node';
  };

  // Helper function to get node style from data
  const getNodeStyle = (node: NonNullable<OCIFJson['nodes']>[string]): Node['style'] => {
    const nodeData = node.data?.[0];
    return {
      type: nodeData?.type === '@ocwg/node/oval' ? 'oval' as const : 'rectangle' as const,
      strokeWidth: nodeData?.strokeWidth || 2,
      strokeColor: nodeData?.strokeColor || '#64748b',
      fillColor: nodeData?.fillColor || '#f8fafc'
    };
  };

  // Process nodes from the OCIF data
  if (json.nodes) {
    Object.entries(json.nodes).forEach(([id, node], index) => {
      const nodeWidth = node.size?.[0] || 120;
      const nodeHeight = node.size?.[1] || 60;
      
      // Use position from node data or calculate grid position
      const x = node.position?.[0] || (padding + (index % 3) * (nodeWidth + nodeSpacing));
      const y = node.position?.[1] || (padding + Math.floor(index / 3) * (nodeHeight + nodeSpacing));

      if (node.data?.[0]?.type !== "@ocwg/node/arrow") {
        const style = getNodeStyle(node);
        nodes.push({
          id: node.id,
          type: style.type,
          width: nodeWidth,
          height: nodeHeight,
          x,
          y,
          text: getNodeText(node),
          style
        });
      }
    });
  }

  // Process relations
  if (json.relations) {
    console.log("relations",json.relations,nodes);
    json.relations.forEach(relationGroup => {
      relationGroup.data.forEach(relation => {
        // Find nodes by string ID
        const fromNode = nodes.find(n => n.id === relation.start);
        const toNode = nodes.find(n => n.id === relation.end);
        console.log("relation",relation,fromNode, toNode);  
        if (fromNode && toNode) {
          // Calculate control points for curved path using position array
          const fromX = fromNode.x + fromNode.width / 2;
          const fromY = fromNode.y + fromNode.height / 2;
          const toX = toNode.x + toNode.width / 2;
          const toY = toNode.y + toNode.height / 2;
          
          // Create a curved path
          const dx = toX - fromX;
          const controlPoint1X = fromX + dx * 0.5;
          const controlPoint1Y = fromY;
          const controlPoint2X = toX - dx * 0.5;
          const controlPoint2Y = toY;
          
          const path = `M ${fromX} ${fromY} 
                       C ${controlPoint1X} ${controlPoint1Y}, 
                         ${controlPoint2X} ${controlPoint2Y}, 
                         ${toX} ${toY}`;
          
          relations.push({ 
            from: relation.start, 
            to: relation.end, 
            path,
            type: relation.type,
            rel: relation.rel
          });
        }
      });
    });
  }

  // Generate SVG content
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="100%" height="100%" fill="#ffffff"/>
  
  <!-- Arrow marker definition -->
  <defs>
    <marker
      id="arrowhead"
      markerWidth="10"
      markerHeight="7"
      refX="9"
      refY="3.5"
      orient="auto"
    >
      <polygon
        points="0 0, 10 3.5, 0 7"
        fill="#94a3b8"
      />
    </marker>
  </defs>
  
  <!-- Relations (drawn first so they appear behind nodes) -->
  ${relations.map(relation => `
    <path 
      d="${relation.path}"
      stroke="#94a3b8"
      stroke-width="2"
      fill="none"
      marker-end="url(#arrowhead)"
      title="${relation.type} (${relation.rel})"
    />
  `).join('\n')}
  
  <!-- Nodes -->
  ${nodes.map(node => `
    <!-- ${node.type} node -->
    ${node.type === 'oval' 
      ? `<ellipse
          cx="${node.x + node.width/2}"
          cy="${node.y + node.height/2}"
          rx="${node.width/2}"
          ry="${node.height/2}"
          fill="${node.style.fillColor}"
          stroke="${node.style.strokeColor}"
          stroke-width="${node.style.strokeWidth}"
        />`
      : `<rect
          x="${node.x}"
          y="${node.y}"
          width="${node.width}"
          height="${node.height}"
          fill="${node.style.fillColor}"
          stroke="${node.style.strokeColor}"
          stroke-width="${node.style.strokeWidth}"
          rx="8"
          ry="8"
        />`
    }
    
    <!-- Node text -->
    <text
      x="${node.x + node.width/2}"
      y="${node.y + node.height/2}"
      font-family="Arial"
      font-size="14"
      fill="#1e293b"
      text-anchor="middle"
      dominant-baseline="middle"
    >${node.text}</text>
  `).join('\n')}
</svg>`;
}

export default App
