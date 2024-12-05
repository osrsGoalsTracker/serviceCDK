package com.osrs.xpgoals.data;

import com.osrs.xpgoals.model.Player;
import com.osrs.xpgoals.persistence.PlayerRepository;
import lombok.extern.log4j.Log4j2;

import javax.inject.Inject;
import javax.inject.Singleton;
import java.time.Instant;
import java.util.Optional;

@Log4j2
@Singleton
public class PlayerService {
    private final PlayerRepository playerRepository;

    @Inject
    public PlayerService(PlayerRepository playerRepository) {
        this.playerRepository = playerRepository;
    }

    public Optional<Player> getPlayer(String rsn) {
        log.info("Fetching player data for RSN: {}", rsn);
        return playerRepository.getPlayer(rsn);
    }

    public void savePlayer(Player player) {
        log.info("Saving player data for RSN: {}", player.getRsn());
        player.setLastUpdated(Instant.now().toString());
        playerRepository.savePlayer(player);
    }
} 