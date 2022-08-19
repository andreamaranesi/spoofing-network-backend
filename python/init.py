from flask import Flask

import os
import cv2
from cv_code import extract_and_predict_faces

hostName = os.environ.get('HOST_NAME') or "0.0.0.0"
serverPort = os.environ.get('SERVER_PORT') or 8080

app = Flask(__name__)


@app.route('/')
def default():
    isdir = os.path.isdir(os.environ.get('IMAGE_STORAGE'))
    return "lo è: " + str(isdir)

@app.route('/test')
def testFunc():
    image = cv2.imread("test5.jpg")
    predictedImage = extract_and_predict_faces(image)
    print("predictedImage")
    cv2.imwrite("./test5Predicted.jpg", predictedImage)
    return "FATTO"

app.run(host=hostName, port=serverPort)

