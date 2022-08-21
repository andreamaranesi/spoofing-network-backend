CREATE DATABASE dataset;
USE dataset;

CREATE TABLE user(
    userName varchar(50) NOT NULL,
    email varchar(50) UNIQUE NOT NULL,
    id INT AUTO_INCREMENT NOT NULL,
    token decimal(8,2) NOT NULL,
    isAdmin BOOLEAN NOT NULL,
    PRIMARY KEY(id) 
);

CREATE TABLE dataset(
    datasetName varchar(50) NOT NULL,
    id INT NOT NULL AUTO_INCREMENT,
    classes INT NOT NULL,
    creationDate DATE NOT NULL,
    userId INT NOT NULL,
    isDeleted BOOLEAN NOT NULL DEFAULT false,
    PRIMARY KEY (id),
    FOREIGN KEY (userId) REFERENCES user(id)
);

CREATE TABLE image(
    UUID INT NOT NULL AUTO_INCREMENT,
    label varchar(50),
    inference varchar(50),
    datasetId INT NOT NULL,
    fileName varchar(100) NOT NULL,
    PRIMARY KEY(UUID),
    FOREIGN KEY(datasetId) REFERENCES dataset(id)
);

CREATE TABLE datasetTag(
    datasetId INT NOT NULL,
    tag varchar(50) NOT NULL,
    PRIMARY KEY (datasetId, tag),
    FOREIGN KEY (datasetId) REFERENCES dataset(id)
);

INSERT INTO user(userName, email, token, isAdmin)
    VALUES
    ('alessandro', 'alex@email.com', 100, false),
    ('andrea', 'andrea@email.com', 100.01, true),
    ('adriano', 'adriano@email.com', 1000, true);

INSERT INTO dataset(datasetName, classes, creationDate, userId)
    VALUES
    ('bank images', 2, '2022-09-17', 1),
    ('bank images', 2, '2022-09-18', 2);

INSERT INTO datasetTag(datasetId, tag)
    VALUES
    (1, 'images'),
    (1, 'from'),
    (1, 'bank');

INSERT INTO image(label, datasetId, fileName)
    VALUES
    ("real", 1, "immagine1.png"),
    ("real", 1, "immagine2.png"),
    ("fake", 2, "immagine1.png");
