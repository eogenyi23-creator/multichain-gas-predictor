import { GasPredictorEngine } from '../dist/index.js';
import {Redis} from 'ioredis';

// Mock the entire ioredis module so tests don't require a live database connection
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => {
    const store: Record<string, string[]> = {};
    const hashes: Record<string, Record<string, string>> = {};

    return {
      pipeline: jest.fn().mockReturnValue({
        lpush: jest.fn().mockImplementation((key, val) => {
          if (!store[key]) store[key] = [];
          store[key].unshift(val);
        }),
        ltrim: jest.fn().mockImplementation((key, start, end) => {
          if (store[key]) store[key] = store[key].slice(start, end + 1);
        }),
        lrange: jest.fn().mockImplementation((key, start, end) => {
          return store[key] || [];
        }),
        exec: jest.fn().mockImplementation(async () => {
          // Return simulated raw Redis pipeline response array
          // The third operation in our code is the LRANGE result
          return [1, 1, store['gas:history:stellar'] || []];
        })
      }),
      hset: jest.fn().mockImplementation(async (key, data) => {
        hashes[key] = data;
        return 1;
      }),
      hgetall: jest.fn().mockImplementation(async (key) => {
        return hashes[key] || {};
      })
    };
  });
});

describe('GasPredictorEngine', () => {
  let engine: GasPredictorEngine;

  beforeEach(() => {
    jest.clearAllMocks();
    engine = new GasPredictorEngine('redis://127.0.0.1:6379');
  });

  test('calculates moving average correctly for sequential block fees', async () => {
    // Block 1: Gas is 20
    const res1 = await engine.updateNetworkGas('stellar', 20);
    expect(res1.currentGasPrice).toBe(20);
    expect(res1.predictedGasPrice).toBe(20); // Average of [20] is 20

    // Block 2: Gas jumps to 40
    const res2 = await engine.updateNetworkGas('stellar', 40);
    expect(res2.currentGasPrice).toBe(40);
    expect(res2.predictedGasPrice).toBe(30); // Average of [40, 20] is 30
  });
});
