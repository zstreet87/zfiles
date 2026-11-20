# Performance

Sources (read in full): [Drepper, What Every Programmer Should Know About Memory](https://people.freebsd.org/~lstewart/articles/cpumemory.pdf)
(D §n, all 114 pages), [Fabian, Data-Oriented Design](https://www.dataorienteddesign.com/dodbook/) (DOD Ch.n),
[Acton, CppCon 2014 slides](https://github.com/CppCon/CppCon2014/tree/master/Presentations),
[Carmack on inlined code](http://number-none.com/blow/john_carmack_on_inlined_code.html),
[Carmack, Functional Programming in C++](http://web.archive.org/web/2013/http://www.altdevblogaday.com/2012/04/26/functional-programming-in-c/),
[TigerStyle](https://github.com/tigerbeetle/tigerbeetle/blob/main/docs/TIGER_STYLE.md),
[Rust Performance Book](https://nnethercote.github.io/perf-book/),
[id DOOM source](https://github.com/id-Software/DOOM), [Sanglard's code reviews](https://fabiensanglard.net/).
Drepper's numbers come from 2007 hardware. Keep the principles and re-measure
the constants.

## Method
1. **Sketch the design first.** Estimate bandwidth and latency for network,
   disk, memory and CPU before writing code. The thousand-fold wins happen at
   design time, when you can't yet profile (TigerStyle). Work in cycles: a
   read from a new cache line costs about 200, a sqrt about 30, a multiply or
   add about 10 (Acton).
2. **Know the data.** Its "type, frequency, quantity, shape, and probability"
   drives the design. Different data means a different problem (DOD Ch.1,
   Acton). Solve the most common case first, not the most general one.
3. **Measure before you tune.** An optimisation without profile data is
   premature. Give each system a time or memory budget and watch per-frame or
   per-step worst cases, not averages (DOD Ch.8, Per.6).
4. **Run one experiment at a time.** Write down the predicted gain before
   making the change, check that the measurement reproduces, and benchmark
   each change separately (DOD Ch.8, Perf Book).
5. **Profile with ratios of hardware counters,** such as cycles per
   instruction or misses per instruction, not raw counts. Cachegrind
   simulates caches and undercounts misses (D §7.1).
6. **Remove silly slowdowns before adding clever speedups.** Comment
   optimised code with the measurement that justified it (Perf Book).

## Memory layout (the main lever)
- **Memory latency dominates.** In Drepper's 2007 measurements a load costs
  under 10 cycles from L1, about 28 from L2, and over 480 from RAM (D §3.2).
  Layout matters more than instruction count.
- **Traverse in storage order.** Transposing for a matrix multiply ran in
  23% of the original time; tiling to the cache-line size ran in 9.5%
  (D §6.2.1).
- **Split hot fields from cold ones.** Put the field read first at the start
  of the struct. Check holes with `pahole`. Use structure-of-arrays only when
  the hot loop really reads one field at a time; three separate x/y/z arrays
  without SIMD cost three cache lines per access (D §6.2.1, DOD Ch.8).
- **Use arrays and indices, not pointer graphs.** Chained pointer hops are
  slow because each load waits for the previous one. Prefer B-tree-style
  wide nodes to node-per-element trees, and handles to raw pointers
  (DOD Ch.9/Ch.10).
- **Choose the layout before the algorithm.** Pre-indexed linear search beat
  full-key binary search by 7.7× (11.13 ms vs 1.45 ms, DOD Ch.6).
- **Represent state by which table a row is in, not by a flag field.** Then
  only rows that need work are touched, and nothing branches per element
  (DOD Ch.3, Acton). Sort or bucket data so branches run in long streaks:
  4.40 ms became 1.15 ms when sorted (DOD Ch.9).
- **Don't put co-used data at power-of-two strides** (multiples of 4096). It
  all maps to one cache set and thrashes (D §6.2.1).
- **Align deliberately.** Put `aligned(64)` on the *type*, and use
  `posix_memalign` for heap memory. A misaligned stream within L2 ran about
  300% slower (D §6.2.1).
- **Huge pages for large working sets.** Hardware never prefetches TLB
  entries, and the prefetcher stops at page boundaries (D §4.3, §6.3).

## Allocation
- **Allocate in bulk or up front,** using arenas, pools or zones, never
  per item in a hot loop. A linked list built with `malloc` scatters its
  nodes (D §7.3). In bounded systems, allocate everything at start-up
  (TigerStyle, P10 rule 3).
- **Reuse buffers.** Call `clear()` on a working collection instead of
  reallocating, and size containers up front with `with_capacity` or
  `reserve` (Perf Book, MS M-MEM-REUSE).
- **DOOM's zone allocator is a good model:** every allocation carries an
  owner and a lifetime tag, so a whole level is freed in one call. It also
  checks a magic ID on every free and has a heap self-check (`z_zone.c`).

## Concurrency
- **False sharing:** give each thread's frequently written data its own
  cache line. In Drepper's test, 4 threads writing one line cost 1,147%. A
  single-socket machine can hide this, so test on the hardware you deploy
  to (D §6.4.1).
- **Group globals by how they are written,** in this order:
  1. read-only;
  2. read-write data used together, packed into one padded struct;
  3. per-thread data, kept in thread-local storage.
  Don't blanket-pad everything (D §6.4.1).
- **Prefer native atomic adds to compare-and-swap loops.** A CAS loop was
  3.5× slower (D §6.4.2). Accumulate per thread and combine once at the end
  (DOD Ch.9).
- **Don't trust home-made lock-free structures.** Fixing the ABA problem
  with a generation counter still dereferences freed memory (D §8.1).
- **Expect sublinear scaling beyond the last-level cache.** Four threads
  gave a 1.65× speedup on a shared bus. Check memory bandwidth use before
  adding threads (D §3.3.4).
- **NUMA:**
  - Memory policy applies when a page is first touched; `mbind` the region
    before touching it.
  - Replicate read-only data on each node.
  - Pin threads deliberately, according to which data they share
    (D §6.5).

## Code and control flow
- **Inlining trades instruction cache for call overhead.** Inline functions
  that have a single caller. Mark small functions with many callers
  `noinline`. Keep cold paths off the hot path with
  `likely`/`unlikely`/`#[cold]` or profile-guided optimisation (D §6.2.2,
  Perf Book).
- **Keep hot loops countable.** No data-dependent `break`, no opaque calls,
  padded and aligned arrays. Confirm vectorisation in the generated assembly
  (DOD Ch.9).
- **Pull hot loops out into functions that take primitive values, not
  `self`.** The compiler can then keep the values in registers without
  proving no aliasing (TigerStyle). Load members into locals before the loop
  for the same reason (Acton, DOD Ch.9).
- **Consistent execution paths beat skipped work** (Carmack). Inlining a
  sequence of steps exposes repeated or contradictory state updates. Put
  one guarded check in one place rather than the same call in 20 places.
  Running the same path every step and suppressing its result is fine
  except where power or heat is the constraint.
- **Pure functions wherever convenient:** collect the inputs, call the pure
  function, then apply its result. Mutating memory in place is still the
  fastest option for bulk data (Carmack FP).
- **Batch work instead of reacting to each event,** and give every queue a
  bound (TigerStyle). Process many items per call: "where there is one,
  there are many" (Acton).

## Don't over-apply
- **Write the plain version first.** Measure before adding lazy caches or
  dirty flags: a branch mispredict (about 24 cycles) can cost more than the
  12-cycle computation it skips (DOD Ch.8).
- **Fixed caps are fast but fail hard.** DOOM's 128-entry `MAXVISPLANES`
  limit crashed on larger levels (Sanglard).
- **Drepper's figures are hardware-specific** (front-side bus, Pentium 4).
  Re-measure on current CPUs and GPUs.
