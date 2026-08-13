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
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;

import java.util.Map;
import java.util.function.Function;

@Component("updateQuestion")
public class UpdateQuestionFunction implements Function<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final DynamoDbTable<Question> questionTable;
    private final String jwtSecret;

    public UpdateQuestionFunction(final DynamoDbEnhancedClient enhancedClient) {
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

            Map<String, String> pathParams = request.getPathParameters();
            if (pathParams == null || !pathParams.containsKey("id")) {
                return CorsHelper.error(400, "Missing question ID in path");
            }
            String id = pathParams.get("id");

            Question existingQuestion = questionTable.getItem(Key.builder().partitionValue(id).build());
            if (existingQuestion == null) {
                return CorsHelper.error(404, "Question not found");
            }

            final Question updatedFields = MAPPER.readValue(request.getBody(), Question.class);

            // Update only the mutable fields
            if (updatedFields.getWord() != null) existingQuestion.setWord(updatedFields.getWord());
            if (updatedFields.getMnemonic() != null) existingQuestion.setMnemonic(updatedFields.getMnemonic());
            if (updatedFields.getDefinition() != null) existingQuestion.setDefinition(updatedFields.getDefinition());
            
            existingQuestion.setUpdatedAt(System.currentTimeMillis());

            questionTable.updateItem(existingQuestion);
            return CorsHelper.ok(existingQuestion);
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
