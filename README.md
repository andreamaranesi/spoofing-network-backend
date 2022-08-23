## INDEX

- <a href="#project-aim">PROJECT AIM</a>
- <a href="#uml-diagrams">UML DIAGRAMS</a>
- <a href="#design-patterns">DESIGN PATTERNS</a>
- <a href="#routes">ROUTES</a>
  - <a href="#user-routes">DEFAULT USER ROUTES</a>
  - <a href="#admin-routes">ADMIN ROUTES</a>
- <a href="#postman-tests">POSTMAN TESTS</a>

## <a id="project-aim">PROJECT AIM</a>

The goal of the project is to allow the creation of a back-end from which a user can upload datasets and make inferences on them.

The predictions are made by our CNN network, trained to detect bonafide and fake people inside an image: 

[link]: https://github.com/andreamaranesi/Spoofing-Attack-Detection-2022

Each user has a specified amount of **tokens**, that are required to upload images, create labels, make inferences.

The costs are the following:

- 0.1 tokens for each uploaded images
- 0.05 tokens to create/update an image label
- 5 tokens for each inference made by our model

If python can't read some images, or can't detect any human face, we will charge back the user for those images.

The back-end consists of a **node.js** docker container, that communicates with a **mysql** database, and the **python** back-end, that only makes inferences and returns a JSON as response.

The node.js back-end uses the following main frameworks/libraries:

- **<a href="https://expressjs.com/it/">express</a>**  framework to make requests possible on **localhost:8080**
- **<a href="https://sequelize.org/ ">sequelize</a>** ORM was used to communicate with the **mysql** database
- **<a href="https://www.npmjs.com/package/axios ">axios</a>** was used to make http requests to the python server, or to download files

Python runs on docker on the port **8080**, while node.js on **3000**, and uses the following main libraries:

- **<a href="https://www.tensorflow.org/ ">tensorflow</a>** to use the CNN model
- **<a href="https://flask.palletsprojects.com/ ">Flask</a>** to instantiate the server 
- **<a href="https://scikit-learn.org/ ">scikit-learn</a>** to create metrics
- **<a href="https://pypi.org/project/opencv-python/ ">opencv-python</a>** for image manipulation

To run the project, is enough the following command:

```bash
cd project_folder
docker compose up
```



## <a id="uml-diagrams">UML DIAGRAMS</a>

### Database Diagram:

![](https://github.com/andreamaranesi/spoofing-network-backend/blob/main/diagrams/ER%20diagram.svg)

### Use Case Diagram:

![](https://github.com/andreamaranesi/spoofing-network-backend/blob/main/diagrams/use%20case%20diagram.svg)

### Class Diagram:

![](https://github.com/andreamaranesi/spoofing-network-backend/blob/main/diagrams/class%20diagram.svg)

### Sequence Diagram (only for some actions):

![](https://github.com/andreamaranesi/spoofing-network-backend/blob/main/diagrams/sequence%20diagram.svg)

## <a id="design-patterns">DESIGN PATTERNS</a>

**MVC** is the main architectural pattern we used to build the node.js back-end. 

**Sequelize** acts as the **DAO** level, since is an ORM that communicates directly with the database. 

With **Sequelize** we built the models, that are then mapped directly to the tables on the database.

For example, this is the initialization of the `User` model:

```typescript
User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    .....
  {
    sequelize,
    modelName: "User",
    tableName: "user",
    timestamps: false,
  }
);
```

The connection with the database is managed by a **Singleton** class, `DatabaseSingleton`:

```typescript
let sequelize = DatabaseSingleton.getInstance().instance;
```

`DatabaseSingleton.getInstance()` creates a **connection pool**:

```typescript
const NEW_INSTANCE = new DatabaseSingleton().sequelize;
    
NEW_INSTANCE.sequelize = new Sequelize(DB_NAME, DB_USERNAME, DB_PASSWORD, {
      host: DB_HOST,
      dialect: "mysql",
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    });
```

The singleton is necessary to avoid to generate useless connection pools every time. In this way, we will have always one instance live.

The **Controller** uses a **Repository** class to retrieve results of actions that require the use of more `Models`, that consist of the **DAO** level in our case.

```typescript
export class Controller {
  // controller interacts with the repository for CRUD operations
  private repository: Repository;
  private user: User;

  // instantiates the repository
  constructor(user: User) {
    this.repository = new Repository(user);
    this.user = user;
  }
  .....
```

The **Controller** is used to check the user request and to prepare eventually the data for the repository, that will make the final operations.

Before the controller, there is a  **middleware level**, that controls/validates:

- user authentication token
- authorization for that route
- user supplied json parameters

Always the **middleware level** retrieves the user from the database soon after validating the authentication token:

```typescript
export const verifyAndAuthenticate = async (req, res, next) => {
  try {
    let decoded = jwt.verify(req.token, process.env.JWT_SECRET_KEY);
    req.user = await User.findOne({ where: { email: decoded.email } });
    .....

```

However, other checks that require the use of the DAO level, are made by the Controller class. This was made to simplify the middleware.

The **Controller** class is created at each user request:

```typescript
app.get("/get/token", async function (req, res) {
  let controller = new Controller(req.user);
  .....
});
```



## <a id="routes">ROUTES</a>

In node.js, each request must be made to **localhost:8080**, this is defined in the **docker-compose.yaml** file:

```yaml
web-node:
        restart: always
        build: "./node"
        ports:
          - 8080:3000
        .....
```



### <a id="user-routes">DEFAULT USER ROUTES</a>

#### CREATE A DATASET

| METHOD | URL             | DATA TYPE | RESPONSE TYPE |
| ------ | --------------- | --------- | ------------- |
| GET    | /create/dataset | Json      | Json          |

| PARAMETER  | REQUIRED | TYPE           | CONSTRAINTS       |
| ---------- | -------- | -------------- | ----------------- |
| name       | true     | string         | <= 100 characters |
| numClasses | true     | int            | >= 1, <= 50       |
| tags       | false    | Array\<string> | <= 50 characters  |



**CONSTRAINTS**

- can't create a dataset if exists another one of the same user with the same name

  

**RESPONSE SCHEMA**

```
{
    "dataset": {
        "id": int,
        "name": string,
        "numClasses": int,
        "creationDate": date,
        "userId": int
    },
    "tags": [
        {
            "tag": string,
            "datasetId": int
        }
    ]
}
```



#### UPDATE A DATASET

| METHOD | URL             | DATA TYPE | RESPONSE TYPE |
| ------ | --------------- | --------- | ------------- |
| GET    | /update/dataset | Json      | Json          |

| PARAMETER  | REQUIRED | TYPE           | CONSTRAINTS       |
| ---------- | -------- | -------------- | ----------------- |
| name       | false    | string         | <= 100 characters |
| numClasses | false    | int            | >= 1, <= 50       |
| tags       | false    | Array\<string> | <= 50 characters  |

**CONSTRAINTS**

- can't update the dataset name if exists another one of the same user with the same name

- **one of** `name`, `numClasses`, `tags` must be defined

  

**RESPONSE SCHEMA**

```
{
    "dataset": {
        "id": int,
        "name": string,
        "numClasses": int,
        "creationDate": date,
        "userId": int
    },
    "tags"?: [
        {
            "tag": string,
            "datasetId": int
        }
    ]
}
```



#### DELETE A DATASET

| METHOD | URL             | DATA TYPE | RESPONSE TYPE |
| ------ | --------------- | --------- | ------------- |
| GET    | /delete/dataset | Json      | Json          |

| PARAMETER | REQUIRED | TYPE | CONSTRAINTS |
| --------- | -------- | ---- | ----------- |
| datasetId | true     | int  | -           |

**RESPONSE SCHEMA**:

```
{
    "deletedDataset": {
        "id": int,
        "name": string,
        "numClasses": int,
        "creationDate": date,
        "userId": int,
        "isDeleted": boolean
    }
}
```



#### RETRIEVE DATASETS

| METHOD | URL          | DATA TYPE | RESPONSE TYPE |
| ------ | ------------ | --------- | ------------- |
| GET    | /get/dataset | Json      | Json          |

| PARAMETER       | REQUIRED | TYPE           | DEFAULT VALUE | CONSTRAINTS                 |
| --------------- | -------- | -------------- | ------------- | --------------------------- |
| startDate       | false    | date           | -             | format DD-MM-YYYY           |
| endDate         | false    | date           | -             | format DD-MM-YYYY           |
| tags            | false    | Array\<string> | -             | <= 50 characters            |
| tagRelationship | false    | string         | or            | [or, and], case insensitive |

**CONSTRAINTS**

- **one of** `startDate`, `endDate`, `tags` must be defined

**NOTES**

- `startDate` without `endDate` will search for datasets with `creationDate` >= `startDate`
- `endDate` without `startDate` will search for datasets with `creationDate <= endDate` 
- `tagRelationship = or` will search for datasets with one of the defined tags
- `tagRelationship = and` will search for datasets with all the defined tags

**RESPONSE SCHEMA**:

```
[
    {
        "id": int,
        "name": string,
        "numClasses": int,
        "creationDate": date,
        "userId": int,
        "Images": [
            {
                "id": int,
                "fileName": string,
                "label": string?,
                "inference": string?,
                "datasetId": int
            }
        ],
        "DatasetTags"?: [
            {
                "datasetId": int,
                "tag": string
            }
        ]
    }
]
```



#### UPLOAD IMAGES

##### FROM URL

| METHOD | URL         | DATA TYPE | RESPONSE TYPE |
| ------ | ----------- | --------- | ------------- |
| GET    | /images/url | Json      | Json          |

| PARAMETER       | REQUIRED | TYPE   | DEFAULT         | CONSTRAINTS                                   |
| --------------- | -------- | ------ | --------------- | --------------------------------------------- |
| url             | true     | url    | -               | link must contains a zip or a supported image |
| datasetId       | true     | int    | -               | -                                             |
| singleImageName | false    | string | downloaded_file | will be truncated if > 100 characters         |

**CONSTRAINTS**

File must have one the following mime types:

- image/jpg
- image/jpeg
- image/png
- application/zip

**NOTES**

filename will be truncated if > 100 characters

**RESPONSE SCHEMA**

 `keys` are the filename of images, `values` their final id

```
{
    "filename":int,
    .....
}
```



##### FROM FILE

| METHOD | URL          | DATA TYPE | RESPONSE TYPE |
| ------ | ------------ | --------- | ------------- |
| POST   | /images/file | form-data | Json          |

| PARAMETER | REQUIRED | TYPE | CONSTRAINTS            |
| --------- | -------- | ---- | ---------------------- |
| images    | true     | file | zip or supported image |
| datasetId | true     | int  | -                      |

**CONSTRAINTS**

File must have one the following mime types:

- image/jpg
- image/jpeg
- image/png
- application/zip

**NOTES**

filename will be truncated if > 100 characters

**RESPONSE SCHEMA**

 `keys` are the filename of images, `values` their final id

```
{
    "filename":int,
    .....
}
```



#### SET IMAGE LABELS

| METHOD | URL        | DATA TYPE | RESPONSE TYPE |
| ------ | ---------- | --------- | ------------- |
| GET    | /set/label | Json      | Json          |

| PARAMETER | REQUIRED | TYPE        | CONSTRAINTS                       |
| --------- | -------- | ----------- | --------------------------------- |
| images    | true     | Array\<int> | -                                 |
| labels    | true     | string      | ["fake","real"], case insensitive |

**CONSTRAINTS**

- `images` length = `labels` length

**NOTES**

- for the image at index `i` of the list, will be linked the label at index `i`

**RESPONSE SCHEMA**

```
[
    {
        "id": int,
        "fileName": string,
        "label": string,
        "inference": string?,
        "datasetId": int
    }
]
```



#### MAKE PREDICTIONS WITH CNN MODEL

| METHOD | URL            | DATA TYPE | RESPONSE TYPE |
| ------ | -------------- | --------- | ------------- |
| GET    | /get/inference | Json      | Json          |

| PARAMETER | REQUIRED | TYPE        |
| --------- | -------- | ----------- |
| images    | true     | Array\<int> |



**NOTES**

- if user requests a single image, checks if the inference has been already made
- if user provides two or more images, **will not** check if the inference has already been made on all of them. This was done because metrics as confusion matrix are returned at runtime, so we don't save them

**RESPONSE SCHEMA**

```
{
    "imagePredictions": [
        {
            "id": int,
            "label": string,
            "prediction": string
        }
    ],
    "invalidPredictions": [string],
    "metrics": {
        "cm": [ [int, int], [int, int] ],
        "validId": [int],
        "values": {
            "Fake": {
                "f1": float,
                "precision": float,
                "recall": float
            },
            "Real": {
                "f1": float,
                "precision": float,
                "recall": float
            }
        }
    },
    "updatedToken"?:float
}
```

`cm` = **confusion matrix** = [positive Real, negative Real], [negative Fake, positive Fake]

`invalidPredictions` = list of images that are unreadable from Python, or that have not a detectable face

 `updatedToken`= new token after the charge back for invalid predictions

#### GET CURRENT TOKEN

| METHOD | URL        | RESPONSE TYPE |
| ------ | ---------- | ------------- |
| GET    | /get/token | Json          |

**RESPONSE SCHEMA**

```
{
    "token": float
}
```



### <a id="admin-routes">ADMIN ROUTES</a>

#### UPDATE USER TOKEN

| METHOD | URL        | DATA TYPE | RESPONSE TYPE |
| ------ | ---------- | --------- | ------------- |
| GET    | /set/token | Json      | Json          |

| PARAMETER | REQUIRED | TYPE  | CONSTRAINT |
| --------- | -------- | ----- | ---------- |
| email     | true     | email | -          |
| token     | true     | float | <= 100000  |

**RESPONSE SCHEMA**

```
{
    "updatedUser": {
        "token": float,
        "id": int,
        "email": string,
        "userName": string,
        "isAdmin": boolean
    }
}
```



## <a id="postman-tests">POSTMAN TESTS</a>

### CREATE A DATASET

#### TEST 1

**Data**:

```json
{
   "name":"",
   "numClasses":-1
}
```

**Response(500)**:

```json
{
    "error": [
        {
            "value": -1,
            "msg": "numClasses must be between 1 and 50",
            "param": "numClasses",
            "location": "body"
        }
    ]
}
```



#### TEST 2

**Data**:

```json
{
   "name":"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
   "numClasses":-1
}
```

**Response (500)**:

```json
{
    "error": [
        {
            "value": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
            "msg": "dataset name must be <= 50 characters",
            "param": "name",
            "location": "body"
        },
        {
            "value": -1,
            "msg": "numClasses must be between 1 and 50",
            "param": "numClasses",
            "location": "body"
        }
    ]
}
```



#### TEST 3

**Data**:

```json
{
   "name":"nome",
   "numClasses":-1,
   "tags":[]
}
```

**Response (500)**:

```json
{
    "error": [
        {
            "value": -1,
            "msg": "numClasses must be between 1 and 50",
            "param": "numClasses",
            "location": "body"
        },
        {
            "value": [],
            "msg": "tags must be a list of string",
            "param": "tags",
            "location": "body"
        }
    ]
}
```



#### TEST 4

**Data**:

```json
{
   "name":"nome",
   "numClasses":1,
   "tags":["tag1","tag2"]
}
```

**Response**:

```json
{
    "dataset": {
        "id": 3,
        "name": "nome",
        "numClasses": 1,
        "creationDate": "2022-08-22T12:31:49.991Z",
        "userId": 1
    },
    "tags": [
        {
            "tag": "tag1",
            "datasetId": 3
        },
        {
            "tag": "tag2",
            "datasetId": 3
        }
    ]
}
```



### UPDATE A DATASET

#### TEST 1

**Data**:

```json
{
   "name":"nome",
   "numClasses":1,
   "tags":["tag1","tag2"]
}
```

**Response**:

```json
{
    "error": [
        {
            "msg": "Invalid value",
            "param": "datasetId",
            "location": "body"
        }
    ]
}
```



#### TEST 2

**Data**:

```json
{
   "name":"nome2",
   "numClasses":-1,
   "tags":["tag1","tag2"],
   "datasetId": 1
}
```

**Response (500)**:

```json
{
    "error": [
        {
            "value": -1,
            "msg": "numClasses must be between 1 and 50",
            "param": "numClasses",
            "location": "body"
        }
    ]
}
```



#### TEST 3

**Data**:

```json
{
   "numClasses": 1,
   "tags":["tag1","tag2"],
   "datasetId": 1
}
```

**Response**:

```json
{
    "dataset": {
        "id": 1,
        "name": "bank images",
        "numClasses": 1,
        "creationDate": "2022-09-17",
        "userId": 1
    },
    "tags": [
        {
            "tag": "tag1",
            "datasetId": 1
        },
        {
            "tag": "tag2",
            "datasetId": 1
        }
    ]
}
```



#### TEST 4

**Data**:

```json
{
   "name":"nome",
   "numClasses":1,
   "tags":["tag1","tag2"],
   "datasetId": 1
}
```

**Response (500)**:

```json
{
    "error": "there is already a dataset with name nome"
}
```



### DELETE A DATASET

#### TEST 1

**Data**:

```json
{
   "datasetId": 4
}
```

**Response (500)**:

```json
{
    "error": "4 id(s) are not accessible"
}
```



#### TEST 2

**Data**:

```json
{
   "datasetId": 8.44
}
```

**Response (500)**:

```json
{
    "error": [
        {
            "value": 8.44,
            "msg": "Invalid value",
            "param": "datasetId",
            "location": "body"
        }
    ]
}
```



#### TEST 3

**Data**:

```json
{
   "datasetId": 1
}
```

**Response**:

```json
{
    "deletedDataset": {
        "id": 1,
        "name": "nome2",
        "numClasses": 1,
        "creationDate": "2022-09-17",
        "userId": 1,
        "isDeleted": true
    }
}
```



### RETRIEVE DATASETS

#### TEST 1

**Data**:

```json
{
   "startDate": "1-13-2021"
}
```

**Response (500)**:

```json
{
    "error": [
        {
            "value": "1-13-2021",
            "msg": "Date must be in the format DD-MM-YYYY",
            "param": "startDate",
            "location": "body"
        }
    ]
}
```



#### TEST 2

**Data**:

```json
{
   "startDate": "22-08-2021"
}
```

**Response**:

```json
[
    {
        "id": 3,
        "name": "nome",
        "numClasses": 1,
        "creationDate": "2022-08-22",
        "userId": 1,
        "Images": []
    }
]
```



#### TEST 3

**Data**:

```json
{
   "startDate": "18-08-2022",
   "endDate": "24-08-2022",
   "tags":["images","faces"],
   "tagRelationship": "a"
}
```

**Response (500)**:

```json
{
    "error": [
        {
            "value": "a",
            "msg": "tag relationship can be 'or','and'",
            "param": "tagRelationship",
            "location": "body"
        }
    ]
}
```



#### TEST 4

**Data**:

```json
{
   "startDate": "18-08-2022",
   "endDate": "24-08-2022",
   "tags":["images","faces"],
   "tagRelationship": "and"
}
```

**Response**:

```json
[
    {
        "id": 4,
        "name": "dataset with images",
        "numClasses": 2,
        "creationDate": "2022-08-22",
        "userId": 1,
        "Images": [
            {
                "id": 4,
                "fileName": "test2.jpg",
                "label": null,
                "inference": null,
                "datasetId": 4
            }
        ],
        "DatasetTags": [
            {
                "datasetId": 4,
                "tag": "faces"
            },
            {
                "datasetId": 4,
                "tag": "images"
            }
        ]
    }
]
```



### UPLOAD IMAGES

#### FROM URL

##### TEST 1

**Data**:

```json
{
  "url":"htts:/website.com",
  "datasetId": 3
}
```

**Response (500)**:

```json
{
    "error": [
        {
            "value": "htts:/website.com",
            "msg": "Invalid value",
            "param": "url",
            "location": "body"
        }
    ]
}
```

##### TEST 2

**Data**:

```json
{
  "url":"https://dremardesign.com/test.zip",
  "datasetId": 3
}
```

**Response**:

```json
{
    "test3.jpg": 9,
    "test4.JPG": 10,
    "test5.JPG": 11
}
```

##### TEST 3

**Data**:

```json
{
  "url":"https://dremardesign.com/test_image.jpg",
  "datasetId": 3,
  "singleImageName":"example"
}
```

**Response**:

```json
{
    "example.jpeg": 6
}
```

##### TEST 4

**Data**:

```json
{
  "url":"https://dremardesign.com/t.jpg",
  "datasetId": 3,
  "singleImageName":"example"
}
```

**Response (500)**:

```json
{
    "error": "unreadable url"
}
```



#### FROM FILE

##### TEST 1

**Data**:

| KEY       | VALUE |
| --------- | ----- |
| images    | None  |
| datasetId | 4     |

**Response (500)**:

```json
{
    "error": "an image or .zip must be provided"
}
```



##### TEST 2

**Data**:

| KEY       | VALUE     |
| --------- | --------- |
| images    | test3.jpg |
| datasetId | 3         |

**Response**:

```json
{
    "test3.jpg": 4
}
```



##### TEST 3

**Data**:

| KEY       | VALUE     |
| --------- | --------- |
| images    | test2.zip |
| datasetId | 3         |

**Response**:

```json
{
    "test3.jpg": 9,
    "test5.JPG": 10
}
```



### SET IMAGE LABELS

#### TEST 1

**Data**:

```json
{
    "images":[4,5,6],
    "labels":["real","fake"]
}
```

**Response (500)**:

```json
{
    "error": "labels length must be equal to images length"
}
```



#### TEST 2

**Data**:

```json
{
    "images":[4,5,6],
    "labels":["real","rr"]
}
```

**Response (500)**:

```json
{
    "error": [
        {
            "value": "rr",
            "msg": "label must be real or fake",
            "param": "labels[1]",
            "location": "body"
        }
    ]
}
```



#### TEST 3

**Data**:

```json
{
    "images":[6,7,8],
    "labels":["real","fake","real"]
}
```

**Response**:

```json
[
    {
        "id": 6,
        "fileName": "example.jpeg",
        "label": "Real",
        "inference": null,
        "datasetId": 3
    },
    {
        "id": 7,
        "fileName": "downloaded_file.jpeg",
        "label": "Fake",
        "inference": null,
        "datasetId": 3
    },
    {
        "id": 8,
        "fileName": ".jpeg",
        "label": "Real",
        "inference": null,
        "datasetId": 3
    }
]
```



### MAKE PREDICTIONS WITH CNN MODEL

#### TEST 1

**Data**:

```json
{
    "images":[14,15]
}
```

**Response (500)**:

```json
{
    "error": "14,15 id(s) are not accessible"
}
```



#### TEST 2

**Data**:

```json
{
    "images":[11]
}
```

**Response**:

```json
{
    "imagePredictions": [],
    "invalidPredictions": [
        11
    ],
    "metrics": null,
    "updatedToken": 473.85
}
```



#### TEST 3

**Data**:

```json
{
    "images":[4]
}
```

**Response**:

```json
{
    "imagePredictions": [
        {
            "id": 4,
            "label": "Real",
            "prediction": "Real"
        }
    ],
    "invalidPredictions": [],
    "metrics": {
        "cm": [
            [
                1,
                0
            ],
            [
                0,
                0
            ]
        ],
        "validId": [
            4
        ],
        "values": {
            "Fake": {
                "f1": 0,
                "precision": 0,
                "recall": 0
            },
            "Real": {
                "f1": 1,
                "precision": 1,
                "recall": 1
            }
        }
    }
}
```



#### TEST 4

**Data**:

```json
{
    "images":[5,6,7,8]
}
```

**Response**:

```json
{
    "imagePredictions": [
        {
            "id": 5,
            "label": "Real",
            "prediction": "Real"
        },
        {
            "id": 6,
            "label": "Real",
            "prediction": "Real"
        },
        {
            "id": 7,
            "label": "Fake",
            "prediction": "Real"
        },
        {
            "id": 8,
            "label": "Real",
            "prediction": "Real"
        }
    ],
    "invalidPredictions": [],
    "metrics": {
        "cm": [
            [
                3,
                0
            ],
            [
                1,
                0
            ]
        ],
        "validId": [
            5,
            6,
            7,
            8
        ],
        "values": {
            "Fake": {
                "f1": 0,
                "precision": 0,
                "recall": 0
            },
            "Real": {
                "f1": 0.86,
                "precision": 0.75,
                "recall": 1
            }
        }
    }
}
```



### GET  USER TOKEN

#### TEST 1

**Response**:

```json
{
    "token": 473.85
}
```



### UPDATE USER TOKEN 

**ADMIN TOKEN**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFuZHJlYUBlbWFpbC5jb20ifQ._CJkiQpkQBSt2CupXLSZ29nj6InEqgs0bjgHwFhWtWg` 

#### TEST 1

**Data**:

```json
{
    "email":"alex2@email.com",
    "token":100
}
```

**Response (500)** :

```json
{
    "error": "user with email alex2@email.com doesn't exist"
}
```

#### TEST 2

**Data**:

```json
{
    "email":"alex@email.com",
    "token":100
}
```

**Response**:

```json
{
    "updatedUser": {
        "token": 100000,
        "id": 1,
        "email": "alex@email.com",
        "userName": "alessandro",
        "isAdmin": false
    }
}
```

#### TEST 3

**Data**:

```json
{
    "email":"alex@email.com",
    "token":100
}
```

**AUTH TOKEN**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFsZXhAZW1haWwuY29tIn0.jgCN_G8Hy5UUCAiH4q2Ac3A-qYZtkH90aJeuTnjZqKg`

**Response (401)**: 

```json
{
    "error": "user must be the admin"
}
```

