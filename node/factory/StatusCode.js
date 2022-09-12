"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForbiddenError = exports.BadRequestError = exports.AuthenticationError = exports.ServerError = exports.StatusCode = void 0;
class StatusCode {
}
exports.StatusCode = StatusCode;
class ServerError extends StatusCode {
    set(message) {
        this.message = { error: message };
        return this;
    }
    send(response) {
        response.status(500).send(this.message);
        return this;
    }
    setAlreadyUpdatedLabels(updatedImages) {
        return this.set("there was an error. List of already saved labels: " +
            JSON.stringify(updatedImages));
    }
    setUpdatingToken() {
        return this.set("error on updating token");
    }
}
exports.ServerError = ServerError;
class AuthenticationError extends StatusCode {
    set(message) {
        this.message = { error: message };
        return this;
    }
    send(response) {
        response.status(401).send(this.message);
        return this;
    }
    setNotAdmin() {
        return this.set("user is not the admin");
    }
    setTokenZero() {
        return this.set("Token amount is 0");
    }
    setTokenExpired() {
        return this.set("Token expired");
    }
}
exports.AuthenticationError = AuthenticationError;
class BadRequestError extends StatusCode {
    setNoValidImages() {
        return this.set("no images was valid");
    }
    set(message) {
        this.message = { error: message };
        return this;
    }
    send(response) {
        response.status(400).send(this.message);
        return this;
    }
    setImageZipAbsent() {
        return this.set("an image or .zip must be provided");
    }
    setDuplicateImageEntries() {
        return this.set("There are duplicated entries on images");
    }
    setLabelImageLength() {
        return this.set("labels length must be equal to images length");
    }
    setImageWithInference(imageId, inference) {
        return this.set(`image id ${imageId} has already an inference: ${inference}`);
    }
}
exports.BadRequestError = BadRequestError;
class ForbiddenError extends StatusCode {
    set(message) {
        this.message = { error: message };
        return this;
    }
    send(response) {
        response.status(403).send(this.message);
        return this;
    }
    setNeedMoreToken(tokenAmout) {
        return this.set(`you need ${tokenAmout} tokens for this operation`);
    }
    setNotAccessible(id) {
        let ids = id.join(",");
        return this.set(`${ids} id(s) are not accessible`);
    }
    setUnreadableUrl(url) {
        return this.set(`unreadable url ${url}`);
    }
    setDatasetSameName(name) {
        return this.set(`there is already a dataset with name ${name}`);
    }
    setNoEmail(email) {
        return this.set(`user with email ${email} doesn't exist`);
    }
    setInvalidUrlResponse(url) {
        return this.set(`can't access to ${url}`);
    }
}
exports.ForbiddenError = ForbiddenError;
