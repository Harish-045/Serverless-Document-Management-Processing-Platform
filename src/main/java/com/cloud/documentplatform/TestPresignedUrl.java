package com.cloud.documentplatform;

import com.cloud.documentplatform.service.S3PresignedUrlService;
import com.cloud.documentplatform.util.AppConfig;

public class TestPresignedUrl {

    public static void main(String[] args) {

        System.out.println(
                "================================"
        );

        System.out.println(
                " S3 PRESIGNED URL TEST"
        );

        System.out.println(
                "================================"
        );

        String documentId =
                "TEST-DOC-" + System.currentTimeMillis();

        String fileName =
                "test-document.txt";

        String contentType =
                "text/plain";

        String objectKey =
                "documents/uploads/"
                        + documentId
                        + "/"
                        + fileName;

        System.out.println(
                "\nBucket: "
                        + AppConfig.S3_BUCKET_NAME
        );

        System.out.println(
                "Object Key: "
                        + objectKey
        );

        S3PresignedUrlService service =
                new S3PresignedUrlService();

        try {

            String uploadUrl =
                    service.generateUploadUrl(
                            objectKey,
                            contentType
                    );

            System.out.println(
                    "\nSUCCESS!"
            );

            System.out.println(
                    "\nPresigned Upload URL:"
            );

            System.out.println(
                    uploadUrl
            );

            System.out.println(
                    "\nURL expires in 10 minutes."
            );

        } catch (Exception e) {

            System.out.println(
                    "\nFAILED!"
            );

            e.printStackTrace();

        } finally {

            service.close();
        }

        System.out.println(
                "\n================================"
        );
    }
}

