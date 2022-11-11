interface Timer {
  duration: number;
  elapsed: number;
  done(): void;
}

let _timers: Timer[] = [];

/**
 * Returns a promise that resolves after a certain amount of time has elapsed.
 */
export function delay(ms: number): Promise<void> {
  return new Promise(done => {
    _timers.push({
      duration: ms,
      elapsed: 0,
      done,
    });
  });
}

/**
 * Updates the state of internal timers.
 * @internal
 */
export function updateTimers(dt: number) {
  for (let timer of _timers) {
    timer.elapsed += dt;

    if (timer.elapsed >= timer.duration) {
      timer.done();
    }
  }

  _timers = _timers.filter(timer => timer.elapsed < timer.duration);
}

/**
 * @internal
 */
export function resetTimers() {
  _timers = [];
}
