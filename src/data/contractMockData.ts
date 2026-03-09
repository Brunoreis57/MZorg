// ── Tipos e dados mock para Gestão de Contratos e Triangulação Financeira ──

export type PaymentCycle = "mensal" | "quinzenal" | "por_medicao";
export type PaymentStatus = "previsto" | "agendado" | "antecipacao_solicitada" | "pago" | "atrasado";
export type InvoiceType = "receita" | "despesa";
export type NfStatus = "aguardando_medicao" | "emitida" | "recebida";
export type SupplierPaymentStatus = "agendado" | "antecipacao_solicitada" | "pago";
export type CashFlowHealth = "em_dia" | "pendente_repasse" | "antecipacao_pendente";

export interface ContractTerms {
  id: string;
  biddingId: string;
  biddingCode: string;
  biddingObject: string;
  // Receita (Órgão)
  orgao: string;
  contractNumber: string;
  contractStartDate: string;
  contractEndDate: string;
  monthlyValue: number;
  paymentCycle: PaymentCycle;
  estimatedPaymentDays: number; // dias após medição
  // Despesa (Fornecedor)
  supplierId: string;
  supplierName: string;
  supplierPaymentRule: string; // ex: "Todo dia 10" ou "5 dias após recebimento"
  supplierMonthlyValue: number;
  anticipationAllowed: boolean;
}

export interface PaymentScheduleEntry {
  id: string;
  contractId: string;
  biddingCode: string;
  type: "entrada" | "saida";
  description: string;
  entity: string; // órgão ou fornecedor
  expectedDate: string;
  actualDate: string | null;
  amount: number;
  status: PaymentStatus;
  nfNumber: string | null;
  nfStatus: NfStatus | SupplierPaymentStatus | null;
  anticipationRequested: boolean;
  anticipationDate: string | null;
  healthStatus: CashFlowHealth;
}

// ── Mock: Fornecedores (referência do módulo existente) ──
export const mockSuppliers = [
  { id: "1", name: "TransVan Express" },
  { id: "2", name: "BH Ônibus" },
  { id: "3", name: "LocaMaq" },
  { id: "4", name: "MicroTur MG" },
];

// ── Mock: Contratos ──
export const mockContractTerms: ContractTerms[] = [
  {
    id: "ct-1",
    biddingId: "1",
    biddingCode: "CC 005/2026",
    biddingObject: "Transporte de servidores em regime de fretamento contínuo",
    orgao: "TRT-3ª Região",
    contractNumber: "CT-2026/045",
    contractStartDate: "01/04/2026",
    contractEndDate: "31/03/2027",
    monthlyValue: 74166.67,
    paymentCycle: "mensal",
    estimatedPaymentDays: 30,
    supplierId: "2",
    supplierName: "BH Ônibus",
    supplierPaymentRule: "Todo dia 10 do mês subsequente",
    supplierMonthlyValue: 54000,
    anticipationAllowed: true,
  },
  {
    id: "ct-2",
    biddingId: "2",
    biddingCode: "PE 034/2025",
    biddingObject: "Locação de caminhões-pipa para abastecimento municipal",
    orgao: "SAAE Uberlândia",
    contractNumber: "CT-2025/189",
    contractStartDate: "15/01/2026",
    contractEndDate: "14/01/2027",
    monthlyValue: 120833.33,
    paymentCycle: "por_medicao",
    estimatedPaymentDays: 45,
    supplierId: "1",
    supplierName: "TransVan Express",
    supplierPaymentRule: "5 dias após recebimento do órgão",
    supplierMonthlyValue: 85000,
    anticipationAllowed: true,
  },
  {
    id: "ct-3",
    biddingId: "3",
    biddingCode: "PE 091/2025",
    biddingObject: "Transporte escolar zona rural - 8 rotas",
    orgao: "Pref. Governador Valadares",
    contractNumber: "CT-2025/312",
    contractStartDate: "01/02/2026",
    contractEndDate: "31/12/2026",
    monthlyValue: 58333.33,
    paymentCycle: "mensal",
    estimatedPaymentDays: 30,
    supplierId: "4",
    supplierName: "MicroTur MG",
    supplierPaymentRule: "Todo dia 15 do mês subsequente",
    supplierMonthlyValue: 42000,
    anticipationAllowed: false,
  },
];

// ── Mock: Cronograma de Pagamentos (Espelhado) ──
export const mockPaymentSchedule: PaymentScheduleEntry[] = [
  // CC 005/2026 - Março
  {
    id: "ps-1", contractId: "ct-1", biddingCode: "CC 005/2026", type: "entrada",
    description: "Medição Março/2026", entity: "TRT-3ª Região",
    expectedDate: "31/03/2026", actualDate: null, amount: 74166.67,
    status: "previsto", nfNumber: "NF-001234", nfStatus: "emitida",
    anticipationRequested: false, anticipationDate: null, healthStatus: "em_dia",
  },
  {
    id: "ps-2", contractId: "ct-1", biddingCode: "CC 005/2026", type: "saida",
    description: "Repasse Março/2026", entity: "BH Ônibus",
    expectedDate: "10/04/2026", actualDate: null, amount: 54000,
    status: "agendado", nfNumber: null, nfStatus: "agendado",
    anticipationRequested: false, anticipationDate: null, healthStatus: "em_dia",
  },
  // PE 034/2025 - Fevereiro
  {
    id: "ps-3", contractId: "ct-2", biddingCode: "PE 034/2025", type: "entrada",
    description: "Medição Fevereiro/2026", entity: "SAAE Uberlândia",
    expectedDate: "15/03/2026", actualDate: "18/03/2026", amount: 120833.33,
    status: "pago", nfNumber: "NF-001189", nfStatus: "recebida",
    anticipationRequested: false, anticipationDate: null, healthStatus: "em_dia",
  },
  {
    id: "ps-4", contractId: "ct-2", biddingCode: "PE 034/2025", type: "saida",
    description: "Repasse Fevereiro/2026", entity: "TransVan Express",
    expectedDate: "23/03/2026", actualDate: null, amount: 85000,
    status: "agendado", nfNumber: null, nfStatus: "agendado",
    anticipationRequested: false, anticipationDate: null, healthStatus: "pendente_repasse",
  },
  // PE 091/2025 - Fevereiro  
  {
    id: "ps-5", contractId: "ct-3", biddingCode: "PE 091/2025", type: "entrada",
    description: "Medição Fevereiro/2026", entity: "Pref. Governador Valadares",
    expectedDate: "28/02/2026", actualDate: "05/03/2026", amount: 58333.33,
    status: "pago", nfNumber: "NF-001150", nfStatus: "recebida",
    anticipationRequested: false, anticipationDate: null, healthStatus: "em_dia",
  },
  {
    id: "ps-6", contractId: "ct-3", biddingCode: "PE 091/2025", type: "saida",
    description: "Repasse Fevereiro/2026", entity: "MicroTur MG",
    expectedDate: "15/03/2026", actualDate: "15/03/2026", amount: 42000,
    status: "pago", nfNumber: null, nfStatus: "pago",
    anticipationRequested: false, anticipationDate: null, healthStatus: "em_dia",
  },
  // PE 034/2025 - Março (antecipação solicitada)
  {
    id: "ps-7", contractId: "ct-2", biddingCode: "PE 034/2025", type: "entrada",
    description: "Medição Março/2026", entity: "SAAE Uberlândia",
    expectedDate: "15/04/2026", actualDate: null, amount: 120833.33,
    status: "previsto", nfNumber: null, nfStatus: "aguardando_medicao",
    anticipationRequested: false, anticipationDate: null, healthStatus: "em_dia",
  },
  {
    id: "ps-8", contractId: "ct-2", biddingCode: "PE 034/2025", type: "saida",
    description: "Repasse Março/2026", entity: "TransVan Express",
    expectedDate: "20/04/2026", actualDate: null, amount: 85000,
    status: "antecipacao_solicitada", nfNumber: null, nfStatus: "antecipacao_solicitada",
    anticipationRequested: true, anticipationDate: "06/03/2026", healthStatus: "antecipacao_pendente",
  },
  // CC 005/2026 - Dezembro atrasado
  {
    id: "ps-9", contractId: "ct-1", biddingCode: "CC 005/2026", type: "entrada",
    description: "Medição Dezembro/2025", entity: "TRT-3ª Região",
    expectedDate: "31/12/2025", actualDate: null, amount: 74166.67,
    status: "atrasado", nfNumber: "NF-001102", nfStatus: "emitida",
    anticipationRequested: false, anticipationDate: null, healthStatus: "pendente_repasse",
  },
  {
    id: "ps-10", contractId: "ct-1", biddingCode: "CC 005/2026", type: "saida",
    description: "Repasse Dezembro/2025", entity: "BH Ônibus",
    expectedDate: "10/01/2026", actualDate: null, amount: 54000,
    status: "previsto", nfNumber: null, nfStatus: "agendado",
    anticipationRequested: false, anticipationDate: null, healthStatus: "pendente_repasse",
  },
];
