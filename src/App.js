import { useState, useRef, useMemo } from "react";

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

  const onUploadProgress = (event) => {

    setUploadProgress((uploadProgress) => uploadProgress + event.loaded);
  };

  const calculateProgress = useMemo(() => {
    if (!inputRef.current?.files) {
      return 0;
    }

    const fileSize = inputRef.current.files[0].size;

    return (uploadProgress / fileSize) * 100;
  }, [uploadProgress]);

  // Create a single file chunk of uniform size
  const createFileChunk = (file, chunkStart, chunkEnd) => {
    const fileChunk = file.slice(chunkStart, chunkEnd);
    console.log(fileChunk);
    return fileChunk;
  };

  // Create a custom request
  const createCustomRequest = (blob: Blob, chunkStart, chunkEnd, fileSize) => {
    const formData = new FormData();
    formData.append(`Blob ${Math.random()}`, blob);

    const customRequest = {
      url: `${URL}/upload`,
      method: "POST",
      body: formData,
      onUploadProgress,
      xmlRequest,
      headers: {
        "Content-Range": `bytes ${chunkStart}-${chunkEnd}/${fileSize}`,
      },
    };
    return customRequest;
  };

  const uploadChunk = async (chunkIndex) => {
    const file = inputRef.current.files[0];
    let chunkStart = chunkIndex * CHUNK_SIZE;

    let chunkEnd;

    if (chunkStart + CHUNK_SIZE <= file.size) {
      chunkEnd = chunkStart + CHUNK_SIZE;
    } else {
      chunkEnd = file.size;
    }

    console.log(`${chunkIndex} ${chunkStart} ${chunkEnd}`);

    const fileChunk = createFileChunk(file, chunkStart, chunkEnd);

    const customRequest = createCustomRequest(
      fileChunk,
      chunkStart,
      chunkEnd,
      file.size
    );

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

  const handleUpload = async (chunkIndex) => {
    const file = inputRef.current.files[0];
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    console.log(file.size);

    let nextChunk = chunkIndex;

    while (nextChunk < totalChunks) {
      try {
        const response = await uploadChunk(nextChunk);

        nextChunk = response.chunkIndex + 1;
        console.log(nextChunk);
      } catch (err) {
        console.log(err);
      }
    }

    if (nextChunk === totalChunks) {
      console.log("COMPLETED");
    }
  };

  const reset = () => {
    setChunkIndex(0);
    setUploadProgress(0);
    setIsPaused(false);
    xmlRequest.current?.abort();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    reset();
    await handleUpload(chunkIndex);
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
      <p>Progress: {calculateProgress} %</p>
      <div className="progress-container">
        <div
          className="progress-bar"
          style={{ width: `${calculateProgress}%` }}
        ></div>
      </div>
    </div>
  );
}

export default App;
