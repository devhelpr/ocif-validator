import React from 'react'

interface FileDropZoneProps {
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function FileDropZone({
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileUpload
}: FileDropZoneProps) {
  return (
    <div 
      className={`border-2 border-dashed rounded-2xl p-8 transition-all duration-300 ${
        isDragging 
          ? 'border-indigo-400 bg-indigo-50' 
          : 'border-zinc-200 hover:border-indigo-300'
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
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
              onChange={onFileUpload}
            />
          </label>
          <p className="text-zinc-600">or drag and drop</p>
          <p className="text-sm text-zinc-500">JSON and JSON5 files</p>
        </div>
      </div>
    </div>
  )
} 