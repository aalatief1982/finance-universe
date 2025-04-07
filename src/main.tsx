
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { handleError } from './utils/error-utils'
import { ErrorType, ErrorSeverity } from './types/error'

// Setup global error handlers
const setupGlobalErrorHandlers = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.warn('Unhandled Promise Rejection:', event.reason);
    
    handleError({
      type: ErrorType.UNKNOWN,
      message: event.reason?.message || 'Unhandled Promise Rejection',
      severity: ErrorSeverity.ERROR,
      context: {
        source: 'unhandledrejection',
        stack: event.reason?.stack,
      },
      originalError: event.reason
    });
    
    // Prevent the default browser handling
    event.preventDefault();
  });

  // Handle uncaught exceptions
  window.addEventListener('error', (event) => {
    console.error('Uncaught Error:', event.error);
    
    handleError({
      type: ErrorType.UNKNOWN,
      message: event.error?.message || event.message || 'Uncaught Error',
      severity: ErrorSeverity.CRITICAL,
      context: {
        source: 'window.onerror',
        fileName: event.filename,
        lineNumber: event.lineno,
        columnNumber: event.colno,
        stack: event.error?.stack
      },
      originalError: event.error
    });
    
    // Prevent the default browser handling
    event.preventDefault();
  });

  // For React 18+ errors that occur during rendering
  const originalConsoleError = console.error;
  console.error = (...args) => {
    // Log original error to maintain dev tools logging
    originalConsoleError(...args);
    
    // Check if this is a React error
    const errorText = args.join(' ');
    if (
      typeof errorText === 'string' && 
      (errorText.includes('React will try to recreate this component tree') || 
       errorText.includes('The above error occurred in the') ||
       errorText.includes('Error: Uncaught'))
    ) {
      // This is likely a React error, extract the actual error
      const errorMatch = errorText.match(/Error: (.*?)(\\n|$)/);
      const errorMessage = errorMatch ? errorMatch[1] : 'React rendering error';
      
      handleError({
        type: ErrorType.UNKNOWN,
        message: errorMessage,
        severity: ErrorSeverity.ERROR,
        context: {
          source: 'react_error',
          fullMessage: errorText
        }
      });
    }
  };

  // Log that error handlers are initialized
  console.info('Global error handlers initialized');
}

// Initialize error handlers
setupGlobalErrorHandlers();

// Create root and render app
try {
  const root = createRoot(document.getElementById("root")!);
  root.render(<App />);
} catch (error) {
  // Handle fatal initialization errors
  handleError({
    type: ErrorType.UNKNOWN,
    message: 'Failed to initialize application',
    severity: ErrorSeverity.CRITICAL,
    context: {
      stage: 'initialization'
    },
    originalError: error
  });
  
  // Render a minimal error page for catastrophic errors
  const errorContainer = document.createElement('div');
  errorContainer.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; color: #666;">
      <h1 style="margin-bottom: 1rem;">Unable to Load Application</h1>
      <p>We're sorry, but the application couldn't be loaded. Please try refreshing the page.</p>
      <button 
        style="margin-top: 1rem; padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 0.25rem; cursor: pointer;"
        onclick="window.location.reload()"
      >
        Refresh
      </button>
    </div>
  `;
  
  // Replace the root element with the error container
  const rootElement = document.getElementById("root");
  if (rootElement && rootElement.parentNode) {
    rootElement.parentNode.replaceChild(errorContainer, rootElement);
  } else {
    document.body.appendChild(errorContainer);
  }
}
