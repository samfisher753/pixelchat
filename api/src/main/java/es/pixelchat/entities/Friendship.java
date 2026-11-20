package es.pixelchat.entities;

import es.pixelchat.enums.FriendshipStatus;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Relación entre dos usuarios: una solicitud de amistad mientras está PENDING y una amistad cuando
 * pasa a ACCEPTED. `requesterId` es quien la envió y `addresseeId`, quien la recibió.
 */
@Entity
@Table(name = "friendships")
public class Friendship extends PanacheEntityBase {

    @Id
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "id", nullable = false, updatable = false, length = 36)
    public UUID id;

    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "requester_id", nullable = false, updatable = false, length = 36)
    public UUID requesterId;

    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "addressee_id", nullable = false, updatable = false, length = 36)
    public UUID addresseeId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    public FriendshipStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    public Instant createdAt;

    @Column(name = "accepted_at")
    public Instant acceptedAt;

    @PrePersist
    void prePersist() {
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
    }

    // -------------------------------------------------------------------------
    // Queries estáticas (Active Record pattern)
    // -------------------------------------------------------------------------

    /** La relación entre dos usuarios, sea quien sea el que envió la solicitud. */
    public static Optional<Friendship> findBetween(UUID a, UUID b) {
        return find("(requesterId = ?1 and addresseeId = ?2) or (requesterId = ?2 and addresseeId = ?1)", a, b)
                .firstResultOptional();
    }

    /** Las relaciones de un usuario con ese estado, tanto las que envió como las que recibió. */
    public static List<Friendship> findOf(UUID userId, FriendshipStatus status) {
        return find("status = ?1 and (requesterId = ?2 or addresseeId = ?2) order by createdAt desc", status, userId)
                .list();
    }

    /** El otro usuario de la relación, visto desde `userId`. */
    public UUID otherThan(UUID userId) {
        return requesterId.equals(userId) ? addresseeId : requesterId;
    }
}
