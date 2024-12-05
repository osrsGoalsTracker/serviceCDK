package com.osrs.xpgoals.persistence;

import com.osrs.xpgoals.model.Player;
import java.util.Optional;

public interface PlayerRepository {
    Optional<Player> getPlayer(String rsn);
    void savePlayer(Player player);
} 