package com.vocabkicker.serverless.utils;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * Utility for validating admin JWTs extracted from API Gateway request headers.
 */
public class JwtValidator {

    public static void validateAdminToken(Map<String, String> headers, String jwtSecret) {
        String adminToken = CorsHelper.extractCookie(headers, "admin_token");

        if (adminToken == null) {
            throw new RuntimeException("Unauthorized: Missing admin token");
        }

        try {
            final SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(adminToken)
                    .getPayload();
            if (!"access".equals(claims.get("type", String.class))) {
                throw new RuntimeException("Unauthorized: Invalid token type");
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Unauthorized: Invalid or expired token");
        }
    }
}
