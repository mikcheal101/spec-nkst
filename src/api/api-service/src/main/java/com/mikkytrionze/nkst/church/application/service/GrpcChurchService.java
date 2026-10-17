package com.mikkytrionze.nkst.church.application.service;

import com.mikkytrionze.infrastructure.jwt.JwtUtil;
import com.mikkytrionze.nkst.member.domain.repository.MemberRepository;
import com.mikkytrionze.proto.church.ChurchServiceGrpc;
import com.mikkytrionze.proto.church.GetChurchRequest;
import com.mikkytrionze.proto.church.GetChurchResponse;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class GrpcChurchService extends ChurchServiceGrpc.ChurchServiceImplBase {

    private final MemberRepository memberRepository;
    private final JwtUtil jwtUtil;

    @Override
    public void getChurchByToken(GetChurchRequest getChurchRequest, StreamObserver<GetChurchResponse> responseObserver) {
        try {
            String token = getChurchRequest.getToken();

            if (StringUtils.isBlank(token) || !jwtUtil.validateJwt(token)) {
                log.warn("Invalid or missing JWT token received in gRPC request");
                responseObserver.onError(Status.UNAUTHENTICATED
                        .withDescription("Invalid or expired JWT token")
                        .asRuntimeException());
                return;
            }

            var identifier = jwtUtil.getUsernameFromToken(token);

            var church = memberRepository.findChurchByIdentifier(identifier)
                    .orElseThrow(() -> new RuntimeException("Church not found for identifier: " + identifier));

            var response = GetChurchResponse.newBuilder()
                    .setChurchId(church.getId())
                    .setChurchName(church.getName())
                    .build();

            responseObserver.onNext(response);
            responseObserver.onCompleted();

        } catch (Exception e) {
            log.error("Error processing getChurchByToken gRPC call", e);
            responseObserver.onError(Status.INTERNAL
                    .withDescription("An error occurred! " + e.getMessage())
                    .asRuntimeException());
        }
    }
}
