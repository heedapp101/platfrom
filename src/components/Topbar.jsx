import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Topbar({ onToggle }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="h-14 bg-white flex items-center justify-between px-6 shadow z-50 relative">
      <button onClick={onToggle} className="text-xl">☰</button>

      <div className="relative">
        {/* Trigger Button (Click instead of Hover) */}
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="flex items-center gap-2 focus:outline-none"
        >
          <span className="font-medium">{user?.name}</span>
          <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center font-bold text-slate-600">
             {user?.username?.charAt(0).toUpperCase()}
          </div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <>
            {/* Invisible backdrop to close menu when clicking outside */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)} 
            />
            
            <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md border border-slate-100 z-20 py-1">
              <div className="px-4 py-2 border-b text-sm text-slate-500">
                Signed in as <br />
                <span className="font-bold text-slate-800">{user?.username}</span>
              </div>

              <button
                onClick={() => {
                  setIsOpen(false);
                  nav("/seller/settings"); // Adjusted to likely route
                }}
                className="block w-full text-left px-4 py-2 hover:bg-slate-50 text-sm"
              >
                Settings
              </button>
              
              <button
                onClick={() => {
                  setIsOpen(false);
                  logout();
                  nav("/login");
                }}
                className="block w-full text-left px-4 py-2 text-red-600 hover:bg-slate-50 text-sm"
              >
                Logout
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}