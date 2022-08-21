import tensorflow as tf
import numpy as np
import time 
import cv2
import pickle


save_labels = "./dl_model/first_task_model_labels"
protoPath = "./face_detector/deploy.prototxt.txt"
modelPath = "./face_detector/res10_300x300_ssd_iter_140000.caffemodel"
savedModel = "./dl_model/first_task_model.h5"
image_for_test = "./test5.jpg"
final_x = 32
final_y = 32
dim = (final_x, final_y)

tested_image = cv2.imread(image_for_test)
face_confidence=0.16

model = tf.keras.models.load_model(savedModel)
le = pickle.loads(open(save_labels, "rb").read())
net = cv2.dnn.readNetFromCaffe(protoPath, modelPath) #modello per estrarre facce


def detect_save_face(frame, output_path=None, multiple_output=False):

    (h, w) = frame.shape[:2]

    # we preprocess image normalizing each r-g-b channel subtracting the values in the last tuple
    blob = cv2.dnn.blobFromImage(cv2.resize(frame, (300, 300)), 1.0,
                                 (300, 300), (104.0, 177.0, 123.0))
    # pass the blob through the network and obtain the detections and
    # predictions
    net.setInput(blob)
    detections = net.forward()   #output => (1, 1, 20, [1, 0.9, .... ]   )
    faces = []
    coordinates=[]

    # ensure at least one face was found
    if len(detections) > 0:
        
        max_i=np.argmax(detections[0, 0, :, 2]) #this is the most probable detected face

        #if we want to output the most probable detected face or all the faces
        min_range = 0 if multiple_output==True else max_i 
        max_range = detections.shape[2] if multiple_output==True else max_i + 1

        for i in range(min_range, max_range):

          # we get the model confidence
          confidence = detections[0, 0, i, 2]

          if confidence >= face_confidence:
            # compute the (x, y)-coordinates of the bounding box for
            # the face and extract the face ROI
            box = detections[0, 0, i, 3:7] * np.array([w, h, w, h])
            (startX, startY, endX, endY) = box.astype("int")

            # we save coordinates 
            coordinates.append(box.astype("int"))
            face = frame[startY:endY, startX:endX]

            #we save the face
            faces.append(face)
            

            try:
              #if we had defined a mask, we take the face also in that mask
           #   if mask is not None:
            #    face_mask = mask[startY:endY, startX:endX]
             #   cv2.imwrite(output_path_mask, face_mask)
            # write the frame to disk
              
              #we save the image if output_path is defined
              if output_path is not None:
                cv2.imwrite(output_path, face)
             
            except:
              pass

    return faces, coordinates

def resize_normalize_image(image, max_value = 255):

    image=cv2.resize(image, dim)
    return  (image)/ np.max(image)

def extract_and_predict_faces(image):

    def translate(k):
      if k == 0:
        return "Real"
      return "Fake"

    extracted_test_faces, coordinates_faces = detect_save_face(
    image, multiple_output=False)

    for i in range(0, len(extracted_test_faces)):

        face = extracted_test_faces[i]
        (startX, startY, endX, endY) = coordinates_faces[i]
        
        if face is not None:

            #print(face)
            face = resize_normalize_image(face)
            face = face.astype("float")
            face = tf.keras.utils.img_to_array(face)
            face = np.expand_dims(face, axis=0)
            #start_time = time.time()
            
            try:
                
                preds = model(face)[0]
                j = np.argmax(preds)
                label = le.classes_[j]
                
                label = translate(label)
                #label = "{}: {:.4f}".format(translate(label), preds[j])
                return label
            except:
                return "non funziona"
            
