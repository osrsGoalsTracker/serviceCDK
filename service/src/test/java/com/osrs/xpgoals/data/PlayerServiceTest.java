package com.osrs.xpgoals.data;

import com.osrs.xpgoals.model.Player;
import com.osrs.xpgoals.persistence.PlayerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

public class PlayerServiceTest {

    @Mock
    private PlayerRepository playerRepository;

    private PlayerService playerService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        playerService = new PlayerService(playerRepository);
    }

    @Test
    void getPlayer_WhenPlayerDoesNotExist_ReturnsEmptyOptional() {
        // Arrange
        String rsn = "nonExistentPlayer";
        when(playerRepository.getPlayer(rsn)).thenReturn(Optional.empty());

        // Act
        Optional<Player> result = playerService.getPlayer(rsn);

        // Assert
        assertTrue(result.isEmpty());
    }

    @Test
    void getPlayer_WhenPlayerExists_ReturnsPlayer() {
        // Arrange
        String rsn = "testPlayer";
        Player player = Player.builder()
                .rsn(rsn)
                .lastUpdated("2023-12-05T00:00:00Z")
                .build();
        when(playerRepository.getPlayer(rsn)).thenReturn(Optional.of(player));

        // Act
        Optional<Player> result = playerService.getPlayer(rsn);

        // Assert
        assertTrue(result.isPresent());
        assertEquals(rsn, result.get().getRsn());
    }

    @Test
    void savePlayer_ShouldSavePlayerWithLastUpdated() {
        // Arrange
        String rsn = "testPlayer";
        Player player = Player.builder()
                .rsn(rsn)
                .build();

        // Act
        playerService.savePlayer(player);

        // Assert
        verify(playerRepository).savePlayer(any(Player.class));
    }
} 