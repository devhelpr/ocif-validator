import { useState, useCallback, useEffect } from 'react'
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
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Check system preference for dark mode
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setIsDark(prefersDark)
    if (prefersDark) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleDarkMode = useCallback(() => {
    setIsDark(prev => {
      const newValue = !prev
      document.documentElement.classList.toggle('dark', newValue)
      return newValue
    })
  }, [])

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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-primary-950 dark:via-gray-900 dark:to-primary-950">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="card animate-fade-in">
            <div className="px-6 py-8">
              <div className="flex justify-between items-center mb-8">
                <div className="text-center flex-1">
                  <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-400 dark:to-primary-600 mb-2">
                    OCIF JSON Validator
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Upload your JSON file to validate against the OCIF schema
                  </p>
                </div>
                <button
                  onClick={toggleDarkMode}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {isDark ? (
                    <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                </button>
              </div>
              
              <div className="mt-4">
                <div 
                  className={`upload-area ${isDragging ? 'upload-area-dragging' : 'upload-area-default'}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="space-y-4 text-center">
                    <div className="relative">
                      <svg
                        className={`mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${
                          isDragging ? 'scale-110 text-primary-500 dark:text-primary-400' : ''
                        }`}
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
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className={`w-6 h-6 rounded-full bg-primary-500 dark:bg-primary-400 transform scale-0 transition-transform duration-200 ${
                          isDragging ? 'scale-100' : ''
                        }`} />
                      </div>
                    </div>
                    <div className="flex flex-col items-center space-y-2">
                      <label
                        htmlFor="file-upload"
                        className="btn btn-primary cursor-pointer"
                      >
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
                      <p className="text-gray-500 dark:text-gray-400">or drag and drop</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500">JSON files only</p>
                    </div>
                  </div>
                </div>
              </div>

              {validationResult && (
                <div 
                  className={`mt-8 p-6 rounded-xl transition-all duration-300 transform animate-slide-in ${
                    validationResult.isValid 
                      ? 'validation-success' 
                      : 'validation-error'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-4">
                    {validationResult.isValid ? (
                      <svg className="h-6 w-6 text-green-500 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="h-6 w-6 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <h3 className="text-xl font-semibold">
                      {validationResult.isValid 
                        ? 'Validation Successful!' 
                        : 'Validation Failed'}
                    </h3>
                  </div>
                  {validationResult.errors && (
                    <ul className="space-y-2">
                      {validationResult.errors.map((error, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-red-500 dark:text-red-400">•</span>
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
    </div>
  )
}

export default App
