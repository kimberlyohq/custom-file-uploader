import { useState, useRef, useMemo } from "react";

import "./App.css";
import { customFetch } from "./customFetch";
import { usePaused } from "./usePaused";

const URL = "http://localhost:8000/files";
const CHUNK_SIZE = 10 * 1024;

function App() {
  const inputRef = useRef();

  const xmlRequest = useRef();

  const [isPaused, setIsPaused] = usePaused(undefined);

  // current upload progress of chunk
  const [uploadProgress, setUploadProgress] = useState(0);

  // current chunk index
  const [chunkIndex, setChunkIndex] = useState(0);

  // progress for the current uploaded chunk
  const onUploadProgress = (event) => {
    // Note: cannot reference event directly in setState update function
    let loaded = event.loaded;

    // uploadProgress value should be <= CHUNK_SIZE
    if (event.lengthComputable) {
      setUploadProgress((prevUploadProgress) => loaded);
    }
  };

  const calculateProgress = useMemo(() => {
    if (!inputRef.current?.files) {
      return 0;
    }

    const fileSize = inputRef.current.files[0].size;
    const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);

    let progress = uploadProgress;

    if (chunkIndex < totalChunks) {
      progress += chunkIndex * CHUNK_SIZE;
    } else {
      // the last chunk may be <the CHUNK_SIZE
      progress += (chunkIndex - 1) * CHUNK_SIZE;
    }

    return ((progress / fileSize) * 100).toFixed(1);
  }, [uploadProgress, chunkIndex]);

  // Create a single file chunk of uniform size
  const createFileChunk = (file, chunkStart, chunkEnd) => {
    const fileChunk = file.slice(chunkStart, chunkEnd);
    return fileChunk;
  };

  // Create a custom request
  const createCustomRequest = (blob: Blob, chunkStart, chunkEnd, fileSize) => {
    const customRequest = {
      url: `${URL}/upload`,
      method: "POST",
      body: blob,
      onUploadProgress,
      xmlRequest,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    };
    return customRequest;
  };

  const uploadChunk = async (chunkIndex) => {
    const file = inputRef.current.files[0];
    let chunkStart = chunkIndex * CHUNK_SIZE;

    let chunkEnd;

    if (chunkStart + CHUNK_SIZE < file.size) {
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
          resolve({ chunkIndex });
        })
        .catch((err) => reject(err));
    });
  };

  const handleUpload = async (isPaused, chunk = chunkIndex) => {
    const file = inputRef.current.files[0];

    if (!file) {
      alert("No file uploaded");
      return;
    }

    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    for (let i = chunk; i < totalChunks; i++) {
      if (isPaused) {
        break;
      }
      try {
        await uploadChunk(i);
        setChunkIndex(i);
      } catch (err) {
        console.log(err);
      }
    }

    setIsPaused(undefined, undefined);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsPaused(false, (paused) => handleUpload(paused, 0));
  };

  const handlePause = (event) => {
    event.preventDefault();
    xmlRequest.current?.abort();
    setIsPaused(true, undefined);
  };

  const handleCancel = (event) => {
    event.preventDefault();
    xmlRequest.current?.abort();
    setChunkIndex(0);
    setUploadProgress(0);
    setIsPaused(undefined, undefined);
    // reset the request list
    xmlRequest.current = undefined;
  };

  const handleResume = (event) => {
    event.preventDefault();
    setIsPaused(false, (paused) => handleUpload(paused));
  };

  return (
    <div className="App">
      <form>
        <input
          ref={inputRef}
          type="file"
          className="input"
          disabled={isPaused !== undefined}
        />
        <button
          type="submit"
          className="button"
          onClick={handleSubmit}
          disabled={isPaused !== undefined}
        >
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
