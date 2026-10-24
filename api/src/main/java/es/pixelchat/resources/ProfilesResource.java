package es.pixelchat.resources;

import es.pixelchat.services.UsersService;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

/**
 * Perfiles públicos: GET /profiles/SamFisher92.
 * Va aparte de /users porque allí hay rutas fijas (/users/me, /users/search): un usuario que se
 * llamara "me" o "search" chocaría con ellas. Aquí cualquier nombre de usuario es válido.
 */
@Path("/profiles")
@Produces(MediaType.APPLICATION_JSON)
public class ProfilesResource {

    @Inject
    UsersService usersService;

    @GET
    @Path("/{username}")
    @Authenticated
    public Response publicProfile(@PathParam("username") String username) {
        return Response.ok(usersService.findPublicProfile(username)).build();
    }
}
