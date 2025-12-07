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
  type Data = {
    num: number;
    rest: number[];
    remained: number;
  };

  function findLargest({ num, rest, remained }: Data) {
    if (remained === 0) {
      // console.log(num);
      return {
        num,
        rest,
        remained,
      };
    }

    if (remained === rest.length) {
      for (let i = 0; i < rest.length; ++i) {
        num += 10 ** (remained - 1 - i) * rest[i]!;
      }

      return {
        num,
        rest: [],
        remained: 0,
      };
    }

    let current = -1;
    let index = -1;

    const lastIndex = remained === 1 ? rest.length : rest.length - remained + 1;

    for (let i = 0; i < lastIndex; ++i) {
      if (rest[i]! > current) {
        current = rest[i]!;
        index = i;
      }
    }

    num += current * 10 ** (remained - 1);

    return findLargest({
      num,
      rest: rest.slice(index + 1),
      remained: remained - 1,
    });
  }

  return Effect.try({
    try: () => {
      return pipe(
        file,
        String.split("\n"),
        Array.map(String.split("")),
        Array.map(Array.map(Number.parse)),
        Array.map(Array.map(Option.getOrThrow)),
        Array.map(
          (a): Data => ({
            num: 0,
            rest: a,
            remained: 12,
          }),
        ),
        Array.map(findLargest),
        Array.map((a) => a.num),
        Number.sumAll,
      );
    },
    catch: (error) => {
      return new ParseError({ message: JSON.stringify(error) });
    },
  });
};

const program = Effect.gen(function* () {
  const file = yield* readFile("part2.txt");

  const parsed = yield* parseInputV1(file);

  yield* display(parsed.toString());
});

BunRuntime.runMain(
  program.pipe(
    Effect.provide(Layer.mergeAll(BunTerminal.layer, BunFileSystem.layer)),
  ),
);
