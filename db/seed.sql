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
    id INT AUTO_INCREMENT NOT NULL,
    classes INT NOT NULL,
    tags varchar(255) NOT NULL,
    creationDate DATE NOT NULL,
    userId INT NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (userId) REFERENCES user(id)
);

CREATE TABLE image(
    UUID INT NOT NULL,
    label varchar(50),
    inference varchar(50),
    datasetId INT NOT NULL,
    PRIMARY KEY(UUID),
    FOREIGN KEY(datasetId) REFERENCES dataset(id)
);

INSERT INTO user(userName, email, token, isAdmin)
    VALUES
    ('alessandro', 'alex@email.com', 100, false),
    ('andrea', 'andrea@email.com', 100.01, true),
    ('adriano', 'adriano@email.com', 1000, true);

INSERT INTO dataset(datasetName, classes, tags, creationDate, userId)
    VALUES
    ('bank images', 2, 'images from a bank', '2022-09-17', 1);
