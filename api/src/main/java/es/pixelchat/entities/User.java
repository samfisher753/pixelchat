package es.pixelchat.entities;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Entity
@Table(name = "users")
public class User extends PanacheEntityBase {

    @Id
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "id", nullable = false, updatable = false, length = 36)
    public UUID id;

    @Email
    @NotBlank
    @Column(name = "email", nullable = false, unique = true, length = 255)
    public String email;

    @NotBlank
    @Size(max = 15)
    @Column(name = "username", nullable = false, unique = true, length = 15)
    public String username;

    @NotBlank
    @Column(name = "password", nullable = false, length = 255)
    public String password;

    @Size(max = 100)
    @Column(name = "display_name", length = 100)
    public String displayName;

    @Column(name = "look", length = 255)
    public String look;

    @Size(max = 50)
    @Column(name = "motto", length = 50)
    public String motto;

    @Column(name = "avatar_url", length = 255)
    public String avatarUrl;

    @Column(name = "header_url", length = 255)
    public String headerUrl;

    @Column(name = "website", length = 255)
    public String website;

    @Size(max = 100)
    @Column(name = "location", length = 100)
    public String location;

    @Column(name = "created_at", nullable = false, updatable = false)
    public Instant createdAt;

    @Column(name = "email_verified", nullable = false)
    public boolean emailVerified = false;

    @Column(name = "is_demo", nullable = false)
    public boolean isDemo = false;

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    @PrePersist
    void prePersist() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    // -------------------------------------------------------------------------
    // Queries estáticas (Active Record pattern)
    // -------------------------------------------------------------------------

    public static Optional<User> findByEmail(String email) {
        return find("LOWER(email) = LOWER(?1)", email).firstResultOptional();
    }

    public static Optional<User> findByUsername(String username) {
        return find("LOWER(username) = LOWER(?1)", username).firstResultOptional();
    }

    public static boolean existsByEmail(String email) {
        return count("LOWER(email) = LOWER(?1)", email) > 0;
    }

    public static boolean existsByUsername(String username) {
        return count("LOWER(username) = LOWER(?1)", username) > 0;
    }

    public static long deleteExpiredDemoUsers(Instant olderThan) {
        return delete("isDemo = true and createdAt < ?1", olderThan);
    }
}
