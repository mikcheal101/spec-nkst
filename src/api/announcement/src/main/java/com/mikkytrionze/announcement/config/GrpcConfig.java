package com.mikkytrionze.announcement.config;

import com.mikkytrionze.proto.church.ChurchServiceGrpc;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GrpcConfig {

    @Value("${grpc.church.server.host:localhost}")
    private String churchServiceHost;

    @Value("${grpc.church.server.port:7075}")
    private int churchServicePort;

    @Bean
    public ManagedChannel churchServiceChannel() {
        return ManagedChannelBuilder.forAddress(churchServiceHost, churchServicePort)
                .usePlaintext()
                .build();
    }

    @Bean
    public ChurchServiceGrpc.ChurchServiceBlockingStub churchServiceBlockingStub(ManagedChannel managedChannel) {
        return ChurchServiceGrpc.newBlockingStub(managedChannel);
    }
}
