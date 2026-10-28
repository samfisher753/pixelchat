package es.pixelchat.services;

import es.pixelchat.entities.Friendship;
import es.pixelchat.entities.User;
import es.pixelchat.enums.FriendshipStatus;
import es.pixelchat.enums.Relationship;
import es.pixelchat.exceptions.ApiError;
import es.pixelchat.exceptions.ApiException;
import es.pixelchat.responses.RelationshipDto;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * Solicitudes de amistad y amistades. Todo vive en la tabla friendships: una fila PENDING es una
 * solicitud y una ACCEPTED, una amistad. Los métodos devuelven cómo queda la relación, para que el
 * front actualice el botón del perfil sin volver a pedirlo.
 */
@ApplicationScoped
public class FriendsService {

    /** Cómo se relaciona `viewerId` con `otherId`. */
    public RelationshipDto relationship(UUID viewerId, UUID otherId) {
        return toDto(viewerId, Friendship.findBetween(viewerId, otherId));
    }

    /**
     * Envía una solicitud a `addresseeId`. Si esa persona ya te había enviado una a ti, en vez de crear
     * otra se acepta la suya: los dos queríais ser amigos.
     */
    @Transactional
    public RelationshipDto sendRequest(UUID requesterId, UUID addresseeId) {
        User addressee = User.findById(addresseeId);
        if (addressee == null) throw new ApiException(ApiError.USER_NOT_FOUND);
        if (addressee.id.equals(requesterId)) {
            throw new ApiException(ApiError.FRIEND_REQUEST_TO_SELF);
        }

        Optional<Friendship> existing = Friendship.findBetween(requesterId, addressee.id);
        if (existing.isPresent()) {
            Friendship friendship = existing.get();
            boolean theyAskedMe = friendship.status == FriendshipStatus.PENDING && friendship.requesterId.equals(addressee.id);
            if (!theyAskedMe) throw new ApiException(ApiError.FRIENDSHIP_ALREADY_EXISTS);
            accept(friendship);
            return toDto(requesterId, existing);
        }

        Friendship friendship = new Friendship();
        friendship.requesterId = requesterId;
        friendship.addresseeId = addressee.id;
        friendship.status = FriendshipStatus.PENDING;
        friendship.persist();
        return toDto(requesterId, Optional.of(friendship));
    }

    /** Acepta una solicitud recibida. Solo puede hacerlo quien la recibió. */
    @Transactional
    public RelationshipDto acceptRequest(UUID userId, UUID requestId) {
        Friendship friendship = findPendingRequest(requestId);
        if (!friendship.addresseeId.equals(userId)) throw new ApiException(ApiError.FRIEND_REQUEST_NOT_FOUND);
        accept(friendship);
        return toDto(userId, Optional.of(friendship));
    }

    /** Rechaza una solicitud recibida o cancela una enviada. */
    @Transactional
    public RelationshipDto deleteRequest(UUID userId, UUID requestId) {
        Friendship friendship = findPendingRequest(requestId);
        if (!friendship.addresseeId.equals(userId) && !friendship.requesterId.equals(userId)) {
            throw new ApiException(ApiError.FRIEND_REQUEST_NOT_FOUND);
        }
        friendship.delete();
        return toDto(userId, Optional.empty());
    }

    /** Deja de ser amigo de `friendId`. */
    @Transactional
    public RelationshipDto removeFriend(UUID userId, UUID friendId) {
        Friendship friendship = Friendship.findBetween(userId, friendId)
                .filter(f -> f.status == FriendshipStatus.ACCEPTED)
                .orElseThrow(() -> new ApiException(ApiError.FRIENDSHIP_NOT_FOUND));
        friendship.delete();
        return toDto(userId, Optional.empty());
    }

    // -------------------------------------------------------------------------

    // Las solicitudes ajenas responden igual que las que no existen: no se revela que existen
    private Friendship findPendingRequest(UUID requestId) {
        Friendship friendship = Friendship.findById(requestId);
        if (friendship == null || friendship.status != FriendshipStatus.PENDING) {
            throw new ApiException(ApiError.FRIEND_REQUEST_NOT_FOUND);
        }
        return friendship;
    }

    private void accept(Friendship friendship) {
        friendship.status = FriendshipStatus.ACCEPTED;
        friendship.acceptedAt = Instant.now();
    }

    private RelationshipDto toDto(UUID viewerId, Optional<Friendship> friendship) {
        if (friendship.isEmpty()) return RelationshipDto.builder().status(Relationship.NONE).build();
        Friendship f = friendship.get();
        if (f.status == FriendshipStatus.ACCEPTED) return RelationshipDto.builder().status(Relationship.FRIENDS).build();
        Relationship status = f.requesterId.equals(viewerId) ? Relationship.REQUEST_SENT : Relationship.REQUEST_RECEIVED;
        return RelationshipDto.builder().status(status).requestId(f.id).build();
    }
}
