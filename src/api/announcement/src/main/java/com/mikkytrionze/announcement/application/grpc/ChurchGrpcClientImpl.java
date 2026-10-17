package com.mikkytrionze.announcement.application.grpc;

import com.mikkytrionze.announcement.domain.grpc.ChurchGrpcClient;
import com.mikkytrionze.proto.church.ChurchServiceGrpc;
import com.mikkytrionze.proto.church.GetChurchRequest;
import com.mikkytrionze.proto.church.GetChurchResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChurchGrpcClientImpl implements ChurchGrpcClient {

    private final ChurchServiceGrpc.ChurchServiceBlockingStub churchServiceBlockingStub;

    @Override
    public GetChurchResponse getChurchByToken(String token) {
        log.info("Calling gRPC ChurchService for token verification");

        var request = GetChurchRequest.newBuilder()
                .setToken(token)
                .build();

        return churchServiceBlockingStub.getChurchByToken(request);
    }
}
