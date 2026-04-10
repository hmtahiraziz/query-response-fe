import { jsPDF } from "jspdf";

/** Inline markdown → plain text for PDF body */
export function stripInlineMd(s: string): string {
  return s
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

type Block =
  | { kind: "h"; level: number; text: string }
  | { kind: "p"; text: string }
  | { kind: "hr" }
  | { kind: "li"; ordered: boolean; index: number; text: string };

export function parseMarkdownBlocks(md: string): Block[] {
  const normalized = md.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];
  const chunks = normalized.split(/\n{2,}/);
  const blocks: Block[] = [];

  for (const chunk of chunks) {
    const rawLines = chunk.split("\n");
    const lines = rawLines.map((l) => l.trimEnd()).filter((l) => l.trim().length > 0);
    if (lines.length === 0) continue;

    const trimmed = lines.map((l) => l.trim());

    if (trimmed.length === 1 && /^[-_*]{3,}\s*$/.test(trimmed[0])) {
      blocks.push({ kind: "hr" });
      continue;
    }

    const first = trimmed[0];
    if (/^#{1,6}\s/.test(first)) {
      const m = /^(#{1,6})\s+([\s\S]*)$/.exec(chunk.replace(/\r\n/g, "\n").trim());
      if (m) {
        blocks.push({ kind: "h", level: m[1].length, text: m[2].replace(/\n/g, " ").trim() });
      }
      continue;
    }

    if (trimmed.every((l) => l.startsWith(">"))) {
      const text = trimmed.map((l) => l.replace(/^>\s?/, "")).join(" ");
      blocks.push({ kind: "p", text });
      continue;
    }

    const allUl = trimmed.every((l) => /^[-*]\s+/.test(l));
    if (allUl) {
      for (const l of trimmed) {
        blocks.push({ kind: "li", ordered: false, index: 0, text: l.replace(/^[-*]\s+/, "") });
      }
      continue;
    }

    const allOl = trimmed.every((l) => /^\d+\.\s+/.test(l));
    if (allOl) {
      for (const l of trimmed) {
        const m = /^(\d+)\.\s+(.*)$/.exec(l);
        if (m) {
          blocks.push({ kind: "li", ordered: true, index: Number(m[1]), text: m[2] });
        }
      }
      continue;
    }

    blocks.push({ kind: "p", text: trimmed.join(" ") });
  }

  return blocks;
}

function ptToMmLineHeight(pt: number): number {
  return (pt * 25.4) / 72;
}

export function buildCoverLetterPdfBlob(markdown: string): Blob {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;
  const maxW = pageW - 2 * margin;
  let y = margin;

  function newPage() {
    doc.addPage();
    y = margin;
  }

  function ensureSpace(mm: number) {
    if (y + mm > pageH - margin) newPage();
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(110, 110, 115);
  doc.text("COVER LETTER", margin, y);
  y += 4.5;
  doc.setFontSize(10.5);
  const dateStr = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.text(dateStr, margin, y);
  y += 6;
  doc.setDrawColor(201, 162, 39);
  doc.setLineWidth(0.35);
  doc.line(margin, y, pageW - margin, y);
  y += 9;

  const blocks = parseMarkdownBlocks(markdown);

  for (const b of blocks) {
    if (b.kind === "h") {
      const sizesPt = [17, 14, 12.5, 11.5, 11, 10.5];
      const sizePt = sizesPt[Math.min(b.level, 6) - 1] ?? 11;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(sizePt);
      doc.setTextColor(18, 18, 20);
      const text = stripInlineMd(b.text);
      const lines = doc.splitTextToSize(text, maxW);
      const lh = ptToMmLineHeight(sizePt) * 1.15;
      for (const line of lines) {
        ensureSpace(lh);
        doc.text(line, margin, y);
        y += lh;
      }
      y += 2.5;
      doc.setFont("helvetica", "normal");
    } else if (b.kind === "p") {
      doc.setFontSize(11);
      doc.setTextColor(42, 44, 48);
      const text = stripInlineMd(b.text);
      const lines = doc.splitTextToSize(text, maxW);
      const lh = ptToMmLineHeight(11) * 1.25;
      for (const line of lines) {
        ensureSpace(lh);
        doc.text(line, margin, y);
        y += lh;
      }
      y += 2;
    } else if (b.kind === "li") {
      doc.setFontSize(11);
      doc.setTextColor(42, 44, 48);
      const bullet = b.ordered ? `${b.index}.` : "•";
      const text = stripInlineMd(b.text);
      const indent = margin + 6;
      const lines = doc.splitTextToSize(text, maxW - 8);
      const lh = ptToMmLineHeight(11) * 1.25;
      let isFirst = true;
      for (const line of lines) {
        ensureSpace(lh);
        if (isFirst) {
          doc.text(bullet, margin, y);
          doc.text(line, indent, y);
          isFirst = false;
        } else {
          doc.text(line, indent, y);
        }
        y += lh;
      }
      y += 0.5;
    } else if (b.kind === "hr") {
      ensureSpace(5);
      doc.setDrawColor(210, 212, 218);
      doc.setLineWidth(0.15);
      doc.line(margin, y + 1, pageW - margin, y + 1);
      y += 6;
    }
  }

  return doc.output("blob");
}
