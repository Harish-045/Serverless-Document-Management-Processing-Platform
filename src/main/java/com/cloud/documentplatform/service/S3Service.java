package com.cloud.documentplatform.service;

import com.cloud.documentplatform.util.AppConfig;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;

public class S3Service {

    private final S3Client s3Client;

    public S3Service() {
        this.s3Client = AWSClientConfig.createS3Client();
    }

    public boolean bucketExists(String bucketName) {

        try {

            HeadBucketRequest request =
                    HeadBucketRequest.builder()
                            .bucket(bucketName)
                            .build();

            s3Client.headBucket(request);

            return true;

        } catch (Exception e) {

            return false;
        }
    }

    /*
     * Delete an object from S3.
     */
    public void deleteObject(String objectKey) {

        DeleteObjectRequest request =
                DeleteObjectRequest.builder()
                        .bucket(AppConfig.S3_BUCKET_NAME)
                        .key(objectKey)
                        .build();

        s3Client.deleteObject(request);
    }
}