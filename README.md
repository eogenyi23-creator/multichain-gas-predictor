# Multichain Gas Price Predictor & Tracker

A real-time, low-latency microservice and utility library built with **TypeScript** and **Redis**. It continuously tracks block transaction fees across multiple decentralized networks, calculates historical moving average gas price projections, and caches data structures for instantaneous consumption by high-frequency decentralized applications (dApps).

## 📊 Core Architecture
* **Sliding Window Logs:** Stores sequential network gas snapshots inside localized Redis lists (`LPUSH` / `LTRIM`).
* **Instantaneous Data Resolution:** Exposes real-time stats through flat Redis Hashes (`HGETALL`), completely isolating heavy frontend traffic from directly hitting rate-limited blockchain RPC endpoints.

## 🔧 Getting Started
1. Run `npm install` to download dependencies.
2. Run `npm run build` to generate the output files.
3. Run `npm run test` to verify module logic.

## 🌊 Drips Wave Ecosystem Contribution
This repository participates actively in the **Drips Wave Ecosystem Sprint Program**. 

We invite external open-source contributors to help expand this utility library under the **"Fix, Merge, and Earn"** framework. Points and rewards are assigned strictly to approved tickets managed in our central tracker.

### 🛠️ How to Contribute:
1. Navigate directly to our **Issues** tab to claim an active, unassigned ticket.
2. Review the points allocation and technical constraints specified by the maintainers.
3. Fork the repository, implement your solution in a dedicated feature branch, and write matching Jest unit tests.
4. Open a structured Pull Request (PR) linking directly to the tracking issue for automated validation.
