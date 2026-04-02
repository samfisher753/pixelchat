package es.pixelchat.filters;

import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;
import org.eclipse.microprofile.config.inject.ConfigProperty;

@Provider
@InternalOnly
public class InternalAuthFilter implements ContainerRequestFilter {

    @ConfigProperty(name = "internal.secret")
    String secret;

    @Override
    public void filter(ContainerRequestContext ctx) {
        String header = ctx.getHeaderString("X-Internal-Secret");
        if (!secret.equals(header)) {
            ctx.abortWith(Response.status(Response.Status.FORBIDDEN).build());
        }
    }
}
