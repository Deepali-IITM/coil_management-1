# -*- mode: python ; coding: utf-8 -*-
# PyInstaller spec for CoilMS desktop server bundle.
# Run: pyinstaller coilms_server.spec

from PyInstaller.utils.hooks import collect_all, collect_data_files

datas     = []
binaries  = []
hiddenimports = []

# pyexcel / pyexcel-io / lml use a dynamic plugin registry — collect everything
for pkg in ['pyexcel', 'pyexcel_io', 'lml']:
    d, b, h = collect_all(pkg)
    datas    += d
    binaries += b
    hiddenimports += h

# passlib wordsets (used by passlib.pwd.genword via pkg_resources shim)
datas += collect_data_files('passlib')

# bcrypt compiled extension (passlib's bcrypt backend)
d, b, h = collect_all('bcrypt')
datas    += d
binaries += b
hiddenimports += h

# Our own source trees
datas += [
    ('backend',  'backend'),
    ('frontend', 'frontend'),
]

hiddenimports += [
    # Flask ecosystem
    'flask', 'flask.templating',
    'flask_sqlalchemy',
    'flask_security', 'flask_security.core', 'flask_security.utils',
    'flask_login', 'flask_principal',
    'flask_wtf', 'flask_caching', 'flask_caching.backends',
    'flask_cors', 'flask_excel', 'flask_restful',
    # SQLAlchemy
    'sqlalchemy', 'sqlalchemy.dialects.sqlite', 'sqlalchemy.orm',
    'sqlalchemy.ext.declarative',
    # Passlib
    'passlib', 'passlib.pwd', 'passlib.context',
    'passlib.handlers', 'passlib.handlers.bcrypt',
    'passlib.utils', 'passlib.utils.handlers',
    # Other deps
    'email_validator', 'pkg_resources',
    'itsdangerous', 'jinja2', 'werkzeug',
    'wtforms', 'blinker', 'cachelib', 'greenlet',
    'chardet', 'texttable',
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
    excludes=['psycopg2', 'psycopg2_binary'],  # not needed offline
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
    console=True,   # keep True so errors appear in app.log via Electron
    argv_emulation=False,
    target_arch=None,
)
