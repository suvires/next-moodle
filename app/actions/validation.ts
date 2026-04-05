export function parseRequiredNumber(rawValue: FormDataEntryValue | null): number {
  const parsed = Number(rawValue);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("Identificador no válido.");
  }

  return parsed;
}
