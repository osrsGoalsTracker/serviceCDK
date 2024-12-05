package com.osrs.xpgoals.di;

import com.google.inject.Guice;
import com.google.inject.Injector;
import com.osrs.xpgoals.data.PlayerService;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertNotNull;

public class PlayerModuleTest {

    @Test
    public void shouldCreateInjectorSuccessfully() {
        // Act
        Injector injector = Guice.createInjector(new PlayerModule());
        PlayerService playerService = injector.getInstance(PlayerService.class);

        // Assert
        assertNotNull(playerService, "PlayerService should be successfully injected");
    }
} 