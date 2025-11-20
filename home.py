import streamlit as st
from pymongo import MongoClient
from collections import Counter
import pandas as pd

st.set_page_config(layout="wide", page_title="Yugioh Deck Analyzer with MongoDB")

st.title("Yugioh Deck Analyzer (MongoDB Edition)")

# -----------------------------
# MongoDB connection
# -----------------------------
mongo_conf = st.secrets["mongodb"]

uri = f"mongodb+srv://{mongo_conf['user']}:{mongo_conf['password']}@{mongo_conf['host']}/?appName={mongo_conf['appName']}"
client = MongoClient(uri)
db = client[mongo_conf["database"]]
collection = db[mongo_conf["collection"]]

# -----------------------------
# Helper functions
# -----------------------------
def parse_ydk(file_content: str):
    """Parse YDK file into main, extra, and side deck card ID lists"""
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
            cid = int(line)
            if section == "main":
                main.append(cid)
            elif section == "extra":
                extra.append(cid)
            elif section == "side":
                side.append(cid)
    return main, extra, side

def show_images(tab, card_docs):
    """Display card images in Streamlit columns (100px)"""
    if not card_docs:
        tab.write("_No cards in this section._")
        return
    cols_per_row = 6
    for i in range(0, len(card_docs), cols_per_row):
        row_docs = card_docs[i: i + cols_per_row]
        cols = tab.columns(len(row_docs))
        for col, card in zip(cols, row_docs):
            name = card.get("name", f"Unknown ({card.get('id')})")
            count = card.get("copies", 1)
            caption = f"{name} ×{count}"
            img_url = card.get("image_url")
            if img_url:
                col.image(img_url, caption=caption, width=100)
            else:
                col.write(caption)

# -----------------------------
# Upload YDK
# -----------------------------
st.subheader("Upload Your YDK Deck File")
uploaded_file = st.file_uploader(".YDK file", type=["ydk"])

if uploaded_file:
    content = uploaded_file.getvalue().decode("utf-8", errors="ignore")
    main_ids, extra_ids, side_ids = parse_ydk(content)
    all_ids = list(set(main_ids + extra_ids + side_ids))
    if not all_ids:
        st.error("No card IDs found in the YDK file.")
        st.stop()
    st.success(f"Deck parsed: Main {len(main_ids)}, Extra {len(extra_ids)}, Side {len(side_ids)}")

    # Query MongoDB for only the cards in the deck
    card_docs_raw = list(collection.find({"id": {"$in": all_ids}}))
    if not card_docs_raw:
        st.warning("No cards found in MongoDB. Make sure the database is populated.")
        st.stop()

    # Count copies for each card
    counts = Counter(main_ids + extra_ids + side_ids)
    card_docs = []
    for doc in card_docs_raw:
        doc_copy = doc.copy()
        doc_copy["copies"] = counts.get(doc["id"], 1)
        card_docs.append(doc_copy)

    # Split by section
    main_cards = [c for c in card_docs if c["id"] in main_ids]
    extra_cards = [c for c in card_docs if c["id"] in extra_ids]
    side_cards = [c for c in card_docs if c["id"] in side_ids]

    # Display images in tabs
    tabs = st.tabs(["Main Deck", "Extra Deck", "Side Deck"])
    show_images(tabs[0], main_cards)
    show_images(tabs[1], extra_cards)
    show_images(tabs[2], side_cards)

    # Build metadata table
    rows = []
    for card in card_docs:
        row = {
            "Card ID": card.get("id"),
            "Name": card.get("name"),
            "Type": card.get("type"),
            "Subtype": card.get("subtype"),
            "Attribute": card.get("attribute"),
            "Level": card.get("level"),
            "ATK": card.get("atk"),
            "DEF": card.get("def"),
            "Link": card.get("linkval"),
            "Scale": card.get("scale"),
            "Text": card.get("text"),
            "Copies (Main)": main_ids.count(card["id"]),
            "Copies (Extra)": extra_ids.count(card["id"]),
            "Copies (Side)": side_ids.count(card["id"]),
        }
        rows.append(row)

    df = pd.DataFrame(rows)

    # Display collapsible metadata table
    with st.expander("Show deck card info"):
        st.dataframe(df, use_container_width=True)
        csv = df.to_csv(index=False).encode("utf-8")
        st.download_button("Download CSV", csv, "deck_info.csv", "text/csv")
else:
    st.info("Upload a .YDK file to analyze your deck after connecting to MongoDB.")
