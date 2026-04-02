import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, KeyRound, ArrowRight, ArrowLeft } from 'lucide-react';
import PasswordInput from '@/components/PasswordInput';
import { toast } from 'sonner';
import logo from '@/assets/logo-pixelchat.svg';
import apiService, { ApiError } from '@/services/apiService';
import { getErrorMessage } from '@/i18n/errorMessages';

type Step = 1 | 2;

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const emailRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);

  // Paso 1
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  // Paso 2
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step2Errors, setStep2Errors] = useState<Record<string, string>>({});

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  useEffect(() => {
    if (step === 2) codeRef.current?.focus();
  }, [step]);

  // ---------------------------------------------------------------------------
  // Paso 1 — solicitar código
  // ---------------------------------------------------------------------------

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setIsLoading(true);

    try {
      await apiService.post('/auth/forgot-password', { email });
      toast.info('Si el email está registrado, recibirás el código en breve.');
      setStep(2);
    } catch (error) {
      if (error instanceof ApiError) {
        setEmailError(getErrorMessage(error.code, 'email'));
      } else {
        setEmailError('Error de conexión. Inténtalo de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Paso 2 — verificar código y cambiar contraseña
  // ---------------------------------------------------------------------------

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep2Errors({});

    if (newPassword !== confirmPassword) {
      setStep2Errors({ confirmPassword: 'Las contraseñas no coinciden' });
      return;
    }

    setIsLoading(true);

    try {
      await apiService.post('/auth/reset-password', { code, newPassword });
      toast.success('Contraseña cambiada correctamente. Ya puedes iniciar sesión.');
      navigate('/login');
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.violations && error.violations.length > 0) {
          const fieldErrors: Record<string, string> = {};
          for (const v of error.violations) {
            fieldErrors[v.field] = getErrorMessage(v.code, v.field);
          }
          setStep2Errors(fieldErrors);
        } else if (
          error.code === 'auth.reset_password_token_not_found' ||
          error.code === 'auth.reset_password_token_expired'
        ) {
          setStep2Errors({ code: getErrorMessage(error.code) });
        } else {
          setStep2Errors({ general: getErrorMessage(error.code) });
        }
      } else {
        setStep2Errors({ general: 'Error de conexión. Inténtalo de nuevo.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Helpers de estilo
  // ---------------------------------------------------------------------------

  const inputClass = (field: string, errMap: Record<string, string> = {}, pr = 'pr-3') =>
    `block w-full pl-10 ${pr} py-3 border rounded-xl leading-5 bg-[#1E1E1E] text-white placeholder-neutral-500 focus:outline-none focus:ring-1 transition-colors ${
      errMap[field]
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
        : 'border-[#383838] focus:border-[#022F72] focus:ring-[#022F72]'
    }`;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-[#1E1E1E] flex flex-col justify-center items-center p-4 font-sans">
      <div className="w-full max-w-md bg-[#2C2C2C] rounded-3xl shadow-2xl overflow-hidden border border-[#383838]">
        <div className="p-8">

          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img src={logo} alt="PixelChat Logo" className="h-40 object-contain drop-shadow-md" />
          </div>

          {/* Indicador de paso */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-[#022F72]' : 'bg-[#383838]'}`} />
            <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-[#022F72]' : 'bg-[#383838]'}`} />
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Paso 1: email                                                     */}
          {/* ---------------------------------------------------------------- */}
          {step === 1 && (
            <>
              <h2 className="text-2xl font-bold text-white text-center mb-2">¿Olvidaste tu contraseña?</h2>
              <p className="text-neutral-400 text-center mb-8 text-sm">
                Introduce tu email y te enviaremos un código para restablecerla.
              </p>

              <form onSubmit={handleRequestCode} className="space-y-4">
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-neutral-500" />
                    </div>
                    <input
                      ref={emailRef}
                      type="email"
                      className={inputClass('email', { email: emailError })}
                      placeholder="Correo electrónico"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                    />
                  </div>
                  {emailError && <p className="mt-1.5 ml-1 text-xs text-red-400">{emailError}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#022F72] hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#2C2C2C] focus:ring-[#022F72] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Enviando...' : (<>Enviar código <ArrowRight className="w-4 h-4" /></>)}
                </button>
              </form>
            </>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* Paso 2: código + nueva contraseña                                 */}
          {/* ---------------------------------------------------------------- */}
          {step === 2 && (
            <>
              <h2 className="text-2xl font-bold text-white text-center mb-2">Introduce el código</h2>
              <p className="text-neutral-400 text-center mb-8 text-sm">
                Hemos enviado un código de 6 dígitos a <span className="text-white">{email}</span>.
                Válido durante 15 minutos.
              </p>

              {step2Errors.general && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {step2Errors.general}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                {/* Código */}
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <KeyRound className="h-5 w-5 text-neutral-500" />
                    </div>
                    <input
                      ref={codeRef}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      className={`${inputClass('code', step2Errors)} tracking-[0.5em] font-mono text-center`}
                      placeholder="000000"
                      value={code}
                      onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                      required
                    />
                  </div>
                  {step2Errors.code && <p className="mt-1.5 ml-1 text-xs text-red-400">{step2Errors.code}</p>}
                </div>

                {/* Nueva contraseña */}
                <div>
                  <PasswordInput
                    className={inputClass('newPassword', step2Errors, 'pr-10')}
                    placeholder="Nueva contraseña"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  {step2Errors.newPassword && <p className="mt-1.5 ml-1 text-xs text-red-400">{step2Errors.newPassword}</p>}
                </div>

                {/* Confirmar contraseña */}
                <div>
                  <PasswordInput
                    className={inputClass('confirmPassword', step2Errors, 'pr-10')}
                    placeholder="Confirmar nueva contraseña"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  {step2Errors.confirmPassword && <p className="mt-1.5 ml-1 text-xs text-red-400">{step2Errors.confirmPassword}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#022F72] hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#2C2C2C] focus:ring-[#022F72] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Guardando...' : (<>Cambiar contraseña <ArrowRight className="w-4 h-4" /></>)}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep(1); setStep2Errors({}); setCode(''); setNewPassword(''); setConfirmPassword(''); }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Cambiar email
                </button>
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-[#252525] border-t border-[#383838] text-center">
          <p className="text-neutral-400 text-sm">
            ¿Recuerdas tu contraseña?{' '}
            <Link to="/login" className="font-bold text-white hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
