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

type Rotation = {
  direction: "L" | "R";
  amount: number;
};

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
  return Effect.try({
    try: () => {
      return pipe(
        file,
        String.split(","),
        Array.map(String.split("-")),
        Array.map(Array.map(Number.parse)),
        Array.map(Array.map(Option.getOrThrow)),
        Array.map((a) => Array.range(a[0], a[1]!)),
        Array.flatten,
        Array.map((a) => a.toString()),
        Array.filter((a) => String.length(a) % 2 === 0),
        Array.filter(
          (a) =>
            String.slice(0, String.length(a) / 2)(a) ===
            String.slice(String.length(a) / 2)(a),
        ),
        Array.map(Number.parse),
        Array.map(Option.getOrThrow),
        Number.sumAll,
      );
    },
    catch: () => {
      return new ParseError({});
    },
  });
};
const parseInputV2 = (file: string) => {
  function isRepeated(a: number) {
    const b = a.toString();

    if (b.length % 2 !== 0) {
      return false;
    }

    const left = String.slice(0, b.length / 2)(b);
    const right = String.slice(b.length / 2)(b);

    return left === right;
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
  const file = yield* readFile("part1.txt");

  const parsed = yield* parseInputV2(file);

  yield* display(parsed.toString());
});

BunRuntime.runMain(
  program.pipe(
    Effect.provide(Layer.mergeAll(BunTerminal.layer, BunFileSystem.layer)),
  ),
);
