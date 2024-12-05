package com.osrs.xpgoals.lambda;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.osrs.xpgoals.data.PlayerService;
import com.osrs.xpgoals.model.Player;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

public class GetPlayerHandlerTest {
    @Mock
    private PlayerService playerService;

    @Mock
    private Context context;

    private GetPlayerHandler handler;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        handler = new GetPlayerHandler(playerService);
    }

    @Test
    void handleRequest_WhenPlayerExists_ReturnsSuccessResponse() {
        // Arrange
        String rsn = "testPlayer";
        Player player = Player.builder()
                .rsn(rsn)
                .lastUpdated("2023-12-05T00:00:00Z")
                .build();

        Map<String, String> pathParameters = new HashMap<>();
        pathParameters.put("rsn", rsn);

        APIGatewayProxyRequestEvent request = new APIGatewayProxyRequestEvent()
                .withPathParameters(pathParameters);

        when(playerService.getPlayer(rsn)).thenReturn(Optional.of(player));

        // Act
        APIGatewayProxyResponseEvent response = handler.handleRequest(request, context);

        // Assert
        assertEquals(200, response.getStatusCode());
        String expectedJson = "{\"rsn\":\"testPlayer\",\"lastUpdated\":\"2023-12-05T00:00:00Z\"}";
        assertEquals(expectedJson, response.getBody());
    }

    @Test
    void handleRequest_WhenPlayerDoesNotExist_Returns404Response() {
        // Arrange
        String rsn = "nonExistentPlayer";
        Map<String, String> pathParameters = new HashMap<>();
        pathParameters.put("rsn", rsn);

        APIGatewayProxyRequestEvent request = new APIGatewayProxyRequestEvent()
                .withPathParameters(pathParameters);

        when(playerService.getPlayer(rsn)).thenReturn(Optional.empty());

        // Act
        APIGatewayProxyResponseEvent response = handler.handleRequest(request, context);

        // Assert
        assertEquals(404, response.getStatusCode());
        assertEquals("Player not found", response.getBody());
    }

    @Test
    void handleRequest_WhenRsnIsMissing_Returns400Response() {
        // Arrange
        APIGatewayProxyRequestEvent request = new APIGatewayProxyRequestEvent()
                .withPathParameters(new HashMap<>());

        // Act
        APIGatewayProxyResponseEvent response = handler.handleRequest(request, context);

        // Assert
        assertEquals(400, response.getStatusCode());
        assertEquals("RSN is required", response.getBody());
    }
} 