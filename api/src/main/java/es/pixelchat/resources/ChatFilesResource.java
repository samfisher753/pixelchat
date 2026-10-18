package es.pixelchat.resources;

import es.pixelchat.requests.ChatFileUploadRequest;
import es.pixelchat.services.ChatFilesService;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.util.UUID;

@Path("/chat/files")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ChatFilesResource {

    @Inject
    ChatFilesService chatFilesService;

    @Inject
    JsonWebToken jwt;

    /** Devuelve una URL para subir un archivo del chat directamente a OCI. */
    @POST
    @Authenticated
    public Response createUpload(@Valid ChatFileUploadRequest request) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return Response.ok(chatFilesService.createUpload(userId, request)).build();
    }
}
