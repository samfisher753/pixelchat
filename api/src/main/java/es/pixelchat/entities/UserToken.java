package es.pixelchat.entities;

import es.pixelchat.enums.TokenType;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Entity
@Table(name = "user_tokens")
public class UserToken extends PanacheEntityBase {

    @Id
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "id", nullable = false, updatable = false, length = 36)
    public UUID id;

    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "user_id", nullable = false, updatable = false, length = 36)
    public UUID userId;

    @Column(name = "token", nullable = false, unique = true, length = 64)
    public String token;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    public TokenType type;

    @Column(name = "expires_at", nullable = false)
    public Instant expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false,
            insertable = false, columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    public Instant createdAt;

    // -------------------------------------------------------------------------
    // Queries estáticas (Active Record pattern)
    // -------------------------------------------------------------------------

    public static Optional<UserToken> findByToken(String token) {
        return find("token", token).firstResultOptional();
    }

    public static void deleteByUserIdAndType(UUID userId, TokenType type) {
        delete("userId = ?1 and type = ?2", userId, type);
    }
}
