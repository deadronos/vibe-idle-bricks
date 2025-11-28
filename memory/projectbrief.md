# Project Brief: Idle Bricks

## Overview

Idle Bricks is an idle/incremental breakout-style game where players automate brick destruction through multiple balls, upgrades, and prestige mechanics. The game runs autonomously with balls bouncing and breaking bricks while players purchase upgrades and new ball types.

## Core Requirements

1. **Autonomous Gameplay**: Balls continuously bounce and break bricks without player input
2. **Progressive Upgrades**: Speed, damage, and coin multiplier upgrades
3. **Multiple Ball Types**: 6 ball types with unique properties (basic, fast, heavy, plasma, explosive, sniper)
4. **Prestige System**: Reset progress for permanent bonuses after breaking 10,000 bricks
5. **Persistent Progress**: Auto-save every 30 seconds + offline earnings
6. **Tier Progression**: Bricks scale in health and value as the player progresses (tiers 1-10)

## Goals

- Provide an engaging idle experience with satisfying visual feedback
- Balance progression curve for long-term engagement
- Support arbitrarily large numbers using break_infinity.js
- Deliver smooth 60fps gameplay in the browser

## Target Platform

- Web browser (desktop and mobile compatible)
- Single-page application with React UI
- Phaser 3 for game canvas rendering

## Success Criteria

- Smooth animation and responsive controls
- Clear visual distinction between ball types and brick tiers
- Intuitive shop and upgrade UI
- Reliable save/load functionality
- Engaging prestige loop
