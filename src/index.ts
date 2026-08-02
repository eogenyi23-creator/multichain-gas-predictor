import Redis from 'ioredis';

interface GasMetrics {
  currentGasPrice: number;
  predictedGasPrice: number;
  updatedAt: number;
}

export class GasPredictorEngine {
  private redis: Redis;
  private movingAverageWindow = 10; // Number of historic blocks to average

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
  }

  /**
   * Tracks a new raw fee entry from a specific blockchain network and updates predictions
   */
  async updateNetworkGas(networkId: string, rawGasPrice: number): Promise<GasMetrics> {
    const historyKey = `gas:history:${networkId}`;
    const statsKey = `gas:stats:${networkId}`;
    const timestamp = Date.now();

    // 1. Push the newest block fee data onto a Redis List
    const pipeline = this.redis.pipeline();
    pipeline.lpush(historyKey, rawGasPrice.toString());
    pipeline.ltrim(historyKey, 0, this.movingAverageWindow - 1); // Keep a fixed historical sliding window
    pipeline.lrange(historyKey, 0, -1);
    
    const results = await pipeline.exec();
    if (!results || !results[2]) {
      throw new Error(`Failed to update metrics for network: ${networkId}`);
    }

    // 2. Compute the moving average prediction model from Redis history
    const historicPrices = results[2][1] as string[];
    const sum = historicPrices.reduce((acc, val) => acc + parseFloat(val), 0);
    const predictedPrice = Math.round((sum / historicPrices.length) * 100) / 100;

    const metrics: GasMetrics = {
      currentGasPrice: rawGasPrice,
      predictedGasPrice: predictedPrice,
      updatedAt: timestamp
    };

    // 3. Store calculated metrics inside a flat Redis Hash for zero-latency retrieval
    await this.redis.hset(statsKey, {
      current: metrics.currentGasPrice.toString(),
      predicted: metrics.predictedGasPrice.toString(),
      updatedAt: metrics.updatedAt.toString()
    });

    return metrics;
  }

  /**
   * Pulls pre-calculated prediction data instantly from the Redis cache
   */
  async getGasMetrics(networkId: string): Promise<GasMetrics | null> {
    const statsKey = `gas:stats:${networkId}`;
    const data = await this.redis.hgetall(statsKey);

    if (!data || !data.current) return null;

    return {
      currentGasPrice: parseFloat(data.current),
      predictedGasPrice: parseFloat(data.predicted),
      updatedAt: parseInt(data.updatedAt)
    };
  }
}
