/* The lib modules read their data from the runtime slice, which the browser
   gets as injected JSON. Tests build the same slice from the data files. */
import { beforeAll } from "vitest";
import { setRuntime } from "../src/lib/runtime";
import { projectRuntime } from "../src/lib/project";

beforeAll(() => setRuntime(projectRuntime()));
