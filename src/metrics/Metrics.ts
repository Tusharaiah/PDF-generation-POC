type Snapshot = {
  totalRequests: number;
  totalSuccess: number;
  totalTimeouts: number;
  avgMs: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
};

class Metrics {
  private durations: number[] = [];
  private maxSamples = 200;
  private _totalRequests = 0;
  private _totalSuccess = 0;
  private _totalTimeouts = 0;

  record(durationMs: number, success: boolean, timedOut: boolean): void {
    this._totalRequests += 1;
    if (success) this._totalSuccess += 1;
    if (timedOut) this._totalTimeouts += 1;
    this.durations.push(durationMs);
    if (this.durations.length > this.maxSamples) this.durations.shift();
  }

  snapshot(): Snapshot {
    const arr = [...this.durations].sort((a, b) => a - b);
    const len = arr.length || 1;
    const avg = arr.reduce((s, v) => s + v, 0) / arr.length || 0;
    const pct = (p: number) => arr[Math.min(len - 1, Math.floor((p / 100) * len))] ?? 0;
    return {
      totalRequests: this._totalRequests,
      totalSuccess: this._totalSuccess,
      totalTimeouts: this._totalTimeouts,
      avgMs: Math.round(avg),
      p50Ms: Math.round(pct(50)),
      p95Ms: Math.round(pct(95)),
      p99Ms: Math.round(pct(99)),
    };
  }
}

const metrics = new Metrics();
export default metrics;


