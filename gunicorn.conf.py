import os

# Render sets PORT automatically; fall back to 10000 locally.
bind = f"0.0.0.0:{os.environ.get('PORT', 10000)}"

# 1 worker avoids SQLite write-lock contention on Render's free tier.
# Increase workers only if you switch to PostgreSQL.
workers = 1
threads = 4
timeout = 120
