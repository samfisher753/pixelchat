package es.pixelchat.filters;

import jakarta.inject.Singleton;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;
import org.eclipse.microprofile.config.ConfigProvider;

@Singleton
@Provider
@InternalOnly
public class InternalAuthFilter implements ContainerRequestFilter {

    @Override
    public void filter(ContainerRequestContext ctx) {
        // Leído en runtime puro: ConfigProvider nunca se evalúa en el static init
        // del binario nativo, evitando que el valor quede congelado en build-time.
        String secret = ConfigProvider.getConfig().getValue("internal.secret", String.class);
        String header = ctx.getHeaderString("X-Internal-Secret");
        if (!secret.equals(header)) {
            ctx.abortWith(Response.status(Response.Status.FORBIDDEN).build());
        }
    }
}
