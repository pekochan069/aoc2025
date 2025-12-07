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
  function check(input: string[][]) {
    let total = 0;

    for (let i = 0; i < input.length; ++i) {
      for (let j = 0; j < input[i]!.length; ++j) {
        if (input[i]![j]! !== "@") {
          continue;
        }

        const canAccess = pipe(
          [
            input[i - 1]?.[j - 1],
            input[i - 1]?.[j],
            input[i - 1]?.[j + 1],
            input[i]?.[j - 1],
            input[i]?.[j + 1],
            input[i + 1]?.[j - 1],
            input[i + 1]?.[j],
            input[i + 1]?.[j + 1],
          ],
          Array.filter((a) => a === "@"),
          Array.length,
          Number.lessThan(4),
        );

        total += canAccess ? 1 : 0;
      }
    }

    return total;
  }

  return Effect.try({
    try: () => {
      return pipe(file, String.split("\n"), Array.map(String.split("")), check);
    },
    catch: (error) => {
      return new ParseError({ message: JSON.stringify(error) });
    },
  });
};

const program = Effect.gen(function* () {
  const file = yield* readFile("part1.txt");

  const parsed = yield* parseInputV1(file);

  yield* display(parsed.toString());
});

BunRuntime.runMain(
  program.pipe(
    Effect.provide(Layer.mergeAll(BunTerminal.layer, BunFileSystem.layer)),
  ),
);
