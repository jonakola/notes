'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { saveTokens } from '@/lib/auth';

interface RegisterErrors {
  email?: string[] | string;
  password?: string[] | string;
  general?: string[] | string;
  [key: string]: string[] | string | undefined;
}

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (shouldRedirect) {
      router.push('/dashboard');
    }
  }, [shouldRedirect, router]);

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    // Clear previous errors
    setErrors({});

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        // Check if the response contains field-specific errors
        if (typeof data === 'object' && !data.error) {
          setErrors(data);
          setIsLoading(false);
          return;
        } else {
          // General error message
          setErrors({ general: [data.error || 'Registration failed'] });
          setIsLoading(false);
          return;
        }
      }

      console.log('Registration successful:', data);

      // Save tokens
      if (data.tokens) {
        saveTokens(data.tokens.access, data.tokens.refresh);
        
        // Set redirect flag instead of redirecting immediately
        setShouldRedirect(true);
        
        // Log that we're attempting to redirect
        console.log('Tokens saved, attempting to redirect to dashboard');
      } else {
        setErrors({ general: ['No tokens received'] });
      }
    } catch (err) {
      console.error('Registration error:', err);
      // Set a general error
      setErrors({ general: [(err as Error).message || 'Something went wrong during registration'] });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to render field-specific errors
  const renderFieldErrors = (fieldName: string) => {
    if (!errors[fieldName]) return null;
    
    return (
      <div className="mt-3 rounded-lg border-2 border-[#d3b88c] bg-[#fcf8f2] p-3">
        <p className="font-medium text-[#8a6d3b] mb-1">An error occured due to the {fieldName} entered:</p>
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
            src="/cat.png"
            alt="Cute cat logo"
            fill
            style={{ objectFit: 'contain' }}
          />
        </div>
        <h1 className="text-4xl font-bold text-[#8a6d3b]">New Friend!</h1>
      </div>
      
      <div className="w-full max-w-md px-4">
        {errors.general && (
          <div className="mb-5 rounded-lg border-2 border-[#d3b88c] bg-[#fcf8f2] p-4">
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
        
        <form className="space-y-4" onSubmit={handleRegister}>
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
          
          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-transparent text-[#d3b88c] border-2 border-[#d3b88c] py-3 px-4 rounded-full hover:bg-[#d3b88c] hover:text-white transition-colors duration-200 disabled:opacity-50 font-medium"
            >
              {isLoading ? 'Processing...' : 'Sign up'}
            </button>
          </div>
          
          <div className="text-center mt-4">
            <Link 
              href="/login" 
              className="text-[#8a6d3b] underline hover:no-underline text-sm font-medium"
            >
              We're already friends!
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}