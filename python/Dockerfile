FROM tensorflow/tensorflow:latest
WORKDIR /usr/src/app-python
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
CMD [ "python", "init.py" ]