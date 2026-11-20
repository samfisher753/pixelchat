package es.pixelchat.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import es.pixelchat.events.FriendshipChanged;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.enterprise.event.TransactionPhase;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Le cuenta a world los cambios de amistad para que avise a los dos usuarios en tiempo real.
 * Solo cuando la transacción se ha guardado, y sin esperar la respuesta: si world no está, se apunta
 * en el log y ya está. La amistad queda guardada y world la cargará cuando se vuelvan a conectar.
 */
@ApplicationScoped
public class WorldNotifier {

    private static final Logger LOG = Logger.getLogger(WorldNotifier.class);
    private static final Duration TIMEOUT = Duration.ofSeconds(5);

    @Inject
    ObjectMapper objectMapper;

    @ConfigProperty(name = "world.url")
    String worldUrl;

    @ConfigProperty(name = "internal.secret")
    String internalSecret;

    // HTTP/1.1 a la fuerza: por defecto HttpClient pide pasar a HTTP/2 (Upgrade: h2c), y en world esa
    // petición se la queda socket.io, que gestiona los upgrades, y la cierra sin responder
    private final HttpClient http = HttpClient.newBuilder()
            .version(HttpClient.Version.HTTP_1_1)
            .connectTimeout(TIMEOUT)
            .build();

    void onFriendshipChanged(@Observes(during = TransactionPhase.AFTER_SUCCESS) FriendshipChanged event) {
        post("/internal/friends/events", event);
    }

    private void post(String path, Object body) {
        String json;
        try {
            json = objectMapper.writeValueAsString(body);
        } catch (JsonProcessingException e) {
            LOG.errorf(e, "No se ha podido preparar el aviso a world %s", path);
            return;
        }
        HttpRequest request = HttpRequest.newBuilder(URI.create(worldUrl + path))
                .timeout(TIMEOUT)
                .header("Content-Type", "application/json")
                .header("X-Internal-Secret", internalSecret)
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();
        http.sendAsync(request, HttpResponse.BodyHandlers.discarding())
                .whenComplete((response, error) -> {
                    if (error != null) LOG.warnf("No se ha podido avisar a world (%s): %s", path, error.getMessage());
                    else if (response.statusCode() >= 300) LOG.warnf("World ha respondido %d a %s", response.statusCode(), path);
                });
    }
}
