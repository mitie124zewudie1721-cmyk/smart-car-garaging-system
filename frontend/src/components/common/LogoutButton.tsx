// src/components/common/LogoutButton.tsx
// (you can put this in a common components folder or anywhere)

import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore'; // ← your auth store (Zustand / Context / etc.)

export default function LogoutButton() {
    const { logout } = useAuthStore(); // assuming your store has a logout action
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();                     // clears token, user state, localStorage, etc.
        navigate('/login', { replace: true }); // redirect to login + replace history
    };

    return (
        <button
            onClick={handleLogout}
            className="
        group flex items-center gap-3 px-5 py-3
        text-red-400 hover:text-red-300
        bg-slate-900/50 hover:bg-red-950/30
        border border-red-500/30 hover:border-red-500/50
        rounded-xl font-medium transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 focus:ring-offset-slate-900
        active:scale-98
      "
            aria-label="Logout from account"
        >
            <LogOut size={18} className="group-hover:rotate-12 transition-transform" />
            <span>Logout</span>
        </button>
    );
}