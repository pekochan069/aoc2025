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
  function findLargest1(numbers: number[]) {
    let num = -1;
    let index = -1;

    if (numbers.length < 3) {
      return {
        num: numbers[0]!,
        rest: numbers.slice(1),
      };
    }

    for (let i = 0; i < numbers.length - 1; ++i) {
      if (numbers[i]! > num) {
        num = numbers[i]!;
        index = i;
      }
    }

    return {
      num,
      rest: numbers.slice(index + 1),
    };
  }

  function findLargest2({ num, rest }: { num: number; rest: number[] }) {
    let num2 = -1;
    let index = -1;

    if (rest.length === 1) {
      return num * 10 + rest[0]!;
    }

    for (let i = 0; i < rest.length; ++i) {
      if (rest[i]! > num2) {
        num2 = rest[i]!;
        index = i;
      }
    }

    return num * 10 + num2;
  }

  return Effect.try({
    try: () => {
      return pipe(
        file,
        String.split("\n"),
        Array.map(String.split("")),
        Array.map(Array.map(Number.parse)),
        Array.map(Array.map(Option.getOrThrow)),
        Array.map(findLargest1),
        Array.map(findLargest2),
        Number.sumAll,
      );
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
