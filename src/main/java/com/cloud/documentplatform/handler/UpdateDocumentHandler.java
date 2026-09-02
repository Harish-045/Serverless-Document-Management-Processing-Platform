package com.cloud.documentplatform.handler;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.cloud.documentplatform.service.AWSClientConfig;
import com.cloud.documentplatform.service.S3PresignedUrlService;
import com.cloud.documentplatform.util.AppConfig;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.ConditionalCheckFailedException;
import software.amazon.awssdk.services.dynamodb.model.GetItemRequest;
import software.amazon.awssdk.services.dynamodb.model.GetItemResponse;
import software.amazon.awssdk.services.dynamodb.model.UpdateItemRequest;

import java.util.HashMap;
import java.util.Map;

public class UpdateDocumentHandler
        implements RequestHandler<Map<String, Object>, Map<String, Object>> {

    private final DynamoDbClient dynamoDbClient;
    private final ObjectMapper objectMapper;
    private final S3PresignedUrlService presignedUrlService;

    public UpdateDocumentHandler() {

        this.dynamoDbClient =
                AWSClientConfig.createDynamoDbClient();

        this.objectMapper =
                new ObjectMapper();

        this.presignedUrlService =
                new S3PresignedUrlService();
    }

    @Override
    public Map<String, Object> handleRequest(
            Map<String, Object> event,
            Context context) {

        context.getLogger().log(
                "========================================\n"
                        + "Update Document Lambda started\n"
                        + "========================================\n"
        );

        try {

            context.getLogger().log(
                    "Received event: " + event
            );

            String documentId =
                    getDocumentId(event);

            if (documentId == null ||
                    documentId.trim().isEmpty()) {

                return createProxyResponse(
                        400,
                        createMessageJson(
                                "documentId is required"
                        )
                );
            }

            documentId =
                    documentId.trim();

            /*
             * ==================================================
             * UPDATE URL REQUEST
             * ==================================================
             */

            if (isUpdateUrlRequest(event)) {

                context.getLogger().log(
                        "Operation: GENERATE UPDATE URL"
                );

                return generateUpdateUrl(
                        documentId,
                        event,
                        context
                );
            }

            /*
             * ==================================================
             * RENAME REQUEST
             * ==================================================
             */

            context.getLogger().log(
                    "Operation: RENAME DOCUMENT"
            );

            return renameDocument(
                    documentId,
                    event,
                    context
            );

        } catch (ConditionalCheckFailedException e) {

            return createProxyResponse(
                    404,
                    createMessageJson(
                            "Document not found"
                    )
            );

        } catch (Exception e) {

            context.getLogger().log(
                    "UPDATE ERROR: "
                            + e.getClass().getName()
                            + " - "
                            + e.getMessage()
            );

            return createProxyResponse(
                    500,
                    createMessageJson(
                            "Failed to update document: "
                                    + e.getMessage()
                    )
            );
        }
    }


    // ==========================================================
    // GENERATE UPDATE URL
    // ==========================================================

    private Map<String, Object> generateUpdateUrl(
            String documentId,
            Map<String, Object> event,
            Context context) {

        try {

            String body =
                    getBody(event);

            String contentType =
                    "application/octet-stream";

            if (body != null &&
                    !body.trim().isEmpty()) {

                JsonNode jsonNode =
                        objectMapper.readTree(body);

                JsonNode contentTypeNode =
                        jsonNode.get("contentType");

                if (contentTypeNode != null &&
                        !contentTypeNode.isNull()) {

                    String requestedContentType =
                            contentTypeNode.asText();

                    if (requestedContentType != null &&
                            !requestedContentType
                                    .trim()
                                    .isEmpty()) {

                        contentType =
                                requestedContentType.trim();
                    }
                }
            }

            context.getLogger().log(
                    "Content type: "
                            + contentType
            );

            // ==================================================
            // DYNAMODB KEY
            // ==================================================

            Map<String, AttributeValue> key =
                    new HashMap<>();

            key.put(
                    "documentId",
                    AttributeValue.builder()
                            .s(documentId)
                            .build()
            );

            // ==================================================
            // GET DOCUMENT
            // ==================================================

            GetItemRequest getItemRequest =
                    GetItemRequest.builder()

                            .tableName(
                                    AppConfig.DYNAMODB_TABLE_NAME
                            )

                            .key(key)

                            .projectionExpression(
                                    "documentId, fileName, fileType, s3Key"
                            )

                            .build();

            GetItemResponse getItemResponse =
                    dynamoDbClient.getItem(
                            getItemRequest
                    );

            if (!getItemResponse.hasItem() ||
                    getItemResponse.item().isEmpty()) {

                return createProxyResponse(
                        404,
                        createMessageJson(
                                "Document not found"
                        )
                );
            }

            Map<String, AttributeValue> item =
                    getItemResponse.item();

            // ==================================================
            // GET S3 KEY
            // ==================================================

            AttributeValue s3KeyAttribute =
                    item.get("s3Key");

            if (s3KeyAttribute == null ||
                    s3KeyAttribute.s() == null ||
                    s3KeyAttribute.s()
                            .trim()
                            .isEmpty()) {

                return createProxyResponse(
                        500,
                        createMessageJson(
                                "Document S3 key is missing"
                        )
                );
            }

            String s3Key =
                    s3KeyAttribute.s();

            String fileName =
                    getAttributeString(
                            item,
                            "fileName"
                    );

            String fileType =
                    getAttributeString(
                            item,
                            "fileType"
                    );

            context.getLogger().log(
                    "Document found"
            );

            context.getLogger().log(
                    "S3 key: "
                            + s3Key
            );

            // ==================================================
            // GENERATE PRESIGNED URL
            // ==================================================

            String uploadUrl =
                    presignedUrlService
                            .generateUploadUrl(
                                    s3Key,
                                    contentType
                            );

            context.getLogger().log(
                    "Presigned URL generated successfully"
            );

            // ==================================================
            // RESPONSE BODY
            // ==================================================

            Map<String, Object> responseBody =
                    new HashMap<>();

            responseBody.put(
                    "status",
                    "SUCCESS"
            );

            responseBody.put(
                    "message",
                    "Presigned update URL generated successfully"
            );

            responseBody.put(
                    "documentId",
                    documentId
            );

            responseBody.put(
                    "fileName",
                    fileName
            );

            responseBody.put(
                    "fileType",
                    fileType
            );

            responseBody.put(
                    "s3Key",
                    s3Key
            );

            responseBody.put(
                    "contentType",
                    contentType
            );

            responseBody.put(
                    "uploadUrl",
                    uploadUrl
            );

            String responseJson =
                    objectMapper.writeValueAsString(
                            responseBody
                    );

            return createProxyResponse(
                    200,
                    responseJson
            );

        } catch (Exception e) {

            context.getLogger().log(
                    "Generate update URL error: "
                            + e.getClass().getName()
                            + " - "
                            + e.getMessage()
            );

            try {

                return createProxyResponse(
                        500,
                        createMessageJson(
                                "Failed to generate update URL: "
                                        + e.getMessage()
                        )
                );

            } catch (Exception ignored) {

                return createProxyResponse(
                        500,
                        "{\"message\":\"Failed to generate update URL\"}"
                );
            }
        }
    }


    // ==========================================================
    // RENAME DOCUMENT
    // ==========================================================

    private Map<String, Object> renameDocument(
            String documentId,
            Map<String, Object> event,
            Context context)
            throws Exception {

        String body =
                getBody(event);

        if (body == null ||
                body.trim().isEmpty()) {

            return createProxyResponse(
                    400,
                    createMessageJson(
                            "Request body is required"
                    )
            );
        }

        JsonNode jsonNode =
                objectMapper.readTree(body);

        JsonNode fileNameNode =
                jsonNode.get("fileName");

        if (fileNameNode == null ||
                fileNameNode.isNull()) {

            return createProxyResponse(
                    400,
                    createMessageJson(
                            "fileName is required"
                    )
            );
        }

        String fileName =
                fileNameNode.asText();

        if (fileName == null ||
                fileName.trim().isEmpty()) {

            return createProxyResponse(
                    400,
                    createMessageJson(
                            "fileName cannot be empty"
                    )
            );
        }

        fileName =
                fileName.trim();

        if (fileName.length() > 255) {

            return createProxyResponse(
                    400,
                    createMessageJson(
                            "File name must be 255 characters or less"
                    )
            );
        }

        if (fileName.contains("/") ||
                fileName.contains("\\") ||
                fileName.contains("\u0000")) {

            return createProxyResponse(
                    400,
                    createMessageJson(
                            "Invalid file name"
                    )
            );
        }

        // ==================================================
        // UPDATE DYNAMODB
        // ==================================================

        Map<String, AttributeValue> key =
                new HashMap<>();

        key.put(
                "documentId",
                AttributeValue.builder()
                        .s(documentId)
                        .build()
        );

        Map<String, AttributeValue> expressionValues =
                new HashMap<>();

        expressionValues.put(
                ":fileName",
                AttributeValue.builder()
                        .s(fileName)
                        .build()
        );

        UpdateItemRequest request =
                UpdateItemRequest.builder()

                        .tableName(
                                AppConfig.DYNAMODB_TABLE_NAME
                        )

                        .key(key)

                        .updateExpression(
                                "SET fileName = :fileName"
                        )

                        .expressionAttributeValues(
                                expressionValues
                        )

                        .conditionExpression(
                                "attribute_exists(documentId)"
                        )

                        .build();

        dynamoDbClient.updateItem(
                request
        );

        // ==================================================
        // RESPONSE
        // ==================================================

        Map<String, Object> responseBody =
                new HashMap<>();

        responseBody.put(
                "status",
                "SUCCESS"
        );

        responseBody.put(
                "message",
                "Document updated successfully"
        );

        responseBody.put(
                "documentId",
                documentId
        );

        responseBody.put(
                "fileName",
                fileName
        );

        String responseJson =
                objectMapper.writeValueAsString(
                        responseBody
                );

        return createProxyResponse(
                200,
                responseJson
        );
    }


    // ==========================================================
    // DETECT UPDATE URL REQUEST
    // ==========================================================

    private boolean isUpdateUrlRequest(
            Map<String, Object> event) {

        if (event == null) {
            return false;
        }

        Object routeKey =
                event.get("routeKey");

        if (routeKey != null &&
                String.valueOf(routeKey)
                        .contains("/update-url")) {

            return true;
        }

        Object rawPath =
                event.get("rawPath");

        if (rawPath != null &&
                String.valueOf(rawPath)
                        .contains("/update-url")) {

            return true;
        }

        Object path =
                event.get("path");

        if (path != null &&
                String.valueOf(path)
                        .contains("/update-url")) {

            return true;
        }

        return false;
    }


    // ==========================================================
    // GET DOCUMENT ID
    // ==========================================================

    private String getDocumentId(
            Map<String, Object> event) {

        if (event == null) {
            return null;
        }

        Object pathParameters =
                event.get("pathParameters");

        if (pathParameters instanceof Map<?, ?>) {

            Map<?, ?> parameters =
                    (Map<?, ?>) pathParameters;

            Object value =
                    parameters.get("documentId");

            if (value != null) {

                return String.valueOf(
                        value
                );
            }
        }

        Object directId =
                event.get("documentId");

        if (directId != null) {

            return String.valueOf(
                    directId
            );
        }

        return null;
    }


    // ==========================================================
    // GET BODY
    // ==========================================================

    private String getBody(
            Map<String, Object> event) {

        if (event == null) {
            return null;
        }

        Object body =
                event.get("body");

        if (body != null) {

            return String.valueOf(
                    body
            );
        }

        return null;
    }


    // ==========================================================
    // GET DYNAMODB STRING
    // ==========================================================

    private String getAttributeString(
            Map<String, AttributeValue> item,
            String attributeName) {

        AttributeValue value =
                item.get(attributeName);

        if (value == null ||
                value.s() == null) {

            return "";
        }

        return value.s();
    }


    // ==========================================================
    // CREATE PROXY RESPONSE
    // ==========================================================

    private Map<String, Object> createProxyResponse(
            int statusCode,
            String body) {

        Map<String, Object> response =
                new HashMap<>();

        response.put(
                "statusCode",
                statusCode
        );

        response.put(
                "headers",
                createHeaders()
        );

        response.put(
                "body",
                body
        );

        response.put(
                "isBase64Encoded",
                false
        );

        return response;
    }


    // ==========================================================
    // CORS HEADERS
    // ==========================================================

    private Map<String, String> createHeaders() {

        Map<String, String> headers =
                new HashMap<>();

        headers.put(
                "Access-Control-Allow-Origin",
                "*"
        );

        headers.put(
                "Access-Control-Allow-Headers",
                "*"
        );

        headers.put(
                "Access-Control-Allow-Methods",
                "GET,POST,PUT,DELETE,OPTIONS"
        );

        headers.put(
                "Content-Type",
                "application/json"
        );

        return headers;
    }


    // ==========================================================
    // MESSAGE JSON
    // ==========================================================

    private String createMessageJson(
            String message) {

        try {

            Map<String, Object> body =
                    new HashMap<>();

            body.put(
                    "message",
                    message
            );

            return objectMapper.writeValueAsString(
                    body
            );

        } catch (Exception e) {

            return "{\"message\":\"Request failed\"}";
        }
    }
}