FROM python:3.8.13
WORKDIR /usr/src/app-python
COPY . .
RUN pip install --no-cache-dir -r requirements.txt
CMD [ "python", "init.py" ]