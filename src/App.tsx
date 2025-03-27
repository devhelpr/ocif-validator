import { useState, useCallback } from 'react'
import { ValidationService, ValidationResult } from './services/ValidationService'
import { Layout } from './components/templates/Layout'
import { FileDropZone } from './components/organisms/FileDropZone'
import { ValidationResult as ValidationResultComponent } from './components/organisms/ValidationResult'

const validationService = new ValidationService()

function App() {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const result = await validationService.validateFile(file)
    setValidationResult(result)
  }, [])

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
    <Layout>
      <div className="px-6 py-8 sm:px-8 sm:py-10">
        <div className="flex justify-between items-center mb-12">
          <div className="text-center flex-1">
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
        </div>
        
        <div className="mt-8">
          <FileDropZone
            onFileSelect={handleFileUpload}
            onFileDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            isDragging={isDragging}
            accept=".json,.json5"
          />
        </div>

        {validationResult && (
          <ValidationResultComponent result={validationResult} />
        )}
      </div>
    </Layout>
  )
}

export default App
