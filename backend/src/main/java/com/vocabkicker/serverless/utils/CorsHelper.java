package com.vocabkicker.serverless.utils;

import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class CorsHelper {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final String ALLOWED_ORIGIN;
    static {
        String origin = System.getenv("CORS_ALLOW_ORIGIN");
        ALLOWED_ORIGIN = origin != null && !origin.isEmpty() ? origin : "https://vocabkicker.vercel.app";
    }

    public static Map<String, String> corsHeaders() {
        Map<String, String> headers = new HashMap<>();
        headers.put("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
        headers.put("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
        headers.put("Access-Control-Allow-Headers", "Content-Type,Authorization,Cookie");
        headers.put("Access-Control-Allow-Credentials", "true");
        headers.put("Content-Type", "application/json");
        return headers;
    }

    public static APIGatewayProxyResponseEvent ok(Object body) {
        try {
            return new APIGatewayProxyResponseEvent()
                    .withStatusCode(200)
                    .withHeaders(corsHeaders())
                    .withBody(MAPPER.writeValueAsString(body));
        } catch (Exception e) {
            return error(500, "Serialization error: " + e.getMessage());
        }
    }

    public static APIGatewayProxyResponseEvent ok(String body) {
        return new APIGatewayProxyResponseEvent()
                .withStatusCode(200)
                .withHeaders(corsHeaders())
                .withBody(body);
    }

    public static APIGatewayProxyResponseEvent error(int statusCode, String message) {
        Map<String, String> errorBody = new HashMap<>();
        errorBody.put("error", message);
        try {
            return new APIGatewayProxyResponseEvent()
                    .withStatusCode(statusCode)
                    .withHeaders(corsHeaders())
                    .withBody(MAPPER.writeValueAsString(errorBody));
        } catch (Exception e) {
            return new APIGatewayProxyResponseEvent()
                    .withStatusCode(statusCode)
                    .withHeaders(corsHeaders())
                    .withBody("{\"error\":\"" + message + "\"}");
        }
    }

    public static APIGatewayProxyResponseEvent okWithHeaders(Object body, Map<String, String> extraHeaders) {
        Map<String, String> headers = corsHeaders();
        headers.putAll(extraHeaders);
        try {
            return new APIGatewayProxyResponseEvent()
                    .withStatusCode(200)
                    .withHeaders(headers)
                    .withBody(MAPPER.writeValueAsString(body));
        } catch (Exception e) {
            return error(500, "Serialization error: " + e.getMessage());
        }
    }

    public static APIGatewayProxyResponseEvent okWithMultiValueHeaders(Object body, Map<String, List<String>> multiHeaders) {
        Map<String, String> headers = corsHeaders();
        try {
            return new APIGatewayProxyResponseEvent()
                    .withStatusCode(200)
                    .withHeaders(headers)
                    .withMultiValueHeaders(multiHeaders)
                    .withBody(MAPPER.writeValueAsString(body));
        } catch (Exception e) {
            return error(500, "Serialization error: " + e.getMessage());
        }
    }

    public static String extractCookie(Map<String, String> headers, String cookieName) {
        if (headers == null) return null;
        String cookieHeader = headers.getOrDefault("cookie",
                headers.getOrDefault("Cookie", null));
        if (cookieHeader == null) return null;
        for (String part : cookieHeader.split(";")) {
            String trimmed = part.trim();
            if (trimmed.startsWith(cookieName + "=")) {
                return trimmed.substring((cookieName + "=").length());
            }
        }
        return null;
    }
}
