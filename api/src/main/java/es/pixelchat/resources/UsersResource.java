package es.pixelchat.resources;

import es.pixelchat.requests.UpdateProfileRequest;
import es.pixelchat.responses.UserLoginDto;
import es.pixelchat.services.UsersService;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.util.UUID;

@Path("/users")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UsersResource {

    @Inject
    UsersService usersService;

    @Inject
    JsonWebToken jwt;

    @PATCH
    @Path("/me")
    @Authenticated
    public Response updateProfile(@Valid UpdateProfileRequest request) {
        UUID userId = UUID.fromString(jwt.getSubject());
        UserLoginDto updated = usersService.updateProfile(userId, request);
        return Response.ok(updated).build();
    }
}
