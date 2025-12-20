/**
 * Performance тесты для dashboard page
 * Измеряет время выполнения последовательных vs параллельных запросов
 */

import { bench, describe } from "vitest";

describe("Dashboard Performance", () => {
  describe("Sequential vs Parallel queries", () => {
    // Имитация последовательных запросов
    const sequentialQueries = async () => {
      const profile = await new Promise((resolve) =>
        setTimeout(() => resolve({ data: { currency: "RUB" } }), 50)
      );
      const accounts = await new Promise((resolve) =>
        setTimeout(() => resolve({ data: [] }), 50)
      );
      return { profile, accounts };
    };

    // Имитация параллельных запросов
    const parallelQueries = async () => {
      const [profile, accounts] = await Promise.all([
        new Promise((resolve) =>
          setTimeout(() => resolve({ data: { currency: "RUB" } }), 50)
        ),
        new Promise((resolve) => setTimeout(() => resolve({ data: [] }), 50)),
      ]);
      return { profile, accounts };
    };

    bench(
      "Sequential queries - последовательные запросы",
      async () => {
        await sequentialQueries();
      },
      {
        time: 500,
      }
    );

    bench(
      "Parallel queries - параллельные запросы через Promise.all",
      async () => {
        await parallelQueries();
      },
      {
        time: 500,
      }
    );
  });
});
