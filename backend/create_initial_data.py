from flask import current_app as app
from flask_security import SQLAlchemyUserDatastore, hash_password
from backend.models import db, Product, Party, Coil, Sale, SaleItem, SaleCoil
from datetime import datetime
with app.app_context():
    db.create_all()

    userdatastore: SQLAlchemyUserDatastore = app.security.datastore

    # Create admin role and user
    userdatastore.find_or_create_role(id=1, name="admin", description="admin")
    if not userdatastore.find_user(email="admin@abc.in"):
        userdatastore.create_user(
            email="admin@abc.in",
            password=hash_password("pass"),
            roles=["admin"],
        )
        db.session.commit()

    # Create example coil
    coil1 = Coil.query.filter_by(coil_number="C001").first()
    if not coil1:
        coil1 = Coil(
            coil_number="C001",
            make="JSW",
            type="Coloron",
            color="Silver",
            purchase_date=datetime.now(),
            supplier_name="Steel Traders",
            total_weight=5000,
            purchase_price=250000
        )
        db.session.add(coil1)
        db.session.commit()

    # Create product from coil's details
    prod1 = Product.query.filter_by(make="JSW", type="Coloron", color="Silver").first()
    if not prod1:
        prod1 = Product(
            make=coil1.make,
            type=coil1.type,
            color=coil1.color,
            rate=50.0,
            coil_id=coil1.id
        )
        db.session.add(prod1)
        db.session.commit()

    # Create example party
    party = Party.query.filter_by(name="Kumar SV").first()
    if not party:
        party = Party(name="Kumar SV", phone="9876543210")
        db.session.add(party)
        db.session.commit()

    print("✅ Initial data populated successfully.")
