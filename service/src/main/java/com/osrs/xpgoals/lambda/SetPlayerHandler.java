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

import java.util.Map;

@Log4j2
public class SetPlayerHandler implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {
    private final PlayerService playerService;

    public SetPlayerHandler() {
        Injector injector = Guice.createInjector(new PlayerModule());
        this.playerService = injector.getInstance(PlayerService.class);
    }

    // Constructor for testing
    SetPlayerHandler(PlayerService playerService) {
        this.playerService = playerService;
    }

    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent input, Context context) {
        try {
            Map<String, String> pathParams = input.getPathParameters();
            if (pathParams == null || !pathParams.containsKey("rsn")) {
                return new APIGatewayProxyResponseEvent()
                        .withStatusCode(400)
                        .withBody("RSN is required in the path");
            }

            String rsn = pathParams.get("rsn");
            if (rsn.trim().isEmpty()) {
                return new APIGatewayProxyResponseEvent()
                        .withStatusCode(400)
                        .withBody("RSN cannot be empty");
            }

            Player player = Player.builder()
                    .rsn(rsn)
                    .build();

            playerService.savePlayer(player);

            return new APIGatewayProxyResponseEvent()
                    .withStatusCode(200)
                    .withBody("Player saved successfully");

        } catch (Exception e) {
            log.error("Error processing request", e);
            return new APIGatewayProxyResponseEvent()
                    .withStatusCode(502)
                    .withBody(e.getMessage());
        }
    }
} 