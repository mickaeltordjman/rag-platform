export type InterventionArm = "GPT" | "GPT_OPENSCHOLAR";
export type StudyPhase = "baseline" | "ai" | "completed";

export type DiagnosticAnswer = {
  mainDiagnosis: string;
  differentials: [string, string, string];
  confidence: number;
  submittedAt: string;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  sources?: Array<{ title: string; url?: string }>;
};

export type ReaderProfile = {
  email: string;
  studyId: string;
  country: string;
  specialty: string;
  trainingLevel: string;
  yearsIndependent: number;
  priorLlmUse: string;
  consentedAt: string;
};

export type CaseSession = {
  caseId: string;
  arm: InterventionArm;
  phase: StudyPhase;
  openedAt: string;
  baseline?: DiagnosticAnswer;
  final?: DiagnosticAnswer;
  messages: ChatMessage[];
  aiUnlockedAt?: string;
  completedAt?: string;
};

export type StudyState = {
  reader?: ReaderProfile;
  sessions: Record<string, CaseSession>;
};

export const CASES = [
  {
    id: "IM-001",
    specialty: "Internal Medicine",
    title: "Fever, rash, and polyarthritis",
    sections: [
      ["Chief complaint", "A 46-year-old man presents with fever, rash, and progressive joint pain."],
      ["History", "One week of intermittent lightheadedness followed by swelling and pain of both wrists and ankles, an evanescent salmon-colored rash, and daily fevers. No recent travel, sick contacts, or new medications."],
      ["Physical examination", "Temperature 38.7°C, blood pressure 147/80 mm Hg, pulse 109 beats/min, oxygen saturation 100% on room air. Swelling and tenderness of the wrists and ankles are present. A faint macular rash is seen on the trunk."],
      ["Laboratory results", "ESR 104 mm/h, ferritin markedly elevated, alkaline phosphatase mildly elevated. CBC, kidney function, AST, ALT, and urinalysis are otherwise unremarkable."],
    ],
  },
  {
    id: "IM-002",
    specialty: "Internal Medicine",
    title: "Dyspnea and constitutional symptoms",
    sections: [
      ["Presentation", "A 34-year-old man with asthma presents with progressive dyspnea, cough, fever, and odynophagia."],
      ["History", "Three months earlier he developed oral white plaques. One month later exertional dyspnea and productive cough developed, followed by fatigue, night sweats, chills, and chest pain."],
      ["Examination", "The patient appears cachectic and ill, with fever and increased work of breathing."],
      ["Available data", "No final diagnosis is shown to the reader. Use the clinical information and any provided images to formulate the differential."],
    ],
  },
    {
    id: "RAD-001",
    specialty: "Radiology",
    title: "RAD-001",
    sections: [
      [
        "Presentation",
        "Replace this with the actual clinical presentation for RAD-001.",
      ],
      [
        "Imaging",
        "Review all available image sequences before submitting your diagnosis.",
      ],
    ],
  },
];

export function deterministicArm(readerId: string, caseId: string): InterventionArm {
  const value = `${readerId}:${caseId}`.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return value % 2 === 0 ? "GPT" : "GPT_OPENSCHOLAR";
}

export function caseText(caseId: string): string {
  const studyCase = CASES.find((item) => item.id === caseId);
  if (!studyCase) return "";
  return studyCase.sections.map(([heading, text]) => `${heading}: ${text}`).join("\n\n");
}
