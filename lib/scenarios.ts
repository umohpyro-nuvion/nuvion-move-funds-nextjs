// The seven scenarios from https://docs.nuvion.co/guides/send-within-nuvion, as a marketplace called Mercato.
export type PartyId = "platform" | "reserve" | "sellerA" | "sellerB" | "customer";
export type KeyOwner = "parentKey" | "customerKey";

export type Party = { name: string; entityId: string; accountId: string; ban: string };
export type Config = { currency: string; parentKey: string; customerKey: string; parties: Record<PartyId, Party> };

export const PARTY_META: Record<PartyId, { role: string; child: boolean; hint: string }> = {
  platform: { role: "Mercato, the parent platform", child: false, hint: "The parent's main account. It pays and receives in several scenarios." },
  reserve: { role: "Mercato reserve account", child: false, hint: "A second account owned by the parent, for the own-accounts scenario." },
  sellerA: { role: "Seller, a child entity", child: true, hint: "A child entity of the parent with its own account." },
  sellerB: { role: "Second seller, a child entity", child: true, hint: "Another child of the same parent." },
  customer: { role: "Another Nuvion customer", child: false, hint: "A separate Nuvion customer, such as a supplier. It has its own API key." },
};

export const EMPTY_CONFIG: Config = {
  currency: "GBP",
  parentKey: "",
  customerKey: "",
  parties: {
    platform: { name: "Mercato Marketplace", entityId: "", accountId: "", ban: "" },
    reserve: { name: "Mercato Reserve", entityId: "", accountId: "", ban: "" },
    sellerA: { name: "Adaeze Textiles", entityId: "", accountId: "", ban: "" },
    sellerB: { name: "Tunde Ceramics", entityId: "", accountId: "", ban: "" },
    customer: { name: "Northwind Supplies Ltd", entityId: "", accountId: "", ban: "" },
  },
};

export type Scenario = {
  id: string;
  title: string;
  story: string;
  from: PartyId;
  to: PartyId;
  key: KeyOwner;
  amount: string;
  narration: string;
  color: string;
};

export const SCENARIOS: Scenario[] = [
  { id: "own-accounts", title: "Between your own accounts", story: "Mercato tops up its reserve account from its main account.", from: "platform", to: "reserve", key: "parentKey", amount: "100.00", narration: "Reserve top-up", color: "#F63080" },
  { id: "other-customer", title: "Pay another Nuvion customer", story: "Mercato pays an invoice to Northwind Supplies, who also bank with Nuvion.", from: "platform", to: "customer", key: "parentKey", amount: "50.00", narration: "Invoice 1042", color: "#E8590C" },
  { id: "child-to-parent", title: "Child pays its parent", story: "A seller settles its monthly listing fees with Mercato.", from: "sellerA", to: "platform", key: "parentKey", amount: "25.00", narration: "Listing fees, October", color: "#8E3FA8" },
  { id: "parent-to-child", title: "Parent pays a child", story: "Mercato pays a seller their weekly earnings.", from: "platform", to: "sellerA", key: "parentKey", amount: "75.00", narration: "Weekly payout", color: "#0E8F83" },
  { id: "between-children", title: "Between two children", story: "One seller buys stock from another seller on the marketplace.", from: "sellerA", to: "sellerB", key: "parentKey", amount: "40.00", narration: "Ceramic bowls, order 88", color: "#2F6FE0" },
  { id: "child-to-customer", title: "Child pays another customer", story: "A seller pays an outside supplier from its own account.", from: "sellerA", to: "customer", key: "parentKey", amount: "30.00", narration: "Fabric, invoice 2210", color: "#2E9E4F" },
  { id: "customer-to-child", title: "Another customer pays a child", story: "Northwind Supplies pays a seller for a wholesale order, using Northwind's own key.", from: "customer", to: "sellerA", key: "customerKey", amount: "60.00", narration: "Wholesale order 311", color: "#A8531C" },
];

export const scenarioById = (id: string) => SCENARIOS.find((s) => s.id === id);

// What the tester still has to fill in on the setup page before a scenario can run.
export function missingFor(s: Scenario, c: Config): string[] {
  const miss: string[] = [];
  if (!c[s.key]) miss.push(s.key === "parentKey" ? "Parent API key" : "Customer API key");
  const from = c.parties[s.from], to = c.parties[s.to];
  if (!from.accountId) miss.push(`${from.name}: account ID`);
  if (PARTY_META[s.from].child && !from.entityId) miss.push(`${from.name}: entity ID`);
  if (!to.ban) miss.push(`${to.name}: account number`);
  return miss;
}

export const money = (minor: number, currency: string) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(minor / 100);
