// src/pages/NotFound.tsx
import { Link } from 'react-router-dom';
import Button from '@/components/common/Button';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 px-4 py-12">
            <div className="text-center space-y-8 max-w-md w-full">
                <h1 className="text-8xl md:text-9xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight animate-pulse">
                    404
                </h1>

                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                    Page Not Found
                </h2>

                <p className="text-lg text-gray-600 dark:text-gray-400">
                    The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link to="/" aria-label="Go back to homepage">
                        <Button
                            variant="primary"
                            size="lg"
                            className="flex items-center gap-2 px-8 py-4 text-lg font-medium"
                        >
                            <ArrowLeft size={20} />
                            Go Back Home
                        </Button>
                    </Link>

                    <Link to="/contact" aria-label="Contact support">
                        <Button
                            variant="outline"
                            size="lg"
                            className="px-8 py-4 text-lg font-medium border-indigo-500 text-indigo-500 hover:bg-indigo-500/10"
                        >
                            Contact Support
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}