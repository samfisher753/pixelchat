package es.pixelchat.services;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.Signature;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.*;

class ObjectStorageServiceTest {

    private static String toPem(byte[] pkcs8) {
        String base64 = Base64.getMimeEncoder(64, "\n".getBytes()).encodeToString(pkcs8);
        return "-----BEGIN PRIVATE KEY-----\n" + base64 + "\n-----END PRIVATE KEY-----\nOCI_API_KEY\n";
    }

    @Test
    void readsDefaultProfileOfOciConfig() {
        Map<String, String> p = ObjectStorageService.parseDefaultProfile(List.of(
                "# comentario",
                "[DEFAULT]",
                "user=ocid1.user.oc1..aaa",
                "fingerprint = 12:34:56",
                "tenancy=ocid1.tenancy.oc1..bbb",
                "region=eu-madrid-1",
                "key_file=oci-key.pem",
                "[OTRO]",
                "user=no-debe-leerse"));
        assertEquals("ocid1.user.oc1..aaa", p.get("user"));
        assertEquals("12:34:56", p.get("fingerprint"));
        assertEquals("eu-madrid-1", p.get("region"));
        assertEquals("oci-key.pem", p.get("key_file"));
    }

    @Test
    void loadsCredentialsWithKeyPathRelativeToConfig(@TempDir Path dir) throws Exception {
        KeyPair pair = KeyPairGenerator.getInstance("RSA").generateKeyPair();
        Files.writeString(dir.resolve("oci-key.pem"), toPem(pair.getPrivate().getEncoded()));
        Path config = dir.resolve("oci-config");
        Files.writeString(config, "[DEFAULT]\nuser=U\nfingerprint=F\ntenancy=T\nregion=eu-madrid-1\nkey_file=oci-key.pem\n");

        ObjectStorageService.Credentials c = ObjectStorageService.loadCredentials(config.toString());
        assertEquals("T/U/F", c.keyId());
        assertEquals("objectstorage.eu-madrid-1.oraclecloud.com", c.host());
    }

    @Test
    void loadsCredentialsFromTheClasspathLikeJwtKeys(@TempDir Path dir) throws Exception {
        // Simula src/main/resources: los ficheros no están en el disco relativo, sino en el classpath
        KeyPair pair = KeyPairGenerator.getInstance("RSA").generateKeyPair();
        Files.writeString(dir.resolve("oci-key.pem"), toPem(pair.getPrivate().getEncoded()));
        Files.writeString(dir.resolve("oci-config"), String.join("\n",
                "[DEFAULT]", "user=U", "fingerprint=F", "tenancy=T", "region=eu-madrid-1", "key_file=oci-key.pem"));

        ClassLoader previous = Thread.currentThread().getContextClassLoader();
        try (var loader = new java.net.URLClassLoader(new java.net.URL[]{dir.toUri().toURL()}, null)) {
            Thread.currentThread().setContextClassLoader(loader);
            ObjectStorageService.Credentials c = ObjectStorageService.loadCredentials("oci-config");
            assertEquals("T/U/F", c.keyId());
        } finally {
            Thread.currentThread().setContextClassLoader(previous);
        }
    }

    @Test
    void signsHeadersInOrderAndSignatureVerifies() throws Exception {
        KeyPair pair = KeyPairGenerator.getInstance("RSA").generateKeyPair();
        var key = ObjectStorageService.parsePrivateKey(toPem(pair.getPrivate().getEncoded()));
        var c = new ObjectStorageService.Credentials("T/U/F", "eu-madrid-1", key);

        Map<String, String> headers = new LinkedHashMap<>();
        headers.put("(request-target)", "post /n/ns/b/bucket/p/");
        headers.put("host", c.host());
        headers.put("x-date", "Sun, 18 Oct 2026 12:00:00 GMT");
        headers.put("x-content-sha256", "abc=");
        headers.put("content-type", "application/json");
        headers.put("content-length", "42");

        String auth = ObjectStorageService.authorization(c, headers);
        assertTrue(auth.startsWith("Signature version=\"1\",keyId=\"T/U/F\",algorithm=\"rsa-sha256\","));
        assertTrue(auth.contains("headers=\"(request-target) host x-date x-content-sha256 content-type content-length\""));

        Matcher m = Pattern.compile("signature=\"([^\"]+)\"").matcher(auth);
        assertTrue(m.find());
        String signingString = String.join("\n",
                "(request-target): post /n/ns/b/bucket/p/",
                "host: objectstorage.eu-madrid-1.oraclecloud.com",
                "x-date: Sun, 18 Oct 2026 12:00:00 GMT",
                "x-content-sha256: abc=",
                "content-type: application/json",
                "content-length: 42");
        Signature verifier = Signature.getInstance("SHA256withRSA");
        verifier.initVerify(pair.getPublic());
        verifier.update(signingString.getBytes(StandardCharsets.UTF_8));
        assertTrue(verifier.verify(Base64.getDecoder().decode(m.group(1))));
    }

    @Test
    void rejectsPkcs1KeysWithAHelpfulMessage() {
        Exception e = assertThrows(IllegalArgumentException.class,
                () -> ObjectStorageService.parsePrivateKey("-----BEGIN RSA PRIVATE KEY-----\nAAAA\n-----END RSA PRIVATE KEY-----"));
        assertTrue(e.getMessage().contains("openssl pkcs8"));
    }
}
