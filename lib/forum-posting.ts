type ActivityDate = {
  label: string;
  timestamp: number;
  dataId?: string;
};

function normalize(value?: string) {
  return (value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function matchesDueDate(date: ActivityDate) {
  const dataId = normalize(date.dataId);
  const label = normalize(date.label);

  return (
    dataId.includes("due") ||
    label.includes("fecha de entrega") ||
    label === "due date"
  );
}

function matchesCutoffDate(date: ActivityDate) {
  const dataId = normalize(date.dataId);
  const label = normalize(date.label);

  return (
    dataId.includes("cutoff") ||
    label.includes("fecha limite") ||
    label.includes("fecha lmite") ||
    label.includes("cut-off") ||
    label === "cutoff date"
  );
}

export function getForumPostingWindow(dates: ActivityDate[] = []) {
  const dueDate = dates.find(matchesDueDate)?.timestamp;
  const cutoffDate = dates.find(matchesCutoffDate)?.timestamp;
  const now = Date.now();

  const dueDateReached = typeof dueDate === "number" && dueDate * 1000 <= now;
  const cutoffDateReached = typeof cutoffDate === "number" && cutoffDate * 1000 <= now;

  return {
    dueDate,
    cutoffDate,
    dueDateReached,
    cutoffDateReached,
    isPastDueButOpen: dueDateReached && !cutoffDateReached,
  };
}
