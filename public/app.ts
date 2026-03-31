/// <reference lib="dom" />
const uploadArea = document.getElementById("uploadArea") as HTMLDivElement;
const fileInput = document.getElementById("fileInput") as HTMLInputElement;
const fileListEl = document.getElementById("fileList") as HTMLDivElement;
const evaluateBtn = document.getElementById("evaluateBtn") as HTMLButtonElement;
const spinner = document.getElementById("spinner") as HTMLDivElement;
const statusEl = document.getElementById("status") as HTMLDivElement;
const errorEl = document.getElementById("error") as HTMLDivElement;
const resultEl = document.getElementById("result") as HTMLDivElement;
const resultContent = document.getElementById(
  "resultContent"
) as HTMLDivElement;
const rulebookToggle = document.getElementById(
  "rulebookToggle"
) as HTMLDivElement;
const rulebookBody = document.getElementById("rulebookBody") as HTMLDivElement;
const rulebookArrow = document.getElementById(
  "rulebookArrow"
) as HTMLSpanElement;
const criteriaList = document.getElementById("criteriaList") as HTMLDivElement;
const gradeScaleEl = document.getElementById("gradeScale") as HTMLDivElement;

// --- Rulebook toggle ---
rulebookToggle.addEventListener("click", () => {
  rulebookBody.classList.toggle("open");
  rulebookArrow.innerHTML = rulebookBody.classList.contains("open")
    ? "&#9660;"
    : "&#9654;";
});

// --- Load rulebook ---
interface CriterionData {
  id: string;
  name: string;
  description: string;
  weight: number;
}

interface GradeData {
  min: number;
  max: number;
  grade: string;
  label: string;
}

async function loadRulebook(): Promise<void> {
  try {
    const res = await fetch("/api/rulebook");
    const data = (await res.json()) as {
      criteria: CriterionData[];
      gradeScale: GradeData[];
    };

    criteriaList.innerHTML = data.criteria
      .map(
        (c: CriterionData) => `
      <div class="criterion">
        <div class="criterion-header">
          <span class="criterion-name">${c.name}</span>
          <span class="criterion-weight">${c.weight}%</span>
        </div>
        <div class="criterion-desc">${c.description}</div>
      </div>
    `
      )
      .join("");

    gradeScaleEl.innerHTML = data.gradeScale
      .map((g: GradeData) => `<span>${g.grade} (${g.min}-${g.max}): ${g.label}</span>`)
      .join(" ");
  } catch {
    criteriaList.innerHTML =
      '<p style="font-size: 12px; color: #555;">Could not load rulebook.</p>';
  }
}

loadRulebook();

// --- File handling ---
let selectedFiles: File[] = [];

uploadArea.addEventListener("click", () => fileInput.click());

uploadArea.addEventListener("dragover", (e: DragEvent) => {
  e.preventDefault();
  uploadArea.classList.add("dragover");
});

uploadArea.addEventListener("dragleave", () => {
  uploadArea.classList.remove("dragover");
});

uploadArea.addEventListener("drop", (e: DragEvent) => {
  e.preventDefault();
  uploadArea.classList.remove("dragover");
  if (e.dataTransfer?.files) {
    addFiles(Array.from(e.dataTransfer.files));
  }
});

fileInput.addEventListener("change", () => {
  if (fileInput.files) {
    addFiles(Array.from(fileInput.files));
    fileInput.value = "";
  }
});

function addFiles(files: File[]): void {
  for (const file of files) {
    const alreadyAdded = selectedFiles.some(
      (f) => f.name === file.name && f.size === file.size
    );
    if (!alreadyAdded) {
      selectedFiles.push(file);
    }
  }
  renderFileList();
}

function removeFile(index: number): void {
  selectedFiles.splice(index, 1);
  renderFileList();
}

function renderFileList(): void {
  fileListEl.innerHTML = "";
  selectedFiles.forEach((file, index) => {
    const item = document.createElement("div");
    item.className = "file-item";

    const name = document.createElement("span");
    name.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", () => removeFile(index));

    item.appendChild(name);
    item.appendChild(removeBtn);
    fileListEl.appendChild(item);
  });

  evaluateBtn.disabled = selectedFiles.length === 0;
}

// --- Markdown rendering ---
function simpleMarkdown(text: string): string {
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Horizontal rules
  html = html.replace(/^---$/gm, "<hr>");

  // Headers
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

  // Bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Unordered lists
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>");

  // Numbered lists
  html = html.replace(/^\d+\. (.+)$/gm, "<li>$1</li>");

  // Line breaks
  html = html.replace(/\n\n/g, "<br><br>");

  return html;
}

// --- Evaluate ---
evaluateBtn.addEventListener("click", async () => {
  if (selectedFiles.length === 0) return;

  evaluateBtn.disabled = true;
  spinner.style.display = "block";
  statusEl.textContent = "Evaluating transcripts...";
  errorEl.style.display = "none";
  resultEl.style.display = "none";

  const formData = new FormData();
  selectedFiles.forEach((file) => formData.append("transcripts", file));

  try {
    const response = await fetch("/api/evaluate", {
      method: "POST",
      body: formData,
    });

    const data = (await response.json()) as {
      error?: string;
      evaluation?: string;
      fileCount?: number;
    };

    if (!response.ok) {
      throw new Error(data.error || "Evaluation failed");
    }

    resultContent.innerHTML = simpleMarkdown(data.evaluation || "");
    resultEl.style.display = "block";
    statusEl.textContent = `Evaluated ${data.fileCount} transcript(s).`;
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Something went wrong";
    errorEl.textContent = `Error: ${message}`;
    errorEl.style.display = "block";
    statusEl.textContent = "";
  } finally {
    spinner.style.display = "none";
    evaluateBtn.disabled = false;
  }
});
