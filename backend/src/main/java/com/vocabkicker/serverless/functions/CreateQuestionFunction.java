package com.vocabkicker.serverless.functions;

import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vocabkicker.serverless.entity.Question;
import com.vocabkicker.serverless.service.JwtService;
import com.vocabkicker.serverless.service.QuestionService;
import com.vocabkicker.serverless.utils.CorsHelper;
import org.springframework.stereotype.Component;

@Component("createQuestion")
public class CreateQuestionFunction extends ApiGatewayHandler {

  private static final ObjectMapper MAPPER = new ObjectMapper();

  private final QuestionService questionService;
  private final JwtService jwtService;

  public CreateQuestionFunction(QuestionService questionService, JwtService jwtService) {
    this.questionService = questionService;
    this.jwtService = jwtService;
  }

  @Override
  protected APIGatewayProxyResponseEvent handleRequest(final APIGatewayProxyRequestEvent request) throws Exception {
    jwtService.validateAdminToken(request.getHeaders());

    final Question question = MAPPER.readValue(request.getBody(), Question.class);
    Question created = questionService.createQuestion(question);
    
    return CorsHelper.ok(created);
  }
}