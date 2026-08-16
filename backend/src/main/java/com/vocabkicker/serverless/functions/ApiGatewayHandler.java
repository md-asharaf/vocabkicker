package com.vocabkicker.serverless.functions;

import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.vocabkicker.serverless.exception.BadRequestException;
import com.vocabkicker.serverless.exception.ConflictException;
import com.vocabkicker.serverless.exception.NotFoundException;
import com.vocabkicker.serverless.exception.UnauthorizedException;
import com.vocabkicker.serverless.utils.CorsHelper;

import java.util.function.Function;

public abstract class ApiGatewayHandler implements Function<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

  @Override
  public APIGatewayProxyResponseEvent apply(APIGatewayProxyRequestEvent request) {
    try {
      return handleRequest(request);
    } catch (UnauthorizedException e) {
      return CorsHelper.error(401, e.getMessage());
    } catch (NotFoundException e) {
      return CorsHelper.error(404, e.getMessage());
    } catch (ConflictException e) {
      return CorsHelper.error(409, e.getMessage());
    } catch (BadRequestException e) {
      return CorsHelper.error(400, e.getMessage());
    } catch (Exception e) {
      return CorsHelper.error(500, e.getMessage());
    }
  }

  protected abstract APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent request) throws Exception;
}
