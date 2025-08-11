from socket import timeout
from flask import current_app as app, jsonify, request
from flask_restful import Resource, Api, reqparse, marshal, fields
from flask_security import auth_required, roles_required, current_user, hash_password
from backend.models import db, Product, Party, Coil, Sale, SaleItem, SaleCoil
from werkzeug.security import generate_password_hash
from datetime import datetime

datastore = app.security.datastore
cache = app.cache
api = Api(prefix="/api")

parser1 = reqparse.RequestParser()
parser1.add_argument(
    "make", type=str, help="Name is required and should be a string", required=True
)
parser1.add_argument(
    "type", type=str, help="type is required and should be a string", required=True
)
parser1.add_argument(
    "color", type=str, help="color is required and should be a string", required=True
)
parser1.add_argument(
    "rate", type=int, help="Price is required and should be float value", required=True
)


product_fields = {
    "id": fields.Integer,
    "make": fields.String,
    "type": fields.Integer,
    "color": fields.String,
    "rate": fields.Float,
}

class ProductsAPI(Resource):
    @cache.cached(timeout=20)
    def get(self):
        products = Product.query.all()
        return jsonify([{
            "id": products.id,
            "type": products.type,
            "make": products.make,
            "color": products.color,
            "rate": products.rate,
        } for product in products])

class UpdateProuct(Resource):
    @auth_required("token")
    @roles_required("admin")
    def get(self, id):
        product = Product.query.get(id)
        return marshal(product, product_fields)

    def post(self, id):
        product = Product.query.get(id)
        args = parser1.parse_args()
        product.make = args.make
        product.type = args.type
        product.color = args.color
        product.rate = args.rate
        db.session.commit()
        return {"message": "product Updated"}




parser2 = reqparse.RequestParser()
parser2.add_argument(
    "make", type=str, help="Name is required and should be a string", required=True
)
parser2.add_argument(
    "type", type=str, help="type is required and should be a string", required=True
)
parser2.add_argument(
    "color", type=str, help="color is required and should be a string", required=True
)
parser2.add_argument(
    "purchase_price",type=float,help="Price is required and should be float value", required=True
)
parser2.add_argument(
    "total_weight", type=float, help="weight is required and should be a float", required=True
)
parser2.add_argument(
    "supplier_name", type=str, help="supplier name is required and should be a string", required=True
)
parser2.add_argument(
    "coil_number", type=str, help="coilNumber is required and should be a string", required=True
)
parser2.add_argument(
    "purchase_date", type=str, help="date of purchase is required ", required=True
)


coil_fields = {
    "id": fields.Integer,
    "coil-number": fields.String,
    "make": fields.String,
    "type": fields.Integer,
    "color": fields.String,
    "purchase_price": fields.Float,
    "total_weight":fields.Float,
    "supplier_name":fields.String,
    "purchase_date":fields.DateTime,
}


class CoilAPI(Resource):
    @auth_required("token")
    @roles_required("admin")
    def get(self):
        coils = Coil.query.all()
        return jsonify([{
            "id": coil.id,
            "coil_number": coil.coil_number,
            "supplier_name": coil.supplier_name,
            "total_weight": coil.total_weight,
            "purchase_price": coil.purchase_price,
            "make": coil.make,
            "type": coil.type,
            "color": coil.color,
            "purchase_date": coil.purchase_date.strftime("%Y-%m-%d %H:%M:%S"),
        } for coil in coils])

class UpdateCoil(Resource):
    @auth_required("token")
    @roles_required("admin")
    def get(self, id):
        coil = Coil.query.get(id)
        return marshal(coil, {
            "id": fields.Integer,
            "coil_number": fields.String,
            "supplier_name": fields.String,
            "total_weight": fields.Float,
            "purchase_price": fields.Float,
            "make": fields.String,
            "type": fields.String,
            "color": fields.String,
            "purchase_date": fields.String,
        })

    def post(self, id):
        coil = Coil.query.get(id)
        args = request.json
        coil.coil_number = args.get("coil_number", coil.coil_number)
        coil.supplier_name = args.get("supplier_name", coil.supplier_name)
        coil.total_weight = args.get("total_weight", coil.total_weight)
        coil.purchase_price = args.get("purchase_price", coil.purchase_price)
        coil.make = args.get("make", coil.make)
        coil.type = args.get("type", coil.type)
        coil.color = args.get("color", coil.color)
        coil.purchase_date=args.get("purchase_date",coil.purchase_date)
        db.session.commit()
        return {"message": "Coil Updated"}

api.add_resource(ProductsAPI, "/products")
api.add_resource(UpdateProuct, "/update/product/<int:id>")
api.add_resource(CoilAPI, "/coils")
api.add_resource(UpdateCoil, "/update/coil/<int:id>")
