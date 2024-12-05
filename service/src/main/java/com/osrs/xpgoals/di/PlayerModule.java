package com.osrs.xpgoals.di;

import com.google.inject.AbstractModule;
import com.google.inject.Provides;
import com.google.inject.Singleton;
import com.osrs.xpgoals.data.PlayerService;
import com.osrs.xpgoals.persistence.DynamoDbPlayerRepository;
import com.osrs.xpgoals.persistence.PlayerRepository;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

public class PlayerModule extends AbstractModule {
    @Override
    protected void configure() {
    }

    @Provides
    @Singleton
    DynamoDbClient provideDynamoDbClient() {
        return DynamoDbClient.builder()
                .region(Region.US_WEST_2)
                .build();
    }

    @Provides
    @Singleton
    PlayerRepository providePlayerRepository(DynamoDbClient dynamoDbClient) {
        return new DynamoDbPlayerRepository(dynamoDbClient);
    }

    @Provides
    @Singleton
    PlayerService providePlayerService(PlayerRepository playerRepository) {
        return new PlayerService(playerRepository);
    }
} 