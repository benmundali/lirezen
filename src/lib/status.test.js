import { describe, expect, it } from "vitest";
import { statusLabel } from "./status";
describe("statusLabel", () => {
  it("traduit les statuts connus", () => {
    expect(statusLabel("a_lire")).toBe("À lire");
    expect(statusLabel("termine")).toBe("Terminé");
  });
  it("gère un statut inconnu", () => {
    expect(statusLabel("autre")).toBe("Inconnu");
  });
});
