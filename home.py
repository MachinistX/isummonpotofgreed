import streamlit as st
import requests
import random
import os

st.title("iSummonPotOfGreed — Deck Viewer")

MAX_LABEL_LENGTH = 20

# ----------------- Helper Functions ----------------- #
def parse_ydk(file_content: str):
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
    url = f"https://db.ygoprodeck.com/api/v7/cardinfo.php?id={card_id}"
    try:
        res = requests.get(url, timeout=5)
        res.raise_for_status()
        data = res.json()
        return data["data"][0]
    except Exception:
        return None

def map_cards_to_lua(lua_folder="card-scripts/official/"):
    lua_card_map = {}
    for filename in os.listdir(lua_folder):
        if filename.endswith(".lua"):
            path = os.path.join(lua_folder, filename)
            with open(path, "r", encoding="utf-8") as f:
                lines = f.readlines()
            if len(lines) >= 2:
                card_name = lines[1].strip().lstrip("--").strip()
                lua_card_map[card_name] = filename
    return lua_card_map

# ----------------- Streamlit UI ----------------- #

uploaded_file = st.file_uploader("Upload your YDK deck file", type=["ydk"])

# Initialize session_state
if "clicked_card" not in st.session_state:
    st.session_state.clicked_card = None
if "remaining_main_deck" not in st.session_state:
    st.session_state.remaining_main_deck = []
if "hand" not in st.session_state:
    st.session_state.hand = []
if "card_cache" not in st.session_state:
    st.session_state.card_cache = {}
if "lua_mapping" not in st.session_state:
    st.session_state.lua_mapping = {}
if "deck_loaded" not in st.session_state:
    st.session_state.deck_loaded = False
if "main" not in st.session_state:
    st.session_state.main = []
if "extra" not in st.session_state:
    st.session_state.extra = []
if "side" not in st.session_state:
    st.session_state.side = []

# ----------------- Load deck and cache data ----------------- #
if uploaded_file and not st.session_state.deck_loaded:
    content = uploaded_file.read().decode("utf-8", errors="ignore")
    main, extra, side = parse_ydk(content)
    st.session_state.main = main
    st.session_state.extra = extra
    st.session_state.side = side

    all_card_ids = main + extra + side
    with st.spinner("Loading card info from YGOPRODeck..."):
        # Fetch and cache all card info
        card_cache = {}
        for cid in all_card_ids:
            card_data = get_card_info(cid)
            if card_data:
                card_cache[cid] = card_data
        st.session_state.card_cache = card_cache

    # Match Lua files and cache
    st.session_state.lua_mapping = map_cards_to_lua()
    st.session_state.remaining_main_deck = main.copy()
    st.session_state.deck_loaded = True

# ----------------- Deck Rendering ----------------- #
def render_deck(deck_list, title):
    cols = st.columns(6)
    for i, cid in enumerate(deck_list):
        card = st.session_state.card_cache.get(cid)
        if card:
            with cols[i % 6]:
                st.image(card["card_images"][0]["image_url"], width=150)
                if st.button("ⓘ", key=f"{title}_{i}_{cid}", help=card["name"]):
                    st.session_state.clicked_card = card
        else:
            with cols[i % 6]:
                st.write(f"Card {cid} not found")

if st.session_state.deck_loaded:
    st.subheader("Main Deck")
    render_deck(st.session_state.main, "Main Deck")
    st.subheader("Extra Deck")
    render_deck(st.session_state.extra, "Extra Deck")
    st.subheader("Side Deck")
    render_deck(st.session_state.side, "Side Deck")

# ----------------- Draw Cards / Test Hand ----------------- #
st.subheader("Draw Cards from Main Deck")
def draw_hand(num_cards=5):
    remaining = st.session_state.remaining_main_deck.copy()
    hand = []
    for _ in range(num_cards):
        if not remaining:
            break
        drawn_card = random.choice(remaining)
        hand.append(drawn_card)
        remaining.remove(drawn_card)
    st.session_state.hand = hand
    st.session_state.remaining_main_deck = remaining

if st.button("Test hand") and st.session_state.deck_loaded:
    st.session_state.remaining_main_deck = st.session_state.main.copy()
    draw_hand(5)

if st.session_state.hand:
    st.markdown("**Hand:**")
    cols = st.columns(len(st.session_state.hand))
    for i, cid in enumerate(st.session_state.hand):
        card = st.session_state.card_cache.get(cid)
        if card:
            with cols[i]:
                st.image(card["card_images"][0]["image_url"], width=150)
                if st.button("ⓘ", key=f"hand_{i}_{cid}", help=card["name"]):
                    st.session_state.clicked_card = card
        else:
            with cols[i]:
                st.write(f"Card {cid} not found")

# ----------------- Sidebar ----------------- #
clicked_card = st.session_state.get("clicked_card", None)
if clicked_card:
    lua_file_name = st.session_state.lua_mapping.get(clicked_card["name"], "Not found")
    st.sidebar.image(clicked_card["card_images"][0]["image_url"], width=150)
    st.sidebar.markdown(f"""
**Name:** {clicked_card['name']}  
**Type:** {clicked_card['type']}  
**Sub-type:** {clicked_card.get('race','')}  
**Attribute:** {clicked_card.get('attribute','')}  
**Level/Rank/Link:** {clicked_card.get('level') or clicked_card.get('rank') or clicked_card.get('linkval','')}  
**ATK/DEF:** {clicked_card.get('atk','-')}/{clicked_card.get('def','-')}  
**.lua file:** {lua_file_name}

{clicked_card.get('desc','')}
""")
