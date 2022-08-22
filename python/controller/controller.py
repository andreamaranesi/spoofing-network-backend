from math import nan
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

    def get_metrics(self, image_predictions):

        images_for_metrics = {"labelList": [],
                              "predictionList": [], "UUIDList": []}
        for image in image_predictions:
            if image["label"] != "":
                images_for_metrics["labelList"].append(image["label"])
                images_for_metrics["predictionList"].append(
                    image["prediction"])
                images_for_metrics["UUIDList"].append(image["UUID"])

        cm = confusion_matrix(
            images_for_metrics["labelList"], images_for_metrics["predictionList"], labels=["Real", "Fake"])

        values = {}

        prec = {}
        rec = {}
        f1 = {}

        def translate(k): return 0 if k == "Real" else 1

        # for each class
        # computes precision, recall, f1 score from the confusion matrix
        for index in ["Real", "Fake"]:

            if index not in values:
                values[index] = dict()

            prec[index] = round(cm[translate(index)][translate(
                index)] / cm[:, translate(index)].sum(), 2)
            rec[index] = round(cm[translate(index)][translate(
                index)] / cm[translate(index)].sum(), 2)
            f1[index] = round((2 * prec[index] * rec[index]) /
                              (prec[index] + rec[index]), 2)

            import math

            values[index]["precision"] = prec[index] if not math.isnan(
                prec[index]) else 0.0
            values[index]["recall"] = rec[index]
            values[index]["f1"] = f1[index] if not math.isnan(
                prec[index]) else 0.0

        result = {"cm": cm.tolist(), "values": values,
                  "validUUID": images_for_metrics["UUIDList"]}
        return result

    """Computes the predictions for the list of images passed in the json_request Json.

    Parameter
        json_request: list of images with relative labels and UUID to be predicted (see variable 'schema' inside)
    
    Return
        result: json with the predictions for every image and metrics for evaluation of the model
    """

    def get_predictions(self, json_request):

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

        validate(json_request, schema)

        image_predictions = []
        invalid_predictions = []

        can_get_confusion_matrix = False

        # for each given image
        # checks if the image is readable
        # checks if there is at least one labeled image,
        # otherwise the confusion matrix can't be created
        for image in json_request["images"]:

            image_file = cv2.imread(image["path"])

            if image_file is None:
                invalid_predictions.append(image["UUID"])
            else:
                prediction = extract_and_predict_faces(image_file)
                if prediction is not None:
                    # confusion matrix needs at least one label
                    if image["label"] != "":
                        can_get_confusion_matrix = True

                    image_predictions.append(
                        {"UUID": image["UUID"], "prediction": prediction, "label": image["label"]})

                # instead if no face was found
                else:
                    invalid_predictions.append(image["UUID"])

        if can_get_confusion_matrix:
            metrics = self.get_metrics(image_predictions)
        else:
            metrics = None

        results = {"invalidPredictions": invalid_predictions,
                   "imagePredictions": image_predictions, "metrics": metrics}

        return results
