# app.py
import os
import re
import subprocess
import json
from pathlib import Path
from typing import Dict, Any, Tuple, List

import streamlit as st
from pymongo import MongoClient, errors
from pymongo.collection import Collection

st.set_page_config(layout="wide", page_title="ProjectIgnis → MongoDB Updater")
st.title("Project Ignis CardScripts → MongoDB (Option C parser)")

# -------------------------
# MongoDB connection check
# -------------------------
mongo_conf = st.secrets["mongodb"]
MONGO_URI = f"mongodb+srv://{mongo_conf['user']}:{mongo_conf['password']}@{mongo_conf['host']}/?appName={mongo_conf['appName']}"

try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    client.server_info()  # force connection attempt
    db = client[mongo_conf["database"]]
    collection: Collection = db[mongo_conf["collection"]]
    st.success("✅ Connected to MongoDB successfully.")
except errors.ServerSelectionTimeoutError:
    st.error("❌ Cannot connect to MongoDB - server selection timeout. Check Atlas network access and secrets.")
    st.stop()
except Exception as e:
    st.error(f"❌ MongoDB connection failed: {e}")
    st.stop()

# Ensure unique index on id
try:
    collection.create_index("id", unique=True)
except Exception:
    # ignore if index exists or if not permitted
    pass

# -------------------------
# Helpers: parsing & detection
# -------------------------

FUNC_PATTERN = re.compile(r"function\s+s\.(\w+)\s*\((.*?)\)(.*?)end", re.DOTALL)  # crude, but works for many scripts

# tokens / regexes for metadata detection
RE_SETCOUNTLIMIT = re.compile(r"\.SetCountLimit\s*\(\s*([^\)]*)\)")
RE_SETCOUNTLIMIT_HOPT = re.compile(r"\.SetCountLimit\s*\(\s*1\s*,\s*id\s*\)")  # common pattern
RE_SETCOUNTLIMIT_DUEL = re.compile(r"SetCountLimit\([^,]*,[^,]*EFFECT_COUNT_CODE_DUEL")
RE_LISTED_SERIES = re.compile(r"s\.listed_series\s*=\s*\{([^\}]*)\}")
RE_LISTED_NAMES = re.compile(r"s\.listed_names\s*=\s*\{([^\}]*)\}")
RE_CATEGORY = re.compile(r"CATEGORY_[A-Z_]+")
RE_EVENT = re.compile(r"EVENT_[A-Z_]+")
RE_EFFECT_FLAG = re.compile(r"EFFECT_FLAG_[A-Z_]+")
RE_EFFECT_TYPE = re.compile(r"EFFECT_TYPE_[A-Z_]+")
RE_SET_PROPERTY = re.compile(r"\.SetProperty\s*\(([^)]*)\)")
RE_CISCODE = re.compile(r"IsCode\s*\(\s*(\d+)\s*\)")
RE_INDESTRUCT = re.compile(r"EFFECT_INDESTRUCTABLE_EFFECT|EFFECT_INDESTRUCTABLE_BATTLE")
RE_CANNOT_BE_TARGET = re.compile(r"EFFECT_CANNOT_BE_EFFECT_TARGET")
RE_CANNOT_SPECIAL_SUMMON = re.compile(r"EFFECT_CANNOT_SPECIAL_SUMMON")
RE_CUSTOM_ACTIVITY = re.compile(r"AddCustomActivityCounter|CustomActivityCounter")
RE_CATEGORY_CALL = re.compile(r"Category\.\w+|CATEGORY_[A-Z_]+")

# utility: simple param splitter
def split_params(param_str: str) -> List[str]:
    params = [p.strip() for p in param_str.split(",")] if param_str.strip() else []
    return [p for p in params if p != ""]

def extract_names(lua: str) -> Tuple[str, str]:
    """
    Try to extract JP/EN names from leading comment lines.
    """
    lines = lua.splitlines()
    jp = en = ""
    for line in lines:
        s = line.strip()
        if s.startswith("--"):
            text = s[2:].strip()
            if not jp:
                jp = text
            elif not en:
                en = text
                break
        elif s == "":
            # skip blank lines
            continue
        else:
            # stop on first non-comment (names usually in first comments)
            continue
    return jp, en

def extract_functions(lua: str) -> Dict[str, Dict[str, Any]]:
    """
    Extract named functions s.<name>(params) ... end into a dict of {name: {parameters: [], body: "..."}}
    """
    result = {}
    for m in FUNC_PATTERN.finditer(lua):
        fname = m.group(1)
        raw_params = m.group(2)
        body = m.group(3).strip()
        result[fname] = {
            "parameters": split_params(raw_params),
            "body": body
        }
    return result

def detect_meta(lua: str) -> Dict[str, Any]:
    """
    Find relevant metadata from Lua script using regex heuristics.
    Returns a dictionary with many boolean flags and lists.
    """
    meta: Dict[str, Any] = {}

    # HOPT / OPT / Once per duel
    meta["has_SetCountLimit"] = bool(RE_SETCOUNTLIMIT.search(lua))
    meta["has_HOPT_like"] = bool(RE_SETCOUNTLIMIT_HOPT.search(lua)) or bool(re.search(r"SetCountLimit\([^,]*\)\s*--\s*once", lua, re.IGNORECASE))
    meta["has_once_per_duel"] = bool(RE_SETCOUNTLIMIT_DUEL.search(lua) or re.search(r"EFFECT_COUNT_CODE_DUEL", lua))

    # Listed series/names
    ss = RE_LISTED_SERIES.search(lua)
    if ss:
        series_raw = ss.group(1)
        # split tokens by comma
        series = [s.strip() for s in series_raw.split(",") if s.strip()]
        meta["listed_series"] = series
    else:
        meta["listed_series"] = []

    sn = RE_LISTED_NAMES.search(lua)
    if sn:
        names_raw = sn.group(1)
        names = [int(n.strip()) for n in re.findall(r"\d+", names_raw)]
        meta["listed_names"] = names
    else:
        meta["listed_names"] = []

    # Categories & events
    meta["categories"] = list(set(RE_CATEGORY.findall(lua)))
    meta["events"] = list(set(RE_EVENT.findall(lua)))
    meta["effect_flags"] = list(set(RE_EFFECT_FLAG.findall(lua)))
    meta["effect_types"] = list(set(RE_EFFECT_TYPE.findall(lua)))

    # Targeting / property
    meta["has_target_property"] = bool(RE_SET_PROPERTY.search(lua) or "EFFECT_FLAG_CARD_TARGET" in lua)
    meta["has_indestructible"] = bool(RE_INDESTRUCT.search(lua))
    meta["has_cannot_be_target"] = bool(RE_CANNOT_BE_TARGET.search(lua))
    meta["has_cannot_special_summon"] = bool(RE_CANNOT_SPECIAL_SUMMON.search(lua))

    # Custom activity counters and locks
    meta["has_custom_activity_counter"] = bool(RE_CUSTOM_ACTIVITY.search(lua))

    # Named codes
    codes = [int(x) for x in re.findall(r"IsCode\s*\(\s*(\d+)\s*\)", lua)]
    meta["referenced_codes"] = list(set(codes))

    # Basic category calls
    meta["category_calls"] = list(set(RE_CATEGORY_CALL.findall(lua)))

    return meta

# -------------------------
# UI: repo path and update button
# -------------------------
st.markdown("**Repo source (default set to Project Ignis CardScripts official):**")
default_repo_url = "https://github.com/ProjectIgnis/CardScripts.git"
repo_path_input = st.text_input("Local path or GitHub repo URL (cloned locally if URL):", value=default_repo_url)

col1, col2 = st.columns([1, 3])
with col1:
    if st.button("Update Database from Project Ignis"):
        # handle clone/pull
        local_repo_path = "./CardScripts"
        try:
            if repo_path_input.startswith("http"):
                if not os.path.isdir(local_repo_path):
                    st.info("Cloning Project Ignis CardScripts (this may take a while)...")
                    subprocess.run(["git", "clone", "--depth", "1", repo_path_input, local_repo_path], check=True)
                else:
                    st.info("Repository already cloned. Pulling latest changes...")
                    # perform git pull
                    try:
                        subprocess.run(["git", "-C", local_repo_path, "pull"], check=True)
                    except subprocess.CalledProcessError:
                        st.warning("`git pull` failed; repository may be in a dirty state. Continuing with current files.")
            else:
                local_repo_path = repo_path_input  # treat as local path

            official_folder = os.path.join(local_repo_path, "official")
            if not os.path.isdir(official_folder):
                st.error(f"official/ folder not found at: {official_folder}")
            else:
                lua_files = [f for f in os.listdir(official_folder) if f.endswith(".lua")]
                total = len(lua_files)
                if total == 0:
                    st.warning("No .lua files found in official/ folder.")
                else:
                    st.write(f"Found {total} .lua scripts. Starting processing...")
                    progress = st.progress(0.0)
                    status = st.empty()
                    log_box = st.empty()
                    inserted = updated = skipped = errors = 0
                    log_lines: List[str] = []

                    for idx, fname in enumerate(sorted(lua_files), start=1):
                        fpath = os.path.join(official_folder, fname)
                        try:
                            with open(fpath, "r", encoding="utf-8") as fh:
                                lua = fh.read()
                        except Exception as e:
                            errors += 1
                            log_lines.append(f"ERROR reading {fname}: {e}")
                            # update UI and continue
                            progress.progress(idx / total)
                            status.text(f"Error reading {fname} ({idx}/{total})")
                            log_box.text("\n".join(log_lines[-10:]))
                            continue

                        # parse id from filename
                        m = re.match(r"c(\d+)\.lua", fname)
                        if not m:
                            skipped += 1
                            log_lines.append(f"SKIP (no id) {fname}")
                            progress.progress(idx / total)
                            status.text(f"Skipped {fname} ({idx}/{total})")
                            log_box.text("\n".join(log_lines[-10:]))
                            continue
                        card_id = int(m.group(1))

                        # extract names, functions, meta
                        name_jp, name_en = extract_names(lua)
                        functions = extract_functions(lua)
                        meta = detect_meta(lua)

                        # build candidate fields to update
                        candidate_doc = {
                            "id": card_id,
                            "name_jp": name_jp,
                            "name_en": name_en,
                            "lua_raw": lua,
                            "functions": functions,
                            "meta": meta
                        }

                        # incremental update logic
                        try:
                            existing = collection.find_one({"id": card_id})
                        except Exception as e:
                            errors += 1
                            log_lines.append(f"ERROR DB find {card_id}: {e}")
                            progress.progress(idx / total)
                            status.text(f"DB error on {card_id} ({idx}/{total})")
                            log_box.text("\n".join(log_lines[-10:]))
                            continue

                        update_fields = {}
                        is_new = existing is None

                        # Compare top-level simple fields
                        for key in ("name_jp", "name_en", "lua_raw"):
                            val = candidate_doc.get(key)
                            if is_new or existing.get(key) != val:
                                update_fields[key] = val

                        # Compare functions: add/replace only if different
                        existing_funcs = existing.get("functions", {}) if existing else {}
                        for fname, fval in functions.items():
                            if existing_funcs.get(fname) != fval:
                                update_fields.setdefault("functions", {})
                                update_fields["functions"][fname] = fval

                        # Compare meta: shallow compare; replace if different
                        existing_meta = existing.get("meta", {}) if existing else {}
                        if existing_meta != meta:
                            update_fields["meta"] = meta

                        # If there are updates, perform $set (upsert if new)
                        if update_fields:
                            try:
                                collection.update_one({"id": card_id}, {"$set": update_fields}, upsert=True)
                                if is_new:
                                    inserted += 1
                                    log_lines.append(f"INSERTED {card_id} ({fname})")
                                else:
                                    updated += 1
                                    log_lines.append(f"UPDATED {card_id} ({fname})")
                            except Exception as e:
                                errors += 1
                                log_lines.append(f"ERROR DB upsert {card_id}: {e}")
                        else:
                            skipped += 1
                            log_lines.append(f"SKIPPED (no changes) {card_id}")

                        # update progress UI
                        progress.progress(idx / total)
                        status.text(f"Processing: {fname} ({idx}/{total})")
                        log_box.text("\n".join(log_lines[-10:]))

                    # finished
                    status.text("Completed processing all files.")
                    st.success(f"Done — inserted: {inserted}, updated: {updated}, skipped: {skipped}, errors: {errors}")
                    # show a bit of log
                    st.subheader("Recent log entries")
                    st.text("\n".join(log_lines[-50:]))
        except subprocess.CalledProcessError as e:
            st.error(f"Git command failed: {e}")
        except Exception as e:
            st.error(f"Unexpected error: {e}")

with col2:
    st.markdown(
        """
        **Notes & behavior**
        - This updater stores **raw Lua** and extracts functions under `functions.<name>` and heuristics under `meta`.
        - Updates are **incremental**: only changed fields are `$set`. Existing fields not touched are preserved.
        - The script **creates a unique index on `id`** to avoid duplicates.
        - If you clone from GitHub, the app will `git clone` (once) and will `git pull` on subsequent runs.
        - You can change the repo path to a local clone if you prefer.
        """
    )
