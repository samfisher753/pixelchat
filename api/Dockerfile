# Imagen nativa Quarkus (multi-stage). Basado en src/main/docker/Dockerfile.native-micro
# y en la guía oficial: compila dentro de Mandrel para no necesitar GraalVM en el host.
#
# Desde la raíz de api/:
#   docker build -t pixelchat-api:native .
#
# Memoria del paso native-image (ajusta si OOM en CI):
#   docker build --build-arg NATIVE_XMX=8g -t pixelchat-api:native .

# ---------------------------------------------------------------------------
# Stage 1: ejecutable nativo (Mandrel + JDK 21, alineado con Quarkus 3.34)
# ---------------------------------------------------------------------------
FROM quay.io/quarkus/ubi9-quarkus-mandrel-builder-image:jdk-21 AS build

ARG NATIVE_XMX=6g

USER quarkus
WORKDIR /build

COPY --chown=quarkus:quarkus gradlew .
COPY --chown=quarkus:quarkus gradle gradle
COPY --chown=quarkus:quarkus build.gradle settings.gradle gradle.properties ./
COPY --chown=quarkus:quarkus src src

# Solo ejecutable nativo (sustituye a quarkus.package.type=native, deprecado).
# -x test: en el contenedor no hay MariaDB; los tests siguen corriendo en local/CI.
RUN chmod +x gradlew \
    && ./gradlew build -x test \
        -Dquarkus.native.enabled=true \
        -Dquarkus.package.jar.enabled=false \
        -Dquarkus.native.native-image-xmx=${NATIVE_XMX} \
        --no-daemon

# ---------------------------------------------------------------------------
# Stage 2: runtime mínimo (misma línea que Dockerfile.native-micro)
# ---------------------------------------------------------------------------
FROM quay.io/quarkus/ubi9-quarkus-micro-image:2.0

WORKDIR /work/
RUN chown 1001 /work \
    && chmod "g+rwX" /work \
    && chown 1001:root /work

COPY --from=build --chown=1001:root --chmod=0755 /build/build/api-*-runner /work/application

EXPOSE 8080
USER 1001

ENTRYPOINT ["./application", "-Dquarkus.http.host=0.0.0.0"]
