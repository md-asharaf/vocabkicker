package com.vocabkicker.serverless.functions;

import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.vocabkicker.serverless.service.JwtService;
import com.vocabkicker.serverless.utils.CorsHelper;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Component("generateUploadUrl")
public class GenerateUploadUrlFunction extends ApiGatewayHandler {

  private final JwtService jwtService;
  private final String bucketName;
  private final S3Presigner presigner;

  public GenerateUploadUrlFunction(JwtService jwtService) {
    this.jwtService = jwtService;
    final String bucket = System.getenv("IMPORT_BUCKET_NAME");
    if (bucket == null || bucket.isEmpty()) {
      throw new IllegalStateException("IMPORT_BUCKET_NAME environment variable is missing");
    }
    this.bucketName = bucket;
    this.presigner = S3Presigner.create();
  }

  @Override
  protected APIGatewayProxyResponseEvent handleRequest(final APIGatewayProxyRequestEvent request) throws Exception {
    jwtService.validateAdminToken(request.getHeaders());

    Map<String, String> queryParams = request.getQueryStringParameters();
    String extension = ".csv";
    if (queryParams != null && queryParams.containsKey("ext")) {
      String extParam = queryParams.get("ext");
      if ("docx".equalsIgnoreCase(extParam)) {
        extension = ".docx";
      }
    }

    String key = UUID.randomUUID().toString() + extension;

    PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
        .signatureDuration(Duration.ofMinutes(10))
        .putObjectRequest(b -> b.bucket(bucketName).key(key))
        .build();

    PresignedPutObjectRequest presignedRequest = presigner.presignPutObject(presignRequest);

    Map<String, String> response = new HashMap<>();
    response.put("url", presignedRequest.url().toString());
    response.put("key", key);

    return CorsHelper.ok(response);
  }
}
