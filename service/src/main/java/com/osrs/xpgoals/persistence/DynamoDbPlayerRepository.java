package com.osrs.xpgoals.persistence;

import com.osrs.xpgoals.model.Player;
import lombok.extern.log4j.Log4j2;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.GetItemRequest;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;
import javax.inject.Inject;
import javax.inject.Singleton;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Log4j2
@Singleton
public class DynamoDbPlayerRepository implements PlayerRepository {
    private final DynamoDbClient dynamoDbClient;
    private static final String TABLE_NAME = "Player";

    @Inject
    public DynamoDbPlayerRepository(DynamoDbClient dynamoDbClient) {
        this.dynamoDbClient = dynamoDbClient;
    }

    @Override
    public Optional<Player> getPlayer(String rsn) {
        Map<String, AttributeValue> key = new HashMap<>();
        key.put("rsn", AttributeValue.builder().s(rsn).build());

        GetItemRequest request = GetItemRequest.builder()
                .tableName(TABLE_NAME)
                .key(key)
                .build();

        try {
            var response = dynamoDbClient.getItem(request);
            if (!response.hasItem()) {
                return Optional.empty();
            }

            Map<String, AttributeValue> item = response.item();
            return Optional.of(Player.builder()
                    .rsn(item.get("rsn").s())
                    .lastUpdated(item.get("lastUpdated").s())
                    .build());
        } catch (Exception e) {
            log.error("Error getting player from DynamoDB", e);
            throw e;
        }
    }

    @Override
    public void savePlayer(Player player) {
        Map<String, AttributeValue> item = new HashMap<>();
        item.put("rsn", AttributeValue.builder().s(player.getRsn()).build());
        item.put("lastUpdated", AttributeValue.builder().s(Instant.now().toString()).build());

        PutItemRequest request = PutItemRequest.builder()
                .tableName(TABLE_NAME)
                .item(item)
                .build();

        try {
            dynamoDbClient.putItem(request);
        } catch (Exception e) {
            log.error("Error saving player to DynamoDB", e);
            throw e;
        }
    }
} 