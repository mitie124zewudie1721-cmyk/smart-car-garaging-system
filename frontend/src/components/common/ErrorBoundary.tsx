import { Component, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="min-h-screen flex items-center justify-center bg-red-50 p-8">
                    <div className="max-w-2xl text-center">
                        <h1 className="text-3xl font-bold text-red-600 mb-4">Something went wrong</h1>
                        <p className="text-gray-700 mb-4">The dashboard failed to load. Check the console for details.</p>
                        <pre className="bg-red-100 p-4 rounded text-left overflow-auto">
                            {this.state.error?.message || 'Unknown error'}
                            {'\n\n'}
                            {this.state.error?.stack}
                        </pre>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;