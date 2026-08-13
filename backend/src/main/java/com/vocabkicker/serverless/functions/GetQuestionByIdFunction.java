package com.vocabkicker.serverless.functions;

import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.vocabkicker.serverless.model.Question;
import com.vocabkicker.serverless.utils.CorsHelper;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;

import java.util.function.Function;

/**
 * Serverless function to retrieve a specific question by its ID.
 */
@Component("getQuestionById")
public class GetQuestionByIdFunction implements Function<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

    private final DynamoDbTable<Question> questionTable;

    public GetQuestionByIdFunction(final DynamoDbEnhancedClient enhancedClient) {
        this.questionTable = enhancedClient.table("Questions", TableSchema.fromBean(Question.class));
    }

    @Override
    public APIGatewayProxyResponseEvent apply(final APIGatewayProxyRequestEvent request) {
        try {
            final String id = request.getPathParameters() != null
                    ? request.getPathParameters().get("id")
                    : null;
            if (id == null || id.trim().isEmpty()) {
                return CorsHelper.error(400, "Question ID is required");
            }
            final Question question = questionTable.getItem(Key.builder().partitionValue(id).build());
            if (question == null) {
                return CorsHelper.error(404, "Question not found");
            }
            return CorsHelper.ok(question);
        } catch (Exception e) {
            return CorsHelper.error(500, e.getMessage());
        }
    }
}