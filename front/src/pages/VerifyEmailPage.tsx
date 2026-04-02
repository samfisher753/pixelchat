import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, MailCheck } from 'lucide-react';
import logo from '@/assets/logo-pixelchat.svg';
import apiService, { ApiError } from '@/services/apiService';
import { getErrorMessage } from '@/i18n/errorMessages';

type Status = 'loading' | 'success' | 'error';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<Status>('loading');
  const [errorCode, setErrorCode] = useState<string>('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setErrorCode('auth.verify_email_token_not_found');
      setStatus('error');
      return;
    }

    apiService
      .post('/auth/verify-email', { token })
      .then(() => setStatus('success'))
      .catch((err) => {
        setErrorCode(err instanceof ApiError ? err.code : '');
        setStatus('error');
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#1E1E1E] flex flex-col justify-center items-center p-4 font-sans">
      <div className="w-full max-w-md bg-[#2C2C2C] rounded-3xl shadow-2xl overflow-hidden border border-[#383838]">
        <div className="p-8">

          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img src={logo} alt="PixelChat Logo" className="h-40 object-contain drop-shadow-md" />
          </div>

          {/* Loading */}
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <svg
                className="animate-spin h-12 w-12 text-[#022F72]"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-neutral-400 text-sm tracking-wide">Verificando tu cuenta...</p>
            </div>
          )}

          {/* Success */}
          {status === 'success' && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="rounded-full bg-green-500/10 p-4">
                <CheckCircle className="h-12 w-12 text-green-400" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-1">¡Email verificado!</h2>
                <p className="text-neutral-400 text-sm">
                  Tu cuenta está activa. Ya puedes iniciar sesión.
                </p>
              </div>
              <Link
                to="/login"
                className="mt-2 w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-[#022F72] hover:bg-blue-800 transition-all"
              >
                Ir al inicio de sesión
              </Link>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="rounded-full bg-red-500/10 p-4">
                <XCircle className="h-12 w-12 text-red-400" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Verificación fallida</h2>
                <p className="text-neutral-400 text-sm">
                  {getErrorMessage(errorCode)}
                </p>
              </div>
              <Link
                to="/login"
                className="mt-2 w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-[#022F72] hover:bg-blue-800 transition-all"
              >
                Volver al inicio de sesión
              </Link>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-8 py-5 bg-[#252525] border-t border-[#383838] flex items-center justify-center gap-2 text-neutral-500 text-xs">
          <MailCheck className="h-4 w-4" />
          <span>Verificación de cuenta PixelChat</span>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
