package com.mikkytrionze.nkst.shared.config;

import com.mikkytrionze.nkst.church.application.service.GrpcChurchService;
import io.grpc.Server;
import io.grpc.ServerBuilder;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class GrpcConfig {

    private final GrpcChurchService grpcChurchService;

    @Value("${grpc.server.port:7075}")
    private int grpcPort;

    private Server server;

    @PostConstruct
    public void startServer() throws IOException {
        server = ServerBuilder.forPort(grpcPort)
                .addService(grpcChurchService)
                .build()
                .start();

        log.info("===> gRPC Server started successfully, listening on port {}", grpcPort);

        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            log.info("*** Shutting down gRPC server since JVM is shutting down");
            GrpcConfig.this.stopServer();
            log.info("*** gRPC server shut down successfully");
        }));
    }

    @PreDestroy
    public void stopServer() {
        if (server != null) {
            server.shutdown();
        }
    }
}
