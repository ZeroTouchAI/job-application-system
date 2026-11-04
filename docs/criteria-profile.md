# Criteria Profile (reusable application answers)

## Problem
Applications keep asking the same things (expected salary, work authorization, notice period, relocation, remote preference, how did you hear about us). Answering each time is the main friction after the resume.

## Concept
A per-user key/value store of **canonical answers**. When a swiped-yes job has questions, the system maps each question to a canonical key, pre-fills from the store, and only asks the user about unknowns. New answers are saved back.

## Data model (Prisma sketch)
```
model CriteriaAnswer {
  id         String   @id @default(cuid())
  userId     String
  key        String   // canonical key, e.g. "expected_salary"
  value      Json
  label      String   // human-readable question text first seen
  updatedAt  DateTime @updatedAt
  @@unique([userId, key])
}

model JobQuestion {
  id        String @id @default(cuid())
  jobId     String
  rawText   String
  fieldType String   // text | select | boolean | number
  options   Json?
  mappedKey String?  // canonical key if matched
}
```

## Flow
1. Swipe yes.
2. Fetch question schema (Greenhouse/Lever expose it; otherwise parse application page text the user opens).
3. Map each question to a canonical key (LLM classify, fall back to "new key").
4. Pre-fill known answers; surface unknowns in one short form.
5. Save new answers; user reviews everything before submitting.

## Rules
- User always reviews and submits. No silent auto-submit (matches repo principles).
- Answers are never invented. Unknown means ask.
- Sensitive answers (salary, work authorization) are editable and deletable in settings.

## Open questions
- Per-job overrides (e.g. different salary for a contract role)?
- How to handle free-text essay questions (generate draft from profile, user edits)?
