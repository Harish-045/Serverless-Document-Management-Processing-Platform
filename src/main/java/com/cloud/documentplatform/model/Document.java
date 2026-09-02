
package com.cloud.documentplatform.model;

public class Document {

    private String documentId;
    private String fileName;
    private String fileType;
    private long fileSize;
    private String s3Key;
    private String status;
    private String uploadedAt;
    private String processedAt;

    public Document() {
    }

    public Document(
            String documentId,
            String fileName,
            String fileType,
            long fileSize,
            String s3Key,
            String status,
            String uploadedAt,
            String processedAt) {

        this.documentId = documentId;
        this.fileName = fileName;
        this.fileType = fileType;
        this.fileSize = fileSize;
        this.s3Key = s3Key;
        this.status = status;
        this.uploadedAt = uploadedAt;
        this.processedAt = processedAt;
    }

    public String getDocumentId() {
        return documentId;
    }

    public void setDocumentId(String documentId) {
        this.documentId = documentId;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getFileType() {
        return fileType;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
    }

    public long getFileSize() {
        return fileSize;
    }

    public void setFileSize(long fileSize) {
        this.fileSize = fileSize;
    }

    public String getS3Key() {
        return s3Key;
    }

    public void setS3Key(String s3Key) {
        this.s3Key = s3Key;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(String uploadedAt) {
        this.uploadedAt = uploadedAt;
    }

    public String getProcessedAt() {
        return processedAt;
    }

    public void setProcessedAt(String processedAt) {
        this.processedAt = processedAt;
    }

    @Override
    public String toString() {

        return "Document{" +
                "documentId='" + documentId + '\'' +
                ", fileName='" + fileName + '\'' +
                ", fileType='" + fileType + '\'' +
                ", fileSize=" + fileSize +
                ", s3Key='" + s3Key + '\'' +
                ", status='" + status + '\'' +
                ", uploadedAt='" + uploadedAt + '\'' +
                ", processedAt='" + processedAt + '\'' +
                '}';
    }
}

