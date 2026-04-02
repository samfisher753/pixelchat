package es.pixelchat.services;

import es.pixelchat.entities.RefreshToken;
import es.pixelchat.entities.User;
import es.pixelchat.entities.UserToken;
import es.pixelchat.enums.TokenType;
import es.pixelchat.exceptions.ApiError;
import es.pixelchat.exceptions.ApiException;
import es.pixelchat.mappers.UserMapper;
import es.pixelchat.requests.ForgotPasswordRequest;
import es.pixelchat.requests.LoginRequest;
import es.pixelchat.requests.RefreshTokenRequest;
import es.pixelchat.requests.RegisterRequest;
import es.pixelchat.requests.ResendVerificationRequest;
import es.pixelchat.requests.ResetPasswordRequest;
import es.pixelchat.requests.VerifyEmailRequest;
import es.pixelchat.responses.LoginResponse;
import es.pixelchat.responses.RefreshTokenResponse;
import io.quarkus.elytron.security.common.BcryptUtil;
import io.smallrye.jwt.build.Jwt;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class AuthService {

    @Inject
    UserMapper userMapper;

    @Inject
    EmailService emailService;

    @ConfigProperty(name = "app.url")
    String appUrl;

    @Transactional
    public void register(RegisterRequest request) {
        registerValidations(request);

        request.password = BcryptUtil.bcryptHash(request.password);

        User user = userMapper.toEntity(request);
        user.persist();

        sendVerifyEmail(user);
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        Optional<User> foundUser = User.findByEmail(request.user);
        if (foundUser.isEmpty()) {
            foundUser = User.findByUsername(request.user);
        }

        User user = foundUser.orElseThrow(() -> new ApiException(ApiError.USER_NOT_FOUND));

        if (!BcryptUtil.matches(request.password, user.password)) {
            throw new ApiException(ApiError.INVALID_CREDENTIALS);
        }

        if (!user.emailVerified) {
            throw new ApiException(ApiError.EMAIL_NOT_VERIFIED);
        }

        return LoginResponse.builder()
                .accessToken(generateAccessToken(user))
                .refreshToken(issueRefreshToken(user.id))
                .user(userMapper.toLoginDto(user))
                .build();
    }

    @Transactional
    public RefreshTokenResponse refresh(RefreshTokenRequest request) {
        RefreshToken refreshToken = RefreshToken.findByToken(request.refreshToken)
                .orElseThrow(() -> new ApiException(ApiError.REFRESH_TOKEN_NOT_FOUND));

        if (Instant.now().isAfter(refreshToken.expiresAt)) {
            throw new ApiException(ApiError.REFRESH_TOKEN_EXPIRED);
        }

        User user = User.findById(refreshToken.userId);
        if (user == null) {
            throw new ApiException(ApiError.USER_NOT_FOUND);
        }

        return RefreshTokenResponse.builder()
                .accessToken(generateAccessToken(user))
                .refreshToken(issueRefreshToken(user.id))
                .build();
    }

    @Transactional
    public void verifyEmail(VerifyEmailRequest request) {
        UserToken userToken = UserToken.findByToken(request.token)
                .orElseThrow(() -> new ApiException(ApiError.VERIFY_EMAIL_TOKEN_NOT_FOUND));

        if (userToken.type != TokenType.VERIFY_EMAIL) {
            throw new ApiException(ApiError.VERIFY_EMAIL_TOKEN_NOT_FOUND);
        }

        if (Instant.now().isAfter(userToken.expiresAt)) {
            userToken.delete();
            throw new ApiException(ApiError.VERIFY_EMAIL_TOKEN_EXPIRED);
        }

        User user = User.findById(userToken.userId);
        if (user == null) {
            throw new ApiException(ApiError.USER_NOT_FOUND);
        }

        user.emailVerified = true;
        userToken.delete();
    }

    @Transactional
    public void resendVerificationEmail(ResendVerificationRequest request) {
        Optional<User> foundUser = User.findByEmail(request.email);

        // Respuesta silenciosa si el email no existe o ya está verificado
        // (evita user enumeration)
        if (foundUser.isEmpty() || foundUser.get().emailVerified) {
            return;
        }

        sendVerifyEmail(foundUser.get());
    }

    @Transactional
    public void logout(UUID userId) {
        RefreshToken.deleteById(userId);

        User.<User>findByIdOptional(userId).ifPresent(user -> {
            if (user.isDemo) {
                user.delete();
            }
        });
    }

    @Transactional
    public LoginResponse demo() {
        String username;
        do {
            String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 8);
            username = "guest_" + suffix;
        } while (User.existsByUsername(username));

        User user = new User();
        user.username = username;
        user.email = username + "@demo.pixelchat";
        user.password = BcryptUtil.bcryptHash(UUID.randomUUID().toString());
        user.emailVerified = true;
        user.isDemo = true;
        user.persist();

        return LoginResponse.builder()
                .accessToken(generateAccessToken(user))
                .refreshToken(issueRefreshToken(user.id))
                .user(userMapper.toLoginDto(user))
                .build();
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        Optional<User> foundUser = User.findByEmail(request.email);

        // Respuesta silenciosa si el email no existe o no está verificado
        // (evita user enumeration)
        if (foundUser.isEmpty() || !foundUser.get().emailVerified) {
            return;
        }

        sendResetPasswordEmail(foundUser.get());
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        UserToken userToken = UserToken.findByToken(request.code)
                .orElseThrow(() -> new ApiException(ApiError.RESET_PASSWORD_TOKEN_NOT_FOUND));

        if (userToken.type != TokenType.RESET_PASSWORD) {
            throw new ApiException(ApiError.RESET_PASSWORD_TOKEN_NOT_FOUND);
        }

        if (Instant.now().isAfter(userToken.expiresAt)) {
            userToken.delete();
            throw new ApiException(ApiError.RESET_PASSWORD_TOKEN_EXPIRED);
        }

        User user = User.findById(userToken.userId);
        if (user == null) {
            throw new ApiException(ApiError.USER_NOT_FOUND);
        }

        user.password = BcryptUtil.bcryptHash(request.newPassword);
        userToken.delete();
    }

    // -------------------------------------------------------------------------
    // Email helpers
    // -------------------------------------------------------------------------

    private void sendVerifyEmail(User user) {
        UserToken.deleteByUserIdAndType(user.id, TokenType.VERIFY_EMAIL);

        String tokenValue = UUID.randomUUID().toString();

        UserToken userToken = new UserToken();
        userToken.id = UUID.randomUUID();
        userToken.userId = user.id;
        userToken.token = tokenValue;
        userToken.type = TokenType.VERIFY_EMAIL;
        userToken.expiresAt = Instant.now().plus(24, ChronoUnit.HOURS);
        userToken.persist();

        String verificationLink = appUrl + "/verify-email?token=" + tokenValue;
        emailService.sendVerificationEmail(user.email, verificationLink);
    }

    private void sendResetPasswordEmail(User user) {
        UserToken.deleteByUserIdAndType(user.id, TokenType.RESET_PASSWORD);

        String code = String.format("%06d", new SecureRandom().nextInt(1_000_000));

        UserToken userToken = new UserToken();
        userToken.id = UUID.randomUUID();
        userToken.userId = user.id;
        userToken.token = code;
        userToken.type = TokenType.RESET_PASSWORD;
        userToken.expiresAt = Instant.now().plus(15, ChronoUnit.MINUTES);
        userToken.persist();

        emailService.sendPasswordResetEmail(user.email, code);
    }

    // -------------------------------------------------------------------------
    // Token helpers
    // -------------------------------------------------------------------------

    private String generateAccessToken(User user) {
        return Jwt.issuer("pixelchat")
                .upn(user.username)
                .subject(user.id.toString())
                .expiresIn(15 * 60)
                .sign();
    }

    private String issueRefreshToken(UUID userId) {
        String tokenValue = UUID.randomUUID().toString();

        Instant expiresAt = Instant.now().plus(7, ChronoUnit.DAYS);

        RefreshToken refreshToken = RefreshToken.findById(userId);
        if (refreshToken == null) {
            refreshToken = new RefreshToken();
            refreshToken.userId = userId;
            refreshToken.token = tokenValue;
            refreshToken.expiresAt = expiresAt;
            refreshToken.persist();
        } else {
            refreshToken.token = tokenValue;
            refreshToken.expiresAt = expiresAt;
        }

        return tokenValue;
    }

    // -------------------------------------------------------------------------
    // Validaciones de registro
    // -------------------------------------------------------------------------

    private void registerValidations(RegisterRequest request) {
        if (User.existsByEmail(request.email)) {
            throw new ApiException(ApiError.EMAIL_IN_USE);
        }
        if (User.existsByUsername(request.username)) {
            throw new ApiException(ApiError.USERNAME_IN_USE);
        }
    }
}
