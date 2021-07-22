// @flow

type CustomRequest = {
  +url: string,
  +method?: string,
  +headers?: { [string]: string },
  +body?: any,
  +timeout?: number,
  +onTimeout?: () => any,
  +onProgress?: (event: ProgressEvent) => any,
  +onUploadProgress?: (event: ProgressEvent) => any,
  xmlRequest?: Array<XMLHttpRequest>,
};

/**
 * Takes in a url / Request object, and an optional init object
 * @returns a promise containing the Response object
 */
export const customFetch = (request: CustomRequest): Promise<Response> => {
  return new Promise((resolve, reject) => {
    const defaultTimeoutHandler = () => {
      reject(new Error("Request failed due to a timeout error"));
    };

    const {
      url,
      method: requestMethod,
      body: requestBody,
      timeout,
      headers,
      onTimeout = defaultTimeoutHandler,
      onProgress,
      onUploadProgress,
      xmlRequest,
    } = request;

    const xhr = new XMLHttpRequest();

    if (xmlRequest) {
      xmlRequest.push(xhr);
    }

    if (onProgress) {
      xhr.onprogress = onProgress;
    }

    if (onUploadProgress) {
      xhr.upload.onprogress = onUploadProgress;
    }

    /**
     * Called when transaction fails due to an error
     * Only called when there is an error at the network level as
     * Fetch only throws an error when there is a error at network level
     */
    xhr.onerror = () => {
      reject(new Error("Request failed due to a network error"));
    };

    /**
     * When the fetch operation is complete, return a Response object
     */
    xhr.onreadystatechange = () => {
      // Request is aborted
      if (xhr.status === 0 && xhr.status === XMLHttpRequest.UNSENT) {
        return;
      } else if (xhr.readyState === XMLHttpRequest.DONE) {
        // fetch operation is complete

        // status.ok when status code between 200 - 299

        // Update the properties of the response object
        const init = {};
        init.status = xhr.status;
        init.statusText = xhr.statusText;
        // Create a response with the body
        const body = xhr.response;

        const response = new Response(body, init);
        resolve(response);
        
        if (xmlRequest) {
          const index = xmlRequest.indexOf(xhr);
          xmlRequest.splice(index, 1);
        }
      
      }
    };

    if (timeout) {
      xhr.timeout = timeout;
    }

    if (onTimeout) {
      xhr.ontimeout = onTimeout;
    }

    // default method is "GET"
    let method = "GET";
    let body = undefined;

    // Determine method
    if (requestMethod) {
      method = requestMethod;
    }

    // Determine body of request
    if (requestBody) {
      body = requestBody;
    }

    xhr.open(method, url);

    // Set request headers --> need to call it after open and before send

    if (headers) {
      for (let key in headers) {
        xhr.setRequestHeader(key, headers[key]);
      }
    }

    // body will be ignored if it is a GET request
    xhr.send(body);
  });
};
