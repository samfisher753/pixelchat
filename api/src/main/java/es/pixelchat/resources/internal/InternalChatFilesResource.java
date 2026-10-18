package es.pixelchat.resources.internal;

import es.pixelchat.filters.InternalOnly;
import es.pixelchat.services.ChatFilesService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.Map;
import java.util.UUID;

@InternalOnly
@Path("/internal/chat-files")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class InternalChatFilesResource {

    @Inject
    ChatFilesService chatFilesService;

    /** Enlace de lectura de un archivo del chat, para que world lo reparta a la sala. */
    @GET
    @Path("/read-url")
    public Response createReadUrl(@QueryParam("userId") UUID userId, @QueryParam("objectName") String objectName) {
        return Response.ok(Map.of("url", chatFilesService.createReadUrl(userId, objectName))).build();
    }
}
