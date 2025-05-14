"use client"
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Auth() {
  if(localStorage.getItem("token")){
    // Redirect to files page if already logged in
    window.location.href = "/files";
  }
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isLogin) {
        // Login request
        const response = await axios.post("http://localhost:5000/login", {
          phone,
          password
        });
        
        // Store token in localStorage
        localStorage.setItem("token", response.data.tokenId);
        
        // Show success toast
        toast.success("Login successful!");
        
        // Redirect to files page
        setTimeout(() => router.push("/files"), 1000);
      } else {
        // Register request
        const response = await axios.post("http://localhost:5000/register", {
          name,
          phone,
          password
        });
        
        // Show success toast
        toast.success("Account created successfully! Please log in.");
        
        // Switch to login mode
        setIsLogin(true);
        setPassword("");
      }
    } catch (error) {
      
      // Show error toast
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.message || "Authentication failed. Please try again.");
      } else {
        toast.error(isLogin ? "Login failed. Please try again." : "Signup failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)] bg-white text-black">
      {/* Toast container for notifications */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      
      <main className="flex flex-col gap-8 row-start-2 items-center w-full max-w-md">
        <div className="w-full bg-white rounded-lg border border-black/[.08] p-8 shadow-sm">
          <div className="flex justify-center mb-6">
            <div className="flex rounded-full overflow-hidden border border-black/[.08]">
              <button 
                className={`px-4 py-2 text-sm transition-colors ${isLogin ? 'bg-black text-white' : 'hover:bg-[#f2f2f2]'}`}
                onClick={() => setIsLogin(true)}
                type="button"
                disabled={loading}
              >
                Log in
              </button>
              <button 
                className={`px-4 py-2 text-sm transition-colors ${!isLogin ? 'bg-black text-white' : 'hover:bg-[#f2f2f2]'}`}
                onClick={() => setIsLogin(false)}
                type="button"
                disabled={loading}
              >
                Sign up
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold text-center mb-2">
              {isLogin ? "Welcome back" : "Create your account"}
            </h2>
            
            {!isLogin && (
              <div className="flex flex-col gap-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="rounded-md border border-black/[.08] p-2 bg-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-black/10"
                  required
                  disabled={loading}
                />
              </div>
            )}
            
            <div className="flex flex-col gap-2">
              <label htmlFor="phone" className="text-sm font-medium">
                Phone
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                className="rounded-md border border-black/[.08] p-2 bg-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-black/10"
                required
                disabled={loading}
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex justify-between">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                {isLogin && (
                  <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                    Forgot password?
                  </Link>
                )}
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="rounded-md border border-black/[.08] p-2 bg-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-black/10"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className={`mt-4 rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-black text-white gap-2 hover:bg-[#383838] text-sm h-10 px-4 w-full ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isLogin ? "Logging in..." : "Signing up..."}
                </>
              ) : (
                isLogin ? "Log in" : "Sign up"
              )}
            </button>
            
            <div className="relative flex items-center justify-center mt-4">
              <hr className="w-full border-t border-black/[.08]" />
              <span className="absolute bg-white px-2 text-xs text-gray-500">
                OR
              </span>
            </div>
            
            <button
              type="button"
              className="mt-4 rounded-full border border-solid border-black/[.08] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] text-sm h-10 px-4"
              disabled={loading}
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M43.611 20.083H42V20H24V28H35.303C33.654 32.657 29.223 36 24 36C17.373 36 12 30.627 12 24C12 17.373 17.373 12 24 12C27.059 12 29.842 13.154 31.961 15.039L37.618 9.382C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24C4 35.045 12.955 44 24 44C35.045 44 44 35.045 44 24C44 22.659 43.862 21.35 43.611 20.083Z" fill="#FFC107" />
                <path d="M6.306 14.691L12.877 19.51C14.655 15.108 18.961 12 24 12C27.059 12 29.842 13.154 31.961 15.039L37.618 9.382C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691Z" fill="#FF3D00" />
                <path d="M24 44C29.166 44 33.86 42.023 37.409 38.808L31.219 33.57C29.1436 35.1484 26.6075 36.0021 24 36C18.798 36 14.381 32.683 12.717 28.054L6.19501 33.079C9.50601 39.556 16.227 44 24 44Z" fill="#4CAF50" />
                <path d="M43.611 20.083H42V20H24V28H35.303C34.5142 30.2164 33.0328 32.1532 31.216 33.568L31.219 33.566L37.409 38.804C36.971 39.2 44 34 44 24C44 22.659 43.862 21.35 43.611 20.083Z" fill="#1976D2" />
              </svg>
              Continue with Google
            </button>
            
            <button
              type="button"
              className="mt-2 rounded-full border border-solid border-black/[.08] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] text-sm h-10 px-4"
              disabled={loading}
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 0C5.37 0 0 5.37 0 12C0 17.31 3.435 21.795 8.205 23.385C8.805 23.49 9.03 23.13 9.03 22.815C9.03 22.53 9.015 21.585 9.015 20.58C6 21.135 5.22 19.845 4.98 19.17C4.845 18.825 4.26 17.76 3.75 17.475C3.33 17.25 2.73 16.695 3.735 16.68C4.68 16.665 5.355 17.55 5.58 17.91C6.66 19.725 8.385 19.215 9.075 18.9C9.18 18.12 9.495 17.595 9.84 17.295C7.17 16.995 4.38 15.96 4.38 11.37C4.38 10.065 4.845 8.985 5.61 8.145C5.49 7.845 5.07 6.615 5.73 4.965C5.73 4.965 6.735 4.65 9.03 6.195C9.99 5.925 11.01 5.79 12.03 5.79C13.05 5.79 14.07 5.925 15.03 6.195C17.325 4.635 18.33 4.965 18.33 4.965C18.99 6.615 18.57 7.845 18.45 8.145C19.215 8.985 19.68 10.05 19.68 11.37C19.68 15.975 16.875 16.995 14.205 17.295C14.64 17.67 15.015 18.39 15.015 19.515C15.015 21.12 15 22.41 15 22.815C15 23.13 15.225 23.505 15.825 23.385C20.565 21.795 24 17.295 24 12C24 5.37 18.63 0 12 0Z" />
              </svg>
              Continue with GitHub
            </button>
          </form>
        </div>
        
        <p className="text-sm text-center text-gray-500">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="text-blue-600 hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-blue-600 hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </main>
      
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/docs"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Docs
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}