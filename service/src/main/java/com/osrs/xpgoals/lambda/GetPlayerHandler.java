package com.osrs.xpgoals.lambda;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.google.inject.Guice;
import com.google.inject.Injector;
import com.osrs.xpgoals.data.PlayerService;
import com.osrs.xpgoals.di.PlayerModule;
import com.osrs.xpgoals.model.Player;
import lombok.extern.log4j.Log4j2;
import com.fasterxml.jackson.databind.ObjectMapper;

@Log4j2
public class GetPlayerHandler implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {
    private final PlayerService playerService;
    private final ObjectMapper objectMapper;

    public GetPlayerHandler() {
        Injector injector = Guice.createInjector(new PlayerModule());
        this.playerService = injector.getInstance(PlayerService.class);
        this.objectMapper = new ObjectMapper();
    }

    // Constructor for testing
    GetPlayerHandler(PlayerService playerService) {
        this.playerService = playerService;
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent input, Context context) {
        try {
            String rsn = input.getPathParameters().get("rsn");
            if (rsn == null || rsn.trim().isEmpty()) {
                return new APIGatewayProxyResponseEvent()
                        .withStatusCode(400)
                        .withBody("RSN is required");
            }

            var player = playerService.getPlayer(rsn);
            if (player.isPresent()) {
                return new APIGatewayProxyResponseEvent()
                        .withStatusCode(200)
                        .withBody(objectMapper.writeValueAsString(player.get()));
            }

            return new APIGatewayProxyResponseEvent()
                    .withStatusCode(404)
                    .withBody("Player not found");

        } catch (Exception e) {
            log.error("Error processing request", e);
            return new APIGatewayProxyResponseEvent()
                    .withStatusCode(502)
                    .withBody(e.getMessage());
        }
    }
} 