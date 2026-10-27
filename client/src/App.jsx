
import { useEffect, useMemo, useState } from "react";
import "./App.css";

function getAudioDate(name) {
  const match = name.match(
    /(?:^|\D)(\d{1,2})[/-](\d{1,2})[/-](\d{2}|\d{4})(?!\d)/
  );

  if (!match) return null;

  const month = Number(match[1]);
  const day = Number(match[2]);
  let year = Number(match[3]);

  if (match[3].length === 2) {
    year += year >= 70 ? 1900 : 2000;
  }

  const date = new Date(year, month - 1, day);

  // Reject invalid dates such as 02/31/26.
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return [
    year,
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

function App() {
  const [audios, setAudios] = useState([]);
  const [search, setSearch] = useState("");
  const [fileType, setFileType] = useState("all");
  const [sortOrder, setSortOrder] = useState("az");
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/audios")
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load audio files.");
        return response.json();
      })
      .then((data) => setAudios(data.audios))
      .catch(() => setError("Could not load the audio library."))
      .finally(() => setLoading(false));
  }, []);

  const filteredAudios = useMemo(() => {
    const query = search.trim().toLowerCase();

    return audios
      .filter((audio) => audio.name.toLowerCase().includes(query))
      .filter((audio) => {
        const extension = audio.name.split(".").pop().toLowerCase();
        return fileType === "all" || extension === fileType;
      })
      .filter((audio) => {
        return !selectedDate || getAudioDate(audio.name) === selectedDate;
      })
      .sort((a, b) => {
        const comparison = a.name.localeCompare(b.name, undefined, {
          sensitivity: "base",
        });

        return sortOrder === "az" ? comparison : -comparison;
      });
  }, [audios, search, fileType, sortOrder, selectedDate]);

  function clearFilters() {
    setSearch("");
    setFileType("all");
    setSortOrder("az");
    setSelectedDate("");
  }

  return (
    <main className="container">
      <header>
        <h1>Audio Library</h1>
        <p>Search and explore the collection.</p>
      </header>

      <input
        className="search"
        type="search"
        placeholder="Search audio titles..."
        aria-label="Search audio titles"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      <div className="filters">
        <label>
          <span>Recording date</span>
          <input
            className="date-filter"
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
          />
        </label>

        <label>
          <span>File type</span>
          <select
            value={fileType}
            onChange={(event) => setFileType(event.target.value)}
          >
            <option value="all">All formats</option>
            <option value="mp3">MP3</option>
            <option value="ogg">OGG</option>
            <option value="wav">WAV</option>
            <option value="m4a">M4A</option>
            <option value="flac">FLAC</option>
          </select>
        </label>
      </div>

      <p className="count">
        {loading
          ? "Loading audio files..."
          : `${filteredAudios.length} of ${audios.length} audio files`}
      </p>

      {error && <p role="alert">{error}</p>}

      {!loading && !error && (
        <section className="audio-list" aria-label="Audio files">
          {filteredAudios.map((audio) => (
            <a
              className="audio-item"
              href={audio.link}
              target="_blank"
              rel="noreferrer"
              key={audio.id}
            >
              <span className="audio-name">{audio.name}</span>
              <span className="open-link">Open ↗</span>
            </a>
          ))}

          {filteredAudios.length === 0 && (
            <div className="empty-state">
              <p>No matching audio files found.</p>
              <button className="clear-filters" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

export default App;
