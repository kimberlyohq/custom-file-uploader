import { useState, useRef } from "react";

import "./App.css";
import { customFetch } from "./customFetch";

const URL = "http://localhost:8000/files";

function App() {
  const inputRef = useRef();

  // set initial value to 0
  const progress = useRef(0);
  const xmlRequest = useRef([]);

  const [isPaused, setIsPaused] = useState(false);

  const onUploadProgress = (event) => {
    console.log(`${event.loaded} / ${event.total}`);
  };

  // Create a single file chunk of uniform size
  const createFileChunk = (file, chunkStart, chunkEnd) => {
    const fileChunk = file.slice(chunkStart, chunkEnd);

    return fileChunk;
  };

  // Create a custom request
  const createCustomRequest = (blob: Blob) => {
    const formData = new FormData();
    formData.append(
      `Blob ${progress.current} ${progress.current + blob.size}`,
      blob
    );

    const customRequest = {
      url: `${URL}/upload`,
      method: "POST",
      body: formData,
      onUploadProgress,
      xmlRequest: xmlRequest.current,
    };
    return customRequest;
  };

  const handleUpload = async () => {
    const file = inputRef.current.files[0];

    if (!file || file.size === 0) {
      alert("No file uploaded");
      return;
    }

    const CHUNK_SIZE = 10 * 1024;

    console.log(`START ${progress.current}`);

    while (progress.current + CHUNK_SIZE < file.size) {
      const fileChunk = createFileChunk(
        file,
        progress.current,
        progress.current + CHUNK_SIZE
      );
      const customRequest = createCustomRequest(fileChunk);
      try {
        const response = await customFetch(customRequest);
        const message = (await response.json()).message;
        console.log(
          `${message} ${progress.current} - ${progress.current + CHUNK_SIZE}`
        );
        progress.current += CHUNK_SIZE;
      } catch (err) {
        console.log(err);
      }
    }

    if (progress.current === file.size) {
      console.log("COMPLETED");
      progress.current = 0;
      return;
    }

    // When the file size is not a multiple of chunk size
    if (progress.current !== file.size) {
      const partialFileChunk = createFileChunk(file, progress.current, file.size);
      const customRequest = createCustomRequest(partialFileChunk);
      try {
        const response = await customFetch(customRequest);
        const message = (await response.json()).message;
        console.log(`${message} ${progress.current} - ${file.size}`);
        progress.current = file.size;
      } catch (err) {
        console.log(err);
      }
    }

    if (progress.current === file.size) {
      console.log("COMPLETED");
    }

    // reset the progress
    progress.current = 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await handleUpload();
  };

  const handlePause = (event) => {
    event.preventDefault();
    console.log("PAUSED");
    setIsPaused(true);
    xmlRequest.current.find((xhr) => xhr.abort());
  };

  const handleCancel = (event) => {
    event.preventDefault();
    xmlRequest.current.find((xhr) => xhr.abort());

    // reset the request list
    xmlRequest.current = [];

    // reset progress
    progress.current = 0;
  };

  const handleResume = (event) => {
    event.preventDefault();
    console.log("RESUMED");
    setIsPaused(false);
    handleUpload();
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
