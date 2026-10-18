import apiService, { ApiError } from '@/services/apiService';
import type { AuthUser } from '@/types/AuthUser';

export type ProfileImageType = 'avatar' | 'header';

// Tamaño final de cada imagen (el navegador la recorta y reduce antes de subirla).
// La cabecera se muestra en el perfil con esta misma proporción (4:1), así se ve tal cual se recortó.
export const PROFILE_IMAGE_SIZE: Record<ProfileImageType, { width: number; height: number }> = {
  avatar: { width: 256, height: 256 },
  header: { width: 1600, height: 400 },
};

const FIELD: Record<ProfileImageType, 'avatarUrl' | 'headerUrl'> = { avatar: 'avatarUrl', header: 'headerUrl' };

interface UploadUrlResponse {
  uploadUrl: string;
  publicUrl: string;
}

// Sube la imagen directamente a OCI con la URL que da la api y la guarda en el perfil.
// Devuelve el usuario actualizado.
export async function uploadProfileImage(type: ProfileImageType, image: Blob): Promise<AuthUser> {
  const { uploadUrl, publicUrl } = await apiService.post<UploadUrlResponse>('/users/me/images', {
    type,
    contentType: image.type,
  });
  const response = await fetch(uploadUrl, { method: 'PUT', body: image, headers: { 'Content-Type': image.type } })
    .catch(() => null);
  if (!response || !response.ok) throw new ApiError('storage.upload_failed');
  return apiService.patch<AuthUser>('/users/me', { [FIELD[type]]: publicUrl });
}

// Quita la imagen del perfil (la api borra el archivo)
export function removeProfileImage(type: ProfileImageType): Promise<AuthUser> {
  return apiService.patch<AuthUser>('/users/me', { [FIELD[type]]: '' });
}
