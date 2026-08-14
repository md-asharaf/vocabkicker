package com.vocabkicker.serverless.functions;

import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.vocabkicker.serverless.dto.QuizQuestion;
import com.vocabkicker.serverless.service.QuestionService;
import com.vocabkicker.serverless.utils.CorsHelper;
import org.springframework.stereotype.Component;

import java.util.List;

@Component("generateQuiz")
public class GenerateQuizFunction extends ApiGatewayHandler {

  private final QuestionService questionService;

  public GenerateQuizFunction(QuestionService questionService) {
    this.questionService = questionService;
  }

  @Override
  protected APIGatewayProxyResponseEvent handleRequest(final APIGatewayProxyRequestEvent request) throws Exception {
    int numberOfQuestions = 10;
    if (request.getQueryStringParameters() != null && request.getQueryStringParameters().containsKey("count")) {
      try {
        numberOfQuestions = Integer.parseInt(request.getQueryStringParameters().get("count"));
      } catch (NumberFormatException ignored) {
      }
    }

    List<QuizQuestion> quiz = questionService.generateQuiz(numberOfQuestions);
    return CorsHelper.ok(quiz);
  }
}