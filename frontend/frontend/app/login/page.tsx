'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { saveTokens } from '@/lib/auth';

interface LoginErrors {
  email?: string[] | string;
  password?: string[] | string;
  general?: string[] | string;
  [key: string]: string[] | string | undefined;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (shouldRedirect) {
      router.push('/dashboard');
    }
  }, [shouldRedirect, router]);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if the response contains field-specific errors
        if (typeof data === 'object' && !data.error) {
          // Handle structured field errors (if API returns them)
          setErrors(data);
        } else {
          // Handle general error message
          setErrors({ general: [data.error || 'Login failed'] });
        }
        setIsLoading(false);
        return;
      }

      console.log('Login successful:', data);

      // Save tokens
      if (data.access && data.refresh) {
        saveTokens(data.access, data.refresh);
        
        // Set redirect flag instead of redirecting immediately
        setShouldRedirect(true);
        
        // Log that we're attempting to redirect
        console.log('Tokens saved, attempting to redirect to dashboard');
      } else {
        setErrors({ general: ['No tokens received'] });
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrors({ general: [(err as Error).message || 'Something went wrong during login'] });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to render field-specific errors
  const renderFieldErrors = (fieldName: string) => {
    if (!errors[fieldName]) return null;
    
    return (
      <div className="mt-3 rounded-lg border-2 border-[#d3b88c] bg-[#fcf8f2] p-3">
        <p className="font-medium text-[#8a6d3b] mb-1">{fieldName}:</p>
        <ul className="list-disc list-inside pl-2 text-[#8a6d3b]">
          {Array.isArray(errors[fieldName]) 
            ? (errors[fieldName] as string[]).map((error, index) => (
                <li key={index} className="text-sm">{error}</li>
              ))
            : <li className="text-sm">{String(errors[fieldName])}</li>
          }
        </ul>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="mb-8 flex flex-col items-center">
        <div className="relative w-36 h-36 mb-6">
          <Image
            src="/cactus.png"
            alt="Cute cactus logo"
            fill
            style={{ objectFit: 'contain' }}
          />
        </div>
        <h1 className="text-4xl font-bold text-[#8a6d3b]">Yay, You're Back!</h1>
      </div>
      
      <div className="w-full max-w-md px-4">
        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-[#d3b88c] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a373] bg-opacity-50"
              placeholder="Email address"
              required
            />
            {renderFieldErrors('email')}
          </div>
          
          <div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-[#d3b88c] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a373] bg-opacity-50"
              placeholder="Password"
              required
            />
            {renderFieldErrors('password')}
          </div>
          
          {errors.general && (
            <div className="rounded-lg border-2 border-[#d3b88c] bg-[#fcf8f2] p-4">
              <p className="font-medium text-[#8a6d3b] mb-1">Error:</p>
              <div className="text-[#8a6d3b]">
                {Array.isArray(errors.general) 
                  ? errors.general.map((error, index) => (
                      <p key={index} className="text-sm">{error}</p>
                    ))
                  : <p className="text-sm">{String(errors.general)}</p>
                }
              </div>
            </div>
          )}
          
          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-transparent text-[#d3b88c] border-2 border-[#d3b88c] py-3 px-4 rounded-full hover:bg-[#d3b88c] hover:text-white transition-colors duration-200 disabled:opacity-50 font-medium"
            >
              {isLoading ? 'Processing...' : 'Login'}
            </button>
          </div>
          
          <div className="text-center mt-4">
            <Link 
              href="/register" 
              className="text-[#8a6d3b] underline hover:no-underline text-sm font-medium"
            >
              Oops! I've never been here before
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}