package com.cloud.documentplatform.handler;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.S3Event;
import com.amazonaws.services.lambda.runtime.events.models.s3.S3EventNotification;
import com.cloud.documentplatform.model.Document;
import com.cloud.documentplatform.service.DynamoDBService;
import com.cloud.documentplatform.service.S3DocumentProcessor;

public class ProcessDocumentHandler
        implements RequestHandler<S3Event, String> {

    private final S3DocumentProcessor documentProcessor;

    public ProcessDocumentHandler() {
        this.documentProcessor =
                new S3DocumentProcessor();
    }

    @Override
    public String handleRequest(
            S3Event event,
            Context context) {

        log(
                context,
                "Process Document Lambda started"
        );

        if (event == null ||
                event.getRecords() == null ||
                event.getRecords().isEmpty()) {

            log(
                    context,
                    "No S3 records found"
            );

            return "No records to process";
        }

        int processedCount = 0;

        for (
                S3EventNotification.S3EventNotificationRecord record
                : event.getRecords()
        ) {

            try {

                String bucketName =
                        record.getS3()
                                .getBucket()
                                .getName();

                String objectKey =
                        record.getS3()
                                .getObject()
                                .getUrlDecodedKey();

                log(
                        context,
                        "Processing: s3://"
                                + bucketName
                                + "/"
                                + objectKey
                );

                Document document =
                        documentProcessor
                                .processDocument(
                                        bucketName,
                                        objectKey
                                );

                log(
                        context,
                        "Document processed successfully: "
                                + document.getDocumentId()
                );

                processedCount++;

            } catch (Exception e) {

                log(
                        context,
                        "Failed to process S3 record: "
                                + e.getMessage()
                );

                throw new RuntimeException(
                        "Failed to process S3 document",
                        e
                );
            }
        }

        return "Processed "
                + processedCount
                + " document(s)";
    }

    private void log(
            Context context,
            String message) {

        if (context != null) {

            context.getLogger().log(
                    message + "\n"
            );

        } else {

            System.out.println(message);
        }
    }
}

