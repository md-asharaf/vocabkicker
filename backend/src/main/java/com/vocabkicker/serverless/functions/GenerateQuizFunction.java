package com.vocabkicker.serverless.functions;

import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.vocabkicker.serverless.model.QuizQuestion;
import com.vocabkicker.serverless.model.Question;
import com.vocabkicker.serverless.utils.CorsHelper;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Serverless function to generate a randomized 10-question quiz.
 * Returns APIGatewayProxyResponseEvent so CORS headers are correctly
 * placed in the HTTP response by the Lambda Proxy Integration.
 */
@Component("generateQuiz")
public class GenerateQuizFunction implements Function<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

    private static final int QUIZ_SIZE = 10;
    private static final int WRONG_OPTIONS_COUNT = 3;

    private final DynamoDbTable<Question> questionTable;

    public GenerateQuizFunction(final DynamoDbEnhancedClient enhancedClient) {
        this.questionTable = enhancedClient.table("Questions", TableSchema.fromBean(Question.class));
    }

    @Override
    public APIGatewayProxyResponseEvent apply(final APIGatewayProxyRequestEvent request) {
        try {
            final List<Question> allQuestions = questionTable.scan().items()
                    .stream().collect(Collectors.toList());
            Collections.shuffle(allQuestions);

            final int limit = Math.min(QUIZ_SIZE, allQuestions.size());
            final List<Question> selected = allQuestions.subList(0, limit);

            final List<QuizQuestion> quiz = selected.stream().map(q -> {
                final List<String> options = new ArrayList<>();
                options.add(q.getWord());

                final List<Question> wrongOptions = new ArrayList<>(allQuestions);
                wrongOptions.remove(q);
                Collections.shuffle(wrongOptions);

                final int wrongLimit = Math.min(WRONG_OPTIONS_COUNT, wrongOptions.size());
                for (int i = 0; i < wrongLimit; i++) {
                    options.add(wrongOptions.get(i).getWord());
                }
                Collections.shuffle(options);

                return new QuizQuestion(q.getDefinition(), q.getWord(), q.getMnemonic(), options);
            }).collect(Collectors.toList());

            return CorsHelper.ok(quiz);
        } catch (Exception e) {
            return CorsHelper.error(500, e.getMessage());
        }
    }
}