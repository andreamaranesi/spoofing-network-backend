from flask import Flask
import os

hostName = os.environ.get('HOST_NAME') or "0.0.0.0"
serverPort = os.environ.get('SERVER_PORT') or 8080

app = Flask(__name__)


@app.route('/')
def main():
    isdir = os.path.isdir(os.environ.get('IMAGE_STORAGE'))
    return "lo è: " + str(isdir)
    return 'Hello, World!'


app.run(host=hostName, port=serverPort)

