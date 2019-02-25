import os
import time
from flask import Flask, request, Response
from flask_cors import CORS
import numpy as np
import json

'''
app setup
'''
app = Flask(__name__)
app.config['ENV'] = 'development'
CORS(app)

'''
api route
'''

@app.route('/rand', methods=['GET'])
def rand():
    response = {
        'result': np.random.rand(16, 9).tolist(),
    }
    response_pickled = json.dumps(response)
    return Response(response=response_pickled, status=200, mimetype="application/json")

@app.route('/static', methods=['GET'], endpoint='static_1')
def static():
    response = {
        'result': np.zeros(16, 9).tolist(),
    }
    response_pickled = json.dumps(response)
    return Response(response=response_pickled, status=200, mimetype="application/json")


'''
start app
'''
if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5002)
