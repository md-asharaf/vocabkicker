package com.vocabkicker.serverless.functions;

import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vocabkicker.serverless.entity.Question;
import com.vocabkicker.serverless.exception.BadRequestException;
import com.vocabkicker.serverless.service.JwtService;
import com.vocabkicker.serverless.service.QuestionService;
import com.vocabkicker.serverless.utils.CorsHelper;
import org.springframework.stereotype.Component;

@Component("updateQuestion")
public class UpdateQuestionFunction extends ApiGatewayHandler {

  private static final ObjectMapper MAPPER = new ObjectMapper();

  private final QuestionService questionService;
  private final JwtService jwtService;

  public UpdateQuestionFunction(QuestionService questionService, JwtService jwtService) {
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

    final Question updatedFields = MAPPER.readValue(request.getBody(), Question.class);
    Question existingQuestion = questionService.updateQuestion(id, updatedFields);
    
    return CorsHelper.ok(existingQuestion);
  }
}
