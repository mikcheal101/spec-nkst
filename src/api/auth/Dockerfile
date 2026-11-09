# syntax=docker/dockerfile:1

# ---------- Build ----------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build

# Shared JWT starter must be installed before the service can build
COPY modules/jwt/mikkytrionze-jwt-security-starter ./modules/jwt/mikkytrionze-jwt-security-starter
RUN --mount=type=cache,target=/root/.m2 \
    mvn -q -f modules/jwt/mikkytrionze-jwt-security-starter/pom.xml install -Dmaven.test.skip=true -Djacoco.skip=true

COPY auth ./auth
RUN --mount=type=cache,target=/root/.m2 \
    mvn -q -f auth/pom.xml clean package -Dmaven.test.skip=true -Djacoco.skip=true

# ---------- Runtime ----------
FROM eclipse-temurin:21-jre AS runtime
WORKDIR /app

RUN groupadd -r app && useradd -r -g app app

COPY --from=build /build/auth/target/*.jar app.jar
RUN chown -R app:app /app
USER app

EXPOSE 81

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
