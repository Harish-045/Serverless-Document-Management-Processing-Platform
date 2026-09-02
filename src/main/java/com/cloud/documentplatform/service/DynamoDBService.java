package com.cloud.documentplatform.service;

import com.cloud.documentplatform.model.Document;
import com.cloud.documentplatform.util.AppConfig;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class DynamoDBService {

    private final DynamoDbClient dynamoDbClient;

    public DynamoDBService() {
        this.dynamoDbClient =
                AWSClientConfig.createDynamoDbClient();
    }

    /*
     * Save a document to DynamoDB.
     */
    public void saveDocument(Document document) {

        Map<String, AttributeValue> item = new HashMap<>();

        item.put(
                "documentId",
                AttributeValue.builder()
                        .s(document.getDocumentId())
                        .build()
        );

        item.put(
                "fileName",
                AttributeValue.builder()
                        .s(document.getFileName())
                        .build()
        );

        item.put(
                "fileType",
                AttributeValue.builder()
                        .s(document.getFileType())
                        .build()
        );

        item.put(
                "fileSize",
                AttributeValue.builder()
                        .n(String.valueOf(document.getFileSize()))
                        .build()
        );

        item.put(
                "s3Key",
                AttributeValue.builder()
                        .s(document.getS3Key())
                        .build()
        );

        item.put(
                "status",
                AttributeValue.builder()
                        .s(document.getStatus())
                        .build()
        );

        item.put(
                "uploadedAt",
                AttributeValue.builder()
                        .s(document.getUploadedAt())
                        .build()
        );

        if (document.getProcessedAt() != null) {

            item.put(
                    "processedAt",
                    AttributeValue.builder()
                            .s(document.getProcessedAt())
                            .build()
            );
        }

        PutItemRequest request =
                PutItemRequest.builder()
                        .tableName(AppConfig.DYNAMODB_TABLE_NAME)
                        .item(item)
                        .build();

        dynamoDbClient.putItem(request);
    }

    /*
     * Get all documents from DynamoDB.
     */
    public List<Map<String, Object>> getAllDocuments() {

        ScanRequest request =
                ScanRequest.builder()
                        .tableName(AppConfig.DYNAMODB_TABLE_NAME)
                        .build();

        ScanResponse response =
                dynamoDbClient.scan(request);

        List<Map<String, Object>> documents =
                new ArrayList<>();

        for (Map<String, AttributeValue> item
                : response.items()) {

            Map<String, Object> document =
                    new HashMap<>();

            document.put(
                    "documentId",
                    getStringValue(item, "documentId")
            );

            document.put(
                    "fileName",
                    getStringValue(item, "fileName")
            );

            document.put(
                    "fileType",
                    getStringValue(item, "fileType")
            );

            document.put(
                    "fileSize",
                    getNumberValue(item, "fileSize")
            );

            document.put(
                    "s3Key",
                    getStringValue(item, "s3Key")
            );

            document.put(
                    "status",
                    getStringValue(item, "status")
            );

            document.put(
                    "uploadedAt",
                    getStringValue(item, "uploadedAt")
            );

            String processedAt =
                    getStringValue(item, "processedAt");

            if (processedAt != null) {

                document.put(
                        "processedAt",
                        processedAt
                );
            }

            documents.add(document);
        }

        return documents;
    }

    /*
     * Safely get a String DynamoDB attribute.
     */
    private String getStringValue(
            Map<String, AttributeValue> item,
            String attributeName) {

        AttributeValue value =
                item.get(attributeName);

        if (value == null || value.s() == null) {
            return null;
        }

        return value.s();
    }

    /*
     * Safely get a Number DynamoDB attribute.
     */
    private long getNumberValue(
            Map<String, AttributeValue> item,
            String attributeName) {

        AttributeValue value =
                item.get(attributeName);

        if (value == null || value.n() == null) {
            return 0L;
        }

        return Long.parseLong(value.n());
    }
    /*
     * Get one document by document ID.
     */
    public Map<String, AttributeValue> getDocumentById(
            String documentId) {

        Map<String, AttributeValue> key =
                new HashMap<>();

        key.put(
                "documentId",
                AttributeValue.builder()
                        .s(documentId)
                        .build()
        );

        GetItemRequest request =
                GetItemRequest.builder()
                        .tableName(
                                AppConfig.DYNAMODB_TABLE_NAME
                        )
                        .key(key)
                        .build();

        GetItemResponse response =
                dynamoDbClient.getItem(request);

        return response.item();
    }
    /*
     * Delete one document from DynamoDB.
     */
    public void deleteDocument(
            String documentId) {

        Map<String, AttributeValue> key =
                new HashMap<>();

        key.put(
                "documentId",
                AttributeValue.builder()
                        .s(documentId)
                        .build()
        );

        DeleteItemRequest request =
                DeleteItemRequest.builder()
                        .tableName(
                                AppConfig.DYNAMODB_TABLE_NAME
                        )
                        .key(key)
                        .build();

        dynamoDbClient.deleteItem(request);
    }
}