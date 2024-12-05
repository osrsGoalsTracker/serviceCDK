package com.osrs.xpgoals.lambda;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.osrs.xpgoals.data.PlayerService;
import com.osrs.xpgoals.persistence.DynamoDbPlayerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;
import software.amazon.awssdk.services.dynamodb.model.PutItemResponse;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

public class SetPlayerHandlerTest {

    @Mock
    private DynamoDbClient dynamoDbClient;

    @Mock
    private Context context;

    private SetPlayerHandler handler;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        when(dynamoDbClient.putItem(any(PutItemRequest.class))).thenReturn(PutItemResponse.builder().build());
        
        DynamoDbPlayerRepository playerRepository = new DynamoDbPlayerRepository(dynamoDbClient);
        PlayerService playerService = new PlayerService(playerRepository);
        handler = new SetPlayerHandler(playerService);
    }

    @Test
    public void shouldSavePlayerSuccessfully() {
        // Arrange
        APIGatewayProxyRequestEvent request = new APIGatewayProxyRequestEvent();
        Map<String, String> pathParams = new HashMap<>();
        pathParams.put("rsn", "test player");
        request.setPathParameters(pathParams);

        // Act
        APIGatewayProxyResponseEvent response = handler.handleRequest(request, context);

        // Assert
        assertEquals(200, response.getStatusCode(), "Should successfully save player");
        assertEquals("Player saved successfully", response.getBody());
    }

    @Test
    public void shouldReturnError_WhenRsnIsMissing() {
        // Arrange
        APIGatewayProxyRequestEvent request = new APIGatewayProxyRequestEvent();

        // Act
        APIGatewayProxyResponseEvent response = handler.handleRequest(request, context);

        // Assert
        assertEquals(400, response.getStatusCode(), "Should return bad request when RSN is missing");
        assertEquals("RSN is required in the path", response.getBody());
    }

    @Test
    public void shouldReturnError_WhenRsnIsEmpty() {
        // Arrange
        APIGatewayProxyRequestEvent request = new APIGatewayProxyRequestEvent();
        Map<String, String> pathParams = new HashMap<>();
        pathParams.put("rsn", "  ");
        request.setPathParameters(pathParams);

        // Act
        APIGatewayProxyResponseEvent response = handler.handleRequest(request, context);

        // Assert
        assertEquals(400, response.getStatusCode(), "Should return bad request when RSN is empty");
        assertEquals("RSN cannot be empty", response.getBody());
    }
} 