import { FileSystem, Terminal } from "@effect/platform";
import { BunFileSystem, BunRuntime, BunTerminal } from "@effect/platform-bun";
import {
  Array,
  Data,
  Effect,
  Layer,
  Number,
  Option,
  pipe,
  String,
} from "effect";

class ParseError extends Data.TaggedClass("ParseError")<{ message?: string }> {}

const readFile = (path: string) => {
  return Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;

    const content = yield* fs.readFileString(path, "utf-8");

    return content;
  });
};

const display = (message: string) => {
  return Effect.gen(function* () {
    const terminal = yield* Terminal.Terminal;

    yield* terminal.display(message);
  });
};

const parseInputV1 = (file: string) => {
  function isRepeated(a: number) {
    const b = a.toString();

    for (let i = 1; i <= b.length / 2; ++i) {
      if (b.length % i !== 0) {
        continue;
      }

      if (
        pipe(
          b,
          Array.chunksOf(i),
          Array.map(Array.join("")),
          Array.window(2),
          Array.map(([a, b]) => a === b),
          Array.every((a) => a),
        )
      ) {
        return true;
      }
    }

    return false;
  }

  return Effect.try({
    try: () => {
      return pipe(
        file,
        String.split(","),
        Array.map(String.split("-")),
        Array.map(Array.map(Number.parse)),
        Array.map(Array.map(Option.getOrThrow)),
        Array.flatMap((a) => Array.range(a[0], a[1]!)),
        Array.filter(isRepeated),
        Number.sumAll,
      );
    },
    catch: () => {
      return new ParseError({});
    },
  });
};
const parseInputV2 = (file: string) => {
  function checkRepeat(a: string, b: number) {
    const left = String.slice(0, b)(a);

    for (let i = 1; i < a.length / b; ++i) {
      const right = String.slice(i * b, (i + 1) * b)(a);

      if (left !== right) {
        return false;
      }
    }

    return true;
  }

  function isRepeated(a: number) {
    const b = a.toString();

    for (let i = 1; i <= b.length / 2; ++i) {
      if (b.length % i !== 0) {
        continue;
      }

      if (checkRepeat(b, i)) {
        return true;
      }
    }

    return false;
  }

  return Effect.try({
    try: () => {
      return pipe(
        file,
        String.split(","),
        Array.map(String.split("-")),
        Array.map(Array.map(Number.parse)),
        Array.map(Array.map(Option.getOrThrow)),
        Array.flatMap((a) => Array.range(a[0], a[1]!)),
        Array.filter(isRepeated),
        Number.sumAll,
      );
    },
    catch: () => {
      return new ParseError({});
    },
  });
};

const program = Effect.gen(function* () {
  const file = yield* readFile("part2.txt");

  const parsed = yield* parseInputV2(file);

  yield* display(parsed.toString());
});

BunRuntime.runMain(
  program.pipe(
    Effect.provide(Layer.mergeAll(BunTerminal.layer, BunFileSystem.layer)),
  ),
);
