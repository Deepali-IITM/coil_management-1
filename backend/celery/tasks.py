from celery import shared_task
import time
from flask import render_template
from sqlalchemy import and_, case, func
import flask_excel

from backend.models import db, Party, SaleCoil, SaleItem, Sale, Coil, Product


@shared_task(ignore_result=False)
def create_csv(self):
    resource = SaleItem.query.all()

    column_names=[column.name for column in SaleItem.__table__.columns]
    csv_out=flask_excel.make_response_from_query_sets(resource, column_names=column_names, file_type='csv')
    
    with open('./backend/celery/user_downloads/requests.csv', 'wb') as file:
        file.write(csv_out.data)

    return 'requests.csv'
