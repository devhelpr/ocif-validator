import { useState, useCallback } from 'react'
import Ajv from 'ajv'
import schema from '../schema.json'

const ajv = new Ajv()
const validate = ajv.compile(schema)

function App() {
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors?: string[];
  } | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const json = JSON.parse(text)
      const isValid = validate(json)

      setValidationResult({
        isValid,
        errors: isValid ? undefined : validate.errors?.map(error => 
          `${error.instancePath} ${error.message}`
        )
      })
    } catch {
      setValidationResult({
        isValid: false,
        errors: ['Invalid JSON format']
      })
    }
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
    if (file && file.type === 'application/json') {
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
            <div className="flex justify-between items-center mb-12">
              <div className="text-center flex-1">
                <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 inline-block text-transparent bg-clip-text mb-4">
                  OCIF JSON Validator
                </h1>
                <p className="text-zinc-600">
                  Upload your JSON file to validate against the OCIF schema
                </p>
              </div>
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
                        accept=".json"
                        onChange={handleFileUpload}
                      />
                    </label>
                    <p className="text-zinc-600">or drag and drop</p>
                    <p className="text-sm text-zinc-500">JSON files only</p>
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
                  <ul className="space-y-3 mt-6">
                    {validationResult.errors.map((error, index) => (
                      <li key={index} className="flex items-start gap-2 text-rose-700">
                        <span className="text-rose-500 mt-1">•</span>
                        <span className="text-sm">{error}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
