from bs4 import BeautifulSoup
import pandas as pd
import re

# =========================
# NAČTENÍ HTML
# =========================
with open("page.html", "r", encoding="utf-8") as f:
    html = f.read()

soup = BeautifulSoup(html, "html.parser")

# =========================
# POMOCNÉ FUNKCE
# =========================
def clean_text(text):
    return re.sub(r"\s+", " ", str(text)).strip()


def is_question_text(text):
    return bool(re.match(r"^\d+\.\s+", text))


def is_explanation_text(text):
    return text.lower().startswith("explanation:")


# =========================
# PARSOVÁNÍ
# =========================
elements = soup.find_all(["p", "ul"])

questions = []

current_question = None
current_answers = []
current_correct = []


def save_current_question():
    if current_question:
        questions.append({
            "question": current_question,
            "answers": " | ".join(current_answers),
            "correct": " | ".join(current_correct)
        })


for el in elements:
    text = clean_text(el.get_text(" ", strip=True))

    if not text:
        continue

    # NOVÁ OTÁZKA
    if el.name == "p" and is_question_text(text):
        save_current_question()
        current_question = text
        current_answers = []
        current_correct = []
        continue

    # ODPOVĚDI
    if current_question and el.name == "ul":
        items = el.find_all("li", recursive=False)

        if items:
            for li in items:
                answer_text = clean_text(li.get_text(" ", strip=True))
                if not answer_text:
                    continue

                current_answers.append(answer_text)

                li_classes = li.get("class", [])
                if "correct_answer" in li_classes:
                    current_correct.append(answer_text)

# uložit poslední otázku
save_current_question()

# =========================
# ČIŠTĚNÍ
# =========================
for q in questions:
    q["question"] = clean_text(q["question"])
    q["answers"] = clean_text(q["answers"])
    q["correct"] = clean_text(q["correct"])

# =========================
# ULOŽENÍ
# =========================
df = pd.DataFrame(questions)
df.to_csv("questions.csv", index=False, encoding="utf-8-sig")
df.to_json("questions.json", orient="records", force_ascii=False)

print(f"Hotovo. Uloženo {len(questions)} otázek do questions.csv")
print("Uloženo i jako JSON")

if questions:
    print("\n--- PRVNÍ OBJEKT ---")
    print("QUESTION:", questions[0]["question"])
    print("ANSWERS:", questions[0]["answers"])
    print("CORRECT:", questions[0]["correct"])