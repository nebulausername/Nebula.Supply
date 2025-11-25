# Homepage Benchmarks

Baseline metrics captured before the Phase 1 refactor. Update this document whenever we re-run the profiling suite.

## Core Web Vitals
- LCP: target = 2500 ms (baseline TBD)
- CLS: target < 0.10
- INP: target < 200 ms

## Rendering
- React render count for Hero + Invite sections: capture via React Profiler and document results here.
- Frame rate during hover interactions: record from Chrome DevTools Performance panel.

## Bundle & Data
- Initial JS payload (Vite report) for `/`: record before/after for visibility.
- API bootstrapping: ensure `useHomepageBootstrap` consolidates network requests.

Document timestamps, tool versions, and test devices with each update to keep comparisons meaningful.
