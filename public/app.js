"use strict";
/// <reference lib="dom" />
const uploadArea = document.getElementById("uploadArea");
const fileInput = document.getElementById("fileInput");
const fileListEl = document.getElementById("fileList");
const evaluateBtn = document.getElementById("evaluateBtn");
const spinner = document.getElementById("spinner");
const statusEl = document.getElementById("status");
const errorEl = document.getElementById("error");
const resultEl = document.getElementById("result");
const resultContent = document.getElementById("resultContent");
const rulebookToggle = document.getElementById("rulebookToggle");
const rulebookBody = document.getElementById("rulebookBody");
const rulebookArrow = document.getElementById("rulebookArrow");
const criteriaList = document.getElementById("criteriaList");
const gradeScaleEl = document.getElementById("gradeScale");
// --- Rulebook toggle ---
rulebookToggle.addEventListener("click", () => {
    rulebookBody.classList.toggle("open");
    rulebookArrow.innerHTML = rulebookBody.classList.contains("open")
        ? "&#9660;"
        : "&#9654;";
});
async function loadRulebook() {
    try {
        const res = await fetch("/api/rulebook");
        const data = (await res.json());
        criteriaList.innerHTML = data.criteria
            .map((c) => `
      <div class="criterion">
        <div class="criterion-header">
          <span class="criterion-name">${c.name}</span>
          <span class="criterion-weight">${c.weight}%</span>
        </div>
        <div class="criterion-desc">${c.description}</div>
      </div>
    `)
            .join("");
        gradeScaleEl.innerHTML = data.gradeScale
            .map((g) => `<span>${g.grade} (${g.min}-${g.max}): ${g.label}</span>`)
            .join(" ");
    }
    catch {
        criteriaList.innerHTML =
            '<p style="font-size: 12px; color: #555;">Could not load rulebook.</p>';
    }
}
loadRulebook();
// --- File handling ---
let selectedFiles = [];
uploadArea.addEventListener("click", () => fileInput.click());
uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.classList.add("dragover");
});
uploadArea.addEventListener("dragleave", () => {
    uploadArea.classList.remove("dragover");
});
uploadArea.addEventListener("drop", (e) => {
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
function addFiles(files) {
    for (const file of files) {
        const alreadyAdded = selectedFiles.some((f) => f.name === file.name && f.size === file.size);
        if (!alreadyAdded) {
            selectedFiles.push(file);
        }
    }
    renderFileList();
}
function removeFile(index) {
    selectedFiles.splice(index, 1);
    renderFileList();
}
function renderFileList() {
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
function simpleMarkdown(text) {
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
    if (selectedFiles.length === 0)
        return;
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
        const data = (await response.json());
        if (!response.ok) {
            throw new Error(data.error || "Evaluation failed");
        }
        resultContent.innerHTML = simpleMarkdown(data.evaluation || "");
        resultEl.style.display = "block";
        statusEl.textContent = `Evaluated ${data.fileCount} transcript(s).`;
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong";
        errorEl.textContent = `Error: ${message}`;
        errorEl.style.display = "block";
        statusEl.textContent = "";
    }
    finally {
        spinner.style.display = "none";
        evaluateBtn.disabled = false;
    }
});
