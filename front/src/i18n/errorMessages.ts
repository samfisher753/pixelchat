// ---------------------------------------------------------------------------
// Mapeo de códigos de error (API + validaciones) a mensajes en español.
//
// Prioridad de lookup: `${field}.${code}` primero, luego `${code}` genérico.
// Esto permite mensajes específicos por campo cuando el texto varía
// (p.ej. el tamaño mínimo de contraseña vs. el de username).
// ---------------------------------------------------------------------------

const messages: Record<string, string> = {

  // -------------------------------------------------------------------------
  // Validaciones genéricas (sin campo específico)
  // -------------------------------------------------------------------------
  'validation.not_blank':  'Este campo es obligatorio',
  'validation.email':      'Introduce un email con formato válido',
  'validation.size':       'El valor no tiene la longitud correcta',
  'validation.pattern':    'El formato introducido no es válido',

  // -------------------------------------------------------------------------
  // Validaciones específicas por campo (campo.código)
  // -------------------------------------------------------------------------

  // username
  'username.validation.size':
    'El nombre de usuario debe tener entre 1 y 15 caracteres',
  'username.validation.pattern':
    'Solo letras, números y guiones bajos (_)',

  // password
  'password.validation.size':
    'La contraseña debe tener entre 8 y 128 caracteres',

  // -------------------------------------------------------------------------
  // Errores de autenticación (auth.*)
  // -------------------------------------------------------------------------
  'auth.email_in_use':
    'Este email ya está registrado',
  'auth.username_in_use':
    'Este nombre de usuario ya está en uso',
  'auth.user_not_found':
    'No se encontró ninguna cuenta con esos datos',
  'auth.invalid_credentials':
    'Contraseña incorrecta',
  'auth.refresh_token_not_found':
    'Sesión no válida, vuelve a iniciar sesión',
  'auth.refresh_token_expired':
    'Tu sesión ha expirado, vuelve a iniciar sesión',
  'auth.session_expired':
    'Tu sesión ha expirado, vuelve a iniciar sesión',
  'auth.email_not_verified':
    'Debes verificar tu email antes de iniciar sesión',
  'auth.verify_email_token_not_found':
    'El enlace de verificación no es válido o ya fue utilizado',
  'auth.verify_email_token_expired':
    'El enlace de verificación ha expirado. Solicita uno nuevo desde el login',
  'auth.reset_password_token_not_found':
    'El código no es válido o ya fue utilizado',
  'auth.reset_password_token_expired':
    'El código ha expirado. Solicita uno nuevo',

  // newPassword (campo del paso 2)
  'newPassword.validation.size':
    'La contraseña debe tener entre 8 y 128 caracteres',

  // -------------------------------------------------------------------------
  // Errores de perfil (users.*)
  // -------------------------------------------------------------------------
  'displayName.validation.size':
    'El nombre no puede superar los 100 caracteres',
  'motto.validation.size':
    'El motto no puede superar los 50 caracteres',
  'location.validation.size':
    'La ubicación no puede superar los 100 caracteres',
  'website.validation.size':
    'La web no puede superar los 255 caracteres',
};

/**
 * Devuelve el mensaje en español para un código de error.
 * Si se proporciona `field`, se busca primero la combinación `field.code`
 * para obtener un mensaje más específico.
 */
export function getErrorMessage(code: string, field?: string): string {
  if (field) {
    const specific = messages[`${field}.${code}`];
    if (specific) return specific;
  }
  return messages[code] ?? 'Ha ocurrido un error inesperado';
}
