import json
import re
import sys
from pathlib import Path
from docx import Document

DOCX = "сборник_заданий_в_тестовой_форме_пед_ф_т_2.docx"
OUT_FILL = Path("topics/patphys_fill.json")
OUT_CASES = Path("topics/patphys_cases.json")


def runs_info(para):
    """Return list of (text, is_bold_italic) for each run."""
    result = []
    for r in para.runs:
        if r.text:
            result.append((r.text, bool(r.bold and r.italic)))
    return result


def extract_fill(para):
    """
    From a paragraph with bold+italic answers, build fill_each item.
    Returns dict or None if no real-word answers found.

    For N blanks: produces N items, each with exactly one [___] while
    the other blanks are filled with their actual answers — so len(items)==len(answers).
    """
    info = runs_info(para)
    answers = []
    segments = []  # list of (text, answer_index_or_None)

    for text, is_bi in info:
        stripped = text.strip()
        if is_bi and re.search(r'[а-яёА-ЯЁa-zA-Z]', stripped):
            segments.append((text, len(answers)))
            answers.append(stripped.rstrip(".,;:"))
        else:
            segments.append((text, None))

    if not answers:
        return None

    def build(target_idx, filled_answers):
        parts = []
        for text, ans_idx in segments:
            if ans_idx is None:
                parts.append(text)
            elif ans_idx == target_idx:
                parts.append("[___]")
            else:
                parts.append(filled_answers[ans_idx])
        s = "".join(parts).strip()
        s = re.sub(r'^[-–]\s*', '', s).strip()
        return re.sub(r' {2,}', ' ', s)

    # q: all blanks as ___
    q_parts = []
    for text, ans_idx in segments:
        q_parts.append("___" if ans_idx is not None else text)
    q = "".join(q_parts).strip()
    q = re.sub(r'^[-–]\s*', '', q).strip()
    q = re.sub(r' {2,}', ' ', q)

    if len(answers) == 1:
        items = ["[___]"]
    else:
        items = [build(i, answers) for i in range(len(answers))]

    return {
        "type": "fill_each",
        "q": q,
        "items": items,
        "answers": answers,
    }


def parse_document():
    doc = Document(DOCX)
    paras = doc.paragraphs

    fill_questions = []
    cases = []
    skipped = []

    # ── Locate section boundaries ──────────────────────────────────────────
    etalony_idx = None   # "Эталоны ответов" header
    first_zadanie = None  # first "Задание N" paragraph index

    for i, p in enumerate(paras):
        t = p.text.strip()
        if etalony_idx is None and re.search(r'Эталоны?\s+ответов', t, re.I):
            etalony_idx = i
        if re.match(r'Задание\s+\d+', t):
            if first_zadanie is None:
                first_zadanie = i

    if etalony_idx is None:
        print("ERROR: 'Эталоны ответов' not found", file=sys.stderr)
        sys.exit(1)

    fill_end = first_zadanie if first_zadanie is not None else len(paras)

    # ── Part 1: fill_each from answered section ────────────────────────────
    for i in range(etalony_idx + 1, fill_end):
        p = paras[i]
        t = p.text.strip()
        if not t:
            continue
        item = extract_fill(p)
        if item:
            fill_questions.append(item)
        else:
            skipped.append(t[:80])

    # ── Part 2: практические задачи ───────────────────────────────────────
    if first_zadanie is not None:
        current_q_parts = []
        current_a_parts = []
        in_answer = False
        zadanie_title = ""

        def flush_case():
            if current_q_parts or zadanie_title:
                q_text = "\n".join(current_q_parts).strip()
                a_text = "\n".join(current_a_parts).strip()
                if q_text and a_text:
                    cases.append({"q": q_text, "a": a_text})

        for i in range(first_zadanie, len(paras)):
            p = paras[i]
            t = p.text.strip()
            if not t:
                continue

            if re.match(r'Задание\s+\d+', t):
                flush_case()
                current_q_parts = []
                current_a_parts = []
                in_answer = False
                zadanie_title = t
                # Include the Задание header in the question
                current_q_parts.append(t)
            elif re.match(r'Эталоны?\s+ответа\s*:', t, re.I) or t.lower().startswith("эталон ответа"):
                in_answer = True
            elif in_answer:
                current_a_parts.append(t)
            else:
                current_q_parts.append(t)

        flush_case()

    return fill_questions, cases, skipped


def main():
    fill_qs, cases, skipped = parse_document()

    OUT_FILL.parent.mkdir(exist_ok=True)

    OUT_FILL.write_text(
        json.dumps(
            {"title": "Патофизиология: дополните фразу", "questions": fill_qs},
            ensure_ascii=False, indent=2,
        ),
        encoding="utf-8",
    )

    OUT_CASES.write_text(
        json.dumps(
            {"title": "Патофизиология: ситуационные задачи", "questions": cases},
            ensure_ascii=False, indent=2,
        ),
        encoding="utf-8",
    )

    lines = [
        f"fill_each распарсено : {len(fill_qs)}",
        f"пропущено (нет ответа): {len(skipped)}",
        f"ситуационных задач   : {len(cases)}",
    ]
    if skipped:
        lines.append("\nПервые 5 пропущенных:")
        for s in skipped[:5]:
            lines.append(f"  {s}")

    report = "\n".join(lines)
    Path("parse_report.txt").write_text(report, encoding="utf-8")
    # also try printing (may be garbled in some terminals)
    print(report)


if __name__ == "__main__":
    main()
