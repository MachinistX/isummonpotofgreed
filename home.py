import streamlit as st
from pymongo import MongoClient, errors

st.set_page_config(layout="wide", page_title="Yugioh MongoDB Updater")
st.title("Yugioh Deck Analyzer & Database Updater")

# -----------------------------
# MongoDB connection check
# -----------------------------
mongo_conf = st.secrets["mongodb"]
uri = f"mongodb+srv://{mongo_conf['user']}:{mongo_conf['password']}@{mongo_conf['host']}/?appName={mongo_conf['appName']}"

try:
    client = MongoClient(uri, serverSelectionTimeoutMS=5000)
    # Try fetching server info
    client.server_info()
    db = client[mongo_conf["database"]]
    collection = db[mongo_conf["collection"]]
    st.success("✅ Connected to MongoDB successfully!")
except errors.ServerSelectionTimeoutError:
    st.error("❌ Cannot connect to MongoDB. Check your cluster, network access, and secrets configuration.")
    st.stop()
except Exception as e:
    st.error(f"❌ MongoDB connection failed: {e}")
    st.stop()
