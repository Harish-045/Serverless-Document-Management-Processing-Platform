package com.cloud.documentplatform;

import com.cloud.documentplatform.model.Document;
import com.cloud.documentplatform.service.S3DocumentProcessor;

public class TestProcessDocument {

    public static void main(String[] args) {

        System.out.println(
                "================================"
        );

        System.out.println(
                " PROCESS DOCUMENT TEST"
        );

        System.out.println(
                "================================"
        );

        /*
         * This is the REAL bucket created
         * for our project.
         */

        String bucketName =
                "serverless-document-platform-harish-2026";

        /*
         * This is the REAL object that we
         * successfully uploaded earlier.
         */

        String objectKey =
                "documents/uploads/"
                        + "TEST-DOC-1788270370473/"
                        + "sample.txt";

        System.out.println(
                "\nBucket:"
        );

        System.out.println(
                bucketName
        );

        System.out.println(
                "\nObject:"
        );

        System.out.println(
                objectKey
        );

        try {

            /*
             * Create processor.
             */

            S3DocumentProcessor processor =
                    new S3DocumentProcessor();

            /*
             * Process the real S3 object.
             */

            Document document =
                    processor.processDocument(
                            bucketName,
                            objectKey
                    );

            /*
             * Display result.
             */

            System.out.println(
                    "\n================================"
            );

            System.out.println(
                    " PROCESSING SUCCESS"
            );

            System.out.println(
                    "================================"
            );

            System.out.println(
                    "\nDocument ID: "
                            + document.getDocumentId()
            );

            System.out.println(
                    "File Name: "
                            + document.getFileName()
            );

            System.out.println(
                    "File Type: "
                            + document.getFileType()
            );

            System.out.println(
                    "File Size: "
                            + document.getFileSize()
            );

            System.out.println(
                    "S3 Key: "
                            + document.getS3Key()
            );

            System.out.println(
                    "Status: "
                            + document.getStatus()
            );

            System.out.println(
                    "Uploaded At: "
                            + document.getUploadedAt()
            );

            System.out.println(
                    "Processed At: "
                            + document.getProcessedAt()
            );

        } catch (Exception e) {

            System.out.println(
                    "\n================================"
            );

            System.out.println(
                    " PROCESSING FAILED"
            );

            System.out.println(
                    "================================"
            );

            System.out.println(
                    "Error: "
                            + e.getMessage()
            );

            e.printStackTrace();
        }

        System.out.println(
                "\n================================"
        );

        System.out.println(
                " TEST COMPLETED"
        );

        System.out.println(
                "================================"
        );
    }
}

