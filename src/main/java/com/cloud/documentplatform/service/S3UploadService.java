
package com.cloud.documentplatform.service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;

public class S3UploadService {

    private final HttpClient httpClient;

    public S3UploadService() {
        this.httpClient = HttpClient.newHttpClient();
    }

    public boolean uploadFile(
            Path filePath,
            String contentType,
            String presignedUrl)
            throws IOException, InterruptedException {

        if (!Files.exists(filePath)) {
            throw new IOException(
                    "File does not exist: "
                            + filePath
            );
        }

        byte[] fileBytes =
                Files.readAllBytes(filePath);

        HttpRequest request =
                HttpRequest.newBuilder()
                        .uri(URI.create(presignedUrl))
                        .header(
                                "Content-Type",
                                contentType
                        )
                        .PUT(
                                HttpRequest.BodyPublishers
                                        .ofByteArray(fileBytes)
                        )
                        .build();

        HttpResponse<String> response =
                httpClient.send(
                        request,
                        HttpResponse.BodyHandlers.ofString()
                );

        System.out.println(
                "S3 HTTP Status: "
                        + response.statusCode()
        );

        if (response.statusCode() >= 200
                && response.statusCode() < 300) {

            return true;
        }

        System.out.println(
                "S3 Error Response:"
        );

        System.out.println(
                response.body()
        );

        return false;
    }
}

