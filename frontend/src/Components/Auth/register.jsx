import React from 'react'
import {useState} from 'react'
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
// import './index.css'

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

const Register = () =>{
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error,setError] = useState('');
  const [showPassword,setShowPassword] = useState(false);
  const navigate = useNavigate();
  const onChangeName = (e) => setName(e.target.value);
  const onChangeEmail = (e) => setEmail(e.target.value);
  const onChangePassword = (e) => setPassword(e.target.value);
  const validateForm = () =>{
    if(!name || !email || !password){
      setError('All fields are required');
      return false;
    }
    if(password.length<6){
      setError('Password must be at least 6 characters');
      return false;
    }
    return true;
  }
  const handleSubmit = async (event) =>{
    event.preventDefault();
    if(!validateForm()) return;

    if (!API_URL) {
      setError('API URL is not configured. Set VITE_API_URL in frontend/.env.');
      return;
    }

    try{
      const response = await axios.post(`${API_URL}/auth/register`,{
        name,
        email,
        password
      });
      if(response.data.token){
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user',JSON.stringify({
          name: response.data.name,
          email: response.data.email,
          password: response.data.password
        }))
        navigate('/dashboard');
      }else{
        
      }
    }catch(err){
      if(err.response?.status === 409){
        setError('Email already registered');
      }else if(err.response?.data?.error){
        setError(err.response.data.error);
      }else{
        setError('Registration failed. Please try again.');
      }
      console.error('Registration failed:', err);
    }
  }
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050816]">
        <div className="w-full max-w-md p-8 border shadow-2xl bg-white/10 rounded-2xl backdrop-blur-md border-white/20">
          <h2 className="mb-2 text-3xl font-bold text-center text-white">Create Account</h2>
          <p className="mb-6 text-center text-purple-300">Join ATS Analyzer</p>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="relative">
              <FaUser className="absolute text-purple-400 left-3 top-3" />
              <input
                id="name"
                name="name"
                type="text"
                required
                className="w-full py-2 pl-10 pr-4 text-white placeholder-purple-200 border rounded-lg bg-white/20 border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="relative">
              <FaEnvelope className="absolute text-purple-400 left-3 top-3" />
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full py-2 pl-10 pr-4 text-white placeholder-purple-200 border rounded-lg bg-white/20 border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <FaLock className="absolute text-purple-400 left-3 top-3" />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                className="w-full py-2 pl-10 pr-12 text-white placeholder-purple-200 border rounded-lg bg-white/20 border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute text-purple-300 right-3 top-2 hover:text-purple-500 focus:outline-none"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <FaEyeSlash className="w-5 h-5" />
                ) : (
                  <FaEye className="w-5 h-5" />
                )}
              </button>
            </div>
            {error && <div className="text-sm text-center text-red-400">{error}</div>}
            <button
              type="submit"
              className="w-full py-2 font-bold text-white transition rounded-lg shadow-lg bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600"
            >
              Register
            </button>
            <p className="mt-2 text-center text-purple-200">
              Already have an account?{' '}
              <a href="/login" className="text-blue-300 hover:underline">Login</a>
            </p>
          </form>
        </div>
      </div>
    );
}
export default Register