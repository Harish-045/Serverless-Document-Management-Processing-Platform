
package com.cloud.documentplatform.util;

public class AppConfig {

    private AppConfig() {
        // Prevent object creation
    }

    public static final String AWS_REGION = "ap-south-1";

    /*
     * Replace this with the EXACT S3 bucket name
     * you created in AWS.
     */
    public static final String S3_BUCKET_NAME =
            "serverless-document-platform-harish-2026";

    public static final String DYNAMODB_TABLE_NAME =
            "Documents";
}

