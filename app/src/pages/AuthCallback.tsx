import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('Processing authentication...');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const { data } = await supabase.auth.getSession();

        if (data.session?.user) {
          navigate('/');
          return;
        }

        setMessage('Unable to complete authentication. Please try signing in again.');
        setIsError(true);
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : 'Authentication redirect failed.',
        );
        setIsError(true);
      }
    };

    handleRedirect();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#111827] px-4">
      <div className="w-full max-w-md rounded-3xl border border-[#E5E7EB] dark:border-[#374151] bg-white dark:bg-[#1F2937] p-10 shadow-[0_25px_80px_rgba(15,23,42,0.12)] text-center">
        <h1 className="text-[22px] font-semibold text-[#111827] dark:text-[#F3F4F6] mb-4">Signing you in</h1>
        <p className={`text-[15px] ${isError ? 'text-[#991B1B]' : 'text-[#4B5563] dark:text-[#D1D5DB]'}`}>
          {message}
        </p>
      </div>
    </div>
  );
}
