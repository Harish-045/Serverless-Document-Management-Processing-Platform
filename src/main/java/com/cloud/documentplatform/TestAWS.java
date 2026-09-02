
        package com.cloud.documentplatform;

import com.cloud.documentplatform.model.Document;
import com.cloud.documentplatform.service.DynamoDBService;
import com.cloud.documentplatform.service.S3Service;
import com.cloud.documentplatform.util.AppConfig;

import java.time.Instant;

public class TestAWS {

    public static void main(String[] args) {

        System.out.println("================================");
        System.out.println(" AWS CONNECTION TEST");
        System.out.println("================================");

        // -------------------------
        // Test S3
        // -------------------------

        System.out.println("\nTesting S3...");

        S3Service s3Service = new S3Service();

        boolean bucketExists =
                s3Service.bucketExists(
                        AppConfig.S3_BUCKET_NAME
                );

        if (bucketExists) {

            System.out.println(
                    "SUCCESS: S3 bucket accessible"
            );

            System.out.println(
                    "Bucket: "
                            + AppConfig.S3_BUCKET_NAME
            );

        } else {

            System.out.println(
                    "FAILED: Cannot access S3 bucket"
            );

            return;
        }

        // -------------------------
        // Test DynamoDB
        // -------------------------

        System.out.println("\nTesting DynamoDB...");

        DynamoDBService dynamoDBService =
                new DynamoDBService();

        String documentId =
                "TEST-" + System.currentTimeMillis();

        Document document =
                new Document(
                        documentId,
                        "test-document.pdf",
                        "application/pdf",
                        1024,
                        "documents/uploads/"
                                + documentId
                                + "/test-document.pdf",
                        "TEST",
                        Instant.now().toString(),
                        null
                );

        try {

            dynamoDBService.saveDocument(document);

            System.out.println(
                    "SUCCESS: DynamoDB record created"
            );

            System.out.println(
                    "Document ID: "
                            + documentId
            );

        } catch (Exception e) {

            System.out.println(
                    "FAILED: DynamoDB operation failed"
            );

            e.printStackTrace();
        }

        System.out.println("\n================================");
        System.out.println(" TEST COMPLETED");
        System.out.println("================================");
    }
}

