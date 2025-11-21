# app.py
import streamlit as st
import requests
from collections import Counter
import html
from typing import Tuple, List, Dict

st.set_page_config(layout="wide", page_title="YDK Viewer — Images + Hover Info")
st.title("YDK Viewer — Images from YGOPRODeck, Info on Hover")

YGOPRO_CARDINFO = "https://db.ygoprodeck.com/api/v7/cardinfo.php?id={}"
YGOPRO_IMAGE = "https://images.ygoprodeck.com/images/cards/{}.jpg"  # large images; small variant exists if desired

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
        if line.isdigit():
            cid = int(line)
            if section == "main":
                main.append(cid)
            elif section == "extra":
                extra.append(cid)
            elif section == "side":
                side.append(cid)
    return main, extra, side

@st.cache_data(show_spinner=False)
def fetch_card_info_ygopro(card_id: int) -> Dict:
    """Fetch card info from YGOPRODeck. Cached between runs."""
    try:
        resp = requests.get(YGOPRO_CARDINFO.format(card_id), timeout=8)
        resp.raise_for_status()
    except Exception:
        return {}
    data = resp.json().get("data")
    if not data:
        return {}
    return data[0]

def make_card_tooltip_html(card_data: Dict) -> str:
    """Return an HTML string for the hover popover with all card info (escaped)."""
    if not card_data:
        return "<div class='ci-tooltip-empty'>No data found on YGOPRODeck for this card.</div>"

    # build fields
    name = html.escape(card_data.get("name", "Unknown"))
    ctype = html.escape(card_data.get("type", ""))
    race = html.escape(card_data.get("race") or "")
    archetype = html.escape(card_data.get("archetype") or "")
    ban = card_data.get("banlist_info") or {}
    ban_str = ", ".join(f"{k}:{v}" for k, v in ban.items()) if ban else ""
    desc = html.escape(card_data.get("desc", "")).replace("\n", "<br/>")
    atk = card_data.get("atk", "")
    deff = card_data.get("def", "")
    level = card_data.get("level", card_data.get("rank", ""))
    attribute = html.escape(card_data.get("attribute") or "")
    scale = card_data.get("scale", "")
    linkval = card_data.get("linkval", "")
    linkmarkers = card_data.get("linkmarkers") or []
    linkmarkers_str = html.escape(", ".join(linkmarkers))

    # sets & prices
    sets = card_data.get("card_sets") or []
    sets_html = ""
    if sets:
        for s in sets[:3]:
            sets_html += f"<div class='ci-set'>{html.escape(s.get('set_name',''))} ({html.escape(s.get('set_code',''))}) - {html.escape(s.get('set_rarity',''))}</div>"

    prices = card_data.get("card_prices") or []
    prices_html = ""
    if prices:
        # take first price object and show some keys
        p = prices[0]
        for k, v in p.items():
            prices_html += f"<div class='ci-price'>{html.escape(k)}: {html.escape(str(v))}</div>"

    # compose HTML
    html_parts = [
        "<div class='ci-tooltip'>",
        f"<h3 style='margin:4px 0'>{name}</h3>",
        f"<div><strong>Type:</strong> {ctype} / {race}</div>",
        f"<div><strong>Archetype:</strong> {archetype}</div>",
        f"<div><strong>Attribute/Level:</strong> {attribute} / {level}</div>",
        f"<div><strong>ATK / DEF:</strong> {atk or '-'} / {deff or '-'}</div>",
    ]

    if scale:
        html_parts.append(f"<div><strong>Pendulum Scale:</strong> {scale}</div>")
    if linkval:
        html_parts.append(f"<div><strong>Link Rating:</strong> {linkval} — Arrows: {linkmarkers_str}</div>")

    if ban_str:
        html_parts.append(f"<div><strong>Banlist:</strong> {html.escape(ban_str)}</div>")

    if sets_html:
        html_parts.append("<div><strong>Sets:</strong>")
        html_parts.append(sets_html)
        html_parts.append("</div>")

    if prices_html:
        html_parts.append("<div><strong>Sample prices:</strong>")
        html_parts.append(prices_html)
        html_parts.append("</div>")

    if desc:
        html_parts.append("<div style='margin-top:6px;'><strong>Card text:</strong><div style='margin-top:4px'>" + desc + "</div></div>")

    html_parts.append("</div>")
    return "".join(html_parts)

def make_card_html_card(card_id: int, card_data: Dict, width_px: int = 100) -> str:
    """
    Return an HTML block for a single card image with a CSS hover popover.
    width_px controls image width; height preserved by browser.
    """
    img_url = YGOPRO_IMAGE.format(card_id)
    safe_img = html.escape(img_url)
    tooltip_html = make_card_tooltip_html(card_data)
    # outer container with tooltip shown on hover
    # use data-tooltip for simpler escaping, but we place the tooltip content in a hidden div to allow rich HTML
    html_block = f"""
    <div class="ci-card">
      <img src="{safe_img}" width="{width_px}" alt="{html.escape(str(card_data.get('name','')))}" loading="lazy"/>
      <div class="ci-popup">
        {tooltip_html}
      </div>
    </div>
    """
    return html_block

# CSS for grid and tooltip
TOOLTIP_CSS = """
<style>
.ci-grid { display:flex; flex-wrap:wrap; gap:8px; }
.ci-section { margin-bottom:18px; }
.ci-card { position: relative; display:inline-block; }
.ci-card img { border-radius:6px; box-shadow: 0 2px 6px rgba(0,0,0,0.25); }
.ci-popup {
  visibility: hidden;
  opacity: 0;
  transition: opacity 0.12s ease;
  position: absolute;
  z-index: 9999;
  top: -10px;
  left: 110%;
  width: 420px;
  max-height: 400px;
  overflow: auto;
  background: white;
  border: 1px solid rgba(0,0,0,0.12);
  padding: 10px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.15);
  border-radius: 8px;
}
.ci-card:hover .ci-popup { visibility: visible; opacity: 1; }
/* small screens: drop tooltip under image */
@media(max-width:800px){
  .ci-popup { left: 0; top: 110%; width: 90vw; }
}
.ci-tooltip h3 { margin:0; font-size:16px; }
.ci-tooltip div { font-size:13px; margin-top:4px; }
.ci-set, .ci-price { font-size:12px; color: #444; margin-top:4px; }
</style>
"""

# -------------------------
# UI: upload
# -------------------------
st.markdown("Upload a `.ydk` deck file (EDOPro / DuelingBook / YGOPro format).")
uploaded = st.file_uploader("Upload .ydk", type=["ydk"])

if uploaded:
    content = uploaded.getvalue().decode("utf-8", errors="ignore")
    main_ids, extra_ids, side_ids = parse_ydk(content)
    if not (main_ids or extra_ids or side_ids):
        st.error("No cards found in the YDK file.")
    else:
        st.success(f"Parsed YDK: Main={len(main_ids)} Extra={len(extra_ids)} Side={len(side_ids)}")
        # fetch card data for unique ids
        all_ids = list(dict.fromkeys(main_ids + extra_ids + side_ids))  # preserve order, unique
        with st.spinner("Fetching card data from YGOPRODeck..."):
            card_cache = {}
            for cid in all_ids:
                card_cache[cid] = fetch_card_info_ygopro(cid)

        # render sections
        st.markdown(TOOLTIP_CSS, unsafe_allow_html=True)

        def render_section(title: str, ids: List[int]):
            st.markdown(f"### {title} — {len(ids)} cards")
            if not ids:
                st.write("_No cards in this section._")
                return
            # create HTML grid
            html_items = []
            for cid in ids:
                card_data = card_cache.get(cid, {})
                html_items.append(make_card_html_card(cid, card_data, width_px=100))
            grid_html = '<div class="ci-grid">' + "\n".join(html_items) + "</div>"
            st.markdown(grid_html, unsafe_allow_html=True)

        render_section("Main Deck", main_ids)
        render_section("Extra Deck", extra_ids)
        render_section("Side Deck", side_ids)

        st.markdown("---")
        st.info("Hover a card image to see full card information fetched from YGOPRODeck.")
else:
    st.info("Waiting for a .YDK file upload.")
