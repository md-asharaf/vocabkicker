package com.vocabkicker.serverless.functions;

import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.vocabkicker.serverless.model.Question;
import com.vocabkicker.serverless.utils.CorsHelper;
import com.vocabkicker.serverless.utils.JwtValidator;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;

import java.util.function.Function;

/**
 * Serverless function to delete a question by its ID.
 * Requires a valid admin_token cookie.
 */
@Component("deleteQuestion")
public class DeleteQuestionFunction implements Function<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

    private final DynamoDbTable<Question> questionTable;
    private final String jwtSecret;

    public DeleteQuestionFunction(final DynamoDbEnhancedClient enhancedClient) {
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

            final String id = request.getPathParameters() != null
                    ? request.getPathParameters().get("id")
                    : null;
            if (id == null || id.trim().isEmpty()) {
                return CorsHelper.error(400, "Question ID is required");
            }
            questionTable.deleteItem(Key.builder().partitionValue(id).build());
            return CorsHelper.ok("{\"message\":\"Deleted\"}");
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