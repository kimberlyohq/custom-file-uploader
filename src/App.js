import { useState, useRef, useEffect } from "react";

import "./App.css";
import { customFetch } from "./customFetch";

const URL = "http://localhost:8000/files";
const CHUNK_SIZE = 10 * 1024;

function App() {
  const inputRef = useRef();

  // set initial value to 0
  const progress = useRef(0);
  const xmlRequest = useRef();

  const [isPaused, setIsPaused] = useState(false);

  // current chunk index
  const [uploadProgress, setUploadProgress] = useState(0);

  // Re-render the component when progress changes
  useEffect(() => {
    console.log(`Progress ${uploadProgress}`);
  }, [uploadProgress]);


  // TODO:
  const onUploadProgress = (event) => {
    setUploadProgress((event.loaded / event.total) * 100);
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
      xmlRequest,
    };
    return customRequest;
  };


  const handleUpload = async () => {
    const customRequest = createCustomRequest(inputRef.current.files[0]);
    try {
      const response = await customFetch(customRequest);
      const successMsg = (await response.json()).message;
      console.log(successMsg);
    } catch (err) {
      console.log(err);
    }
    
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    await handleUpload();
  };

  const handlePause = (event) => {
    event.preventDefault();
    setIsPaused(true);
    xmlRequest.current?.abort();
  };

  const handleCancel = (event) => {
    event.preventDefault();
    setIsPaused(false);
    xmlRequest.current?.abort();

    // reset the request list
    xmlRequest.current = undefined;

    // reset progress
    progress.current = 0;

    // reset the chunkCount 
    setChunkIndex(0);
  };

  const handleResume = (event) => {
    event.preventDefault();
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
