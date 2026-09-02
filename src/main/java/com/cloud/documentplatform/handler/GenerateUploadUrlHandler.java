package com.cloud.documentplatform.handler;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.cloud.documentplatform.service.S3PresignedUrlService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

public class GenerateUploadUrlHandler
        implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

    private final S3PresignedUrlService presignedUrlService;
    private final ObjectMapper objectMapper;

    public GenerateUploadUrlHandler() {
        this.presignedUrlService = new S3PresignedUrlService();
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public APIGatewayProxyResponseEvent handleRequest(
            APIGatewayProxyRequestEvent input,
            Context context) {

        context.getLogger().log(
                "Generate Upload URL Lambda started"
        );

        try {

            /*
             * Handle CORS preflight request.
             */
            if (input != null
                    && input.getHttpMethod() != null
                    && input.getHttpMethod().equalsIgnoreCase("OPTIONS")) {

                return createResponse(
                        200,
                        "{\"message\":\"CORS OK\"}"
                );
            }

            /*
             * Validate request.
             */
            if (input == null || input.getBody() == null) {

                return createResponse(
                        400,
                        createErrorJson(
                                "Request body is required"
                        )
                );
            }

            String body = input.getBody();

            /*
             * API Gateway may send a Base64 encoded body.
             */
            if (Boolean.TRUE.equals(input.getIsBase64Encoded())) {

                body = new String(
                        java.util.Base64.getDecoder().decode(body),
                        java.nio.charset.StandardCharsets.UTF_8
                );
            }

            /*
             * Parse JSON body.
             *
             * Expected:
             *
             * {
             *   "fileName": "document.pdf",
             *   "contentType": "application/pdf"
             * }
             */
            JsonNode jsonNode;

            try {

                jsonNode = objectMapper.readTree(body);

            } catch (Exception e) {

                return createResponse(
                        400,
                        createErrorJson(
                                "Invalid JSON request body"
                        )
                );
            }

            /*
             * Read fileName.
             */
            JsonNode fileNameNode =
                    jsonNode.get("fileName");

            if (fileNameNode == null
                    || fileNameNode.asText().trim().isEmpty()) {

                return createResponse(
                        400,
                        createErrorJson(
                                "fileName is required"
                        )
                );
            }

            /*
             * Read contentType.
             */
            JsonNode contentTypeNode =
                    jsonNode.get("contentType");

            if (contentTypeNode == null
                    || contentTypeNode.asText().trim().isEmpty()) {

                return createResponse(
                        400,
                        createErrorJson(
                                "contentType is required"
                        )
                );
            }

            String fileName =
                    fileNameNode.asText().trim();

            String contentType =
                    contentTypeNode.asText().trim();

            /*
             * Basic filename security.
             *
             * Prevent directory traversal such as:
             *
             * ../../file.txt
             */
            if (fileName.contains("..")
                    || fileName.contains("/")
                    || fileName.contains("\\")) {

                return createResponse(
                        400,
                        createErrorJson(
                                "Invalid fileName"
                        )
                );
            }

            /*
             * Generate unique document ID.
             */
            String documentId =
                    "DOC-" + UUID.randomUUID();

            /*
             * Create S3 object key.
             */
            String objectKey =
                    "documents/uploads/"
                            + documentId
                            + "/"
                            + fileName;

            context.getLogger().log(
                    "Generating presigned URL for: "
                            + objectKey
            );

            /*
             * Generate temporary upload URL.
             */
            String uploadUrl =
                    presignedUrlService.generateUploadUrl(
                            objectKey,
                            contentType
                    );

            /*
             * Create successful response.
             */
            Map<String, Object> response =
                    new HashMap<>();

            response.put(
                    "status",
                    "SUCCESS"
            );

            response.put(
                    "documentId",
                    documentId
            );

            response.put(
                    "fileName",
                    fileName
            );

            response.put(
                    "contentType",
                    contentType
            );

            response.put(
                    "s3Key",
                    objectKey
            );

            response.put(
                    "uploadUrl",
                    uploadUrl
            );

            String responseBody =
                    objectMapper.writeValueAsString(
                            response
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
                            "Failed to generate upload URL"
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
                "OPTIONS,POST"
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