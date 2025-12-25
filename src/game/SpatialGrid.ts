import { BrickData, BallData } from '../types';

export class SpatialGrid {
  private cellSize: number;
  private grid: Map<string, BrickData[]> = new Map();

  constructor(cellSize: number = 100) {
    this.cellSize = cellSize;
  }

  private getKey(col: number, row: number): string {
    return `${col},${row}`;
  }

  clear() {
    this.grid.clear();
  }

  rebuild(bricks: BrickData[]) {
    this.clear();
    for (const brick of bricks) {
      this.add(brick);
    }
  }

  add(brick: BrickData) {
    const startCol = Math.floor(brick.x / this.cellSize);
    const endCol = Math.floor((brick.x + brick.width) / this.cellSize);
    const startRow = Math.floor(brick.y / this.cellSize);
    const endRow = Math.floor((brick.y + brick.height) / this.cellSize);

    for (let col = startCol; col <= endCol; col++) {
      for (let row = startRow; row <= endRow; row++) {
        const key = this.getKey(col, row);
        if (!this.grid.has(key)) {
          this.grid.set(key, []);
        }
        this.grid.get(key)!.push(brick);
      }
    }
  }

  query(ball: BallData, ballRadius: number = 8): BrickData[] {
    // Determine the range of cells the ball overlaps with
    // We use a bounding box for the ball for grid query
    const minX = ball.x - ballRadius;
    const maxX = ball.x + ballRadius;
    const minY = ball.y - ballRadius;
    const maxY = ball.y + ballRadius;

    const startCol = Math.floor(minX / this.cellSize);
    const endCol = Math.floor(maxX / this.cellSize);
    const startRow = Math.floor(minY / this.cellSize);
    const endRow = Math.floor(maxY / this.cellSize);

    const potentialBricks = new Set<BrickData>();

    for (let col = startCol; col <= endCol; col++) {
      for (let row = startRow; row <= endRow; row++) {
        const key = this.getKey(col, row);
        const bricks = this.grid.get(key);
        if (bricks) {
          for (const brick of bricks) {
            potentialBricks.add(brick);
          }
        }
      }
    }

    return Array.from(potentialBricks);
  }
}
