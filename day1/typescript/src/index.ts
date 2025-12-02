import { FileSystem, Terminal } from "@effect/platform";
import { BunFileSystem, BunRuntime, BunTerminal } from "@effect/platform-bun";
import { Data, Effect, Layer } from "effect";

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

const parseInput = (input: string) => {
  return Effect.gen(function* () {
    if (input.length < 2) {
      return yield* Effect.fail(
        new ParseError({
          message: "Input length should be greater than 2",
        }),
      );
    }

    const direction = input[0] as string;
    const amount = parseInt(input.slice(1));

    if (direction !== "R" && direction !== "L") {
      return yield* Effect.fail(
        new ParseError({
          message: "Rotation direction should be either 'L' or 'R'",
        }),
      );
    }

    if (isNaN(amount)) {
      return yield* Effect.fail(
        new ParseError({
          message: "Invalid rotation amound number",
        }),
      );
    }

    const rotation: Rotation = {
      direction,
      amount: anount % 100,
    };

    return rotation;
  });
};

const program = Effect.gen(function* () {
  let position = 50;
  let at0 = 0;

  const file = yield* readFile("test.txt");

  const inputList = file.split("\n");

  for (const input of inputList) {
    const rotation = yield* parseInput(input);

    if (rotation.direction === "L") {
      position -= rotation.amount;
    } else {
      position += rotation.amount;
    }

    if (position < 0) {
      position = 100 + position;
    } else if (position > 99) {
      position = position - 100;
    }

    if (position === 0) {
      at0 += 1;
    }
  }

  yield* display(at0.toString());
});

BunRuntime.runMain(
  program.pipe(
    Effect.provide(Layer.mergeAll(BunTerminal.layer, BunFileSystem.layer)),
  ),
);
