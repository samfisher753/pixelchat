package es.pixelchat.resources;

import es.pixelchat.requests.ForgotPasswordRequest;
import es.pixelchat.requests.LoginRequest;
import es.pixelchat.requests.RefreshTokenRequest;
import es.pixelchat.requests.RegisterRequest;
import es.pixelchat.requests.ResendVerificationRequest;
import es.pixelchat.requests.ResetPasswordRequest;
import es.pixelchat.requests.VerifyEmailRequest;
import es.pixelchat.responses.LoginResponse;
import es.pixelchat.responses.RefreshTokenResponse;
import es.pixelchat.services.AuthService;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.util.UUID;

@Path("/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthResource {

    @Inject
    AuthService authService;

    @Inject
    JsonWebToken jwt;

    @POST
    @Path("/register")
    public Response register(@Valid RegisterRequest request) {
        authService.register(request);
        return Response.status(Response.Status.CREATED).build();
    }

    @POST
    @Path("/login")
    public Response login(@Valid LoginRequest request) {
        LoginResponse response = authService.login(request);
        return Response.ok(response).build();
    }

    @POST
    @Path("/refresh-token")
    public Response refresh(@Valid RefreshTokenRequest request) {
        RefreshTokenResponse response = authService.refresh(request);
        return Response.ok(response).build();
    }

    @POST
    @Path("/verify-email")
    public Response verifyEmail(@Valid VerifyEmailRequest request) {
        authService.verifyEmail(request);
        return Response.ok().build();
    }

    @POST
    @Path("/resend-verification")
    public Response resendVerification(@Valid ResendVerificationRequest request) {
        authService.resendVerificationEmail(request);
        return Response.ok().build();
    }

    @POST
    @Path("/logout")
    @Authenticated
    public Response logout() {
        UUID userId = UUID.fromString(jwt.getSubject());
        authService.logout(userId);
        return Response.ok().build();
    }

    @POST
    @Path("/demo")
    public Response demo() {
        LoginResponse response = authService.demo();
        return Response.ok(response).build();
    }

    @POST
    @Path("/forgot-password")
    public Response forgotPassword(@Valid ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return Response.ok().build();
    }

    @POST
    @Path("/reset-password")
    public Response resetPassword(@Valid ResetPasswordRequest request) {
        authService.resetPassword(request);
        return Response.ok().build();
    }
}
