import { useState, useRef, useEffect } from "react";

import "./App.css";

import { customFetch } from "./customFetch";

const URL = "http://localhost:8000/files";

function App() {
  const inputRef = useRef();

  const [isPaused, setIsPaused] = useState(false);

  let progress = 0;

  let xmlRequest = [];

  useEffect(() => {
    console.log(progress);
  })

  useEffect(() => {
    
    console.log(isPaused);
  }, [isPaused]);

  const onUploadProgress = (event) => {
    console.log(`${event.loaded} / ${event.total}`);
  };

  // Create a single file chunk of uniform size
  const createFixedFileChunk = (file, chunkStart, chunkSize) => {
    const fileChunk = file.slice(chunkStart, chunkStart + chunkSize);

    return fileChunk;
  };

  // Implement partial chunk request (When the file size is not a multiple of chunk size)
  const createPartialFileChunk = (file, chunkStart) => {
    const fileChunk = file.slice(progress, chunkStart, file.size);
    return fileChunk;
  };

  // Create a custom request
  const createCustomRequest = (blob: Blob) => {
    const formData = new FormData();
    formData.append(`Blob ${progress} ${progress + blob.size}`, blob);

    const customRequest = {
      url: `${URL}/upload`,
      method: "POST",
      body: formData,
      onUploadProgress,
      xmlRequest,
    };
    return customRequest;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const file = inputRef.current.files[0];

    const CHUNK_SIZE = 10 * 1024;

    while (progress + CHUNK_SIZE < file.size) {
      const fileChunk = createFixedFileChunk(file, progress, CHUNK_SIZE);
      const customRequest = createCustomRequest(fileChunk);
      try {
        const response = await customFetch(customRequest);
        const message = (await response.json()).message;
        console.log(`${message} ${progress} - ${progress + CHUNK_SIZE}`);
        progress += CHUNK_SIZE;
      } catch (err) {
        console.log(err);
      }
    }

    if(progress === file.size) {
      return ;
    }

    if (progress !== file.size) {
      const partialFileChunk = createPartialFileChunk(file, progress);
      const customRequest = createCustomRequest(partialFileChunk);
      try {
        const response = await customFetch(customRequest);
        const message = (await response.json()).message;
        console.log(`${message} ${progress} - ${file.size}`);
        progress = file.size;
      } catch (err) {
        console.log(err);
      }
    }

    console.log(progress === file.size);
    // reset the progress
    progress  = 0;

  };

  const handlePause = (event) => {
    event.preventDefault();
    setIsPaused(isPaused);
  };

  const handleCancel = (event) => {
    event.preventDefault();

    // reset the request list
    xmlRequest = [];

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
