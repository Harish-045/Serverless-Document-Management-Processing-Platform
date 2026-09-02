
package com.cloud.documentplatform.service;

import com.cloud.documentplatform.util.AppConfig;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.s3.S3Client;

public class AWSClientConfig {

    private static final Region REGION =
            Region.of(AppConfig.AWS_REGION);

    private AWSClientConfig() {
        // Prevent object creation
    }

    public static S3Client createS3Client() {

        return S3Client.builder()
                .region(REGION)
                .build();
    }

    public static DynamoDbClient createDynamoDbClient() {

        return DynamoDbClient.builder()
                .region(REGION)
                .build();
    }
}

