---
name: Anti-Fabrication Rule
description: Prohibits AI agents from fabricating metrics, benchmarks, performance statistics, or test results.
applyTo: "**"
---

# Anti-Fabrication Rule

**NEVER fabricate metrics, benchmarks, performance data, test results, or measurements.**

If specific numbers, percentages, execution timings, or statistical data are **not explicitly present** in the source material (source code, git diffs, build outputs, profiler logs, or test execution runs), **do not invent them**.

---

## What This Means

### ❌ PROHIBITED — Do Not Do This

- Inventing percentage improvements (*"reduces bundle size by 23%"*, *"improves throughput by 35%"*)
- Fabricating timing data (*"reduces API latency from 450ms to 180ms"*)
- Making up benchmark numbers (*"handles 5,000 req/sec"*)
- Estimating memory savings (*"saves 20MB of heap memory"*)
- Guessing test coverage metrics (*"increases code coverage from 65% to 88%"*)
- Claiming performance gains without empirical verification (*"2x faster execution"*)

### ✅ ALLOWED — Do This Instead

- Describe improvements **qualitatively**:
  - *"reduces payload size"*
  - *"improves query efficiency"*
  - *"eliminates redundant allocations"*
  - *"streamlines component rendering"*
  - *"improves memory utilization"*
- Quote **actual measured data** when present in the verified source:
  - *"Test execution output shows execution time decreased from 450ms to 180ms"*
  - *"Build output reports bundle size reduced from 850KB to 620KB"*
- State **the concrete code modification** without inventing quantified benefits:
  - *"replaces O(n²) search with O(1) hash map lookup"*
  - *"implements memoization caching for computed values"*
  - *"introduces lazy loading for deferred route bundles"*
- Use conditional or qualitative language when the exact impact has not been benchmarked:
  - *"expected to reduce database round-trips"*
  - *"designed to minimize re-renders"*

---

## Scope

This rule strictly applies to all AI-generated outputs:
- Documentation (architecture notes, update logs, README files, system guides, ADRs)
- Git commit messages and pull request descriptions
- Code comments and docstrings
- Task status reports and execution summaries
- Direct conversational responses to developers

---

## Why This Rule Exists

Fabricated metrics:
1. Mislead developers, code reviewers, and system architects.
2. Create false expectations regarding system performance and capacity.
3. Undermine confidence in automated testing and AI-assisted workflows.
4. Risk being cited as verified facts in downstream specifications and compliance reports.
5. Obscure whether real performance bottlenecks were actually resolved.

---

## When Empirical Data Is Available

When verified measurements exist from:
- Automated test runners (unit, integration, or E2E results)
- Benchmark suites with reproducible run outputs
- Build tool output logs (bundle sizes, asset counts, compile timings)
- Profiler traces and runtime diagnostic dumps
- Coverage tool reports

**Quote the measurements directly** and cite the specific source command, log, or commit hash.

---

## Enforcement Checklist

Before making any claim involving a number or metric:
1. Did I measure this in a real command run, or read it in an actual source file/diff?
2. If yes: quote the source explicitly.
3. If no: convert the statement to a purely qualitative description.
4. **When in doubt, omit the statistic.**
