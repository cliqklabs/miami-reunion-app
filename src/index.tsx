import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import TestApp from './TestApp';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Add error boundary for debugging
class ErrorBoundary extends React.Component {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if ((this.state as any).hasError) {
      return <div style={{padding: '20px', color: 'white', background: '#333'}}>
        <h1>Something went wrong.</h1>
        <p>Check the console for details.</p>
      </div>;
    }

    return this.props.children;
  }
}

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
