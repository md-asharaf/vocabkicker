package com.vocabkicker.serverless.functions;

import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.vocabkicker.serverless.model.Question;
import com.vocabkicker.serverless.utils.CorsHelper;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;

import software.amazon.awssdk.enhanced.dynamodb.model.Page;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component("getQuestions")
public class GetQuestionsFunction implements Function<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

    private final DynamoDbTable<Question> questionTable;

    public GetQuestionsFunction(final DynamoDbEnhancedClient enhancedClient) {
        this.questionTable = enhancedClient.table("Questions", TableSchema.fromBean(Question.class));
    }

    @Override
    public APIGatewayProxyResponseEvent apply(final APIGatewayProxyRequestEvent request) {
        try {
            Map<String, String> queryParams = request.getQueryStringParameters();
            
            int limit = 10;
            String lastEvaluatedKeyId = null;

            if (queryParams != null) {
                if (queryParams.containsKey("limit")) {
                    try {
                        limit = Integer.parseInt(queryParams.get("limit"));
                    } catch (NumberFormatException ignored) {}
                }
                if (queryParams.containsKey("lastEvaluatedKey") && !queryParams.get("lastEvaluatedKey").isEmpty()) {
                    lastEvaluatedKeyId = queryParams.get("lastEvaluatedKey");
                }
            }

            Map<String, AttributeValue> exclusiveStartKey = null;
            if (lastEvaluatedKeyId != null && !lastEvaluatedKeyId.equals("null")) {
                exclusiveStartKey = new HashMap<>();
                exclusiveStartKey.put("id", AttributeValue.builder().s(lastEvaluatedKeyId).build());
            }

            final Map<String, AttributeValue> finalExclusiveStartKey = exclusiveStartKey;
            final int finalLimit = limit;
            
            Page<Question> firstPage = questionTable.scan(r -> {
                r.limit(finalLimit);
                if (finalExclusiveStartKey != null) {
                    r.exclusiveStartKey(finalExclusiveStartKey);
                }
            }).stream().findFirst().orElse(null);

            Map<String, Object> response = new HashMap<>();
            
            if (firstPage != null) {
                response.put("items", firstPage.items());
                if (firstPage.lastEvaluatedKey() != null && firstPage.lastEvaluatedKey().containsKey("id")) {
                    response.put("lastEvaluatedKey", firstPage.lastEvaluatedKey().get("id").s());
                } else {
                    response.put("lastEvaluatedKey", null);
                }
            } else {
                response.put("items", new java.util.ArrayList<>());
                response.put("lastEvaluatedKey", null);
            }

            return CorsHelper.ok(response);
        } catch (Exception e) {
            return CorsHelper.error(500, e.getMessage());
        }
    }
}