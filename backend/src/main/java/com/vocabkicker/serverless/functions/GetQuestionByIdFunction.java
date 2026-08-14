package com.vocabkicker.serverless.functions;

import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.vocabkicker.serverless.entity.Question;
import com.vocabkicker.serverless.exception.BadRequestException;
import com.vocabkicker.serverless.exception.NotFoundException;
import com.vocabkicker.serverless.service.QuestionService;
import com.vocabkicker.serverless.utils.CorsHelper;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component("getQuestionById")
public class GetQuestionByIdFunction extends ApiGatewayHandler {

  private final QuestionService questionService;

  public GetQuestionByIdFunction(QuestionService questionService) {
    this.questionService = questionService;
  }

  @Override
  protected APIGatewayProxyResponseEvent handleRequest(final APIGatewayProxyRequestEvent request) throws Exception {
    final String id = request.getPathParameters() != null
        ? request.getPathParameters().get("id")
        : null;
    if (id == null || id.trim().isEmpty()) {
      throw new BadRequestException("Question ID is required");
    }

    Optional<Question> qOpt = questionService.getQuestionById(id);
    if (qOpt.isEmpty()) {
      throw new NotFoundException("Question not found");
    }

    return CorsHelper.ok(qOpt.get());
  }
}