package com.vocabkicker.serverless.functions;

import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vocabkicker.serverless.dto.AuthResult;
import com.vocabkicker.serverless.dto.LoginRequest;
import com.vocabkicker.serverless.service.AuthService;
import com.vocabkicker.serverless.utils.CorsHelper;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component("adminLogin")
public class AdminLoginFunction extends ApiGatewayHandler {

  private static final ObjectMapper MAPPER = new ObjectMapper();
  private final AuthService authService;

  public AdminLoginFunction(AuthService authService) {
    this.authService = authService;
  }

  @Override
  protected APIGatewayProxyResponseEvent handleRequest(final APIGatewayProxyRequestEvent request) throws Exception {
    final LoginRequest req = MAPPER.readValue(request.getBody(), LoginRequest.class);
    AuthResult authResult = authService.login(req);

    final String accessCookie = String.format(
        "admin_token=%s; Path=/; HttpOnly; Max-Age=%d; SameSite=None; Secure",
        authResult.getAccessToken(), 15 * 60);
    final String refreshCookie = String.format(
        "refresh_token=%s; Path=/; HttpOnly; Max-Age=%d; SameSite=None; Secure",
        authResult.getRefreshToken(), 7 * 24 * 60 * 60);

    final Map<String, String> extraHeaders = new HashMap<>();
    extraHeaders.put("Set-Cookie", accessCookie);

    final Map<String, String> body = new HashMap<>();
    body.put("message", "Login successful");
    body.put("refreshToken", authResult.getRefreshToken());
    body.put("refreshCookie", refreshCookie);

    return CorsHelper.okWithHeaders(body, extraHeaders);
  }
}
