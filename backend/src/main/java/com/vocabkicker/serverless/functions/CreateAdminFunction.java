package com.vocabkicker.serverless.functions;

import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vocabkicker.serverless.dto.AuthResult;
import com.vocabkicker.serverless.dto.LoginRequest;
import com.vocabkicker.serverless.exception.UnauthorizedException;
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
    try {
      final LoginRequest req = MAPPER.readValue(request.getBody(), LoginRequest.class);
      AuthResult authResult = authService.createAdmin(req);

      final String accessCookie = String.format(
          "admin_token=%s; Path=/; HttpOnly; Max-Age=%d; SameSite=None; Secure",
          authResult.getAccessToken(), 15 * 60);
      final String refreshCookie = String.format(
          "refresh_token=%s; Path=/; HttpOnly; Max-Age=%d; SameSite=None; Secure",
          authResult.getRefreshToken(), 7 * 24 * 60 * 60);

      final Map<String, String> extraHeaders = new HashMap<>();
      extraHeaders.put("Set-Cookie", accessCookie);

      final Map<String, String> body = new HashMap<>();
      body.put("message", "Admin created and logged in");
      body.put("refreshToken", authResult.getRefreshToken());
      body.put("refreshCookie", refreshCookie);

      return CorsHelper.okWithHeaders(body, extraHeaders);
    } catch (Exception e) {
      if (e.getMessage() != null && e.getMessage().contains("already exists")) {
        try {
          jwtService.validateAdminToken(request.getHeaders());
          throw new UnauthorizedException("Cannot create another admin without modifications to support multiple admins.");
        } catch (Exception tokenEx) {
          throw new UnauthorizedException("Unauthorized: Admin already exists, and no valid token provided.");
        }
      }
      throw e;
    }
  }
}
