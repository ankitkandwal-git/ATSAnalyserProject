import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaEnvelope, FaLock } from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "");

const Register = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!API_URL) {
      setError("API URL is not configured.");
      return;
    }

    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }

        navigate("/dashboard");
      } else {
        setError(data.error || "Registration failed. Please try again.");
      }
    } catch (err) {
      setError("Registration failed. Please try again.");
      console.error(err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#050816]">
      <div className="w-full max-w-md p-8 border shadow-2xl bg-white/10 rounded-2xl backdrop-blur-md border-white/20">
        <h2 className="mb-2 text-3xl font-bold text-center text-white">
          Create Account
        </h2>

        <p className="mb-6 text-center text-purple-300">
          Join ATS Analyzer
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <FaUser className="absolute text-purple-400 left-3 top-3" />

            <input
              type="text"
              placeholder="Full Name"
              className="w-full py-2 pl-10 pr-4 text-white placeholder-purple-200 border rounded-lg bg-white/20 border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <FaEnvelope className="absolute text-purple-400 left-3 top-3" />

            <input
              type="email"
              placeholder="Email"
              className="w-full py-2 pl-10 pr-4 text-white placeholder-purple-200 border rounded-lg bg-white/20 border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <FaLock className="absolute text-purple-400 left-3 top-3" />

            <input
              type="password"
              placeholder="Password"
              className="w-full py-2 pl-10 pr-4 text-white placeholder-purple-200 border rounded-lg bg-white/20 border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <FaLock className="absolute text-purple-400 left-3 top-3" />

            <input
              type="password"
              placeholder="Confirm Password"
              className="w-full py-2 pl-10 pr-4 text-white placeholder-purple-200 border rounded-lg bg-white/20 border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="text-sm text-center text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2 font-bold text-white transition rounded-lg shadow-lg bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600"
          >
            Register
          </button>
        </form>

        <p className="mt-4 text-center text-purple-200">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-blue-300 hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;