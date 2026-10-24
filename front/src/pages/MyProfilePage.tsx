import { ReactNode, useEffect, useRef, useState } from 'react';
import { Settings, Camera, X, Check, Loader2, Shirt, Upload, Trash2 } from 'lucide-react';
import LookEditor from '@/components/LookEditor';
import ProfileCard from '@/components/ProfileCard';
import ImageCropDialog from '@/components/ImageCropDialog';
import { PROFILE_IMAGE_SIZE, ProfileImageType, removeProfileImage, uploadProfileImage } from '@/services/profileImageService';
import { toast } from 'sonner';
import { useAuth } from '@/providers/AuthProvider';
import apiService, { ApiError } from '@/services/apiService';
import { getErrorMessage } from '@/i18n/errorMessages';
import type { AuthUser } from '@/types/AuthUser';
import { useGame } from '@/contexts/GameContext';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

// Botón que abre el selector de imagen; si ya hay una, muestra un menú para subir otra o quitarla
function ImageMenu({ label, hasImage, onUpload, onRemove, buttonClassName, align = 'right', children }: {
  label: string;
  hasImage: boolean;
  onUpload: () => void;
  onRemove: () => void;
  buttonClassName: string;
  // Hacia dónde se despliega el menú desde el botón (para que no lo recorte la tarjeta)
  align?: 'left' | 'right';
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const item = 'w-full flex items-center gap-2 px-3 py-2 text-sm font-medium hover:bg-[#383838] transition-colors';
  return (
    <div ref={ref} className="relative">
      <button type="button" title={label} aria-label={label} className={buttonClassName}
        onClick={() => (hasImage ? setOpen(o => !o) : onUpload())}>
        {children}
      </button>
      {open && (
        <div className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-2 min-w-[170px] bg-[#2C2C2C] border border-[#383838] rounded-xl shadow-2xl overflow-hidden z-30`}>
          <button type="button" className={`${item} text-neutral-200`} onClick={() => { setOpen(false); onUpload(); }}>
            <Upload className="w-4 h-4" /> Subir otra
          </button>
          <button type="button" className={`${item} text-red-400`} onClick={() => { setOpen(false); onRemove(); }}>
            <Trash2 className="w-4 h-4" /> Quitar
          </button>
        </div>
      )}
    </div>
  );
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
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

// Tu propio perfil (/profile): la tarjeta con los botones y el formulario para editarlo
export function MyProfilePage() {
  const auth = useAuth();
  const user = auth.user!;
  const game = useGame();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingLook, setIsEditingLook] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Imagen elegida que se está encuadrando, e imagen que se está subiendo
  const [cropping, setCropping] = useState<{ type: ProfileImageType; file: File } | null>(null);
  const [uploading, setUploading] = useState<ProfileImageType | null>(null);
  const avatarInput = useRef<HTMLInputElement>(null);
  const headerInput = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<ProfileForm>({
    username:    user.username    ?? '',
    displayName: user.displayName ?? '',
    motto:       user.motto       ?? '',
    location:    user.location    ?? '',
    website:     user.website     ?? '',
  });

  const handleEdit = () => {
    setForm({
      username:    user.username    ?? '',
      displayName: user.displayName ?? '',
      motto:       user.motto       ?? '',
      location:    user.location    ?? '',
      website:     user.website     ?? '',
    });
    setErrors({});
    setIsEditing(true);
  };

  // ---------------------------------------------------------------------------
  // Fotos de perfil y cabecera
  // ---------------------------------------------------------------------------

  const IMAGE_NAMES: Record<ProfileImageType, string> = { avatar: 'Foto de perfil', header: 'Cabecera' };

  const chooseImage = (type: ProfileImageType) => {
    (type === 'avatar' ? avatarInput : headerInput).current?.click();
  };

  const onImageChosen = (type: ProfileImageType, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('El archivo no es una imagen.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error('La imagen es demasiado grande (máximo 15 MB).');
      return;
    }
    setCropping({ type, file });
  };

  const saveImage = async (type: ProfileImageType, image: Blob | null) => {
    setCropping(null);
    setUploading(type);
    try {
      const updated = image ? await uploadProfileImage(type, image) : await removeProfileImage(type);
      auth.updateUser(updated);
      toast.success(`${IMAGE_NAMES[type]} ${image ? 'actualizada' : 'eliminada'}.`);
    } catch (error) {
      toast.error(error instanceof ApiError ? getErrorMessage(error.code) : 'Error de conexión. Inténtalo de nuevo.');
    } finally {
      setUploading(null);
    }
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

  const btn = 'flex items-center gap-2 py-2 text-white rounded-full font-bold transition-colors disabled:opacity-50';

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <ProfileCard
        profile={user}
        headerSlot={<>
          {uploading === 'header' && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
          <div className="absolute top-3 right-3 z-20">
            <ImageMenu label="Cambiar cabecera" hasImage={!!user.headerUrl}
              onUpload={() => chooseImage('header')} onRemove={() => saveImage('header', null)}
              buttonClassName="flex items-center gap-2 px-3 py-1.5 bg-black/55 hover:bg-black/75 text-white text-sm font-medium rounded-full transition-colors disabled:opacity-50">
              <Camera className="w-4 h-4" />
              Cambiar cabecera
            </ImageMenu>
          </div>
        </>}
        avatarSlot={<>
          {uploading === 'avatar' && (
            <div className="absolute inset-0 m-1 rounded-full bg-black/50 flex items-center justify-center">
              <Loader2 className="w-7 h-7 text-white animate-spin" />
            </div>
          )}
          <div className="absolute bottom-1 right-1">
            <ImageMenu label="Cambiar foto de perfil" hasImage={!!user.avatarUrl} align="left"
              onUpload={() => chooseImage('avatar')} onRemove={() => saveImage('avatar', null)}
              buttonClassName="bg-[#383838] text-white p-2 rounded-full hover:bg-[#022F72] border-2 border-[#2C2C2C] transition-colors shadow-md">
              <Camera className="w-4 h-4" />
            </ImageMenu>
          </div>
        </>}
        actions={!isEditing ? (
          <div className="flex flex-wrap justify-end items-center gap-2">
            <button onClick={() => setIsEditingLook(true)} className={`${btn} px-6 bg-[#383838] hover:bg-[#444444] border border-[#444444]`}>
              <Shirt className="w-4 h-4" />
              Cambiar aspecto
            </button>
            <button onClick={handleEdit} className={`${btn} px-6 bg-[#383838] hover:bg-[#444444] border border-[#444444]`}>
              <Settings className="w-4 h-4" />
              Editar Perfil
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={handleCancel} disabled={isSaving} className={`${btn} px-5 bg-[#383838] hover:bg-[#444444] border border-[#444444]`}>
              <X className="w-4 h-4" />
              Cancelar
            </button>
            <button onClick={handleSave} disabled={isSaving} className={`${btn} px-5 bg-[#022F72] hover:bg-blue-800`}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Guardar
            </button>
          </div>
        )}
        // Al pulsar tu personaje se puede cambiar el aspecto
        onFigureClick={() => setIsEditingLook(true)}
        figureTitle="Cambiar aspecto"
      >
        {/* Mientras editas, el formulario sustituye a los datos del perfil */}
        {isEditing ? (<>
          {errors.general && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {errors.general}
            </div>
          )}
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
          </div>
        </>) : null}
      </ProfileCard>

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

      {isEditingLook && <LookEditor onClose={() => setIsEditingLook(false)} />}

      <input ref={avatarInput} type="file" accept="image/*" className="hidden" onChange={e => onImageChosen('avatar', e)} />
      <input ref={headerInput} type="file" accept="image/*" className="hidden" onChange={e => onImageChosen('header', e)} />
      {cropping && (
        <ImageCropDialog
          file={cropping.file}
          title={cropping.type === 'avatar' ? 'Encuadra tu foto de perfil' : 'Encuadra tu cabecera'}
          outputWidth={PROFILE_IMAGE_SIZE[cropping.type].width}
          outputHeight={PROFILE_IMAGE_SIZE[cropping.type].height}
          round={cropping.type === 'avatar'}
          onCancel={() => setCropping(null)}
          onConfirm={image => saveImage(cropping.type, image)}
        />
      )}
    </div>
  );
}

export default MyProfilePage;
