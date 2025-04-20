import React from "react";
import { ValidationResult } from "../../types/validation";
import { JsonCanvasService } from "../../services/jsoncanvas-service";

interface ExportToJsonCanvasButtonProps {
  validationResult: ValidationResult;
  className?: string;
}

export const ExportToJsonCanvasButton: React.FC<
  ExportToJsonCanvasButtonProps
> = ({ validationResult, className = "" }) => {
  const handleExport = () => {
    JsonCanvasService.exportToJsonCanvas(validationResult);
  };

  return (
    <button
      onClick={handleExport}
      className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors ${className}`}
    >
      Export to JSONCanvas
    </button>
  );
};
