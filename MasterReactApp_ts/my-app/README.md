# Installation
npm install --save-dev ajv@^7
npm install --legacy-peer-deps

# Run
npm start

# Test
npm test

# Benchmark
npx ts-node --project tsconfig.benchmark.json src/Benchmarks/runSweep.ts

-> benchmark_results.json

# Generate Graph
npx ts-node --project tsconfig.benchmark.json src/Benchmarks/runSweep.ts

