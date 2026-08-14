package com.vocabkicker.serverless.functions;

import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.vocabkicker.serverless.exception.BadRequestException;
import com.vocabkicker.serverless.service.JwtService;
import com.vocabkicker.serverless.service.QuestionService;
import com.vocabkicker.serverless.utils.CorsHelper;
import org.springframework.stereotype.Component;

@Component("deleteQuestion")
public class DeleteQuestionFunction extends ApiGatewayHandler {

  private final QuestionService questionService;
  private final JwtService jwtService;

  public DeleteQuestionFunction(QuestionService questionService, JwtService jwtService) {
    this.questionService = questionService;
    this.jwtService = jwtService;
  }

  @Override
  protected APIGatewayProxyResponseEvent handleRequest(final APIGatewayProxyRequestEvent request) throws Exception {
    jwtService.validateAdminToken(request.getHeaders());

    final String id = request.getPathParameters() != null
        ? request.getPathParameters().get("id")
        : null;
    if (id == null || id.trim().isEmpty()) {
      throw new BadRequestException("Question ID is required");
    }
    
    questionService.deleteQuestion(id);
    return CorsHelper.ok("{\"message\":\"Deleted\"}");
  }
}