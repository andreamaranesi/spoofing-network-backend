from flask import Flask, request, jsonify
from controller.controller import Controller
import os

hostName = os.environ.get('HOST_NAME') or "0.0.0.0"
serverPort = os.environ.get('SERVER_PORT') or 8080

app = Flask(__name__)
controller = Controller()


# Route for image prediction. 
# Requires: a Json Body for the list of images to predict and the labels
#           (See correct schema in Controller function).
# Returns:  Json with the predictions and the metrics where applicable. 
@app.route('/predict')
def predict():
    try:
        jsonRequest = request.get_json()
    except:
        return "Json malformed"
    
    predictions = controller.get_predictions(jsonRequest)
    return jsonify(predictions)
    

app.run(host=hostName, port=serverPort)