package com.vocabkicker.serverless.functions;

import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vocabkicker.serverless.dto.AuthResult;
import com.vocabkicker.serverless.dto.RefreshRequest;
import com.vocabkicker.serverless.exception.BadRequestException;
import com.vocabkicker.serverless.exception.UnauthorizedException;
import com.vocabkicker.serverless.service.AuthService;
import com.vocabkicker.serverless.utils.CorsHelper;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component("adminRefresh")
public class AdminRefreshFunction extends ApiGatewayHandler {

  private static final ObjectMapper MAPPER = new ObjectMapper();
  private final AuthService authService;

  public AdminRefreshFunction(AuthService authService) {
    this.authService = authService;
  }

  @Override
  protected APIGatewayProxyResponseEvent handleRequest(final APIGatewayProxyRequestEvent request) throws Exception {
    RefreshRequest req = null;
    if (request.getBody() != null && !request.getBody().trim().isEmpty()) {
      try {
        req = MAPPER.readValue(request.getBody(), RefreshRequest.class);
      } catch (Exception ignored) {
      }
    }

    if (req == null || req.getRefreshToken() == null) {
      String extractedToken = CorsHelper.extractCookie(request.getHeaders(), "refresh_token");
      if (extractedToken != null) {
        req = new RefreshRequest();
        req.setRefreshToken(extractedToken);
      } else {
        throw new BadRequestException("Missing refresh token in body or cookies");
      }
    }

    AuthResult authResult;
    try {
      authResult = authService.refresh(req);
    } catch (Exception e) {
      throw new UnauthorizedException("Invalid or expired refresh token: " + e.getMessage());
    }

    final String accessCookie = String.format(
        "admin_token=%s; Path=/; HttpOnly; Max-Age=%d; SameSite=None; Secure",
        authResult.getAccessToken(), 15 * 60);
    final String refreshCookie = String.format(
        "refresh_token=%s; Path=/; HttpOnly; Max-Age=%d; SameSite=None; Secure",
        authResult.getRefreshToken(), 7 * 24 * 60 * 60);

    final Map<String, List<String>> multiHeaders = new HashMap<>();
    multiHeaders.put("Set-Cookie", Arrays.asList(accessCookie, refreshCookie));

    final Map<String, String> body = new HashMap<>();
    body.put("message", "Token refreshed");
    body.put("refreshToken", authResult.getRefreshToken());

    return CorsHelper.okWithMultiValueHeaders(body, multiHeaders);
  }
}
