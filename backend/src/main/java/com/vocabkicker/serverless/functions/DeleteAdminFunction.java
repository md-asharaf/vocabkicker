package com.vocabkicker.serverless.functions;

import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.vocabkicker.serverless.exception.BadRequestException;
import com.vocabkicker.serverless.service.AuthService;
import com.vocabkicker.serverless.service.JwtService;
import com.vocabkicker.serverless.utils.CorsHelper;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component("deleteAdmin")
public class DeleteAdminFunction extends ApiGatewayHandler {

    private final AuthService authService;
    private final JwtService jwtService;

    public DeleteAdminFunction(AuthService authService, JwtService jwtService) {
        this.authService = authService;
        this.jwtService = jwtService;
    }

    @Override
    protected APIGatewayProxyResponseEvent handleRequest(final APIGatewayProxyRequestEvent request) throws Exception {
        jwtService.validateAdminToken(request.getHeaders());

        final String id = request.getPathParameters() != null
                ? request.getPathParameters().get("id")
                : null;
        if (id == null || id.trim().isEmpty()) {
            throw new BadRequestException("Admin ID is required");
        }

        authService.deleteAdmin(id);
        return CorsHelper.ok(Map.of("message", "Admin deleted successfully"));
    }
}
