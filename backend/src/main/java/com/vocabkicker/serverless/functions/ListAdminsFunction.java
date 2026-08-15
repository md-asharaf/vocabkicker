package com.vocabkicker.serverless.functions;

import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.vocabkicker.serverless.dto.UserDto;
import com.vocabkicker.serverless.service.AuthService;
import com.vocabkicker.serverless.service.JwtService;
import com.vocabkicker.serverless.utils.CorsHelper;
import org.springframework.stereotype.Component;

import java.util.List;

@Component("listAdmins")
public class ListAdminsFunction extends ApiGatewayHandler {

    private final AuthService authService;
    private final JwtService jwtService;

    public ListAdminsFunction(AuthService authService, JwtService jwtService) {
        this.authService = authService;
        this.jwtService = jwtService;
    }

    @Override
    protected APIGatewayProxyResponseEvent handleRequest(final APIGatewayProxyRequestEvent request) throws Exception {
        io.jsonwebtoken.Claims claims = jwtService.validateAdminToken(request.getHeaders());
        String currentAdminId = claims.getSubject();
        List<UserDto> admins = authService.getAllAdmins().stream()
                .filter(admin -> !admin.getId().equals(currentAdminId))
                .toList();
        return CorsHelper.ok(admins);
    }
}
