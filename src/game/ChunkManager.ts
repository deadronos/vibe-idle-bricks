import type { BrickData, Viewport } from '../types';
import { GAME_CONFIG, VIEWPORT_CONFIG } from '../config/gameConfig';

/**
 * ChunkManager - Handles the viewport-based brick loading system
 * Only loads/renders bricks that are visible in the current viewport
 */
export class ChunkManager {
  private loadedChunks: Set<string> = new Set();
  private viewport: Viewport;
  
  // Callbacks for chunk loading/unloading
  private onChunkLoad?: (chunkX: number, chunkY: number, bricks: BrickData[]) => void;
  private onChunkUnload?: (chunkX: number, chunkY: number) => void;
  
  constructor() {
    this.viewport = {
      x: 0,
      y: 0,
      width: GAME_CONFIG.canvasWidth,
      height: GAME_CONFIG.canvasHeight,
    };
  }

  /**
   * Set callback for when a chunk needs to be loaded
   */
  setOnChunkLoad(callback: (chunkX: number, chunkY: number, bricks: BrickData[]) => void): void {
    this.onChunkLoad = callback;
  }

  /**
   * Set callback for when a chunk needs to be unloaded
   */
  setOnChunkUnload(callback: (chunkX: number, chunkY: number) => void): void {
    this.onChunkUnload = callback;
  }

  /**
   * Generate chunk key from coordinates
   */
  private getChunkKey(chunkX: number, chunkY: number): string {
    return `${chunkX},${chunkY}`;
  }

  /**
   * Parse chunk key back to coordinates
   */
  private parseChunkKey(key: string): { chunkX: number; chunkY: number } {
    const [chunkX, chunkY] = key.split(',').map(Number);
    return { chunkX, chunkY };
  }

  /**
   * Calculate which chunks are visible based on viewport
   */
  getVisibleChunks(): { chunkX: number; chunkY: number }[] {
    const { brickWidth, brickHeight, brickGap, chunkSize, gridWidth, gridHeight } = GAME_CONFIG;
    const buffer = VIEWPORT_CONFIG.chunkLoadBuffer;
    
    const cellWidth = brickWidth + brickGap;
    const cellHeight = brickHeight + brickGap;
    const chunkPixelWidth = chunkSize * cellWidth;
    const chunkPixelHeight = chunkSize * cellHeight;
    
    // Calculate chunk range (with buffer)
    const startChunkX = Math.max(0, Math.floor(this.viewport.x / chunkPixelWidth) - buffer);
    const startChunkY = Math.max(0, Math.floor(this.viewport.y / chunkPixelHeight) - buffer);
    const endChunkX = Math.min(
      Math.ceil(gridWidth / chunkSize),
      Math.ceil((this.viewport.x + this.viewport.width) / chunkPixelWidth) + buffer
    );
    const endChunkY = Math.min(
      Math.ceil(gridHeight / chunkSize),
      Math.ceil((this.viewport.y + this.viewport.height) / chunkPixelHeight) + buffer
    );
    
    const visibleChunks: { chunkX: number; chunkY: number }[] = [];
    
    for (let chunkY = startChunkY; chunkY <= endChunkY; chunkY++) {
      for (let chunkX = startChunkX; chunkX <= endChunkX; chunkX++) {
        visibleChunks.push({ chunkX, chunkY });
      }
    }
    
    return visibleChunks;
  }

  /**
   * Get brick positions for a specific chunk
   */
  getBrickPositionsInChunk(chunkX: number, chunkY: number): { x: number; y: number }[] {
    const { chunkSize, gridWidth, gridHeight } = GAME_CONFIG;
    
    const startX = chunkX * chunkSize;
    const startY = chunkY * chunkSize;
    const endX = Math.min(startX + chunkSize, gridWidth);
    const endY = Math.min(startY + chunkSize, gridHeight);
    
    const positions: { x: number; y: number }[] = [];
    
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        positions.push({ x, y });
      }
    }
    
    return positions;
  }

  /**
   * Update viewport and manage chunk loading/unloading
   */
  updateViewport(newViewport: Viewport, getBrickData: (x: number, y: number) => BrickData): void {
    this.viewport = newViewport;
    
    const visibleChunks = this.getVisibleChunks();
    const visibleChunkKeys = new Set(visibleChunks.map(c => this.getChunkKey(c.chunkX, c.chunkY)));
    
    // Unload chunks that are no longer visible
    for (const loadedKey of this.loadedChunks) {
      if (!visibleChunkKeys.has(loadedKey)) {
        const { chunkX, chunkY } = this.parseChunkKey(loadedKey);
        this.unloadChunk(chunkX, chunkY);
      }
    }
    
    // Load new visible chunks
    for (const { chunkX, chunkY } of visibleChunks) {
      const key = this.getChunkKey(chunkX, chunkY);
      if (!this.loadedChunks.has(key)) {
        this.loadChunk(chunkX, chunkY, getBrickData);
      }
    }
  }

  /**
   * Load a chunk
   */
  private loadChunk(chunkX: number, chunkY: number, getBrickData: (x: number, y: number) => BrickData): void {
    const key = this.getChunkKey(chunkX, chunkY);
    this.loadedChunks.add(key);
    
    const positions = this.getBrickPositionsInChunk(chunkX, chunkY);
    const bricks = positions
      .map(pos => getBrickData(pos.x, pos.y))
      .filter(brick => !brick.destroyed);
    
    if (this.onChunkLoad) {
      this.onChunkLoad(chunkX, chunkY, bricks);
    }
  }

  /**
   * Unload a chunk
   */
  private unloadChunk(chunkX: number, chunkY: number): void {
    const key = this.getChunkKey(chunkX, chunkY);
    this.loadedChunks.delete(key);
    
    if (this.onChunkUnload) {
      this.onChunkUnload(chunkX, chunkY);
    }
  }

  /**
   * Force reload all chunks (e.g., after game reset)
   */
  reloadAllChunks(getBrickData: (x: number, y: number) => BrickData): void {
    // Unload all current chunks
    for (const key of this.loadedChunks) {
      const { chunkX, chunkY } = this.parseChunkKey(key);
      if (this.onChunkUnload) {
        this.onChunkUnload(chunkX, chunkY);
      }
    }
    this.loadedChunks.clear();
    
    // Load visible chunks
    this.updateViewport(this.viewport, getBrickData);
  }

  /**
   * Check if a chunk is loaded
   */
  isChunkLoaded(chunkX: number, chunkY: number): boolean {
    return this.loadedChunks.has(this.getChunkKey(chunkX, chunkY));
  }

  /**
   * Get the number of loaded chunks
   */
  getLoadedChunkCount(): number {
    return this.loadedChunks.size;
  }

  /**
   * Get world position for a brick grid position
   */
  static gridToWorld(gridX: number, gridY: number): { x: number; y: number } {
    const { brickWidth, brickHeight, brickGap } = GAME_CONFIG;
    return {
      x: gridX * (brickWidth + brickGap) + brickWidth / 2,
      y: gridY * (brickHeight + brickGap) + brickHeight / 2,
    };
  }

  /**
   * Get grid position from world position
   */
  static worldToGrid(worldX: number, worldY: number): { x: number; y: number } {
    const { brickWidth, brickHeight, brickGap } = GAME_CONFIG;
    return {
      x: Math.floor(worldX / (brickWidth + brickGap)),
      y: Math.floor(worldY / (brickHeight + brickGap)),
    };
  }

  /**
   * Get the total world size in pixels
   */
  static getTotalWorldSize(): { width: number; height: number } {
    const { brickWidth, brickHeight, brickGap, gridWidth, gridHeight } = GAME_CONFIG;
    return {
      width: gridWidth * (brickWidth + brickGap),
      height: gridHeight * (brickHeight + brickGap),
    };
  }
}
