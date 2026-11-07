import { createServerFn } from "@tanstack/react-start";

/**
 * Server function that hands the browser what it needs to open a Gemini Live session.
 * GEMINI_API_KEY is read on the server only (set it as a server secret, never in source).
 * NOTE: the returned `url` contains the key, so the browser can see it. See delivery notes.
 */
export const getGeminiLiveConfig = createServerFn({ method: "GET" }).handler(async () => {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured on the server environment.");
  }

  const host = "generativelanguage.googleapis.com";
  // Model is overridable from a server env var; the default is the model confirmed to connect.
  const model = process.env["GEMINI_LIVE_MODEL"] || "models/gemini-3.8-live";
  const url = `wss://${host}/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;

  const systemInstruction = {
    parts: [
      {
        text: `You are the voice assistant of an offline-first Pakistani steel-works ERP and cash book. Speak natural Roman Urdu / Urdu mixed with simple English, short and clear.

DATA RULES
- Never guess an account, bank, material, balance, date or amount. Look it up with the tools. If a tool cannot do something, say so plainly.
- You can read everything (accounts, ledgers, balances, cash and banks, stock, heats, cheques, workers, sales, purchases, expenses) and you can draft new entries and new accounts. You cannot edit or delete anything.

ENTRY RULES (follow strictly)
1. Find out the entry type: sale, purchase, receive payment (inward), issue payment (outward), expense, worker salary, worker advance.
2. Call record_transaction_draft as soon as you know the type and the name. The app tells you exactly what is still missing. Ask the user ONLY for the missing items, one or two at a time, then call it again with everything collected so far.
3. Never ask for more than the tool says, and never invent values. For a cheque ask the bank (only from list_banks) and the cheque number; for online ask the bank and reference; for a sale or purchase ask the material (list_materials), weight in kg and rate (or the total), and whether it is credit or net (settled on the spot).
4. A sale is only for BUYER accounts, a purchase only for SUPPLIER accounts, salary and advance only for WORKER accounts; payments and expenses never for workers. If the account is not found, say it is not in the system and ask if you should create it. If the name is incomplete, use the closest match the tool returns; if the tool says ambiguous, read the full names and ask which one.
5. When record_transaction_draft returns draft_ready, read the summary aloud and ask "save kar dun?". Call confirm_pending ONLY after a clear yes. If the user says no or wants a change, call cancel_pending or call record_transaction_draft again with the change.
6. To create an account use create_account (name, type, optional phone, opening balance, wages for workers). Read the summary and confirm the same way. After it is created, continue with the entry.
7. After saving, tell the user the voucher number briefly and be ready for a fresh entry; do not reuse the previous party or amount unless asked.

QUESTIONS ABOUT DATA
- Use last_transaction, search_entries, account_balance, get_overview and get_report. Always say the date, type and amount (and voucher number) when you report an entry.
- Dates: the current date is given below. "aaj" = today, "kal" = yesterday, "parson" = two days ago, "10 tareekh" = the 10th (pass day_of_month), "pichle hafte" = a date range. Say the real date you used.
- Use get_form_spec if the user asks what an entry needs.`,
      },
    ],
  };

  const S = (description: string) => ({ type: "STRING", description });
  const N = (description: string) => ({ type: "NUMBER", description });
  // Gemini rejects empty `required` lists and empty parameter objects, so both are left out when there is nothing to say.
  const obj = (properties: Record<string, unknown>, required: string[] = []) => ({ type: "OBJECT", properties, ...(required.length ? { required } : {}) });
  const dateProps = {
    date: S("Exact date YYYY-MM-DD, if the user gave a full date"),
    days_ago: N("How many days ago (parson = 2, kal = 1)"),
    day_of_month: N("Day number of the month, e.g. 10 for '10 tareekh'"),
  };
  const tools = [
    {
      functionDeclarations: [
        {
          name: "record_transaction_draft",
          description: "Create or update the pending entry draft. The app validates it against the entry form rules and answers with draft_ready, or with what is missing / not found. Never invent missing values; ask the user.",
          parameters: obj({
            type: { type: "STRING", enum: ["sale", "purchase", "inward", "outward", "expense", "salary", "advance"], description: "inward = receive payment, outward = issue payment" },
            party_name: S("Account name as the user said it (partial or misspelt is fine). For expense: who was paid."),
            amount: N("Total amount in PKR (for sale/purchase it can be omitted when weight_kg and rate are given)"),
            material: S("Material name for sale/purchase"),
            weight_kg: N("Weight in kg for sale/purchase"),
            rate: N("Rate in rupees per kg for sale/purchase"),
            pay_mode: { type: "STRING", enum: ["credit", "net"], description: "Sale/purchase only: credit = pay later, net = settled on the spot" },
            payment_method: { type: "STRING", enum: ["cash", "cheque", "online"], description: "How the money moves" },
            bank_name: S("Bank name, only one returned by list_banks"),
            cheque_no: S("Cheque number, or 'none' if the user has none"),
            reference: S("Online transaction reference, or 'none'"),
            category: S("Expense category (see list_categories)"),
            remarks: S("Optional note"),
            ...dateProps,
          }, ["type"]),
        },
        { name: "confirm_pending", description: "Save the pending draft (entry or account). Call ONLY after the user clearly said yes to your read-back.", parameters: obj({ force: { type: "BOOLEAN", description: "true only if the app warned about a similar entry and the user still wants to save" } }) },
        { name: "cancel_pending", description: "Discard the pending draft." },
        { name: "find_account", description: "Look up an account from a spoken name. Pass entry_type so only the right kind of account is searched.", parameters: obj({ name: S("Name as spoken"), entry_type: { type: "STRING", enum: ["sale", "purchase", "inward", "outward", "expense", "salary", "advance"] } }, ["name"]) },
        { name: "create_account", description: "Draft a new account. The app asks what is missing; the user confirms before it is created.", parameters: obj({ name: S("Full account name"), type: S("Buyer, Supplier, Worker or another type the app has"), phone: S("Phone, optional"), address: S("Address, optional"), opening_balance: N("Opening balance, default 0"), fixed_wages: N("Monthly wages (workers)"), cnic: S("CNIC (workers), optional"), confirm_new: { type: "BOOLEAN", description: "true only if the user insists on a new account although a similar one exists" } }, ["name", "type"]) },
        { name: "list_banks", description: "The banks that exist in the app. Offer only these." },
        { name: "list_materials", description: "The materials that exist in the app." },
        { name: "list_categories", description: "The expense categories that exist in the app." },
        { name: "last_transaction", description: "The latest entry on an account's ledger (type, amount, date, voucher).", parameters: obj({ account_name: S("Account name as spoken") }, ["account_name"]) },
        {
          name: "search_entries",
          description: "Find entries by account, type, date or range, amount or text. Returns the rows, their count and total amount.",
          parameters: obj({
            account_name: S("Account name as spoken"),
            type: { type: "STRING", enum: ["sale", "purchase", "inward", "outward", "expense", "salary", "advance", "capital", "transfer"] },
            from: S("Start date YYYY-MM-DD"), to: S("End date YYYY-MM-DD"),
            min_amount: N("Minimum amount"), max_amount: N("Maximum amount"), text: S("Words in particulars, remarks or voucher number"), limit: N("How many rows, default 8"),
            ...dateProps,
          }),
        },
        { name: "account_balance", description: "Balance and recent entries of one account.", parameters: obj({ account_name: S("Account name as spoken") }, ["account_name"]) },
        { name: "get_overview", description: "Cash in hand, banks, receivables, payables, advances, this month's sales/purchases/expenses, stock, pending cheques, workers." },
        { name: "get_report", description: "A report for a date range (default: this month).", parameters: obj({ report: { type: "STRING", enum: ["sales", "purchases", "expenses", "stock", "heats", "cheques", "workers", "receivables", "payables", "cash"] }, from: S("Start date YYYY-MM-DD"), to: S("End date YYYY-MM-DD") }, ["report"]) },
        { name: "get_form_spec", description: "What the entry form needs for an entry type.", parameters: obj({ entry_type: { type: "STRING", enum: ["sale", "purchase", "inward", "outward", "expense", "salary", "advance"] } }, ["entry_type"]) },
        { name: "navigate_app", description: "Open a screen of the app.", parameters: obj({ screen: { type: "STRING", enum: ["dashboard", "sales", "purchases", "vouchers", "accounts", "cashbook", "banks", "expenses", "reports"] } }, ["screen"]) },
      ],
    },
  ];

  // Declarations are sent as a JSON string so the server-function serializer accepts the loosely typed schema.
  return { url, model, systemInstruction, tools: JSON.stringify(tools) };
});
