package com.vocabkicker.serverless.functions;

import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vocabkicker.serverless.model.LoginResponse;
import com.vocabkicker.serverless.model.RefreshRequest;
import com.vocabkicker.serverless.model.User;
import com.vocabkicker.serverless.utils.CorsHelper;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component("adminRefresh")
public class AdminRefreshFunction implements Function<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final DynamoDbTable<User> userTable;
    private final BCryptPasswordEncoder passwordEncoder;
    private final String jwtSecret;

    public AdminRefreshFunction(final DynamoDbEnhancedClient enhancedClient) {
        this.userTable = enhancedClient.table("Users", TableSchema.fromBean(User.class));
        this.passwordEncoder = new BCryptPasswordEncoder();

        final String secret = System.getenv("JWT_SECRET");
        if (secret == null || secret.isEmpty()) {
            throw new IllegalStateException("JWT_SECRET environment variable is missing");
        }
        this.jwtSecret = secret;
    }

    @Override
    public APIGatewayProxyResponseEvent apply(final APIGatewayProxyRequestEvent request) {
        try {
            final RefreshRequest req = MAPPER.readValue(request.getBody(), RefreshRequest.class);

            if (req.getRefreshToken() == null || req.getRefreshToken().isEmpty()) {
                return CorsHelper.error(400, "Missing refresh token");
            }

            final SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
            Claims claims;
            try {
                claims = Jwts.parser().verifyWith(key).build()
                        .parseSignedClaims(req.getRefreshToken()).getPayload();
            } catch (Exception e) {
                return CorsHelper.error(401, "Invalid refresh token signature");
            }

            if (!"refresh".equals(claims.get("type", String.class))) {
                return CorsHelper.error(401, "Invalid token type");
            }

            final String userId = claims.getSubject();
            final User user = userTable.getItem(Key.builder().partitionValue(userId).build());

            if (user == null || user.getRefreshTokenHash() == null) {
                return CorsHelper.error(401, "Session revoked or not found");
            }

            if (System.currentTimeMillis() > user.getRefreshTokenExpiry()) {
                return CorsHelper.error(401, "Refresh token expired");
            }

            if (!passwordEncoder.matches(req.getRefreshToken(), user.getRefreshTokenHash())) {
                // Token reuse detected — revoke all sessions
                user.setRefreshTokenHash(null);
                user.setRefreshTokenExpiry(null);
                userTable.putItem(user);
                return CorsHelper.error(401, "Compromised token detected. All sessions revoked.");
            }

            // --- Token Rotation ---
            final long accessExpiration = 1000L * 60 * 15;
            final String newAccessToken = Jwts.builder()
                    .subject(user.getId())
                    .claim("email", user.getEmail())
                    .claim("type", "access")
                    .issuedAt(new Date())
                    .expiration(new Date(System.currentTimeMillis() + accessExpiration))
                    .signWith(key)
                    .compact();

            final long refreshExpiration = 1000L * 60 * 60 * 24 * 7;
            final String newRefreshToken = Jwts.builder()
                    .subject(user.getId())
                    .claim("type", "refresh")
                    .issuedAt(new Date())
                    .expiration(new Date(System.currentTimeMillis() + refreshExpiration))
                    .signWith(key)
                    .compact();

            user.setRefreshTokenHash(passwordEncoder.encode(newRefreshToken));
            user.setRefreshTokenExpiry(System.currentTimeMillis() + refreshExpiration);
            userTable.putItem(user);

            final String accessCookie = String.format(
                    "admin_token=%s; Path=/; HttpOnly; Max-Age=%d; SameSite=None; Secure",
                    newAccessToken, 15 * 60);

            final Map<String, String> extraHeaders = new HashMap<>();
            extraHeaders.put("Set-Cookie", accessCookie);

            final Map<String, String> body = new HashMap<>();
            body.put("message", "Refresh successful");
            body.put("refreshToken", newRefreshToken);

            return CorsHelper.okWithHeaders(body, extraHeaders);
        } catch (Exception e) {
            return CorsHelper.error(500, e.getMessage());
        }
    }
}
