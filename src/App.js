import { useState, useRef } from "react";

import "./App.css";

import { customFetch } from "./customFetch";

const URL = "http://localhost:8000/files";

function App() {
  const inputRef = useRef();

  const [isPaused, setIsPaused] = useState(false);

  let progress = 0;
  
  let requestList = [];

  const onUploadProgress = (event) => {
    console.log(`${event.loaded} / ${event.total}`);
  };

  // Create a single file chunk of uniform size
  const createFixedFileChunk = (file, chunkStart, chunkSize) => {
    const fileChunk = file.slice(chunkStart, chunkStart + chunkSize);
    progress += chunkSize;

    return fileChunk;
  };


  // Implement partial chunk request (When the file size is not a multiple of chunk size)
  const createPartialFileChunk = (file, chunkStart) => {
      const fileChunk = file.slice(progress, chunkStart, file.size);
      progress = file.size;
      return fileChunk;
  }


  // Create a custom request
  const createCustomRequest = (blob: Blob) => {
    const formData = new FormData();
    formData.append(`Blob ${progress} ${progress + blob.size}`, blob);

    const customRequest = {
      url: `${URL}/upload`,
      method: "POST",
      body: formData,
      onUploadProgress,
      requestList,
    };
    return customRequest;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    // Array of blobs
    const file = inputRef.current.files[0];
    // createFileChunks(file);
    // await uploadFile();

    const CHUNK_SIZE = 10 * 1024;

    while (progress + CHUNK_SIZE < file.size) {
      const fileChunk = createFixedFileChunk(file, progress, CHUNK_SIZE);
      const customRequest = createCustomRequest(fileChunk);
      try {
        const response = await customFetch(customRequest);
        const message = (await response.json()).message;
        console.log(`${message} ${progress} - ${progress + CHUNK_SIZE}`);
      } catch (err) {
        console.log(err);
      }
    }
  };

  const handlePause = (event) => {
    event.preventDefault();
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

    // reset progress
    progress = 0;
  };

  const handleResume = (event) => {
    event.preventDefault();
    setIsPaused(false);
  };

  return (
    <div className="App">
      <form>
        <input ref={inputRef} type="file" className="input" />
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
