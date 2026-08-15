package com.vocabkicker.serverless.functions;

import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vocabkicker.serverless.dto.UpdateAdminRequest;
import com.vocabkicker.serverless.dto.UserDto;
import com.vocabkicker.serverless.exception.BadRequestException;
import com.vocabkicker.serverless.service.AuthService;
import com.vocabkicker.serverless.service.JwtService;
import com.vocabkicker.serverless.utils.CorsHelper;
import org.springframework.stereotype.Component;

@Component("updateAdmin")
public class UpdateAdminFunction extends ApiGatewayHandler {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private final AuthService authService;
    private final JwtService jwtService;

    public UpdateAdminFunction(AuthService authService, JwtService jwtService) {
        this.authService = authService;
        this.jwtService = jwtService;
    }

    @Override
    protected APIGatewayProxyResponseEvent handleRequest(final APIGatewayProxyRequestEvent request) throws Exception {
        jwtService.validateAdminToken(request.getHeaders());

        String id = null;
        if (request.getPathParameters() != null) {
            id = request.getPathParameters().get("id");
        }
        
        if (id == null || id.isEmpty()) {
            throw new BadRequestException("Admin ID is required");
        }

        final UpdateAdminRequest req = MAPPER.readValue(request.getBody(), UpdateAdminRequest.class);
        UserDto updatedAdmin = authService.updateAdmin(id, req);

        return CorsHelper.ok(updatedAdmin);
    }
}
