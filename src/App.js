import { useState } from "react";

import "./App.css";

import { customFetch } from "./customFetch";

const URL = "http://localhost:8000/files";

function App() {
  const [file, setFile] = useState();

  const handleFileUpload = (event) => {
    const files = event.target.files;
    setFile(files[0]);
  };

  const uploadFile = async () => {
    const customRequest = {
      url: `${URL}/upload`,
      method: "POST",
    };

    try {
      const response = await customFetch(customRequest);
      console.log(await response.json());
    } catch (err) {
      console.log(err);
    }
  };

  // Break the file into fixed size Blobs
  const createFileChunks = (file: File) => {
    const fileChunkList = [];
    const fileSize = file.size;

    let current = 0;
    const STEP = 10 * 1024;

    while (current < fileSize) {
      //var newBlob = blob.slice(start, end, contentType);
      const fileChunk = file.slice(current, current + STEP);
      current += STEP;
      fileChunkList.push({ file: fileChunk });
    }

    fileChunkList.push({file: file.slice(current, fileSize)});
  
    return fileChunkList;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const fileChunkList = createFileChunks(file);
    uploadFile();
  };

  return (
    <div className="App">
      <form>
        <input type="file" onChange={handleFileUpload} />
        <button type="submit" onClick={handleSubmit}>
          Upload
        </button>
      </form>
    </div>
  );
}

export default App;
