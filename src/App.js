import { useState } from "react";

import "./App.css";

import { customFetch } from "./customFetch";

const URL = "http://localhost:8000/files";

function App() {
  const [file, setFile] = useState();
  const [isPaused, setIsPaused] = useState(false);

  let fileChunks = [];
  let requestList = [];

  const handleFileUpload = (event) => {
    // array of files
    const files = event.target.files;
    setFile(files[0]);
  };

  const onUploadProgress = (event) => {
    console.log(`${event.loaded} / ${event.total}`);
  };

  const uploadFile = async () => {
    // Map each file chunk to a customRequest object
    const customRequests = fileChunks.map((fileChunk, index) => {
      const formData = new FormData();
      formData.append(`Blob ${index}`, fileChunks[index]);

      const customRequest = {
        url: `${URL}/upload`,
        method: "POST",
        body: formData,
        onUploadProgress,
        requestList,
      };
      return customRequest;
    });

    // Upload all file chunks to the server
    try {
      customRequests.map(async (request, index) => {
        const response = await customFetch(request);
        const responseJSON = await response.json();
        console.log(`${responseJSON.message} ${index}`);
        fileChunks.splice(index, 1);
      });
    } catch (err) {
      console.log(err);
    }
  };

  // Break the file into fixed size Blobs
  const createFileChunks = (file: File) => {
    const fileSize = file.size;

    let current = 0;
    const STEP = 10 * 1024;

    while (current < fileSize) {
      //var newBlob = blob.slice(start, end, contentType);
      const fileChunk = file.slice(current, current + STEP);
      current += STEP;
      fileChunks.push({ file: fileChunk });
    }

    fileChunks.push({ file: file.slice(current, fileSize) });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    // Array of blobs
    createFileChunks(file);
    await uploadFile();
  };

  const handlePause = (event) => {
    event.preventDefault();
    setIsPaused(true);
    requestList.forEach((xhr) => {
      xhr?.abort();
    });
  };

  const handleCancel = (event) => {
    event.preventDefault();
    requestList.forEach((xhr) => {
      xhr?.abort();
    });

    // reset the request list
    requestList = [];
    fileChunks = [];
    setFile(undefined);
  };

  const handleResume = (event) => {
    event.preventDefault();
    setIsPaused(false);
    uploadFile();
  };

  return (
    <div className="App">
      <form>
        <input type="file" className="input" onChange={handleFileUpload} />
        <button type="submit" className="button" onClick={handleSubmit}>
          Upload
        </button>
        {!isPaused ? (
          <button className="button" onClick={handlePause}>
            Pause
          </button>
        ) : (
          <button className="button" onClick={handleResume}>
            Resume
          </button>
        )}
        <button className="button" onClick={handleCancel}>
          Cancel
        </button>
      </form>
    </div>
  );
}

export default App;
