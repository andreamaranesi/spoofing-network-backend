from flask import Flask
import os

hostName = os.environ.get('HOST_NAME') or "localhost"
serverPort = os.environ.get('SERVER_PORT') or 8080

app = Flask(__name__)


@app.route('/')
def main():
    return 'Hello, World!'


app.run(host=hostName, port=serverPort)

