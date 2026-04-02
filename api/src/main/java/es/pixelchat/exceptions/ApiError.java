package es.pixelchat.exceptions;

import jakarta.ws.rs.core.Response;
import lombok.Getter;

@Getter
public enum ApiError {

    // -------------------------------------------------------------------------
    // Auth
    // -------------------------------------------------------------------------
    USER_NOT_FOUND(Response.Status.NOT_FOUND, "auth.user_not_found", "No se ha encontrado el usuario"),
    INVALID_CREDENTIALS(Response.Status.UNAUTHORIZED, "auth.invalid_credentials", "Las credenciales son incorrectas"),
    EMAIL_IN_USE(Response.Status.CONFLICT, "auth.email_in_use", "El email ya está en uso"),
    USERNAME_IN_USE(Response.Status.CONFLICT, "auth.username_in_use", "El nombre de usuario ya está en uso"),
    REFRESH_TOKEN_NOT_FOUND(Response.Status.UNAUTHORIZED, "auth.refresh_token_not_found", "El refresh token no existe"),
    REFRESH_TOKEN_EXPIRED(Response.Status.UNAUTHORIZED, "auth.refresh_token_expired", "El refresh token ha expirado"),
    EMAIL_NOT_VERIFIED(Response.Status.FORBIDDEN, "auth.email_not_verified", "El email no ha sido verificado"),
    VERIFY_EMAIL_TOKEN_NOT_FOUND(Response.Status.BAD_REQUEST, "auth.verify_email_token_not_found", "El token de verificación no existe o ya fue usado"),
    VERIFY_EMAIL_TOKEN_EXPIRED(Response.Status.BAD_REQUEST, "auth.verify_email_token_expired", "El token de verificación ha expirado"),
    RESET_PASSWORD_TOKEN_NOT_FOUND(Response.Status.BAD_REQUEST, "auth.reset_password_token_not_found", "El código no es válido o ya fue usado"),
    RESET_PASSWORD_TOKEN_EXPIRED(Response.Status.BAD_REQUEST, "auth.reset_password_token_expired", "El código ha expirado, solicita uno nuevo");

    private final Response.Status status;
    private final String code;
    private final String message;

    ApiError(Response.Status status, String code, String message) {
        this.status = status;
        this.code = code;
        this.message = message;
    }
}
