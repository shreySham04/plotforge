import PDFDocument from "pdfkit";
import { Project, ProjectContent } from "../types/index.js";
import { Response } from "express";

export function generateProjectPdf(project: Project, content: ProjectContent, res: Response): void {
  const title = project.title || "Untitled Project";
  const author = project.authorUsername || "Author";
  const isScript = project.type === "SCRIPT";
  const textContent = isScript ? (content.scriptContent || "") : (content.storyContent || "");

  const safeFilename = title.replace(/[^a-zA-Z0-9_\-]/g, "_").substring(0, 50);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}.pdf"`);

  const doc = new PDFDocument({
    size: "LETTER",
    margins: {
      top: 54,
      bottom: 54,
      left: 72,
      right: 72
    },
    info: {
      Title: title,
      Author: author,
      Creator: "PlotForge Screenplay Studio"
    }
  });

  doc.pipe(res);

  // Title Header
  doc.fontSize(22).font(isScript ? "Courier-Bold" : "Helvetica-Bold").text(title.toUpperCase(), { align: "center" });
  doc.moveDown(0.5);

  doc.fontSize(11).font(isScript ? "Courier" : "Helvetica").fillColor("#555555").text(`Written by ${author}`, { align: "center" });

  if (project.logline) {
    doc.moveDown(0.4);
    doc.fontSize(10).font(isScript ? "Courier-Oblique" : "Helvetica-Oblique").fillColor("#777777").text(`"${project.logline}"`, { align: "center" });
  }

  doc.moveDown(1.5);
  doc.strokeColor("#d1d5db").lineWidth(1).moveTo(72, doc.y).lineTo(540, doc.y).stroke();
  doc.moveDown(1.5);

  // Body format
  if (isScript) {
    doc.font("Courier").fontSize(10).fillColor("#111827");
  } else {
    doc.font("Helvetica").fontSize(11).fillColor("#1f2937");
  }

  const lines = (textContent || "No text recorded yet.").split("\n");
  for (const line of lines) {
    // Screenplay formatting conventions
    const trimmed = line.trim();
    if (isScript && (trimmed.startsWith("INT.") || trimmed.startsWith("EXT.") || trimmed.startsWith("FADE"))) {
      doc.moveDown(0.5);
      doc.font("Courier-Bold").text(line, { align: "left", lineGap: 3 });
      doc.font("Courier");
    } else if (isScript && trimmed === trimmed.toUpperCase() && trimmed.length > 2 && trimmed.length < 35 && !trimmed.includes(".")) {
      // Character cue
      doc.moveDown(0.4);
      doc.font("Courier-Bold").text(line, { indent: 140, lineGap: 2 });
      doc.font("Courier");
    } else {
      doc.text(line, { lineGap: 3 });
    }
  }

  doc.end();
}
