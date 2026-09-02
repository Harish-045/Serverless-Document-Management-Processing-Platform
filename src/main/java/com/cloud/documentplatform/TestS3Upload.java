package com.cloud.documentplatform;

import com.cloud.documentplatform.service.S3PresignedUrlService;
import com.cloud.documentplatform.service.S3UploadService;
import com.cloud.documentplatform.util.AppConfig;

import java.nio.file.Path;

public class TestS3Upload {

    public static void main(String[] args) {

        System.out.println(
                "================================"
        );

        System.out.println(
                " S3 FILE UPLOAD TEST"
        );

        System.out.println(
                "================================"
        );

        String documentId =
                "TEST-DOC-" + System.currentTimeMillis();

        String fileName =
                "sample.txt";

        String contentType =
                "text/plain";

        String objectKey =
                "documents/uploads/"
                        + documentId
                        + "/"
                        + fileName;

        Path filePath =
                Path.of(
                        "test-files",
                        fileName
                );

        System.out.println(
                "\nBucket: "
                        + AppConfig.S3_BUCKET_NAME
        );

        System.out.println(
                "File: "
                        + filePath
        );

        System.out.println(
                "S3 Key: "
                        + objectKey
        );

        S3PresignedUrlService presignedUrlService =
                new S3PresignedUrlService();

        S3UploadService uploadService =
                new S3UploadService();

        try {

            // -----------------------------
            // Generate presigned URL
            // -----------------------------

            System.out.println(
                    "\nGenerating presigned URL..."
            );

            String uploadUrl =
                    presignedUrlService
                            .generateUploadUrl(
                                    objectKey,
                                    contentType
                            );

            System.out.println(
                    "Presigned URL generated."
            );

            // -----------------------------
            // Upload file
            // -----------------------------

            System.out.println(
                    "\nUploading file to S3..."
            );

            boolean uploaded =
                    uploadService.uploadFile(
                            filePath,
                            contentType,
                            uploadUrl
                    );

            // -----------------------------
            // Result
            // -----------------------------

            if (uploaded) {

                System.out.println(
                        "\nSUCCESS!"
                );

                System.out.println(
                        "File uploaded successfully."
                );

                System.out.println(
                        "S3 Key: "
                                + objectKey
                );

            } else {

                System.out.println(
                        "\nUPLOAD FAILED!"
                );
            }

        } catch (Exception e) {

            System.out.println(
                    "\nERROR!"
            );

            e.printStackTrace();

        } finally {

            presignedUrlService.close();
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

