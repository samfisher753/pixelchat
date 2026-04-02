import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Mail, User, UserCircle, ArrowRight } from 'lucide-react';
import PasswordInput from '@/components/PasswordInput';
import { toast } from 'sonner';
import logo from '@/assets/logo-pixelchat.svg';
import apiService, { ApiError } from '@/services/apiService';
import { getErrorMessage } from '@/i18n/errorMessages';

// Mapa de códigos de error de negocio al campo de formulario que les corresponde
const ERROR_TO_FIELD: Record<string, string> = {
  'auth.email_in_use': 'email',
  'auth.username_in_use': 'username',
};

function RegisterPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [look, setLook] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: 'Las contraseñas no coinciden' });
      return;
    }

    setIsLoading(true);
    try {
      await apiService.post('/auth/register', {
        email,
        username,
        password,
        look: look || undefined,
      });
      toast.success('¡Cuenta creada! Revisa tu email para verificar la cuenta.', { duration: 5000 });
      navigate('/login');
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.violations && error.violations.length > 0) {
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

  const inputClass = (field: string, pr = 'pr-3') =>
    `block w-full pl-10 ${pr} py-3 border rounded-xl leading-5 bg-[#1E1E1E] text-white placeholder-neutral-500 focus:outline-none focus:ring-1 transition-colors ${
      errors[field]
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
        : 'border-[#383838] focus:border-[#022F72] focus:ring-[#022F72]'
    }`;

  return (
    <div className="min-h-screen bg-[#1E1E1E] flex flex-col justify-center items-center p-4 font-sans py-12">
      <div className="w-full max-w-md bg-[#2C2C2C] rounded-3xl shadow-2xl overflow-hidden border border-[#383838]">
        <div className="p-8">
          <div className="flex justify-center mb-6 mx-auto w-fit">
            <img src={logo} alt="PixelChat Logo" className="h-16 object-contain drop-shadow-md" />
          </div>

          <h2 className="text-2xl font-bold text-white text-center mb-2">Crea tu cuenta</h2>
          <p className="text-neutral-400 text-center mb-8">Únete a la comunidad de PixelChat</p>

          {errors.general && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-neutral-500" />
                </div>
                <input
                  type="email"
                  className={inputClass('email')}
                  placeholder="Correo electrónico"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              {errors.email && <p className="mt-1.5 ml-1 text-xs text-red-400">{errors.email}</p>}
            </div>

            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-neutral-500" />
                </div>
                <input
                  type="text"
                  className={inputClass('username')}
                  placeholder="Nombre de usuario"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                />
              </div>
              {errors.username && <p className="mt-1.5 ml-1 text-xs text-red-400">{errors.username}</p>}
            </div>

            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserCircle className="h-5 w-5 text-neutral-500" />
                </div>
                <input
                  type="text"
                  className={inputClass('look')}
                  placeholder="Avatar de Habbo.es (opcional)"
                  value={look}
                  onChange={e => setLook(e.target.value)}
                />
              </div>
              {errors.look && <p className="mt-1.5 ml-1 text-xs text-red-400">{errors.look}</p>}
            </div>

            <div>
              <PasswordInput
                className={inputClass('password', 'pr-10')}
                placeholder="Contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              {errors.password && <p className="mt-1.5 ml-1 text-xs text-red-400">{errors.password}</p>}
            </div>

            <div>
              <PasswordInput
                className={inputClass('confirmPassword', 'pr-10')}
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              {errors.confirmPassword && <p className="mt-1.5 ml-1 text-xs text-red-400">{errors.confirmPassword}</p>}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#022F72] hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#2C2C2C] focus:ring-[#022F72] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Registrando...' : (<>Registrarse <ArrowRight className="w-4 h-4" /></>)}
              </button>
            </div>
          </form>
        </div>

        <div className="px-8 py-6 bg-[#252525] border-t border-[#383838] text-center">
          <p className="text-neutral-400 text-sm">
            ¿Ya tienes una cuenta?{' '}
            <Link to="/login" className="font-bold text-white hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
