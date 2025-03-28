import Ajv, { ErrorObject } from 'ajv'
import { ValidationError } from '../types/ocif'
import schema from '../../schema.json'

const ajv = new Ajv({ allErrors: true, verbose: true })
const validate = ajv.compile(schema)

export function getSchemaDetails(error: ErrorObject): string {
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

export function findLineColumn(jsonString: string, path: string): { line: number; column: number } {
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

export function validateJson(json: any, text: string): { isValid: boolean; errors?: ValidationError[] } {
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

    return {
      isValid: false,
      errors
    }
  }

  return { isValid: true }
} 