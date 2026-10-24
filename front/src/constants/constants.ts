
// Tamaño máximo de un archivo del chat. Debe coincidir con chat.max-file-bytes en la api,
// que es quien lo comprueba de verdad (aquí solo sirve para avisar antes de subirlo).
export const MAX_FILE_SIZE_BYTES: number = 25 * 1024 * 1024; // 25 MB
export const MAX_MSG_LENGTH: number = 136;
// Clave con la que se guardan en Assets los sprites del avatar por defecto
export const DEFAULT_AVATAR: string = "default";