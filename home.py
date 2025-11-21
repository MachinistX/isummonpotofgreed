import streamlit as st
import requests

st.title("iSummonPotOfGreed — Deck Viewer")

# ----------------- Helper Functions ----------------- #

def parse_ydk(file_content: str):
    """Parse YDK content into main, extra, and side decks"""
    main, extra, side = [], [], []
    current = None

    for line in file_content.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            if line.startswith("#main"):
                current = "main"
            elif line.startswith("#extra"):
                current = "extra"
            continue
        if line == "!side":
            current = "side"
            continue
        if line.isdigit():
            if current == "main":
                main.append(line)
            elif current == "extra":
                extra.append(line)
            elif current == "side":
                side.append(line)
    return main, extra, side

def get_card_info(card_id):
    """Fetch card info from YGOPRODeck API"""
    url = f"https://db.ygoprodeck.com/api/v7/cardinfo.php?id={card_id}"
    try:
        res = requests.get(url, timeout=5)
        res.raise_for_status()
        data = res.json()
        return data["data"][0]
    except Exception:
        return None

# ----------------- Streamlit UI ----------------- #

uploaded_file = st.file_uploader("Upload your YDK deck file", type=["ydk"])

if uploaded_file:
    content = uploaded_file.read().decode("utf-8", errors="ignore")
    main, extra, side = parse_ydk(content)

    st.subheader("Main Deck")
    if not main:
        st.info("No cards found in Main Deck")
    else:
        cols = st.columns(6)
        for i, cid in enumerate(main):
            card = get_card_info(cid)
            if card:
                cols[i % 6].image(card["card_images"][0]["image_url"], caption=card["name"])
            else:
                cols[i % 6].write(f"Card {cid} not found")

    if extra:
        st.subheader("Extra Deck")
        cols = st.columns(6)
        for i, cid in enumerate(extra):
            card = get_card_info(cid)
            if card:
                cols[i % 6].image(card["card_images"][0]["image_url"], caption=card["name"])
            else:
                cols[i % 6].write(f"Card {cid} not found")

    if side:
        st.subheader("Side Deck")
        cols = st.columns(6)
        for i, cid in enumerate(side):
            card = get_card_info(cid)
            if card:
                cols[i % 6].image(card["card_images"][0]["image_url"], caption=card["name"])
            else:
                cols[i % 6].write(f"Card {cid} not found")
