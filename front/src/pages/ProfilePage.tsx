import { useState } from 'react';
import { Settings, MapPin, Calendar, Link as LinkIcon, Edit3, X, Check, Loader2, UserCircle } from 'lucide-react';
import LookPreview from '@/components/LookPreview';
import { toast } from 'sonner';
import { useAuth } from '@/providers/AuthProvider';
import apiService, { ApiError } from '@/services/apiService';
import { getErrorMessage } from '@/i18n/errorMessages';
import type { AuthUser } from '@/types/AuthUser';
import { useGame } from '@/contexts/GameContext';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatJoinDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  } catch {
    return '';
  }
}

function normalizeWebsite(url: string): string {
  return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
}

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface ProfileForm {
  username: string;
  displayName: string;
  motto: string;
  location: string;
  website: string;
  look: string;
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function ProfilePage() {
  const auth = useAuth();
  const user = auth.user!;
  const game = useGame();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<ProfileForm>({
    username:    user.username    ?? '',
    displayName: user.displayName ?? '',
    motto:       user.motto       ?? '',
    location:    user.location    ?? '',
    website:     user.website     ?? '',
    look:        user.look        ?? '',
  });

  const handleEdit = () => {
    setForm({
      username:    user.username    ?? '',
      displayName: user.displayName ?? '',
      motto:       user.motto       ?? '',
      location:    user.location    ?? '',
      website:     user.website     ?? '',
      look:        user.look        ?? '',
    });
    setErrors({});
    setIsEditing(true);
  };

  const handleCancel = () => {
    setErrors({});
    setIsEditing(false);
  };

  const handleSave = async () => {
    setErrors({});
    setIsSaving(true);
    try {
      const updated = await apiService.patch<AuthUser>('/users/me', {
        username:    form.username    || null,
        displayName: form.displayName || null,
        motto:       form.motto       || null,
        location:    form.location    || null,
        website:     form.website     || null,
        look:        form.look        || null,
      });
      auth.updateUser(updated);
      game!.updatePlayer(updated);
      setIsEditing(false);
      toast.success('Perfil actualizado correctamente.');
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.violations && error.violations.length > 0) {
          const fieldErrors: Record<string, string> = {};
          for (const v of error.violations) {
            fieldErrors[v.field] = getErrorMessage(v.code, v.field);
          }
          setErrors(fieldErrors);
        } else {
          setErrors({ general: getErrorMessage(error.code) });
        }
      } else {
        setErrors({ general: 'Error de conexión. Inténtalo de nuevo.' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const field = (
    name: keyof ProfileForm,
    placeholder: string,
    opts?: { maxLength?: number }
  ) => (
    <div>
      <input
        value={form[name]}
        onChange={e => setForm(prev => ({ ...prev, [name]: e.target.value }))}
        placeholder={placeholder}
        maxLength={opts?.maxLength}
        className={`w-full bg-[#1E1E1E] text-white placeholder-neutral-500 rounded-xl px-3 py-2 text-sm border focus:outline-none focus:ring-1 transition-colors ${
          errors[name]
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
            : 'border-[#383838] focus:border-[#022F72] focus:ring-[#022F72]'
        }`}
      />
      {errors[name] && (
        <p className="mt-1 text-xs text-red-400">{errors[name]}</p>
      )}
    </div>
  );

  const displayName = user.displayName || user.username;
  const joinDate    = user.createdAt ? formatJoinDate(user.createdAt) : null;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header: cover + avatar + botones */}
      <div className="bg-[#2C2C2C] rounded-3xl overflow-hidden shadow-lg border border-[#383838] relative">
        <div className="h-48 bg-gradient-to-r from-[#1E1E1E] via-[#022F72] to-[#1E1E1E] w-full opacity-90 pointer-events-none" />

        <div className="relative z-10 px-8 pb-8">
          <div className="flex justify-between items-end -mt-16 mb-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-[#2C2C2C] bg-[#383838] overflow-hidden shadow-2xl flex items-center justify-center">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-bold text-white select-none">
                    {(user.displayName || user.username).charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <button className="absolute bottom-1 right-1 bg-[#383838] text-white p-2 rounded-full hover:bg-[#022F72] border-2 border-[#2C2C2C] transition-colors shadow-md">
                <Edit3 className="w-4 h-4" />
              </button>
            </div>

            {/* Botones edición */}
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-6 py-2 bg-[#383838] hover:bg-[#444444] text-white rounded-full font-bold transition-colors border border-[#444444]"
              >
                <Settings className="w-4 h-4" />
                Editar Perfil
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2 bg-[#383838] hover:bg-[#444444] text-white rounded-full font-bold transition-colors border border-[#444444] disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2 bg-[#022F72] hover:bg-blue-800 text-white rounded-full font-bold transition-colors disabled:opacity-50"
                >
                  {isSaving
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Check className="w-4 h-4" />}
                  Guardar
                </button>
              </div>
            )}
          </div>

          {/* Error general */}
          {errors.general && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {errors.general}
            </div>
          )}

          {/* Datos del perfil */}
          {!isEditing ? (
            // --------------- Modo vista ---------------
            <div>
              <h1 className="text-2xl font-bold text-white">{displayName}</h1>
              <p className="text-neutral-400 font-medium">@{user.username}</p>

              {user.motto && (
                <p className="mt-4 text-neutral-300 max-w-2xl text-[15px] leading-relaxed">
                  {user.motto}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-sm text-neutral-400">
                {user.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span>{user.location}</span>
                  </div>
                )}
                {user.website && (
                  <div className="flex items-center gap-1.5">
                    <LinkIcon className="w-4 h-4 shrink-0" />
                    <a
                      href={normalizeWebsite(user.website)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#4b8df8] hover:underline truncate max-w-[200px]"
                    >
                      {user.website}
                    </a>
                  </div>
                )}
                {user.look && (
                  <div className="flex items-center gap-1.5">
                    <UserCircle className="w-4 h-4 shrink-0" />
                    <span>{user.look}</span>
                  </div>
                )}
                {joinDate && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>Se unió en {joinDate}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-6 mt-6 pt-6 border-t border-[#383838]">
                <div className="flex gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                  <span className="font-bold text-white">0</span>
                  <span className="text-neutral-400">Amigos</span>
                </div>
              </div>
            </div>
          ) : (
            // --------------- Modo edición ---------------
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-neutral-500 mb-1.5">Nombre de usuario</label>
                  {field('username', 'usuario', { maxLength: 15 })}
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1.5">Nombre visible</label>
                  {field('displayName', 'Tu nombre', { maxLength: 100 })}
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-500 mb-1.5">Misión</label>
                {field('motto', 'Cuéntanos algo sobre ti…', { maxLength: 50 })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-neutral-500 mb-1.5">Ubicación</label>
                  {field('location', 'Ciudad, País', { maxLength: 100 })}
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1.5">Web</label>
                  {field('website', 'https://tu-web.com', { maxLength: 255 })}
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-500 mb-1.5">Avatar de Habbo.es (apariencia en el juego)</label>
                <LookPreview
                  value={form.look}
                  onChange={v => setForm(prev => ({ ...prev, look: v }))}
                  maxLength={255}
                  inputClassName={`w-full bg-[#1E1E1E] text-white placeholder-neutral-500 rounded-xl px-3 py-2 text-sm border focus:outline-none focus:ring-1 transition-colors ${
                    errors.look
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-[#383838] focus:border-[#022F72] focus:ring-[#022F72]'
                  }`}
                />
                {errors.look && <p className="mt-1 text-xs text-red-400">{errors.look}</p>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex border-b border-[#383838]">
        <button className="px-6 py-4 text-white border-b-2 border-white font-bold">
          Mis Posts
        </button>
        <button className="px-6 py-4 text-neutral-500 hover:text-white font-semibold transition-colors">
          Me gusta
        </button>
      </div>

      <div className="py-12 text-center text-neutral-500 bg-[#1E1E1E]/50 mt-6 rounded-2xl border border-[#383838]/50">
        <p className="text-lg">Aún no has hecho ninguna publicación.</p>
        <button className="mt-4 px-6 py-2 bg-[#383838] text-white rounded-full font-bold hover:bg-[#444444] transition-colors border border-[#444444]">
          Crear mi primer post
        </button>
      </div>
    </div>
  );
}

export default ProfilePage;
