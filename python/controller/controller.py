import cv2
import json
from dl_code import extract_and_predict_faces
from jsonschema import validate
from sklearn.metrics import confusion_matrix

class Controller:

    def __init__(self) -> None:
        pass

    """Internal function to get the metrics for the evaluation of the model

    Parameter
        imagePredictions: dictionary with UUID, prediction and label of the predicted images
    
    Return
        result: dictionary with confusion matrix, precision, recall, f1 score 
                and the valid UUID used for the evaluation of the model
    """
    def getMetrics(self, imagePredictions):
        
        imagesForMetrics = {"labelList": [], "predictionList": [], "UUIDList": []}
        for image in imagePredictions:
            if image["label"] is not None:
                imagesForMetrics["labelList"].append(image["label"])
                imagesForMetrics["predictionList"].append(image["prediction"])
                imagesForMetrics["UUIDList"].append(image["UUID"])

        cm = confusion_matrix(imagesForMetrics["labelList"], imagesForMetrics["predictionList"], labels=["Real", "Fake"])
        prec = {}
        rec = {}
        f1 = {}

        translate = lambda k: 0 if k == "Real" else 1
        
        for index in ["Real", "Fake"]:
            prec[index] = round(cm[translate(index)][translate(index)] / cm[:, translate(index)].sum(),2)
            rec[index] = round(cm[translate(index)][translate(index)] /cm[translate(index)].sum(),2)
            f1[index] = round((2 * prec[index] * rec[index])/(prec[index] + rec[index]),2)
            
        result = {"cm": cm.tolist(), "precision": prec, "recall": rec, "f1": f1, "validUUID": imagesForMetrics["UUIDList"]}
        return result
    
    


    """Computes the predictions for the list of images passed in the jsonRequest Json.

    Parameter
        jsonRequest: list of images with relative labels and UUID to be predicted (see variable 'schema' inside)
    
    Return
        result: json with the predictions for every image and metrics for evaluation of the model
    """
    def getPredictions(self, jsonRequest):
                
        # JSON VALIDATION
        schema = {
            "type": "object",
            "required": [
                "images"
            ],
            "properties": {
                "images": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "required": [
                            "UUID",
                            "path",
                            "label"
                        ],
                        "properties": {
                            "UUID": {
                                "type": "integer"
                            },
                            "path": {
                                "type": "string"
                            },
                            "label": {
                                "type": "string"
                            }
                        }
                    }
                }
            }
        }
        validate(jsonRequest, schema)
        
        imagePredictions = []
        for image in jsonRequest["images"]:
            imageFile = cv2.imread(image["path"])
            prediction = extract_and_predict_faces(imageFile)
            imagePredictions.append({"UUID": image["UUID"], "prediction": prediction, "label": image["label"]})

        metrics = self.getMetrics(imagePredictions)
        results = {"imagePredictions": imagePredictions, "metrics": metrics}

        return json.dumps(results)