# syntax=docker/dockerfile:1

# ---------- Build ----------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build

# Shared modules must be installed before the service can build
COPY modules/jwt/mikkytrionze-jwt-security-starter ./modules/jwt/mikkytrionze-jwt-security-starter
COPY modules/grpc-proto/mikkytrionze-grpc-proto ./modules/grpc-proto/mikkytrionze-grpc-proto
RUN --mount=type=cache,target=/root/.m2 \
    mvn -q -f modules/jwt/mikkytrionze-jwt-security-starter/pom.xml install -Dmaven.test.skip=true -Djacoco.skip=true && \
    mvn -q -f modules/grpc-proto/mikkytrionze-grpc-proto/pom.xml install -Dmaven.test.skip=true -Djacoco.skip=true

COPY announcement ./announcement
RUN --mount=type=cache,target=/root/.m2 \
    mvn -q -f announcement/pom.xml clean package -Dmaven.test.skip=true -Djacoco.skip=true

# ---------- Runtime ----------
FROM eclipse-temurin:21-jre AS runtime
WORKDIR /app

RUN groupadd -r app && useradd -r -g app app

COPY --from=build /build/announcement/target/*.jar app.jar
RUN chown -R app:app /app
USER app

EXPOSE 83

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
