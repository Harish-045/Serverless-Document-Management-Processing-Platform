package com.cloud.documentplatform.service;

import com.cloud.documentplatform.model.Document;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectResponse;

import java.time.Instant;

public class S3DocumentProcessor {

    private final S3Client s3Client;
    private final DynamoDBService dynamoDBService;

    public S3DocumentProcessor() {

        this.s3Client =
                AWSClientConfig.createS3Client();

        this.dynamoDBService =
                new DynamoDBService();
    }

    public Document processDocument(
            String bucketName,
            String objectKey) {

        System.out.println(
                "Reading S3 object metadata..."
        );

        /*
         * -----------------------------------------
         * Get object metadata from S3
         * -----------------------------------------
         */

        HeadObjectRequest request =
                HeadObjectRequest.builder()
                        .bucket(bucketName)
                        .key(objectKey)
                        .build();

        HeadObjectResponse response =
                s3Client.headObject(request);

        long fileSize =
                response.contentLength();

        String contentType =
                response.contentType();

        /*
         * Some S3 objects may not have a content type.
         */

        if (contentType == null ||
                contentType.isBlank()) {

            contentType =
                    "application/octet-stream";
        }

        /*
         * -----------------------------------------
         * Extract document ID
         * -----------------------------------------
         */

        String documentId =
                extractDocumentId(objectKey);

        /*
         * -----------------------------------------
         * Extract file name
         * -----------------------------------------
         */

        String fileName =
                extractFileName(objectKey);

        /*
         * -----------------------------------------
         * Create Document
         * -----------------------------------------
         */

        String currentTime =
                Instant.now().toString();

        Document document =
                new Document(
                        documentId,
                        fileName,
                        contentType,
                        fileSize,
                        objectKey,
                        "PROCESSED",
                        currentTime,
                        currentTime
                );

        /*
         * -----------------------------------------
         * Save to DynamoDB
         * -----------------------------------------
         */

        dynamoDBService.saveDocument(
                document
        );

        System.out.println(
                "Document saved to DynamoDB:"
        );

        System.out.println(
                "Document ID: "
                        + documentId
        );

        System.out.println(
                "File Name: "
                        + fileName
        );

        System.out.println(
                "Content Type: "
                        + contentType
        );

        System.out.println(
                "File Size: "
                        + fileSize
        );

        return document;
    }

    private String extractDocumentId(
            String objectKey) {

        /*
         * Expected structure:
         *
         * documents/uploads/DOC-123/file.pdf
         */

        String[] parts =
                objectKey.split("/");

        if (parts.length >= 4) {

            return parts[2];
        }

        return "UNKNOWN-"
                + System.currentTimeMillis();
    }

    private String extractFileName(
            String objectKey) {

        int lastSlash =
                objectKey.lastIndexOf('/');

        if (lastSlash >= 0 &&
                lastSlash < objectKey.length() - 1) {

            return objectKey.substring(
                    lastSlash + 1
            );
        }

        return objectKey;
    }
}

