import streamlit as st
import pandas as pd
import requests
from collections import Counter
import json
from typing import Tuple, List

st.set_page_config(layout="wide", page_title="Yugioh Deck Analyzer")

st.title("Yugioh Deck Analyzer (v1.1)")

# -------------------------
# Helpers
# -------------------------

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

        # Some .ydk variants include comments; skip non-digit lines
        if line.isdigit():
            if section == "main":
                main.append(int(line))
            elif section == "extra":
                extra.append(int(line))
            elif section == "side":
                side.append(int(line))

    return main, extra, side


@st.cache_data(show_spinner=False)
def fetch_card_info(card_id: int):
    """
    Fetch card info from YGOPRODeck and return the parsed JSON dict.
    Cached per session to avoid repeated network calls.
    """
    url = f"https://db.ygoprodeck.com/api/v7/cardinfo.php?id={card_id}"
    try:
        resp = requests.get(url, timeout=8)
        resp.raise_for_status()
    except Exception as e:
        # Return a minimal response with error info
        return {"id": card_id, "name": f"Unknown ({card_id})", "error": str(e)}

    payload = resp.json().get("data", [None])[0]
    if not payload:
        return {"id": card_id, "name": f"Unknown ({card_id})", "error": "No data"}

    # Build a normalized record with many fields exposed
    record = {
        "id": payload.get("id"),
        "name": payload.get("name"),
        "type": payload.get("type"),
        "race": payload.get("race"),
        "desc": payload.get("desc"),
        "archetype": payload.get("archetype"),
        "banlist_info": payload.get("banlist_info"),
        "atk": payload.get("atk"),
        "def": payload.get("def"),
        "level": payload.get("level"),
        "attribute": payload.get("attribute"),
        "scale": payload.get("scale"),
        "linkval": payload.get("linkval"),
        "linkmarkers": payload.get("linkmarkers", []),
        "card_images": payload.get("card_images", []),
        "card_sets": payload.get("card_sets", []),
        "card_prices": payload.get("card_prices", []),
        # Keep full raw payload for inspection if needed
        "_raw": payload,
    }
    return record


def safe_json_str(obj, max_chars=400):
    """Return a compact, truncated JSON string for display in a table cell."""
    try:
        s = json.dumps(obj, ensure_ascii=False)
    except Exception:
        s = str(obj)
    if len(s) > max_chars:
        return s[: max_chars - 3] + "..."
    return s


# -------------------------
# UI – Upload YDK
# -------------------------

uploaded_file = st.file_uploader("Upload a .YDK file", type=["ydk"])

if uploaded_file:
    file_content = uploaded_file.getvalue().decode("utf-8", errors="ignore")
    main_ids, extra_ids, side_ids = parse_ydk(file_content)

    st.success("File parsed successfully!")
    st.info(f"Found {len(main_ids)} main, {len(extra_ids)} extra, {len(side_ids)} side cards.")

    # Count copies
    all_ids = list(main_ids) + list(extra_ids) + list(side_ids)
    id_counts = Counter(all_ids)

    unique_ids = list(id_counts.keys())

    # Fetch card info with progress
    st.write("Fetching card data from YGOPRODeck (cached when possible)...")
    progress = st.progress(0)
    card_db = {}
    total = len(unique_ids)
    if total == 0:
        progress.progress(1.0)
    for i, cid in enumerate(unique_ids):
        card_db[cid] = fetch_card_info(cid)
        # progress expects a float between 0.0 and 1.0 or int 0-100
        if total:
            progress.progress((i + 1) / total)
    st.success("Card data loaded!")

    # -------------------------
    # Display Card Images in a neat container
    # -------------------------

    with st.container():
        st.subheader("Card Images")
        # Use three columns for section toggles / counts, then image rows below
        st.markdown(
            f"**Main:** {len(main_ids)} cards &nbsp;&nbsp; | &nbsp;&nbsp; **Extra:** {len(extra_ids)} cards &nbsp;&nbsp; | &nbsp;&nbsp; **Side:** {len(side_ids)} cards"
        )

        def display_card_section(title: str, ids: List[int], cols_per_row: int = 6):
            st.markdown(f"### {title}")
            if not ids:
                st.write("_No cards in this section._")
                return

            # create rows of columns
            rows = [ids[i : i + cols_per_row] for i in range(0, len(ids), cols_per_row)]
            for row in rows:
                cols = st.columns(len(row))
                for col, cid in zip(cols, row):
                    card = card_db.get(cid, {})
                    name = card.get("name", f"Unknown ({cid})")
                    # Count how many copies are present in this section
                    if title.lower().startswith("main"):
                        copies = main_ids.count(cid)
                    elif title.lower().startswith("extra"):
                        copies = extra_ids.count(cid)
                    else:
                        copies = side_ids.count(cid)

                    caption = f"{name} ×{copies}"
                    img_url = None
                    imgs = card.get("card_images") or []
                    if imgs:
                        # some cards have multiple images; use the first
                        img_url = imgs[0].get("image_url")

                    with col:
                        if img_url:
                            st.image(img_url, caption=caption, use_container_width=True)
                        else:
                            st.write(caption)

        display_card_section("Main Deck", main_ids)
        display_card_section("Extra Deck", extra_ids)
        display_card_section("Side Deck", side_ids)

    # -------------------------
    # Build Table with extended info inside a collapsible expander
    # -------------------------

    table_rows = []
    for cid, _ in id_counts.items():
        card = card_db.get(cid, {"id": cid})
        raw = card.get("_raw", card)  # raw payload if present

        # assemble fields, handling missing entries gracefully
        row = {
            "Card ID": cid,
            "Card Name": card.get("name"),
            "Card Type": card.get("type"),
            "Subtype / Race": card.get("race"),
            "Card Text": card.get("desc"),
            "Archetype": card.get("archetype"),
            "ATK": card.get("atk"),
            "DEF": card.get("def"),
            "Level": card.get("level"),
            "Attribute": card.get("attribute"),
            "Scale": card.get("scale"),
            "Link Rating": card.get("linkval"),
            "Link Arrows": ", ".join(card.get("linkmarkers") or []),
            "Banlist Info (raw)": safe_json_str(card.get("banlist_info")),
            "Card Sets (sample)": safe_json_str(card.get("card_sets")),
            "Card Prices (sample)": safe_json_str(card.get("card_prices")),
            "Copies (Main Deck)": main_ids.count(cid),
            "Copies (Extra Deck)": extra_ids.count(cid),
            "Copies (Side Deck)": side_ids.count(cid),
            "Raw Data (truncated)": safe_json_str(raw, max_chars=500),
        }
        table_rows.append(row)

    df = pd.DataFrame(table_rows)

    with st.expander("Show / Hide: Full Card Info Table (click to expand)"):
        st.subheader("Deck Information Table")
        st.dataframe(df, use_container_width=True)

        # Also offer CSV download
        csv = df.to_csv(index=False).encode("utf-8")
        st.download_button("Download table as CSV", data=csv, file_name="deck_info.csv", mime="text/csv")
else:
    st.info("Upload a .YDK file to begin. Files exported from DuelingBook / EDOPro / YGOPro are supported.")
