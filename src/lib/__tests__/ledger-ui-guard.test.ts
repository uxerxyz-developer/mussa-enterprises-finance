import { describe, it, expect } from "vitest";
import ledgerSource from "../../routes/ledger.$id.tsx?raw";

// Guards against an accidental deletion of the ledger page's on-screen controls (this happened once, see CHANGELOG v1.4.1).
const MARKERS: [string, string][] = [
  ["party balance card", 'sm:text-2xl">{a.name}'],
  ["account type / contact / address", "accountTypeLabel(d, a.type)"],
  ["worker wages card", "Fixed Wages / month"],
  ["worker advance outstanding", "Advance outstanding"],
  ["received / issued cards", ">Received</div>"],
  ["From date filter", 'label="From"'],
  ["To date filter", 'label="To"'],
  ["Clear dates button", ">Clear</Button>"],
  ["Cards View toggle", "Cards View"],
  ["Register Table View toggle", "Register Table View"],
  ["transactions list", "Transactions</h2>"],
];

describe("ledger page keeps its on-screen controls", () => {
  it.each(MARKERS)("%s", (_name, marker) => {
    expect(ledgerSource).toContain(marker);
  });
});
