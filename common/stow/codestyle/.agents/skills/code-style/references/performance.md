# Performance: lessons from game engines and systems code

Sources: [John Carmack on inlined code](http://number-none.com/blow/john_carmack_on_inlined_code.html),
[Data-Oriented Design (Fabian)](https://www.dataorienteddesign.com/dodbook/),
[Mike Acton, "Data-Oriented Design and C++" (CppCon 2014)](https://www.youtube.com/watch?v=rX0ItVEVjHc),
[Drepper, "What Every Programmer Should Know About Memory"](https://people.freebsd.org/~lstewart/articles/cpumemory.pdf),
[id Software DOOM source](https://github.com/id-Software/DOOM), C++ Core Guidelines Per.*.

## Principles
- **Design around the data:** the purpose of a program is to transform data.
  Start from what the data looks like, how much of it there is, and how it is
  accessed. If you don't know the data, you don't know the problem (Acton,
  Fabian).
- **Optimize for the common case:** handle many items at once rather than one
  at a time. Wherever there is one, there are many (Acton).
- **Memory is usually the bottleneck,** not arithmetic. A cache miss to main
  memory costs on the order of 100 or more cycles (Drepper), so contiguous,
  predictable access beats a clever algorithm over scattered data.
- **Measure:** profile on the target hardware with realistic data before and
  after each change. Report the numbers, not impressions (Per.6).

## Data layout
- **Structure of arrays:** for hot loops that touch only a few fields, store
  each field in its own array rather than an array of structs. Each cache
  line then holds only data the loop uses.
- **Hot and cold data:** split fields used every iteration from those used
  rarely, and keep the hot structs small.
- **Arrays and indices:** prefer contiguous arrays with indices over linked
  structures and pointer graphs. Indices also survive serialization and
  reallocation.
- **Remove branches:** sort or partition data so a loop doesn't branch per
  element, for example by keeping separate arrays for active and inactive
  items.

## Allocation
- **Allocate up front:** allocate at startup or per frame from arenas, pools
  or zone allocators. DOOM routes its allocations through `z_zone.c`, a
  zone allocator. Never call `malloc` per item in a hot loop.
- **Reuse buffers:** reuse a scratch buffer instead of allocating and freeing
  repeatedly.

## Control flow and state (Carmack)
- **Visible order:** when the order of state changes matters, inlining a
  sequence of subroutines into one function shows the whole order and exposes
  repeated or contradictory updates.
- **Pure functions:** functions that only read their inputs and return
  results remove whole classes of bugs about when state changes. Use them
  wherever possible, and keep them pure.
- **Run every path:** run the same code path every frame and suppress or
  ignore its result when it's not needed, rather than adding branches that
  are rarely taken. Rarely-run paths are where bugs hide. This costs extra
  work, so it fits poorly where power or heat is tight.
- **Latency is a correctness property:** check the order of events (input,
  update, render), not just throughput.

## Checklist before calling code "fast"
1. Profile it with real data (`perf`, VTune, `nsys` or `rocprof` for GPUs,
   or `py-spy`).
2. Is the hot loop reading memory contiguously? Count the cache misses
   (`perf stat -e cache-misses`).
3. Are there allocations, virtual calls or locks inside the loop?
4. Can the work be batched, vectorized, or skipped entirely?
