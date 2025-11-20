import streamlit as st
import pandas as pd
import json
import os
from collections import Counter
from typing import List, Tuple

st.set_page_config(layout="wide", page_title="Yugioh Deck Analyzer (EDOPro JSON)")

st.title("Yugioh Deck Analyzer with EDOPro JSON")

DATA_DIR = "data"
os.makedirs(DATA_DIR, exist_ok=True)
CARDS_JSON_PATH = os.path.join(DATA_DIR, "cards.json")
TEXTS_JSON_PATH = os.path.join(DATA_DIR, "texts.json")


# -----------------------------
# Helpers
# -----------------------------
def parse_ydk(file_content: str) -> Tuple[List[int], List[int], List[int]]:
    main, extra, side = [], [], []
    section = None
    for line in file_content.splitlines():
        line = line.strip()
        if line == "#main":
            section = "main"
            continue
        elif line == "#extra":
            section = "extra"
            continue
        elif line == "!side" or line == "#side":
            section = "side"
            continue
        if line.startswith("#") or line == "":
            continue
        if line.isdigit():
            if section == "main":
                main.append(int(line))
            elif section == "extra":
                extra.append(int(line))
            elif section == "side":
                side.append(int(line))
    return main, extra, side


def safe_json_str(obj, max_chars=400):
    try:
        s = json.dumps(obj, ensure_ascii=False)
    except Exception:
        s = str(obj)
    if len(s) > max_chars:
        return s[: max_chars - 3] + "..."
    return s


def load_json(path):
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


# -----------------------------
# EDOPro Database Update Button
# -----------------------------
st.subheader("EDOPro Database")
st.markdown(
    "Click the button below to update the local EDOPro database (`cards.json` and `texts.json`)."
)
if st.button("Update EDOPro Database"):
    # --- Replace this section with your actual source ---
    # For demonstration, we simulate fetching the full EDOPro database
    # You can replace with GitHub download or bundled file
    try:
        st.info("Fetching EDOPro database...")

        # Simulate: copy pre-bundled JSON from app folder
        bundled_cards = "edo_full_cards.json"  # replace with your actual file
        if not os.path.exists(bundled_cards):
            st.error(f"Bundled EDOPro JSON not found: {bundled_cards}")
        else:
            with open(bundled_cards, "r", encoding="utf-8") as f:
                full_cards = json.load(f)

            # Split into cards.json and texts.json
            cards_json = {}
            texts_json = {}
            for cid, data in full_cards.items():
                cards_json[cid] = data
                texts_json[cid] = {"desc": data.get("desc", ""), "pendulum": data.get("pendulum", "")}

            # Save to /data/
            with open(CARDS_JSON_PATH, "w", encoding="utf-8") as f:
                json.dump(cards_json, f, ensure_ascii=False, indent=2)
            with open(TEXTS_JSON_PATH, "w", encoding="utf-8") as f:
                json.dump(texts_json, f, ensure_ascii=False, indent=2)

            st.success("EDOPro database updated successfully!")
    except Exception as e:
        st.error(f"Failed to update EDOPro database: {e}")


# -----------------------------
# YDK Upload
# -----------------------------
st.subheader("Upload YDK File")
uploaded_file = st.file_uploader(".YDK file", type=["ydk"])
if uploaded_file:
    file_content = uploaded_file.getvalue().decode("utf-8", errors="ignore")
    main_ids, extra_ids, side_ids = parse_ydk(file_content)
    all_ids = list(set(main_ids + extra_ids + side_ids))
    if not all_ids:
        st.error("No card IDs found in the uploaded YDK.")
        st.stop()

    st.success(f"YDK parsed successfully! Main: {len(main_ids)}, Extra: {len(extra_ids)}, Side: {len(side_ids)}")

    # Load existing EDOPro JSON
    cards_json = load_json(CARDS_JSON_PATH)
    texts_json = load_json(TEXTS_JSON_PATH)
    if not cards_json:
        st.warning("cards.json is empty. Click 'Update EDOPro Database' first.")
        st.stop()

    # Build lookup
    card_db = {int(k): v for k, v in cards_json.items()}

    # -----------------------------
    # Display card images in tabs
    # -----------------------------
    tabs = st.tabs(["Main Deck", "Extra Deck", "Side Deck"])

    def display_images(tab, ids: List[int]):
        if not ids:
            tab.write("_No cards in this section._")
            return
        cols_per_row = 6
        rows = [ids[i: i + cols_per_row] for i in range(0, len(ids), cols_per_row)]
        for row in rows:
            cols = tab.columns(len(row))
            for col, cid in zip(cols, row):
                card = card_db.get(cid, {})
                name = card.get("name", f"Unknown ({cid})")
                copies = ids.count(cid)
                caption = f"{name} ×{copies}"
                img_url = card.get("image_url")  # make sure EDOPro JSON has image_url field
                if img_url:
                    col.image(img_url, caption=caption, width=100)
                else:
                    col.write(caption)

    display_images(tabs[0], main_ids)
    display_images(tabs[1], extra_ids)
    display_images(tabs[2], side_ids)

    # -----------------------------
    # Build table in collapsible expander
    # -----------------------------
    table_rows = []
    id_counts = Counter(main_ids + extra_ids + side_ids)
    for cid in all_ids:
        card = card_db.get(cid, {})
        text_data = texts_json.get(str(cid), {})
        row = {
            "Card ID": cid,
            "Card Name": card.get("name"),
            "Card Type": card.get("type"),
            "Subtype / Race": card.get("race"),
            "Archetype": card.get("archetype"),
            "Card Text": text_data.get("desc", ""),
            "Pendulum Text": text_data.get("pendulum", ""),
            "ATK": card.get("atk"),
            "DEF": card.get("def"),
            "Level": card.get("level"),
            "Rank": card.get("rank"),
            "Attribute": card.get("attribute"),
            "Scale": card.get("scale"),
            "Link Rating": card.get("linkval"),
            "Link Arrows": ", ".join(card.get("linkmarkers", [])),
            "Copies (Main Deck)": main_ids.count(cid),
            "Copies (Extra Deck)": extra_ids.count(cid),
            "Copies (Side Deck)": side_ids.count(cid),
            "Raw JSON": safe_json_str(card, max_chars=500)
        }
        table_rows.append(row)

    df = pd.DataFrame(table_rows)

    with st.expander("Show / Hide: Full Card Info Table"):
        st.dataframe(df, use_container_width=True)
        csv = df.to_csv(index=False).encode("utf-8")
        st.download_button("Download table as CSV", data=csv, file_name="deck_info.csv", mime="text/csv")
else:
    st.info("Upload a .YDK file to start analyzing your deck. You can also update the EDOPro database first.")
