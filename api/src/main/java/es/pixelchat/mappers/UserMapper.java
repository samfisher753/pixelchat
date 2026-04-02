package es.pixelchat.mappers;

import es.pixelchat.entities.User;
import es.pixelchat.requests.RegisterRequest;
import es.pixelchat.responses.UserLoginDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "jakarta")
public interface UserMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "displayName", ignore = true)
    @Mapping(target = "motto", ignore = true)
    @Mapping(target = "avatarUrl", ignore = true)
    @Mapping(target = "headerUrl", ignore = true)
    @Mapping(target = "website", ignore = true)
    @Mapping(target = "location", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "emailVerified", ignore = true)
    @Mapping(target = "isDemo", ignore = true)
    User toEntity(RegisterRequest request);

    @Mapping(target = "demo", source = "isDemo")
    @Mapping(target = "location", source = "location")
    @Mapping(target = "website", source = "website")
    @Mapping(target = "createdAt", source = "createdAt")
    UserLoginDto toLoginDto(User user);
}
