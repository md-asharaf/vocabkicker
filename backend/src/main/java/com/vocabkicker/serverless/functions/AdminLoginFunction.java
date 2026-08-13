package com.vocabkicker.serverless.functions;

import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vocabkicker.serverless.model.LoginRequest;
import com.vocabkicker.serverless.model.User;
import com.vocabkicker.serverless.utils.CorsHelper;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;

@Component("adminLogin")
public class AdminLoginFunction implements Function<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final DynamoDbTable<User> userTable;
    private final BCryptPasswordEncoder passwordEncoder;
    private final String jwtSecret;

    public AdminLoginFunction(final DynamoDbEnhancedClient enhancedClient) {
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
            final LoginRequest req = MAPPER.readValue(request.getBody(), LoginRequest.class);

            final Optional<User> userOpt = userTable.scan().items().stream()
                    .filter(u -> u.getEmail().equalsIgnoreCase(req.getEmail()))
                    .findFirst();

            if (userOpt.isEmpty()) {
                return CorsHelper.error(401, "Invalid credentials");
            }

            final User user = userOpt.get();
            if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
                return CorsHelper.error(401, "Invalid credentials");
            }

            final SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));

            final long accessExpiration = 1000L * 60 * 15;
            final String accessToken = Jwts.builder()
                    .subject(user.getId())
                    .claim("email", user.getEmail())
                    .claim("type", "access")
                    .issuedAt(new Date())
                    .expiration(new Date(System.currentTimeMillis() + accessExpiration))
                    .signWith(key)
                    .compact();

            final long refreshExpiration = 1000L * 60 * 60 * 24 * 7;
            final String refreshToken = Jwts.builder()
                    .subject(user.getId())
                    .claim("type", "refresh")
                    .issuedAt(new Date())
                    .expiration(new Date(System.currentTimeMillis() + refreshExpiration))
                    .signWith(key)
                    .compact();

            user.setRefreshTokenHash(passwordEncoder.encode(refreshToken));
            user.setRefreshTokenExpiry(System.currentTimeMillis() + refreshExpiration);
            userTable.putItem(user);

            // API Gateway only supports a single Set-Cookie header value per key.
            // We pick the more security-critical one (access token) here and let
            // the client store the refresh token from the response body if needed.
            // For multi-cookie support, use API Gateway v2 (HTTP API) with multiValueHeaders.
            final String accessCookie = String.format(
                    "admin_token=%s; Path=/; HttpOnly; Max-Age=%d; SameSite=None; Secure",
                    accessToken, 15 * 60);
            final String refreshCookie = String.format(
                    "refresh_token=%s; Path=/; HttpOnly; Max-Age=%d; SameSite=None; Secure",
                    refreshToken, 7 * 24 * 60 * 60);

            // Return both tokens in the body too so the frontend can fall back to
            // Authorization header if cookies are blocked cross-origin.
            final Map<String, String> extraHeaders = new HashMap<>();
            extraHeaders.put("Set-Cookie", accessCookie);

            final Map<String, String> body = new HashMap<>();
            body.put("message", "Login successful");
            body.put("refreshToken", refreshToken);
            body.put("refreshCookie", refreshCookie);

            return CorsHelper.okWithHeaders(body, extraHeaders);
        } catch (Exception e) {
            return CorsHelper.error(500, e.getMessage());
        }
    }
}
