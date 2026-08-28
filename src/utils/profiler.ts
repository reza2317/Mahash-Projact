class Profiler {
  private timings: Record<string, number> = {};

  start(label: string) {
    this.timings[label] = performance.now();
  }

  end(label: string) {
    if (!this.timings[label]) return;
    const duration = performance.now() - this.timings[label];
    console.log(`[Profiler] ⏱️ ${label} took ${duration.toFixed(2)}ms`);
    delete this.timings[label];
    return duration;
  }
}

export const appProfiler = new Profiler();
