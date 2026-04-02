package es.pixelchat.services;

import es.pixelchat.entities.RefreshToken;
import es.pixelchat.entities.User;
import es.pixelchat.entities.UserToken;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@ApplicationScoped
public class DemoCleanupService {

    private static final Logger LOG = Logger.getLogger(DemoCleanupService.class);

    @Scheduled(every = "24h")
    @Transactional
    void cleanupExpiredDemoUsers() {
        Instant cutoff = Instant.now().minus(24, ChronoUnit.HOURS);
        long deleted = User.deleteExpiredDemoUsers(cutoff);
        if (deleted > 0) {
            LOG.infof("Limpieza de usuarios demo: %d usuarios eliminados (creados antes de %s)", deleted, cutoff);
        }
    }
}
