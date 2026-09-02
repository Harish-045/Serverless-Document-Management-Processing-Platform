package com.cloud.documentplatform.service;

import com.cloud.documentplatform.util.AppConfig;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;

import java.time.Duration;

public class S3PresignedUrlService {

    private final S3Presigner s3Presigner;

    public S3PresignedUrlService() {

        this.s3Presigner = S3Presigner.builder()
                .region(
                        software.amazon.awssdk.regions.Region
                                .of(AppConfig.AWS_REGION)
                )
                .build();
    }

    /*
     * Generate temporary S3 upload URL.
     */
    public String generateUploadUrl(
            String objectKey,
            String contentType) {

        PutObjectRequest putObjectRequest =
                PutObjectRequest.builder()
                        .bucket(AppConfig.S3_BUCKET_NAME)
                        .key(objectKey)
                        .contentType(contentType)
                        .build();

        PresignedPutObjectRequest presignedRequest =
                s3Presigner.presignPutObject(
                        builder -> builder
                                .signatureDuration(
                                        Duration.ofMinutes(10)
                                )
                                .putObjectRequest(
                                        putObjectRequest
                                )
                );

        return presignedRequest.url().toString();
    }

    /*
     * Generate temporary S3 download URL.
     */
    public String generateDownloadUrl(
            String objectKey) {

        GetObjectRequest getObjectRequest =
                GetObjectRequest.builder()
                        .bucket(AppConfig.S3_BUCKET_NAME)
                        .key(objectKey)
                        .build();

        PresignedGetObjectRequest presignedRequest =
                s3Presigner.presignGetObject(
                        builder -> builder
                                .signatureDuration(
                                        Duration.ofMinutes(10)
                                )
                                .getObjectRequest(
                                        getObjectRequest
                                )
                );

        return presignedRequest.url().toString();
    }

    /*
     * Close the S3 presigner.
     */
    public void close() {

        s3Presigner.close();
    }
}