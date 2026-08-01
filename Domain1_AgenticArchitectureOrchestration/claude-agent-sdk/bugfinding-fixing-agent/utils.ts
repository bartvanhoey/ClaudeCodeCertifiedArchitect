// // before running program replace content utils.ts with utils_buggy.ts
function calculateAverage(numbers: number[]): number {
  if (!numbers || numbers.length === 0) {
    return 0;
  }
  let total = 0;
  for (const num of numbers) {
    total += num;
  }
  return total / numbers.length;
}

function getUserName(user: { name: string } | null | undefined): string {
  if (!user || typeof user.name !== "string") {
    return "";
  }
  return user.name.toUpperCase();
}