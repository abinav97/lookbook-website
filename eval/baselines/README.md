# Evaluation baselines

Each run is one pass over eval/candidates.json against a local dev server, produced by `npm run eval`.
Files: NN.run.json (raw responses, no inputs or images), NN.score.json (deterministic scoring), NN.summary.json (latency, tokens, cost, failures, and the note explaining what changed before the run).

| Run | Fully passing | Checks | Non-200 | p50 / p90 / max (s) | Spend |
|---|---|---|---|---|---|
| 01 | 9/16 | 101/110 | 0 | 15.4 / 22.5 / 23.2 | $0.48 |
| 02 | 13/17 | 112/116 | 3 | 12.7 / 19.4 / 21.1 | $0.36 |
| 03 | 17/17 | 142/142 | 0 | 12.8 / 23.4 / 75.5 | $0.49 |
| 04 | 17/17 | 143/143 | 0 | 13.4 / 20.7 / 22.4 | $0.50 |
| 05 | 16/17 | 142/143 | 0 | 12.8 / 19.9 / 19.9 | $0.52 |
| 06 | 11/17 | 102/108 | 5 | 16.3 / 21.6 / 22.0 | $0.41 |
| 07 | 15/17 | 131/133 | 1 | 14.7 / 21.8 / 25.0 | $0.44 |
| 08 (final) | 16/17 | 142/143 | 0 | 14.3 / 20.9 / 21.6 | $0.52 |

**Run 08 is the definitive final baseline.** Runs 01 to 07 document the iteration that led to it.

Total eval spend across runs: $3.71.
