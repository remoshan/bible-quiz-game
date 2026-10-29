type Ranked = { userId: string };

export function presentLeaderboard<Row extends Ranked, Mine extends Ranked>(rows: Row[], mine: Mine | null) {
  const entries = rows.map(({ userId, ...entry }) => ({ ...entry, isYou: userId === mine?.userId }));

  if (!mine || entries.some((entry) => entry.isYou)) return { entries, you: null };

  const { userId, ...you } = mine;
  return { entries, you };
}
