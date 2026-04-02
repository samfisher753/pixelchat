import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, ArrowRight, MailWarning, X, Send } from 'lucide-react';
import PasswordInput from '@/components/PasswordInput';
import { toast } from 'sonner';
import logo from '@/assets/logo-pixelchat.svg';
import apiService, { ApiError } from '@/services/apiService';
import { getErrorMessage } from '@/i18n/errorMessages';
import { useAuth } from '@/providers/AuthProvider';
import type { LoginData } from '@/types/LoginData';

// Errores de negocio → campo del formulario al que pertenecen
const ERROR_TO_FIELD: Record<string, string> = {
  'auth.user_not_found':    'user',
  'auth.invalid_credentials': 'password',
};

const LoginPage = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  // Modal de email no verificado
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (auth.isAuthenticated) {
      navigate('/feed');
    }
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const response = await apiService.post<LoginData>('/auth/login', { user, password });

      auth.login(response);
      navigate('/feed');
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === 'auth.email_not_verified') {
          // Pre-rellenar el email si el campo user parece un email
          setResendEmail(user.includes('@') ? user : '');
          setShowVerifyModal(true);
        } else if (error.violations && error.violations.length > 0) {
          const fieldErrors: Record<string, string> = {};
          for (const v of error.violations) {
            fieldErrors[v.field] = getErrorMessage(v.code, v.field);
          }
          setErrors(fieldErrors);
        } else {
          const targetField = ERROR_TO_FIELD[error.code];
          if (targetField) {
            setErrors({ [targetField]: getErrorMessage(error.code) });
          } else {
            setErrors({ general: getErrorMessage(error.code) });
          }
        }
      } else {
        setErrors({ general: 'Error de conexión. Inténtalo de nuevo.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!resendEmail) return;
    setIsResending(true);
    try {
      await apiService.post('/auth/resend-verification', { email: resendEmail });
      toast.success('Correo enviado. Revisa tu bandeja de entrada.');
      setShowVerifyModal(false);
    } catch {
      toast.error('No se pudo enviar el correo. Inténtalo de nuevo.');
    } finally {
      setIsResending(false);
    }
  };

  const handleDemo = async () => {
    setIsDemoLoading(true);
    try {
      const response = await apiService.post<LoginData>('/auth/demo');
      auth.login(response);
      navigate('/feed');
      toast.info('Cuenta demo: se eliminará al cerrar sesión o en menos de 48 horas.', { duration: 6000 });
    } catch {
      toast.error('No se pudo iniciar el modo demo. Inténtalo de nuevo.');
    } finally {
      setIsDemoLoading(false);
    }
  };

  const inputClass = (field: string, pr = 'pr-3') =>
    `block w-full pl-10 ${pr} py-3 border rounded-xl leading-5 bg-[#1E1E1E] text-white placeholder-neutral-500 focus:outline-none focus:ring-1 transition-colors ${
      errors[field]
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
        : 'border-[#383838] focus:border-[#022F72] focus:ring-[#022F72]'
    }`;

  return (
    <div className="min-h-screen bg-[#1E1E1E] flex flex-col justify-center items-center p-4 font-sans">
      <div className="w-full max-w-md bg-[#2C2C2C] rounded-3xl shadow-2xl overflow-hidden border border-[#383838]">
        <div className="p-8">
          <div className="flex justify-center mb-8 mx-auto w-fit">
            <img src={logo} alt="PixelChat Logo" className="h-40 object-contain drop-shadow-md" />
          </div>

          <h2 className="text-2xl font-bold text-white text-center mb-2">Bienvenido de nuevo</h2>
          <p className="text-neutral-400 text-center mb-8">Conéctate a tu mundo 2D</p>

          {errors.general && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-neutral-500" />
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  className={inputClass('user')}
                  placeholder="Usuario o correo electrónico"
                  value={user}
                  onChange={e => setUser(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
              {errors.user && <p className="mt-1.5 ml-1 text-xs text-red-400">{errors.user}</p>}
            </div>

            <div>
              <PasswordInput
                className={inputClass('password', 'pr-10')}
                placeholder="Contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              {errors.password && <p className="mt-1.5 ml-1 text-xs text-red-400">{errors.password}</p>}
            </div>

            <div className="flex items-center justify-between pt-1 pb-2">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 bg-[#1E1E1E] border-[#383838] rounded text-[#022F72] focus:ring-[#022F72] focus:ring-offset-[#2C2C2C]"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-neutral-400">
                  Recordarme
                </label>
              </div>
              <Link to="/reset-password" className="text-sm font-medium text-white hover:text-neutral-300 transition-colors">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#022F72] hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#2C2C2C] focus:ring-[#022F72] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Entrando...' : (<>Entrar <ArrowRight className="w-4 h-4" /></>)}
            </button>
          </form>
        </div>

        <div className="px-8 pb-6 bg-[#2C2C2C]">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-[#383838]" />
            <span className="text-xs text-neutral-500">o</span>
            <div className="flex-1 h-px bg-[#383838]" />
          </div>
          <button
            type="button"
            onClick={handleDemo}
            disabled={isDemoLoading || isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-[#383838] rounded-xl text-sm font-medium text-neutral-300 hover:bg-[#383838] hover:text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isDemoLoading ? 'Iniciando demo...' : 'Probar en modo demo'}
          </button>
        </div>

        <div className="px-8 py-5 bg-[#252525] border-t border-[#383838] text-center">
          <p className="text-neutral-400 text-sm">
            ¿No tienes una cuenta?{' '}
            <Link to="/register" className="font-bold text-white hover:underline">
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>

      {/* Modal: email no verificado */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#2C2C2C] rounded-2xl border border-[#383838] shadow-2xl p-6">

            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-amber-500/10 p-2">
                  <MailWarning className="h-5 w-5 text-amber-400" />
                </div>
                <h3 className="text-white font-bold text-base">Email no verificado</h3>
              </div>
              <button
                onClick={() => setShowVerifyModal(false)}
                className="text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-neutral-400 text-sm mb-5">
              {getErrorMessage('auth.email_not_verified')}
            </p>

            <div className="mb-4">
              <label className="block text-xs text-neutral-500 mb-1.5">Tu email</label>
              <input
                type="email"
                value={resendEmail}
                onChange={e => setResendEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="block w-full px-3 py-2.5 border border-[#383838] rounded-xl bg-[#1E1E1E] text-white placeholder-neutral-500 text-sm focus:outline-none focus:ring-1 focus:border-[#022F72] focus:ring-[#022F72] transition-colors"
              />
            </div>

            <button
              onClick={handleResendVerification}
              disabled={isResending || !resendEmail}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-[#022F72] hover:bg-blue-800 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isResending ? 'Enviando...' : (<><Send className="h-4 w-4" /> Reenviar correo</>)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
