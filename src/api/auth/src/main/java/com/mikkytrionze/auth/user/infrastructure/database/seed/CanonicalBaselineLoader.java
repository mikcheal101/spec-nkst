package com.mikkytrionze.auth.user.infrastructure.database.seed;

import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

@Component
@RequiredArgsConstructor
public class CanonicalBaselineLoader {
    private final ObjectMapper objectMapper;

    public CanonicalBaseline load() {
        try (InputStream is = new ClassPathResource("seed/canonical-baseline.json").getInputStream()) {
            byte[] bytes = is.readAllBytes();
            CanonicalBaseline baseline = objectMapper.readValue(bytes, CanonicalBaseline.class);
            validate(baseline, bytes);
            return baseline;
        } catch (Exception e) {
            throw new IllegalStateException("Failed to load canonical seed baseline", e);
        }
    }

    private void validate(CanonicalBaseline b, byte[] bytes) throws Exception {
        if (b.version() == null || b.version().isBlank()) throw new IllegalStateException("Seed baseline version missing");
        if (b.permissions() == null || b.roles() == null || b.users() == null) throw new IllegalStateException("Seed baseline missing required sections");
        for (CanonicalBaseline.PermissionSeed p : b.permissions()) {
            if (p.key() == null || !p.key().matches("[A-Z_]+:[A-Z_]+")) throw new IllegalStateException("Invalid canonical permission key: " + p.key());
            if (p.resource() == null || p.action() == null) throw new IllegalStateException("Permission resource/action required: " + p.key());
        }
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        String checksum = HexFormat.of().formatHex(md.digest(bytes));
        // checksum file is external artifact; loader validates structure and canonical format.
    }
}
