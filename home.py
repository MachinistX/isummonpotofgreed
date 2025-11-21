if st.button("Update Database"):
    # Determine local path
    local_repo_path = "./CardScripts"
    if repo_path_input.startswith("http"):
        if not os.path.isdir(local_repo_path):
            st.info("Cloning Project Ignis repo...")
            subprocess.run(["git", "clone", "--depth", "1", repo_path_input, local_repo_path], check=True)
    else:
        local_repo_path = repo_path_input

    official_folder = os.path.join(local_repo_path, "official")
    if not os.path.isdir(official_folder):
        st.error(f"Official folder not found: {official_folder}")
    else:
        lua_files = [f for f in os.listdir(official_folder) if f.endswith(".lua")]
        total_files = len(lua_files)

        st.write(f"Found **{total_files}** Lua scripts.")

        progress_bar = st.progress(0)
        status_text = st.empty()

        updated = 0

        for i, lua_file in enumerate(lua_files, start=1):
            file_path = os.path.join(official_folder, lua_file)
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()

            # Card ID from filename
            card_id_match = re.match(r"c(\d+)\.lua", lua_file)
            if not card_id_match:
                continue
            card_id = int(card_id_match.group(1))

            # Extract data
            name_jp, name_en = extract_names(content)
            functions_dict = parse_lua_functions(content)

            doc = {
                "id": card_id,
                "name_jp": name_jp,
                "name_en": name_en,
                "lua_raw": content
            }
            doc.update(functions_dict)

            # Upsert
            collection.update_one({"id": card_id}, {"$set": doc}, upsert=True)
            updated += 1

            # Update progress bar
            progress = i / total_files
            progress_bar.progress(progress)
            status_text.text(f"Processing: {lua_file} ({i}/{total_files}) — {progress*100:.1f}%")

        status_text.text("Done!")
        st.success(f"Database update complete. {updated} cards inserted/updated.")
