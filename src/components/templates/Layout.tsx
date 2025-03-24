import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 p-4 sm:p-8 md:p-12">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-white rounded-3xl shadow-xl shadow-zinc-200/50 backdrop-blur-sm animate-fade-in">
          {children}
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
  );
} 