package com.vocabkicker.serverless.functions;

import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vocabkicker.serverless.model.LoginRequest;
import com.vocabkicker.serverless.model.User;
import com.vocabkicker.serverless.utils.CorsHelper;
import com.vocabkicker.serverless.utils.JwtValidator;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;

@Component("createAdmin")
public class CreateAdminFunction implements Function<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final DynamoDbTable<User> userTable;
    private final BCryptPasswordEncoder passwordEncoder;
    private final String jwtSecret;

    public CreateAdminFunction(final DynamoDbEnhancedClient enhancedClient) {
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
            final boolean hasExistingAdmins = userTable.scan().items().stream().findAny().isPresent();
            if (hasExistingAdmins) {
                JwtValidator.validateAdminToken(request.getHeaders(), jwtSecret);
            }

            final LoginRequest req = MAPPER.readValue(request.getBody(), LoginRequest.class);

            if (req.getEmail() == null || req.getPassword() == null || req.getPassword().length() < 6) {
                return CorsHelper.error(400, "Invalid email or password (min 6 chars)");
            }

            final boolean exists = userTable.scan().items().stream()
                    .anyMatch(u -> u.getEmail().equalsIgnoreCase(req.getEmail()));
            if (exists) {
                return CorsHelper.error(409, "User already exists");
            }

            final long now = System.currentTimeMillis();
            final User user = User.builder()
                    .id(UUID.randomUUID().toString())
                    .email(req.getEmail().toLowerCase())
                    .passwordHash(passwordEncoder.encode(req.getPassword()))
                    .createdAt(now)
                    .updatedAt(now)
                    .build();

            userTable.putItem(user);

            // Don't return the password hash
            final Map<String, Object> safe = new HashMap<>();
            safe.put("id", user.getId());
            safe.put("email", user.getEmail());
            safe.put("createdAt", user.getCreatedAt());

            return CorsHelper.ok(safe);
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().startsWith("Unauthorized")) {
                return CorsHelper.error(401, e.getMessage());
            }
            return CorsHelper.error(400, e.getMessage());
        } catch (Exception e) {
            return CorsHelper.error(500, e.getMessage());
        }
    }
}
