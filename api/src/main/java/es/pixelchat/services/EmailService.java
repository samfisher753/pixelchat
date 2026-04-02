package es.pixelchat.services;

import io.quarkus.mailer.Mail;
import io.quarkus.mailer.Mailer;
import io.quarkus.qute.Location;
import io.quarkus.qute.Template;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.io.InputStream;

@ApplicationScoped
public class EmailService {

    private static final Logger LOG = Logger.getLogger(EmailService.class);
    private static final String LOGO_CID = "logo@pixelchat";
    private static final String LOGO_PATH = "/email-assets/logo.png";

    @Inject
    Mailer mailer;

    @ConfigProperty(name = "app.url")
    String appUrl;

    @Inject
    @Location("emails/verify-email/verify-email.html")
    Template verifyEmailTemplate;

    @Inject
    @Location("emails/reset-password/reset-password.html")
    Template resetPasswordTemplate;

    private byte[] logoBytes;

    @PostConstruct
    void loadLogo() {
        try (InputStream is = getClass().getResourceAsStream(LOGO_PATH)) {
            if (is != null) {
                logoBytes = is.readAllBytes();
            } else {
                LOG.warnf("Logo no encontrado en %s — los emails se enviarán sin imagen.", LOGO_PATH);
            }
        } catch (Exception e) {
            LOG.warn("No se pudo cargar el logo para los emails.", e);
        }
    }

    public void sendVerificationEmail(String toEmail, String verificationLink) {
        String body = verifyEmailTemplate
                .data("verificationLink", verificationLink)
                .data("appUrl", appUrl)
                .render();

        Mail mail = Mail.withHtml(toEmail, "Verifica tu cuenta en PixelChat", body);
        attachLogo(mail);
        mailer.send(mail);
    }

    public void sendPasswordResetEmail(String toEmail, String resetCode) {
        String body = resetPasswordTemplate
                .data("resetCode", resetCode)
                .data("appUrl", appUrl)
                .render();

        Mail mail = Mail.withHtml(toEmail, "Restablece tu contraseña en PixelChat", body);
        attachLogo(mail);
        mailer.send(mail);
    }

    private void attachLogo(Mail mail) {
        if (logoBytes != null) {
            mail.addInlineAttachment("logo.png", logoBytes, "image/png", "<" + LOGO_CID + ">");
        }
    }
}
