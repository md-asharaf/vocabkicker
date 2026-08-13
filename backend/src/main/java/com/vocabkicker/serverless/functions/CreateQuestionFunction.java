package com.vocabkicker.serverless.functions;

import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vocabkicker.serverless.model.Question;
import com.vocabkicker.serverless.utils.CorsHelper;
import com.vocabkicker.serverless.utils.JwtValidator;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;

import java.util.UUID;
import java.util.function.Function;

@Component("createQuestion")
public class CreateQuestionFunction implements Function<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final DynamoDbTable<Question> questionTable;
    private final String jwtSecret;

    public CreateQuestionFunction(final DynamoDbEnhancedClient enhancedClient) {
        this.questionTable = enhancedClient.table("Questions", TableSchema.fromBean(Question.class));
        final String secret = System.getenv("JWT_SECRET");
        if (secret == null || secret.isEmpty()) {
            throw new IllegalStateException("JWT_SECRET environment variable is missing");
        }
        this.jwtSecret = secret;
    }

    @Override
    public APIGatewayProxyResponseEvent apply(final APIGatewayProxyRequestEvent request) {
        try {
            JwtValidator.validateAdminToken(request.getHeaders(), jwtSecret);

            final Question question = MAPPER.readValue(request.getBody(), Question.class);
            final long now = System.currentTimeMillis();

            if (question.getId() == null || question.getId().trim().isEmpty()) {
                question.setId(UUID.randomUUID().toString());
                question.setCreatedAt(now);
            } else {
                if (question.getCreatedAt() == null) {
                    question.setCreatedAt(now);
                }
            }

            question.setUpdatedAt(now);
            questionTable.putItem(question);
            return CorsHelper.ok(question);
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