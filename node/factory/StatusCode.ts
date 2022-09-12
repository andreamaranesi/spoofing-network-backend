export abstract class StatusCode {
  abstract set(message: string): StatusCode;
  abstract send(response: any): StatusCode;
}

export class ServerError extends StatusCode {
  private message: Object;

  set(message: string): StatusCode {
    this.message = { error: message };
    return this;
  }

  send(response: any): StatusCode {
    response.status(500).send(this.message);
    return this;
  }

  setAlreadyUpdatedLabels(updatedImages: Object): StatusCode {
    return this.set(
      "there was an error. List of already saved labels: " +
        JSON.stringify(updatedImages)
    );
  }

  setUpdatingToken(): StatusCode {
    return this.set("error on updating token");
  }
}

export class AuthenticationError extends StatusCode {
  private message: Object;

  set(message: string): StatusCode {
    this.message = { error: message };
    return this;
  }

  send(response: any): StatusCode {
    response.status(401).send(this.message);
    return this;
  }

  setNotAdmin(): StatusCode {
    return this.set("user is not the admin");
  }

  setTokenZero(): StatusCode {
    return this.set("Token amount is 0");
  }

  setTokenExpired(): StatusCode {
    return this.set("Token expired");
  }
}

export class BadRequestError extends StatusCode {
  private message: Object;
  static setNoZipOrImage: any;

  setNoValidImages(): StatusCode {
    return this.set("no images was valid");
  }

  set(message: string): StatusCode {
    this.message = { error: message };
    return this;
  }

  send(response: any): StatusCode {
    response.status(400).send(this.message);
    return this;
  }

  setImageZipAbsent(): StatusCode {
    return this.set("an image or .zip must be provided");
  }

  setDuplicateImageEntries(): StatusCode {
    return this.set("There are duplicated entries on images");
  }

  setLabelImageLength(): StatusCode {
    return this.set("labels length must be equal to images length");
  }

  setImageWithInference(imageId: number, inference: any) {
    return this.set(
      `image id ${imageId} has already an inference: ${inference}`
    );
  }
}

export class ForbiddenError extends StatusCode {
  private message: Object;

  set(message: string): StatusCode {
    this.message = { error: message };
    return this;
  }

  send(response: any): StatusCode {
    response.status(403).send(this.message);
    return this;
  }

  setNeedMoreToken(tokenAmout: number): StatusCode {
    return this.set(`you need ${tokenAmout} tokens for this operation`);
  }

  setNotAccessible(id: Array<any>): StatusCode {
    let ids = id.join(",");
    return this.set(`${ids} id(s) are not accessible`);
  }

  setUnreadableUrl(url: string): StatusCode {
    return this.set(`unreadable url ${url}`);
  }

  setDatasetSameName(name: string): StatusCode {
    return this.set(`there is already a dataset with name ${name}`);
  }

  setNoEmail(email: string): StatusCode {
    return this.set(`user with email ${email} doesn't exist`);
  }

  setInvalidUrlResponse(url: string): StatusCode {
    return this.set(`can't access to ${url}`);
  }
}
