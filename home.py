import streamlit as st
from pymongo import MongoClient
import os
import re
import subprocess

st.set_page_config(layout="wide", page_title="Yugioh MongoDB Updater")
st.title("Update Card Database from Project Ignis Scripts")

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
def parse_lua_functions(lua_content):
    funcs_to_extract = ["initial_effect","condition","target","operation","rfilter","tgcond","tgtg","tgop"]
    func_pattern = re.compile(r"function\s+s\.(\w+)\s*\((.*?)\)(.*?)end", re.DOTALL)
    result = {}
    for match in func_pattern.finditer(lua_content):
        fname = match.group(1)
        if fname in funcs_to_extract:
            params = [p.strip() for p in match.group(2).split(",")]
            body = match.group(3).strip()
            result[fname] = {"parameters": params, "body": body}
    return result

def extract_names(lua_content):
    lines = lua_content.splitlines()
    name_jp = name_en = ""
    for line in lines:
        line = line.strip()
        if line.startswith("--"):
            if not name_jp:
                name_jp = line[2:].strip()
            elif not name_en:
                name_en = line[2:].strip()
                break
    return name_jp, name_en

# -----------------------------
# Update Database Button
# -----------------------------
st.subheader("Update Database from Project Ignis Scripts")
st.info("This will iterate over all .lua files in the official folder and update MongoDB.")

# Default GitHub repo
default_repo_url = "https://github.com/ProjectIgnis/CardScripts.git"
repo_path_input = st.text_input("Path to local Project Ignis repo (or leave default to clone):", default_repo_url)

if st.button("Update Database"):
    # Determine if repo_path_input is a URL or local path
    if repo_path_input.startswith("http"):
        # Clone repo to temporary folder if it doesn't exist
        local_repo_path = "./CardScripts"
        if not os.path.isdir(local_repo_path):
            st.info("Cloning Project Ignis repo...")
            subprocess.run(["git", "clone", "--depth", "1", repo_path_input, local_repo_path], check=True)
        official_folder = os.path.join(local_repo_path, "official")
    else:
        official_folder = os.path.join(repo_path_input, "official")

    if not os.path.isdir(official_folder):
        st.error(f"Official folder not found: {official_folder}")
    else:
        lua_files = [f for f in os.listdir(official_folder) if f.endswith(".lua")]
        st.write(f"Found {len(lua_files)} Lua scripts.")
        updated = 0
        for lua_file in lua_files:
            file_path = os.path.join(official_folder, lua_file)
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            card_id_match = re.match(r"c(\d+)\.lua", lua_file)
            if not card_id_match:
                continue
            card_id = int(card_id_match.group(1))
            name_jp, name_en = extract_names(content)
            functions_dict = parse_lua_functions(content)
            doc = {"id": card_id, "name_jp": name_jp, "name_en": name_en, "lua_raw": content}
            doc.update(functions_dict)
            collection.update_one({"id": card_id}, {"$set": doc}, upsert=True)
            updated += 1
        st.success(f"Database update complete. {updated} cards inserted/updated.")
