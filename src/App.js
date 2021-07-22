import { useState } from "react";

import "./App.css";

import { customFetch } from "./customFetch";

const URL = "http://localhost:8000/files";

function App() {
  const [file, setFile] = useState();

  const handleFileUpload = (event) => {
    const files = event.target.files;
    setFile(files[0]);
  }

  const handleSubmit = () => {

  }


  return (
    <div className="App">
      <form>
        <input
          type="file"
          onChange={handleFileUpload}
        />
        <button type="submit" onClick={handleSubmit}>
          Upload
        </button>
      </form>
    </div>
  );
}

export default App;
