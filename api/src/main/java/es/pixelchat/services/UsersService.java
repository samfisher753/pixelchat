package es.pixelchat.services;

import es.pixelchat.entities.User;
import es.pixelchat.exceptions.ApiError;
import es.pixelchat.exceptions.ApiException;
import es.pixelchat.mappers.UserMapper;
import es.pixelchat.requests.UpdateProfileRequest;
import es.pixelchat.responses.UserLoginDto;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.util.UUID;

@ApplicationScoped
public class UsersService {

    @Inject
    UserMapper userMapper;

    public UserLoginDto findById(UUID id) {
        User user = User.findById(id);
        if (user == null) {
            throw new ApiException(ApiError.USER_NOT_FOUND);
        }

        return userMapper.toLoginDto(user);
    }

    @Transactional
    public UserLoginDto updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = User.findById(userId);
        if (user == null) {
            throw new ApiException(ApiError.USER_NOT_FOUND);
        }

        if (request.username != null) {
            if (!request.username.equalsIgnoreCase(user.username) && User.existsByUsername(request.username)) {
                throw new ApiException(ApiError.USERNAME_IN_USE);
            }
            user.username = request.username;
        }

        // Campos opcionales: null → no actualizar, string vacío → borrar el valor
        if (request.displayName != null) {
            user.displayName = request.displayName.isBlank() ? null : request.displayName;
        }
        if (request.motto != null) {
            user.motto = request.motto.isBlank() ? null : request.motto;
        }
        if (request.location != null) {
            user.location = request.location.isBlank() ? null : request.location;
        }
        if (request.website != null) {
            user.website = request.website.isBlank() ? null : request.website;
        }
        if (request.look != null) {
            user.look = request.look.isBlank() ? null : request.look;
        }

        return userMapper.toLoginDto(user);
    }
}
