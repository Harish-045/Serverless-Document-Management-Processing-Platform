package com.cloud.documentplatform.handler;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.cloud.documentplatform.service.DynamoDBService;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class GetDocumentsHandler
        implements RequestHandler<
        APIGatewayProxyRequestEvent,
        APIGatewayProxyResponseEvent> {

    private final DynamoDBService dynamoDBService;
    private final ObjectMapper objectMapper;

    public GetDocumentsHandler() {

        this.dynamoDBService =
                new DynamoDBService();

        this.objectMapper =
                new ObjectMapper();
    }

    @Override
    public APIGatewayProxyResponseEvent handleRequest(
            APIGatewayProxyRequestEvent input,
            Context context) {

        context.getLogger().log(
                "Get Documents Lambda started"
        );

        try {

            /*
             * Handle CORS preflight.
             */
            if (input != null
                    && input.getHttpMethod() != null
                    && input.getHttpMethod()
                    .equalsIgnoreCase("OPTIONS")) {

                return createResponse(
                        200,
                        "{\"message\":\"CORS OK\"}"
                );
            }

            /*
             * Get documents from DynamoDB.
             */
            List<Map<String, Object>> documents =
                    dynamoDBService.getAllDocuments();

            context.getLogger().log(
                    "Documents found: "
                            + documents.size()
            );

            /*
             * Convert list to JSON.
             */
            String responseBody =
                    objectMapper.writeValueAsString(
                            documents
                    );

            return createResponse(
                    200,
                    responseBody
            );

        } catch (Exception e) {

            context.getLogger().log(
                    "ERROR: "
                            + e.getClass().getSimpleName()
                            + " - "
                            + e.getMessage()
            );

            return createResponse(
                    500,
                    createErrorJson(
                            "Failed to retrieve documents"
                    )
            );
        }
    }

    /*
     * Create API Gateway response.
     */
    private APIGatewayProxyResponseEvent createResponse(
            int statusCode,
            String body) {

        Map<String, String> headers =
                new HashMap<>();

        headers.put(
                "Content-Type",
                "application/json"
        );

        headers.put(
                "Access-Control-Allow-Origin",
                "*"
        );

        headers.put(
                "Access-Control-Allow-Headers",
                "Content-Type,Authorization"
        );

        headers.put(
                "Access-Control-Allow-Methods",
                "OPTIONS,GET"
        );

        return new APIGatewayProxyResponseEvent()
                .withStatusCode(statusCode)
                .withHeaders(headers)
                .withBody(body);
    }

    /*
     * Create JSON error response.
     */
    private String createErrorJson(
            String message) {

        try {

            Map<String, String> error =
                    new HashMap<>();

            error.put(
                    "status",
                    "ERROR"
            );

            error.put(
                    "message",
                    message
            );

            return objectMapper.writeValueAsString(
                    error
            );

        } catch (Exception e) {

            return "{\"status\":\"ERROR\",\"message\":\""
                    + message
                    + "\"}";
        }
    }
}