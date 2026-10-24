package es.pixelchat.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import es.pixelchat.exceptions.ApiError;
import es.pixelchat.exceptions.ApiException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyFactory;
import java.security.MessageDigest;
import java.security.PrivateKey;
import java.security.Signature;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Acceso a OCI Object Storage. Es el único punto del proyecto que habla con OCI.
 *
 * No usa el SDK de Java de Oracle (da problemas con la compilación nativa de Quarkus): llama
 * directamente a la API REST y firma cada petición con la clave de API, siguiendo la
 * especificación de firma de OCI (https://docs.oracle.com/iaas/Content/API/Concepts/signingrequests.htm).
 *
 * Las credenciales se leen del fichero de configuración estándar de OCI (el mismo que usaba world):
 * [DEFAULT] user, fingerprint, tenancy, region, key_file. Se cargan la primera vez que hacen falta,
 * así la api arranca aunque no estén configuradas (solo fallan las operaciones de almacenamiento).
 */
@ApplicationScoped
public class ObjectStorageService {

    private static final Logger LOG = Logger.getLogger(ObjectStorageService.class);
    private static final DateTimeFormatter HTTP_DATE = DateTimeFormatter.RFC_1123_DATE_TIME.withZone(ZoneOffset.UTC);

    @ConfigProperty(name = "oci.config-file")
    String configFile;

    @ConfigProperty(name = "oci.namespace")
    String namespace;

    @Inject
    ObjectMapper objectMapper;

    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    private volatile Credentials credentials;

    record Credentials(String keyId, String region, PrivateKey privateKey) {
        String host() {
            return "objectstorage." + region + ".oraclecloud.com";
        }
    }

    // -------------------------------------------------------------------------
    // Operaciones
    // -------------------------------------------------------------------------

    /** Crea una PAR que permite subir (PUT) un único objeto durante el tiempo indicado. Devuelve su URL. */
    public String createWriteUrl(String bucket, String objectName, Duration validFor) {
        return createPar(bucket, objectName, "ObjectWrite", "upload-", validFor);
    }

    /** Crea una PAR que permite descargar (GET) un único objeto durante el tiempo indicado. Devuelve su URL. */
    public String createReadUrl(String bucket, String objectName, Duration validFor) {
        return createPar(bucket, objectName, "ObjectRead", "download-", validFor);
    }

    private String createPar(String bucket, String objectName, String accessType, String namePrefix, Duration validFor) {
        Credentials c = credentials();
        String path = "/n/" + namespace + "/b/" + bucket + "/p/";
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("name", namePrefix + objectName);
        body.put("objectName", objectName);
        body.put("accessType", accessType);
        body.put("timeExpires", Instant.now().plus(validFor).toString());

        Map<?, ?> response = send(c, "POST", path, toJson(body));
        Object fullPath = response.get("fullPath");
        Object accessUri = response.get("accessUri");
        if (fullPath != null) return fullPath.toString();
        if (accessUri != null) return "https://" + c.host() + accessUri;
        throw storageError("La respuesta de OCI no trae la URL de la PAR", null);
    }

    /** Borra un objeto. Si no existe, no hace nada. */
    public void deleteObject(String bucket, String objectName) {
        Credentials c = credentials();
        String path = "/n/" + namespace + "/b/" + bucket + "/o/" + encode(objectName);
        send(c, "DELETE", path, null);
    }

    /** URL pública de un objeto (solo funciona en buckets públicos). */
    public String publicUrl(String bucket, String objectName) {
        return publicUrlPrefix(bucket) + encode(objectName);
    }

    /** Principio común de las URLs públicas de un bucket. */
    public String publicUrlPrefix(String bucket) {
        return "https://" + credentials().host() + "/n/" + namespace + "/b/" + bucket + "/o/";
    }

    // -------------------------------------------------------------------------
    // Peticiones firmadas
    // -------------------------------------------------------------------------

    private Map<?, ?> send(Credentials c, String method, String path, String body) {
        String date = HTTP_DATE.format(Instant.now());
        Map<String, String> signed = new LinkedHashMap<>();
        signed.put("(request-target)", method.toLowerCase() + " " + path);
        signed.put("host", c.host());
        signed.put("x-date", date);

        HttpRequest.Builder request = HttpRequest.newBuilder(URI.create("https://" + c.host() + path))
                .timeout(Duration.ofSeconds(20))
                .header("x-date", date);

        if (body != null) {
            byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
            String sha = Base64.getEncoder().encodeToString(sha256(bytes));
            signed.put("x-content-sha256", sha);
            signed.put("content-type", "application/json");
            signed.put("content-length", String.valueOf(bytes.length));
            request.header("x-content-sha256", sha)
                    .header("content-type", "application/json")
                    .method(method, HttpRequest.BodyPublishers.ofByteArray(bytes));
        } else {
            request.method(method, HttpRequest.BodyPublishers.noBody());
        }
        request.header("authorization", authorization(c, signed));

        HttpResponse<String> response;
        try {
            response = http.send(request.build(), HttpResponse.BodyHandlers.ofString());
        } catch (Exception e) {
            throw storageError("No se pudo conectar con OCI", e);
        }

        int status = response.statusCode();
        if (method.equals("DELETE") && status == 404) return Map.of();
        if (status < 200 || status >= 300) {
            throw storageError("OCI respondió " + status + ": " + response.body(), null);
        }
        if (response.body() == null || response.body().isBlank()) return Map.of();
        try {
            return objectMapper.readValue(response.body(), Map.class);
        } catch (Exception e) {
            throw storageError("Respuesta de OCI no válida", e);
        }
    }

    /** Cabecera Authorization: firma RSA-SHA256 de las cabeceras indicadas, en ese orden. */
    static String authorization(Credentials c, Map<String, String> signedHeaders) {
        StringBuilder signingString = new StringBuilder();
        for (Map.Entry<String, String> h : signedHeaders.entrySet()) {
            if (!signingString.isEmpty()) signingString.append('\n');
            signingString.append(h.getKey()).append(": ").append(h.getValue());
        }
        try {
            Signature rsa = Signature.getInstance("SHA256withRSA");
            rsa.initSign(c.privateKey());
            rsa.update(signingString.toString().getBytes(StandardCharsets.UTF_8));
            String signature = Base64.getEncoder().encodeToString(rsa.sign());
            return "Signature version=\"1\",keyId=\"" + c.keyId() + "\",algorithm=\"rsa-sha256\","
                    + "headers=\"" + String.join(" ", signedHeaders.keySet()) + "\",signature=\"" + signature + "\"";
        } catch (Exception e) {
            throw storageError("No se pudo firmar la petición a OCI", e);
        }
    }

    // -------------------------------------------------------------------------
    // Credenciales
    // -------------------------------------------------------------------------

    private Credentials credentials() {
        Credentials c = credentials;
        if (c == null) {
            synchronized (this) {
                if (credentials == null) credentials = loadCredentials(configFile);
                c = credentials;
            }
        }
        return c;
    }

    /**
     * Igual que las claves de JWT (mp.jwt.verify.publickey.location): la ruta se busca primero en
     * disco y, si no existe, entre los recursos de la aplicación (src/main/resources). En producción
     * conviene montar los ficheros en disco: en la imagen nativa no se incluyen los recursos que no
     * estén en quarkus.native.resources.includes, y así las credenciales no quedan dentro del binario.
     */
    static Credentials loadCredentials(String location) {
        Source config = Source.of(location);
        Map<String, String> profile;
        try {
            profile = parseDefaultProfile(config.readText().lines().toList());
        } catch (Exception e) {
            throw storageError("No se pudo leer la configuración de OCI en " + config.describe()
                    + " (ni en disco ni en los recursos)", e);
        }
        for (String key : List.of("user", "fingerprint", "tenancy", "region", "key_file")) {
            if (profile.get(key) == null || profile.get(key).isBlank()) {
                throw storageError("Falta '" + key + "' en la configuración de OCI " + config.describe(), null);
            }
        }
        // La ruta de la clave puede ser relativa al propio fichero de configuración
        Source keyFile = config.resolve(profile.get("key_file").replaceFirst("^~", System.getProperty("user.home")));
        try {
            PrivateKey key = parsePrivateKey(keyFile.readText());
            String keyId = profile.get("tenancy") + "/" + profile.get("user") + "/" + profile.get("fingerprint");
            return new Credentials(keyId, profile.get("region"), key);
        } catch (Exception e) {
            throw storageError("No se pudo leer la clave de OCI en " + keyFile.describe(), e);
        }
    }

    /** Un fichero que puede estar en disco o entre los recursos de la aplicación. */
    record Source(Path path, String resource) {

        static Source of(String location) {
            Path p = Path.of(location);
            if (Files.exists(p)) return new Source(p, null);
            return new Source(null, location.replaceFirst("^/", ""));
        }

        String readText() throws Exception {
            if (path != null) return Files.readString(path, StandardCharsets.UTF_8);
            ClassLoader loader = Thread.currentThread().getContextClassLoader();
            try (var in = loader.getResourceAsStream(resource)) {
                if (in == null) throw new java.io.FileNotFoundException(resource);
                return new String(in.readAllBytes(), StandardCharsets.UTF_8);
            }
        }

        /** Otro fichero relativo a este (en disco o en los recursos, según dónde esté este). */
        Source resolve(String other) {
            if (Path.of(other).isAbsolute()) return Source.of(other);
            if (path != null) {
                Path parent = path.toAbsolutePath().getParent();
                return Source.of((parent != null ? parent.resolve(other) : Path.of(other)).toString());
            }
            int slash = resource.lastIndexOf('/');
            return new Source(null, slash >= 0 ? resource.substring(0, slash + 1) + other : other);
        }

        String describe() {
            return path != null ? path.toAbsolutePath().toString() : "recursos:" + resource;
        }
    }

    /** Lee la sección [DEFAULT] de un fichero de configuración de OCI. */
    static Map<String, String> parseDefaultProfile(List<String> lines) {
        Map<String, String> values = new HashMap<>();
        boolean inDefault = false;
        for (String raw : lines) {
            String line = raw.trim();
            if (line.isEmpty() || line.startsWith("#") || line.startsWith(";")) continue;
            if (line.startsWith("[")) {
                inDefault = line.equalsIgnoreCase("[DEFAULT]");
                continue;
            }
            int eq = line.indexOf('=');
            if (inDefault && eq > 0) {
                values.put(line.substring(0, eq).trim(), line.substring(eq + 1).trim());
            }
        }
        return values;
    }

    /** Clave privada en formato PEM PKCS#8 ("BEGIN PRIVATE KEY"), que es el que genera la consola de OCI. */
    static PrivateKey parsePrivateKey(String pem) throws Exception {
        if (pem.contains("BEGIN RSA PRIVATE KEY")) {
            throw new IllegalArgumentException("La clave está en formato PKCS#1; conviértela a PKCS#8 con: "
                    + "openssl pkcs8 -topk8 -nocrypt -in oci-key.pem -out oci-key-pkcs8.pem");
        }
        int start = pem.indexOf("-----BEGIN PRIVATE KEY-----");
        int end = pem.indexOf("-----END PRIVATE KEY-----");
        if (start < 0 || end < 0) throw new IllegalArgumentException("No es una clave PEM PKCS#8");
        String base64 = pem.substring(start + "-----BEGIN PRIVATE KEY-----".length(), end).replaceAll("\\s", "");
        return KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(Base64.getDecoder().decode(base64)));
    }

    // -------------------------------------------------------------------------
    // Utilidades
    // -------------------------------------------------------------------------

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            throw storageError("No se pudo preparar la petición a OCI", e);
        }
    }

    private static byte[] sha256(byte[] data) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(data);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private static String encode(String objectName) {
        return URLEncoder.encode(objectName, StandardCharsets.UTF_8).replace("+", "%20");
    }

    private static ApiException storageError(String detail, Exception cause) {
        if (cause != null) LOG.error(detail, cause);
        else LOG.error(detail);
        return new ApiException(ApiError.STORAGE_UNAVAILABLE);
    }
}
