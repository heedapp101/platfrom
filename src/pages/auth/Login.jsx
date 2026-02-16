import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { API_ENDPOINTS } from "../../config/api";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Call your Backend API
      const res = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrUsername, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      // 2. Handle Permissions
      const userRole = data.user.userType; // 'general' | 'business' | 'admin'

      if (userRole === "general") {
        setError("Access Denied: General users do not have dashboard access.");
        setLoading(false);
        return;
      }

      // 3. Log user in
      // Map backend 'userType' to frontend 'role' logic
      const authUser = { 
        ...data.user, 
        role: userRole === "business" ? "seller" : userRole 
      };
      
      login(authUser, data.token);

      // 4. Redirect
      if (userRole === "admin") {
        navigate("/admin");
      } else if (userRole === "business") {
        navigate("/seller");
      } else {
        setError("Unknown role.");
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Back to Home */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition font-medium"
      >
        <ArrowLeft size={20} />
        Back to Home
      </Link>

      <div className="w-full max-w-md px-4">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <span className="text-4xl font-heed text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Heeszo </span>
        </div>

        <form onSubmit={submit} className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
          <h2 className="text-2xl font-bold mb-2 text-center text-gray-900">Welcome Back</h2>
          <p className="text-gray-500 text-center mb-6">Sign in to your dashboard</p>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm border border-red-100">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Email or Username</label>
            <input
              className="w-full border border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              placeholder="Enter your credentials"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              className="w-full border border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              placeholder="Enter your password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            disabled={loading}
            className={`w-full text-white py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 ${
              loading 
                ? 'bg-indigo-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>

          <p className="text-center text-gray-500 text-sm mt-6">
            Business & Admin accounts only
          </p>
        </form>
      </div>
    </div>
  );
}