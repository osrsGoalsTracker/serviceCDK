package com.osrs.xpgoals.model;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class Player {
    private String rsn;
    private String lastUpdated;
} 