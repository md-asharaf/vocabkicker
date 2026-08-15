package com.vocabkicker.serverless.functions;

import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vocabkicker.serverless.dto.LoginRequest;
import com.vocabkicker.serverless.service.AuthService;
import com.vocabkicker.serverless.service.JwtService;
import com.vocabkicker.serverless.utils.CorsHelper;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component("createAdmin")
public class CreateAdminFunction extends ApiGatewayHandler {

  private static final ObjectMapper MAPPER = new ObjectMapper();
  private final AuthService authService;
  private final JwtService jwtService;

  public CreateAdminFunction(AuthService authService, JwtService jwtService) {
    this.authService = authService;
    this.jwtService = jwtService;
  }

  @Override
  protected APIGatewayProxyResponseEvent handleRequest(final APIGatewayProxyRequestEvent request) throws Exception {
    if (authService.getAdminCount() > 0) {
      jwtService.validateAdminToken(request.getHeaders());
    }

    final LoginRequest req = MAPPER.readValue(request.getBody(), LoginRequest.class);
    authService.createAdmin(req);

    final Map<String, String> body = new HashMap<>();
    body.put("message", "Admin created successfully");

    return CorsHelper.ok(body);
  }
}
