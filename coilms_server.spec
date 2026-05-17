# -*- mode: python ; coding: utf-8 -*-
# PyInstaller spec for CoilMS desktop server bundle.
# Run: pyinstaller coilms_server.spec

from PyInstaller.utils.hooks import collect_all, collect_data_files, collect_submodules

datas         = []
binaries      = []
hiddenimports = []

# ── Dynamic-plugin packages: collect everything ───────────────────────────────
for pkg in ['pyexcel', 'pyexcel_io', 'lml']:
    d, b, h = collect_all(pkg)
    datas         += d
    binaries      += b
    hiddenimports += h

# passlib wordsets + all handlers (bcrypt backend needs passlib data files)
datas         += collect_data_files('passlib')
hiddenimports += collect_submodules('passlib')

# bcrypt compiled extension
d, b, h = collect_all('bcrypt')
datas         += d
binaries      += b
hiddenimports += h

# flask_security — collect submodules to avoid dynamic-import misses
hiddenimports += collect_submodules('flask_security')

# SQLAlchemy dialects (sqlite is used in Electron; include extras for safety)
hiddenimports += collect_submodules('sqlalchemy.dialects.sqlite')
hiddenimports += collect_submodules('sqlalchemy.orm')

# flask_caching backends
hiddenimports += collect_submodules('flask_caching')

# ── Our own source trees ──────────────────────────────────────────────────────
datas += [
    ('backend',  'backend'),
    ('frontend', 'frontend'),
]

# ── Explicit hidden imports ───────────────────────────────────────────────────
hiddenimports += [
    # Flask 3 core
    'flask', 'flask.templating', 'flask.json', 'flask.json.provider',
    'flask.sansio.app', 'flask.sansio.blueprints', 'flask.sansio.scaffold',
    # Flask extensions
    'flask_sqlalchemy', 'flask_sqlalchemy.extension',
    'flask_login', 'flask_login.utils',
    'flask_principal',
    'flask_wtf', 'flask_wtf.csrf',
    'flask_cors',
    'flask_excel',
    'flask_restful',
    # SQLAlchemy 2
    'sqlalchemy', 'sqlalchemy.engine', 'sqlalchemy.engine.default',
    'sqlalchemy.dialects', 'sqlalchemy.dialects.sqlite',
    'sqlalchemy.dialects.sqlite.base', 'sqlalchemy.dialects.sqlite.pysqlite',
    'sqlalchemy.orm', 'sqlalchemy.ext.declarative',
    'sqlalchemy.pool', 'sqlalchemy.event',
    # Passlib
    'passlib', 'passlib.pwd', 'passlib.context',
    'passlib.crypto', 'passlib.crypto.digest',
    'passlib.handlers', 'passlib.handlers.bcrypt',
    'passlib.handlers.sha2_crypt', 'passlib.handlers.pbkdf2',
    'passlib.utils', 'passlib.utils.handlers', 'passlib.utils.pbkdf2',
    # Other runtime deps
    'email_validator', 'pkg_resources',
    'itsdangerous', 'markupsafe',
    'jinja2', 'jinja2.ext', 'jinja2.runtime',
    'werkzeug', 'werkzeug.security', 'werkzeug.routing',
    'wtforms', 'wtforms.validators',
    'blinker', 'blinker.base',
    'cachelib', 'cachelib.simple',
    'greenlet',
    'chardet', 'texttable',
    # Standard lib modules that PyInstaller sometimes misses
    'sqlite3', '_sqlite3',
    'uuid', 'hmac', 'hashlib',
]

a = Analysis(
    ['app.py'],
    pathex=[],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        'psycopg2', 'psycopg2_binary',   # Render-only, not needed offline
        'tkinter', '_tkinter',             # GUI toolkit — not used
        'matplotlib', 'numpy', 'pandas',   # heavy libs not in requirements
        'test', 'unittest',
    ],
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='coilms_server',
    debug=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,        # keep True — output captured by Electron → app.log
    argv_emulation=False,
    target_arch=None,
)
