// src/components/layout/Footer.tsx
import { Link } from 'react-router-dom';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-slate-950 text-slate-300 py-12 border-t border-slate-800 mt-auto">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center md:text-left">
                    {/* Brand & tagline */}
                    <div>
                        <Link to="/" className="text-2xl font-bold text-white hover:text-indigo-400 transition-colors">
                            Smart Garaging
                        </Link>
                        <p className="mt-3 text-sm text-slate-400 max-w-xs mx-auto md:mx-0">
                            Smart parking solution for car owners and garage operators in Ethiopia.
                        </p>
                    </div>

                    {/* Quick links */}
                    <div>
                        <h4 className="text-lg font-semibold text-white mb-4">Quick Links</h4>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link
                                    to="/"
                                    className="hover:text-indigo-400 transition-colors"
                                >
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/find-garage"
                                    className="hover:text-indigo-400 transition-colors"
                                >
                                    Find Garage
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/my-reservations"
                                    className="hover:text-indigo-400 transition-colors"
                                >
                                    My Reservations
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/login"
                                    className="hover:text-indigo-400 transition-colors"
                                >
                                    Login
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/register"
                                    className="hover:text-indigo-400 transition-colors"
                                >
                                    Register
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal & contact */}
                    <div>
                        <h4 className="text-lg font-semibold text-white mb-4">Legal & Contact</h4>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <a
                                    href="#"
                                    className="hover:text-indigo-400 transition-colors"
                                >
                                    Privacy Policy
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="hover:text-indigo-400 transition-colors"
                                >
                                    Terms of Service
                                </a>
                            </li>
                            <li>
                                <a
                                    href="mailto:support@smartgaraging.com"
                                    className="hover:text-indigo-400 transition-colors"
                                >
                                    support@smartgaraging.com
                                </a>
                            </li>
                            <li className="text-slate-500">
                                © {currentYear} Smart Garaging. All rights reserved.
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-10 pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
                    <p>Made with care for smarter parking in Ethiopia</p>
                </div>
            </div>
        </footer>
    );
}