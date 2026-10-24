import apiService, { ApiError } from '@/services/apiService';

interface ChatFileUploadResponse {
  objectName: string;
  uploadUrl: string;
}

// Sube un archivo del chat directamente a OCI con la URL que da la api.
// Devuelve el nombre que le ha puesto la api, que es lo que se anuncia a world.
export async function uploadChatFile(file: File): Promise<string> {
  const { objectName, uploadUrl } = await apiService.post<ChatFileUploadResponse>('/chat/files', {
    fileName: file.name,
    contentType: file.type,
    size: file.size,
  });
  const response = await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
    .catch(() => null);
  if (!response || !response.ok) throw new ApiError('storage.upload_failed');
  return objectName;
}
