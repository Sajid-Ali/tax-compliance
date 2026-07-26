import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { Company, CompanyDirector, FilingDeadline } from "../types";

/**
 * Generates a Form A filing PREP SHEET — a clearly-labeled internal draft
 * summarizing everything needed to complete the real SECP Form A submission,
 * for the CA reviewer to check and the admin to use while filing manually on
 * SECP e-Services (no filing API exists to submit directly — see
 * lib/rules-engine.ts and the architecture plan for why).
 *
 * This is deliberately NOT a pixel-reproduction of the official government
 * form (we don't have that asset licensed/embedded) — it's the mail-merge
 * artifact that removes the CA's need to manually re-key company data.
 */
export async function generateFormADraft(params: {
  company: Company;
  directors: CompanyDirector[];
  deadline: FilingDeadline;
}): Promise<Uint8Array> {
  const { company, directors, deadline } = params;

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const margin = 50;
  let y = 841.89 - margin;

  const drawHeading = (text: string) => {
    page.drawText(text, { x: margin, y, size: 16, font: boldFont, color: rgb(0, 0, 0) });
    y -= 24;
  };

  const drawSubheading = (text: string) => {
    y -= 6;
    page.drawText(text, { x: margin, y, size: 12, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
    y -= 18;
  };

  const drawLine = (label: string, value: string) => {
    page.drawText(label, { x: margin, y, size: 10, font, color: rgb(0.35, 0.35, 0.35) });
    page.drawText(value, { x: margin + 180, y, size: 10, font: boldFont });
    y -= 16;
  };

  drawHeading("SECP Form A / Form 29 — Annual Return: Filing Prep Sheet");
  page.drawText("Internal draft for CA review — not the official SECP form.", {
    x: margin,
    y,
    size: 9,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });
  y -= 30;

  drawSubheading("Company");
  drawLine("Name", company.name);
  drawLine("SECP registration no.", company.secp_registration_no);
  drawLine("Incorporation date", company.incorporation_date);
  drawLine("Paid-up capital (PKR)", company.paid_up_capital.toLocaleString());
  drawLine("Company type", company.company_type);

  drawSubheading("Filing");
  drawLine("Rule", deadline.rule_key);
  drawLine("Due date", deadline.due_date);
  drawLine("Status", deadline.status);

  drawSubheading(`Directors (${directors.length})`);
  if (directors.length === 0) {
    page.drawText("No directors recorded yet.", {
      x: margin,
      y,
      size: 10,
      font,
      color: rgb(0.6, 0, 0),
    });
    y -= 16;
  } else {
    for (const d of directors) {
      page.drawText(`${d.name}  ·  ${d.designation}  ·  CNIC ${d.cnic}`, {
        x: margin,
        y,
        size: 10,
        font,
      });
      y -= 16;
    }
  }

  y -= 20;
  page.drawLine({
    start: { x: margin, y },
    end: { x: 595.28 - margin, y },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });
  y -= 24;

  drawSubheading("CA reviewer sign-off");
  page.drawText("Reviewed by: ________________________     Date: ____________", {
    x: margin,
    y,
    size: 10,
    font,
  });
  y -= 20;
  page.drawText(
    "Approval recorded in-app (audit_log) at the time of electronic sign-off — this line is a physical-copy fallback only.",
    { x: margin, y, size: 8, font, color: rgb(0.5, 0.5, 0.5) }
  );

  return pdfDoc.save();
}
