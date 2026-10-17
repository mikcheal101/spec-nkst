package com.mikkytrionze.announcement.domain.grpc;

import com.mikkytrionze.proto.church.GetChurchResponse;

/**
 * Client interface for interacting with the remote Church gRPC service.
 */
public interface ChurchGrpcClient {

    /**
     * Retrieves church details by validating and resolving the provided authentication token.
     *
     * @param token the authentication token used to identify the church
     * @return the {@link GetChurchResponse} containing church information
     */
    GetChurchResponse getChurchByToken(String token);
}
