package com.cloud.documentplatform.handler;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.cloud.documentplatform.service.DynamoDBService;
import com.cloud.documentplatform.service.S3PresignedUrlService;
import com.fasterxml.jackson.databind.ObjectMapper;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

import java.util.HashMap;
import java.util.Map;

public class GenerateDownloadUrlHandler
        implements RequestHandler<
        APIGatewayProxyRequestEvent,
        APIGatewayProxyResponseEvent> {

    private final DynamoDBService dynamoDBService;
    private final S3PresignedUrlService s3PresignedUrlService;
    private final ObjectMapper objectMapper;

    public GenerateDownloadUrlHandler() {

        this.dynamoDBService =
                new DynamoDBService();

        this.s3PresignedUrlService =
                new S3PresignedUrlService();

        this.objectMapper =
                new ObjectMapper();
    }

    @Override
    public APIGatewayProxyResponseEvent handleRequest(
            APIGatewayProxyRequestEvent input,
            Context context) {

        context.getLogger().log(
                "Generate Download URL Lambda started"
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
             * Validate request.
             */
            if (input == null) {

                return createResponse(
                        400,
                        createErrorJson(
                                "Request is required"
                        )
                );
            }

            /*
             * Get document ID from path.
             */
            Map<String, String> pathParameters =
                    input.getPathParameters();

            if (pathParameters == null) {

                return createResponse(
                        400,
                        createErrorJson(
                                "documentId is required"
                        )
                );
            }

            String documentId =
                    pathParameters.get("documentId");

            if (documentId == null
                    || documentId.trim().isEmpty()) {

                return createResponse(
                        400,
                        createErrorJson(
                                "documentId is required"
                        )
                );
            }

            context.getLogger().log(
                    "Requested document: "
                            + documentId
            );

            /*
             * Find document in DynamoDB.
             */
            Map<String, AttributeValue> item =
                    dynamoDBService.getDocumentById(
                            documentId
                    );

            if (item == null || item.isEmpty()) {

                context.getLogger().log(
                        "Document not found: "
                                + documentId
                );

                return createResponse(
                        404,
                        createErrorJson(
                                "Document not found"
                        )
                );
            }

            /*
             * Get S3 key.
             */
            AttributeValue s3KeyAttribute =
                    item.get("s3Key");

            if (s3KeyAttribute == null
                    || s3KeyAttribute.s() == null
                    || s3KeyAttribute.s()
                    .trim()
                    .isEmpty()) {

                return createResponse(
                        500,
                        createErrorJson(
                                "S3 key not found for document"
                        )
                );
            }

            String s3Key =
                    s3KeyAttribute.s();

            /*
             * Get file name.
             */
            String fileName =
                    getStringValue(
                            item,
                            "fileName"
                    );

            /*
             * Generate temporary download URL.
             */
            String downloadUrl =
                    s3PresignedUrlService
                            .generateDownloadUrl(
                                    s3Key
                            );

            context.getLogger().log(
                    "Download URL generated successfully"
            );

            /*
             * Create response.
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
                    "s3Key",
                    s3Key
            );

            response.put(
                    "downloadUrl",
                    downloadUrl
            );

            response.put(
                    "expiresIn",
                    600
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
                            + e.getClass()
                            .getSimpleName()
                            + " - "
                            + e.getMessage()
            );

            return createResponse(
                    500,
                    createErrorJson(
                            "Failed to generate download URL"
                    )
            );
        }
    }

    /*
     * Get String DynamoDB attribute.
     */
    private String getStringValue(
            Map<String, AttributeValue> item,
            String attributeName) {

        AttributeValue value =
                item.get(attributeName);

        if (value == null
                || value.s() == null) {

            return null;
        }

        return value.s();
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
     * Create JSON error.
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