export interface Criterion {
  id: string;
  name: string;
  description: string;
  weight: number; // out of 100 total
  scoringGuide: {
    poor: string;    // 1-3
    fair: string;    // 4-5
    good: string;    // 6-7
    excellent: string; // 8-10
  };
}

export const CRITERIA: Criterion[] = [
  {
    id: "instruction_clarity",
    name: "Instruction Clarity",
    description:
      "Are the user's prompts and instructions clear, specific, and unambiguous? Does the user state what they want, the expected behavior, and any constraints?",
    weight: 15,
    scoringGuide: {
      poor: "Vague, one-word prompts with no context. AI has to guess intent entirely.",
      fair: "Partially clear but missing key details like expected behavior or constraints.",
      good: "Clear instructions with stated goals. Minor ambiguities but AI can proceed.",
      excellent:
        "Precise, well-structured prompts with explicit goals, constraints, and expected output format.",
    },
  },
  {
    id: "problem_understanding",
    name: "Problem Understanding",
    description:
      "Does the user demonstrate core understanding of the problem statement? Do they break down the problem before jumping to solutions? Do they ask clarifying questions?",
    weight: 15,
    scoringGuide: {
      poor: "No evidence of understanding. User blindly asks AI to solve without thought.",
      fair: "Some understanding shown but jumps to implementation without decomposition.",
      good: "Breaks the problem into parts. Shows understanding of what needs to happen.",
      excellent:
        "Deep understanding demonstrated. Decomposes problem, identifies edge cases, and guides the AI with domain knowledge.",
    },
  },
  {
    id: "permission_management",
    name: "Permission & Access Control",
    description:
      "Does the user properly manage permissions when the AI requests or performs actions? Do they review what the AI is about to do before granting access (file writes, command execution, API calls)?",
    weight: 10,
    scoringGuide: {
      poor: "Grants all permissions blindly. Auto-approves everything without review.",
      fair: "Occasionally reviews but mostly auto-approves. No awareness of risk levels.",
      good: "Reviews most permission requests. Understands what actions are being taken.",
      excellent:
        "Carefully reviews every action. Questions risky operations. Uses minimal-privilege approach.",
    },
  },
  {
    id: "destructive_action_checks",
    name: "Destructive Action Safeguards",
    description:
      "Does the user have safeguards against destructive operations? Do they catch or prevent actions like deleting databases, force-pushing, overwriting files, dropping tables, or running unreviewed shell commands?",
    weight: 15,
    scoringGuide: {
      poor: "No safeguards. Allows destructive commands without question. No backups or dry-runs.",
      fair: "Catches some risky actions but misses others. Inconsistent caution.",
      good: "Generally cautious with destructive actions. Asks for confirmation or dry-runs.",
      excellent:
        "Proactively prevents destructive actions. Uses backups, dry-runs, and staging. Reviews all shell commands before execution.",
    },
  },
  {
    id: "context_provision",
    name: "Context Provision",
    description:
      "Does the user provide sufficient context (tech stack, project structure, constraints, existing code) or does the AI have to guess? Does the user share relevant files, error logs, and environment details?",
    weight: 10,
    scoringGuide: {
      poor: "No context given. AI operates blind — guesses language, framework, and structure.",
      fair: "Some context but missing critical details like error messages or file structure.",
      good: "Provides tech stack, relevant code, and constraints. AI has enough to work with.",
      excellent:
        "Rich context: shares files, error logs, environment, constraints, and prior attempts. AI can make fully informed decisions.",
    },
  },
  {
    id: "incremental_verification",
    name: "Incremental Verification",
    description:
      "Does the user verify and test after each step rather than chaining multiple AI outputs blindly? Do they run the code, check output, and confirm correctness before moving on?",
    weight: 10,
    scoringGuide: {
      poor: "Never tests. Accepts multiple AI outputs in a row without verification.",
      fair: "Tests at the end but not between steps. Misses intermediate failures.",
      good: "Tests after major steps. Catches most issues before they compound.",
      excellent:
        "Verifies after each meaningful change. Runs tests, checks output, and confirms behavior before proceeding.",
    },
  },
  {
    id: "security_awareness",
    name: "Security Awareness",
    description:
      "Does the user catch or raise security concerns? Do they notice exposed secrets, SQL injection risks, missing auth, insecure dependencies, or unsafe input handling in AI-generated code?",
    weight: 10,
    scoringGuide: {
      poor: "No security awareness. Accepts code with hardcoded secrets, no input validation, or known vulnerabilities.",
      fair: "Aware of obvious issues like exposed API keys but misses subtler risks.",
      good: "Catches common security issues. Asks AI about input validation and auth.",
      excellent:
        "Proactively reviews for OWASP risks. Checks dependencies, questions auth flows, ensures secrets are in env vars, and validates all inputs.",
    },
  },
  {
    id: "scope_control",
    name: "Scope Control",
    description:
      "Does the user keep the AI focused on the task at hand? Do they prevent over-engineering, unnecessary refactors, or tangential features? Do they course-correct when the AI drifts?",
    weight: 10,
    scoringGuide: {
      poor: "No scope control. AI adds unnecessary features, refactors unrelated code, or goes off-track without correction.",
      fair: "Some awareness but lets the AI drift before correcting. Accepts some bloat.",
      good: "Generally keeps AI on track. Redirects when scope creeps.",
      excellent:
        "Tight scope management. Clearly defines boundaries, rejects unnecessary additions, and keeps the AI laser-focused on the task.",
    },
  },
  {
    id: "error_handling",
    name: "Error Handling & Recovery",
    description:
      "How does the user handle errors, failed builds, or unexpected AI output? Do they diagnose issues, provide error logs, and guide the AI toward a fix — or do they just retry blindly?",
    weight: 5,
    scoringGuide: {
      poor: "Retries the same prompt on failure. No error logs shared. No diagnosis.",
      fair: "Shares error messages but doesn't attempt diagnosis. Relies entirely on AI.",
      good: "Shares errors with context. Attempts basic diagnosis before asking AI.",
      excellent:
        "Diagnoses root cause, shares relevant logs and context, and collaborates with AI to fix systematically.",
    },
  },
];

export const GRADE_SCALE = [
  { min: 90, max: 100, grade: "A+", label: "Exceptional" },
  { min: 80, max: 89, grade: "A", label: "Excellent" },
  { min: 70, max: 79, grade: "B", label: "Good" },
  { min: 60, max: 69, grade: "C", label: "Satisfactory" },
  { min: 50, max: 59, grade: "D", label: "Needs Improvement" },
  { min: 0, max: 49, grade: "F", label: "Poor" },
];

export function buildEvaluationPrompt(): string {
  let prompt = `You are a strict engineering workflow evaluator. You will be given one or more AI coding session transcripts (conversations between a human and an AI coding assistant).

Your job is to evaluate the HUMAN's engineering workflow quality — not the AI's responses.

## Grading Rulebook

Evaluate the transcript on each of the following ${CRITERIA.length} criteria. Each criterion has a weight (shown as percentage). Score each criterion from 1 to 10.

`;

  for (const c of CRITERIA) {
    prompt += `### ${c.id.toUpperCase()}: ${c.name} (Weight: ${c.weight}%)
${c.description}

Scoring guide:
- **1-3 (Poor):** ${c.scoringGuide.poor}
- **4-5 (Fair):** ${c.scoringGuide.fair}
- **6-7 (Good):** ${c.scoringGuide.good}
- **8-10 (Excellent):** ${c.scoringGuide.excellent}

`;
  }

  prompt += `## Output Format

For each criterion, output EXACTLY this format:

### [Criterion Name]
**Score: X/10**
**Evidence:** [Quote or describe specific moments from the transcript that justify this score]
**Assessment:** [1-2 sentence explanation]

---

After all criteria, output:

## Final Grade

**Weighted Score: XX/100**
**Grade: [A+/A/B/C/D/F]**
**Verdict: [Exceptional/Excellent/Good/Satisfactory/Needs Improvement/Poor]**

Grade scale:
- A+ (90-100): Exceptional
- A (80-89): Excellent
- B (70-79): Good
- C (60-69): Satisfactory
- D (50-59): Needs Improvement
- F (0-49): Poor

## Key Strengths
- [Bullet points]

## Critical Gaps
- [Bullet points]

## Recommendations
- [Actionable bullet points for the user to improve their AI-assisted workflow]

IMPORTANT: Be strict and evidence-based. Every score must reference specific moments from the transcript. Do not give high scores without clear evidence. If a criterion is not observable in the transcript, score it as 5 with a note that it was not demonstrated.

Calculate the weighted score as: sum of (criterion_score * criterion_weight / 10) across all criteria.`;

  return prompt;
}
