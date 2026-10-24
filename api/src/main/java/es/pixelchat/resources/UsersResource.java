package es.pixelchat.resources;

import es.pixelchat.requests.ProfileImageUploadRequest;
import es.pixelchat.requests.UpdateProfileRequest;
import es.pixelchat.responses.UserLoginDto;
import es.pixelchat.services.UsersService;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
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

    /** Buscador de usuarios: GET /users/search?q=sam devuelve hasta 10 coincidencias. */
    @GET
    @Path("/search")
    @Authenticated
    public Response search(@QueryParam("q") String query) {
        return Response.ok(usersService.search(query)).build();
    }

    @PATCH
    @Path("/me")
    @Authenticated
    public Response updateProfile(@Valid UpdateProfileRequest request) {
        UUID userId = UUID.fromString(jwt.getSubject());
        UserLoginDto updated = usersService.updateProfile(userId, request);
        return Response.ok(updated).build();
    }

    /** Devuelve una URL para subir una foto de perfil o una cabecera directamente a OCI. */
    @POST
    @Path("/me/images")
    @Authenticated
    public Response createProfileImageUpload(@Valid ProfileImageUploadRequest request) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return Response.ok(usersService.createProfileImageUpload(userId, request)).build();
    }
}
