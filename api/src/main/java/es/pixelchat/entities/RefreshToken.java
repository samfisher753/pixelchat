package es.pixelchat.entities;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Entity
@Table(name = "refresh_tokens")
public class RefreshToken extends PanacheEntityBase {

    @Id
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "user_id", nullable = false, updatable = false, length = 36)
    public UUID userId;

    @Column(name = "token", nullable = false, unique = true, length = 36)
    public String token;

    @Column(name = "expires_at", nullable = false)
    public Instant expiresAt;

    // -------------------------------------------------------------------------
    // Queries estáticas (Active Record pattern)
    // -------------------------------------------------------------------------

    public static Optional<RefreshToken> findByToken(String token) {
        return find("token", token).firstResultOptional();
    }
}
