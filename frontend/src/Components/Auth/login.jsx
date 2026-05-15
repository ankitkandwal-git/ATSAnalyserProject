import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaEnvelope, FaLock } from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('')

    if (!API_URL) {
      setError('API URL is not configured. Set VITE_API_URL in frontend/.env.');
      return;
    }

    try{
        if(!email || !password){
            setError('Please fill in all fields')
        return;
        }
      const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if(response.ok){
          localStorage.setItem('token', data.token);
          window.location.href = '/dashboard';
        }else{
          setError(data.error || 'Login failed. Please try again.')
        }
    }
    catch(err){
        setError('Login failed. Please try again.')
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#050816]">
      <div className="w-full max-w-md p-8 border shadow-2xl bg-white/10 rounded-2xl backdrop-blur-md border-white/20">
        <h2 className="mb-2 text-3xl font-bold text-center text-white">Welcome Back</h2>
        <p className="mb-6 text-center text-purple-300">Login to ATS Analyzer</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <label htmlFor="email" className="sr-only">
              Email
            </label>
            <FaEnvelope className="absolute text-purple-400 left-3 top-3" />
            <input
              id="email"
              name="email"
              type="email"
              className="w-full py-2 pl-10 pr-4 text-white placeholder-purple-200 border rounded-lg bg-white/20 border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Email"
            />
          </div>

          <div className="relative">
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <FaLock className="absolute text-purple-400 left-3 top-3" />
            <input
              id="password"
              name="password"
              type="password"
              className="w-full py-2 pl-10 pr-4 text-white placeholder-purple-200 border rounded-lg bg-white/20 border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Password"
            />
          </div>

          {error && <div className="text-sm text-center text-red-400">{error}</div>}

          <button
            type="submit"
            className="w-full py-2 font-bold text-white transition rounded-lg shadow-lg bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600"
          >
            Login
          </button>
        </form>

        <p className="mt-4 text-center text-purple-200">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-blue-300 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;