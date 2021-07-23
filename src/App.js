import { useState, useRef, useEffect } from "react";

import "./App.css";
import { customFetch } from "./customFetch";

const URL = "http://localhost:8000/files";
const CHUNK_SIZE = 10 * 1024;

function App() {
  const inputRef = useRef();

  const xmlRequest = useRef();

  const [isPaused, setIsPaused] = useState(false);

  // current upload progress of chunk
  const [uploadProgress, setUploadProgress] = useState(0);

  // current chunk index
  const [chunkIndex, setChunkIndex] = useState(0);

  const [totalChunks, setTotalChunks] = useState(0);

  // Trigger re-render the component when chunkIndex changes
  useEffect(() => {
    if (totalChunks === 0 || isPaused) {
      return;
    }

    if (chunkIndex === totalChunks) {
      console.log("COMPLETED");
      reset();
    } else {
      console.log(chunkIndex);
      handleUpload(chunkIndex + 1);
    }
  }, [uploadProgress, chunkIndex]);

  const onUploadProgress = (event) => {
    setUploadProgress((event.loaded / event.total) * 100);
  };

  // Create a single file chunk of uniform size
  const createFileChunk = (file, chunkStart, chunkEnd) => {
    const fileChunk = file.slice(chunkStart, chunkEnd);

    return fileChunk;
  };

  // Create a custom request
  const createCustomRequest = (blob: Blob) => {
    const formData = new FormData();
    formData.append(`Blob ${Math.random()}`, blob);

    const customRequest = {
      url: `${URL}/upload`,
      method: "POST",
      body: formData,
      onUploadProgress,
      xmlRequest,
    };
    return customRequest;
  };

  const uploadChunk = async (chunkIndex) => {
    const file = inputRef.current.files[0];
    const chunkStart = chunkIndex * CHUNK_SIZE;
    let chunkEnd;

    if (chunkStart + CHUNK_SIZE < file.size) {
      chunkEnd = chunkStart + CHUNK_SIZE;
    } else {
      chunkEnd = file.size;
    }

    const fileChunk = createFileChunk(file, chunkStart, chunkEnd);

    const customRequest = createCustomRequest(fileChunk);

    return new Promise((resolve, reject) => {
      customFetch(customRequest)
        .then((response) => {
          // Success --> update the chunk index
          setChunkIndex((chunkIndex) => chunkIndex + 1);
          resolve({ chunkIndex });
        })
        .catch((err) => reject(err));
    });
  };

  // Recursive
  const handleUpload = async (chunkIndex) => {
    const file = inputRef.current.files[0];
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    setTotalChunks(totalChunks);

    try {
      await uploadChunk(chunkIndex);
    } catch (err) {
      console.log(err);
    }
  };

  const reset = () => {
    setChunkIndex(0);
    setUploadProgress(0);
    setTotalChunks(0);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await handleUpload(chunkIndex);
  };

  const handlePause = (event) => {
    event.preventDefault();
    setIsPaused(true);
    setChunkIndex((chunkIndex) => chunkIndex - 1);
    xmlRequest.current?.abort();
  };

  const handleCancel = (event) => {
    event.preventDefault();
    setIsPaused(false);
    xmlRequest.current?.abort();

    // reset the request list
    xmlRequest.current = undefined;

    reset();
  };

  const handleResume = (event) => {
    event.preventDefault();
    setIsPaused(false);
    handleUpload(chunkIndex);
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
