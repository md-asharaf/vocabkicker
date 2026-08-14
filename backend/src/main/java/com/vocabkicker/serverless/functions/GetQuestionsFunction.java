package com.vocabkicker.serverless.functions;

import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.vocabkicker.serverless.repository.QuestionPage;
import com.vocabkicker.serverless.service.QuestionService;
import com.vocabkicker.serverless.utils.CorsHelper;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component("getQuestions")
public class GetQuestionsFunction extends ApiGatewayHandler {

  private final QuestionService questionService;

  public GetQuestionsFunction(QuestionService questionService) {
    this.questionService = questionService;
  }

  @Override
  protected APIGatewayProxyResponseEvent handleRequest(final APIGatewayProxyRequestEvent request) throws Exception {
    Map<String, String> queryParams = request.getQueryStringParameters();

    int limit = 10;
    String lastEvaluatedKeyId = null;
    String search = null;

    if (queryParams != null) {
      if (queryParams.containsKey("limit")) {
        try {
          limit = Integer.parseInt(queryParams.get("limit"));
        } catch (NumberFormatException ignored) {
        }
      }
      if (queryParams.containsKey("lastEvaluatedKey") && !queryParams.get("lastEvaluatedKey").isEmpty()) {
        lastEvaluatedKeyId = queryParams.get("lastEvaluatedKey");
      }
      if (queryParams.containsKey("search") && !queryParams.get("search").trim().isEmpty()) {
        search = queryParams.get("search").trim();
      }
    }

    QuestionPage page = questionService.getQuestions(limit, lastEvaluatedKeyId, search);

    Map<String, Object> response = new HashMap<>();
    response.put("items", page.getItems());
    response.put("lastEvaluatedKey", page.getLastEvaluatedKey());

    return CorsHelper.ok(response);
  }
}