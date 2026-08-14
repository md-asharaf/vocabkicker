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

            String search = null;

            if (queryParams != null) {
                if (queryParams.containsKey("limit")) {
                    try {
                        limit = Integer.parseInt(queryParams.get("limit"));
                    } catch (NumberFormatException ignored) {}
                }
                if (queryParams.containsKey("lastEvaluatedKey") && !queryParams.get("lastEvaluatedKey").isEmpty()) {
                    lastEvaluatedKeyId = queryParams.get("lastEvaluatedKey");
                }
                if (queryParams.containsKey("search") && !queryParams.get("search").trim().isEmpty()) {
                    search = queryParams.get("search").trim();
                }
            }

            Map<String, AttributeValue> exclusiveStartKey = null;
            if (lastEvaluatedKeyId != null && !lastEvaluatedKeyId.equals("null")) {
                exclusiveStartKey = new HashMap<>();
                exclusiveStartKey.put("id", AttributeValue.builder().s(lastEvaluatedKeyId).build());
            }

            final Map<String, AttributeValue> finalExclusiveStartKey = exclusiveStartKey;
            final int finalLimit = limit;
            final String finalSearch = search;
            
            java.util.List<Question> resultItems = new java.util.ArrayList<>();
            String nextKey = null;

            if (finalSearch != null) {
                java.util.regex.Pattern pattern;
                try {
                    pattern = java.util.regex.Pattern.compile(finalSearch, java.util.regex.Pattern.CASE_INSENSITIVE);
                } catch (java.util.regex.PatternSyntaxException e) {
                    pattern = java.util.regex.Pattern.compile(java.util.regex.Pattern.quote(finalSearch), java.util.regex.Pattern.CASE_INSENSITIVE);
                }

                java.util.Iterator<Page<Question>> iterator = questionTable.scan(r -> {
                    if (finalExclusiveStartKey != null) {
                        r.exclusiveStartKey(finalExclusiveStartKey);
                    }
                }).iterator();

                outerLoop:
                while (iterator.hasNext()) {
                    Page<Question> page = iterator.next();
                    for (Question q : page.items()) {
                        boolean match = false;
                        if (q.getWord() != null && pattern.matcher(q.getWord()).find()) match = true;
                        if (!match && q.getDefinition() != null && pattern.matcher(q.getDefinition()).find()) match = true;
                        
                        if (match) {
                            resultItems.add(q);
                            if (resultItems.size() == finalLimit) {
                                nextKey = q.getId();
                                break outerLoop;
                            }
                        }
                    }
                }
            } else {
                Page<Question> firstPage = questionTable.scan(r -> {
                    r.limit(finalLimit);
                    if (finalExclusiveStartKey != null) {
                        r.exclusiveStartKey(finalExclusiveStartKey);
                    }
                }).stream().findFirst().orElse(null);
                
                if (firstPage != null) {
                    resultItems.addAll(firstPage.items());
                    if (firstPage.lastEvaluatedKey() != null && firstPage.lastEvaluatedKey().containsKey("id")) {
                        nextKey = firstPage.lastEvaluatedKey().get("id").s();
                    }
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("items", resultItems);
            response.put("lastEvaluatedKey", nextKey);

            return CorsHelper.ok(response);
        } catch (Exception e) {
            return CorsHelper.error(500, e.getMessage());
        }
    }
}