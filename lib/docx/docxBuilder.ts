import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";
import type { GeneratedResume } from "../engine/generateResume";
import type { GeneratedCoverLetter } from "../engine/generateCoverLetter";
import type { Profile } from "../profileSchema";

/**
 * ATS-safe formatting: single column, standard font, no tables, no
 * headers/footers, no text-in-images. Font size is configurable,
 * default 12pt (24 half-points, docx's unit).
 */
const FONT = "Calibri";
const FONT_SIZE = 24; // 12pt

export async function buildResumeDocx(
  profile: Profile,
  resume: GeneratedResume
): Promise<Buffer> {
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: profile.fullName || "",
          bold: true,
          size: FONT_SIZE + 8,
          font: FONT,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: [profile.email, profile.phone, profile.location, profile.linkedinUrl]
            .filter(Boolean)
            .join(" | "),
          size: FONT_SIZE - 2,
          font: FONT,
        }),
      ],
    }),
    new Paragraph({ text: "" })
  );

  if (resume.summary) {
    children.push(
      heading("Summary"),
      new Paragraph({
        children: [new TextRun({ text: resume.summary, size: FONT_SIZE, font: FONT })],
      }),
      new Paragraph({ text: "" })
    );
  }

  children.push(heading("Experience"));
  for (const job of resume.workExperience) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${job.title} — ${job.employer}`, bold: true, size: FONT_SIZE, font: FONT }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: job.dateRange, italics: true, size: FONT_SIZE - 2, font: FONT }),
        ],
      })
    );
    for (const bullet of job.bullets) {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [new TextRun({ text: bullet.text, size: FONT_SIZE, font: FONT })],
        })
      );
    }
    children.push(new Paragraph({ text: "" }));
  }

  if (resume.skills.length > 0) {
    children.push(
      heading("Skills"),
      new Paragraph({
        children: [
          new TextRun({ text: resume.skills.join(" • "), size: FONT_SIZE, font: FONT }),
        ],
      }),
      new Paragraph({ text: "" })
    );
  }

  if (resume.certifications.length > 0) {
    children.push(
      heading("Certifications"),
      ...resume.certifications.map(
        (c) =>
          new Paragraph({
            bullet: { level: 0 },
            children: [new TextRun({ text: c, size: FONT_SIZE, font: FONT })],
          })
      )
    );
  }

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}

export async function buildCoverLetterDocx(
  profile: Profile,
  letter: GeneratedCoverLetter
): Promise<Buffer> {
  const paragraphs = letter.body
    .split(/\n\n+/)
    .map(
      (para) =>
        new Paragraph({
          children: [new TextRun({ text: para, size: FONT_SIZE, font: FONT })],
          spacing: { after: 200 },
        })
    );

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: profile.fullName || "", bold: true, size: FONT_SIZE, font: FONT }),
            ],
          }),
          new Paragraph({ text: "" }),
          ...paragraphs,
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}

function heading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, bold: true, font: FONT })],
  });
}
