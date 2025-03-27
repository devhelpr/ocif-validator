import { ValidationResult as IValidationResult } from '../../services/ValidationService';
import { ValidationIcon } from '../atoms/ValidationIcon';
import { ValidationErrorItem } from '../molecules/ValidationErrorItem';

interface ValidationResultProps {
  result: IValidationResult;
}

export function ValidationResult({ result }: ValidationResultProps) {
  return (
    <div 
      className={`mt-8 p-8 rounded-2xl transition-all duration-300 transform animate-slide-in ${
        result.isValid 
          ? 'bg-teal-50 border border-teal-200' 
          : 'bg-rose-50 border border-rose-200'
      }`}
    >
      <div className="flex items-center gap-3 mb-4">
        <ValidationIcon isValid={result.isValid} />
        <h3 className={`text-xl font-semibold ${
          result.isValid 
            ? 'text-teal-800' 
            : 'text-rose-800'
        }`}>
          {result.isValid 
            ? 'Validation Successful!' 
            : 'Validation Failed'}
        </h3>
      </div>
      {result.errors && (
        <ul className="space-y-4 mt-6">
          {result.errors.map((error, index) => (
            <li key={index}>
              <ValidationErrorItem error={error} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 