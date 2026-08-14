package com.vocabkicker.serverless.functions;

import com.amazonaws.services.lambda.runtime.events.S3Event;
import com.vocabkicker.serverless.entity.Question;
import com.vocabkicker.serverless.service.QuestionService;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVRecord;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFTable;
import org.apache.poi.xwpf.usermodel.XWPFTableRow;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;

import java.io.InputStreamReader;
import java.io.Reader;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;

@Component("batchCreateQuestions")
public class BatchCreateQuestionsFunction implements Function<S3Event, String> {

  private static final Logger logger = LoggerFactory.getLogger(BatchCreateQuestionsFunction.class);

  private final QuestionService questionService;
  private final S3Client s3Client;

  public BatchCreateQuestionsFunction(QuestionService questionService) {
    this.questionService = questionService;
    this.s3Client = S3Client.create();
  }

  @Override
  public String apply(S3Event s3Event) {
    s3Event.getRecords().forEach(record -> {
      String bucket = record.getS3().getBucket().getName();
      String key = record.getS3().getObject().getKey();

      logger.info("Processing file from S3: bucket={}, key={}", bucket, key);

      try (ResponseInputStream<GetObjectResponse> s3Object = s3Client.getObject(GetObjectRequest.builder()
          .bucket(bucket)
          .key(key)
          .build())) {

        List<Question> questions = new ArrayList<>();
        if (key.toLowerCase().endsWith(".csv")) {
          questions = parseCsv(s3Object);
        } else if (key.toLowerCase().endsWith(".docx")) {
          questions = parseDocx(s3Object);
        } else {
          logger.warn("Unsupported file extension for key: {}", key);
        }

        logger.info("Parsed {} questions. Saving to database...", questions.size());

        for (Question q : questions) {
          questionService.createQuestion(q);
        }

        logger.info("Successfully saved {} questions.", questions.size());

      } catch (Exception e) {
        logger.error("Error processing file {} from bucket {}", key, bucket, e);
        throw new RuntimeException(e);
      }
    });

    return "Success";
  }

  private List<Question> parseCsv(ResponseInputStream<GetObjectResponse> inputStream) throws Exception {
    List<Question> questions = new ArrayList<>();
    try (Reader in = new InputStreamReader(inputStream)) {
      Iterable<CSVRecord> records = CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).build().parse(in);
      for (CSVRecord record : records) {
        if (record.size() >= 3) {
          Question q = new Question();
          q.setWord(record.get(0).trim());
          q.setMnemonic(record.get(1).trim());
          q.setDefinition(record.get(2).trim());
          questions.add(q);
        }
      }
    }
    return questions;
  }

  private List<Question> parseDocx(ResponseInputStream<GetObjectResponse> inputStream) throws Exception {
    List<Question> questions = new ArrayList<>();
    try (XWPFDocument document = new XWPFDocument(inputStream)) {
      for (XWPFTable table : document.getTables()) {
        boolean isFirstRow = true;
        for (XWPFTableRow row : table.getRows()) {
          if (isFirstRow) {
            isFirstRow = false;
            continue; // skip header
          }
          if (row.getTableCells().size() >= 3) {
            Question q = new Question();
            q.setWord(row.getCell(0).getText().trim());
            q.setMnemonic(row.getCell(1).getText().trim());
            q.setDefinition(row.getCell(2).getText().trim());
            questions.add(q);
          }
        }
      }
    }
    return questions;
  }
}
