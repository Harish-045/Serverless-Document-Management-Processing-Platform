package com.cloud.documentplatform.handler;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.cloud.documentplatform.service.DynamoDBService;
import com.cloud.documentplatform.service.S3Service;
import com.fasterxml.jackson.databind.ObjectMapper;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

import java.util.HashMap;
import java.util.Map;

public class DeleteDocumentHandler
        implements RequestHandler<
        APIGatewayProxyRequestEvent,
        APIGatewayProxyResponseEvent> {

    private final DynamoDBService dynamoDBService;
    private final S3Service s3Service;
    private final ObjectMapper objectMapper;

    public DeleteDocumentHandler() {

        this.dynamoDBService =
                new DynamoDBService();

        this.s3Service =
                new S3Service();

        this.objectMapper =
                new ObjectMapper();
    }

    @Override
    public APIGatewayProxyResponseEvent handleRequest(
            APIGatewayProxyRequestEvent input,
            Context context) {

        context.getLogger().log(
                "Delete Document Lambda started"
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
             * Get path parameters.
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
                    "Deleting document: "
                            + documentId
            );

            /*
             * Find document first.
             *
             * We need the S3 key before deleting
             * the DynamoDB record.
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
             * Delete actual file from S3.
             */
            context.getLogger().log(
                    "Deleting S3 object: "
                            + s3Key
            );

            s3Service.deleteObject(s3Key);

            /*
             * Delete metadata from DynamoDB.
             */
            context.getLogger().log(
                    "Deleting DynamoDB record: "
                            + documentId
            );

            dynamoDBService.deleteDocument(
                    documentId
            );

            context.getLogger().log(
                    "Document deleted successfully: "
                            + documentId
            );

            /*
             * Success response.
             */
            Map<String, Object> response =
                    new HashMap<>();

            response.put(
                    "status",
                    "SUCCESS"
            );

            response.put(
                    "message",
                    "Document deleted successfully"
            );

            response.put(
                    "documentId",
                    documentId
            );

            response.put(
                    "s3Key",
                    s3Key
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
                            "Failed to delete document"
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
                "OPTIONS,DELETE"
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