const express = require("express");
const cors = require("cors");
const { google } = require("googleapis");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, "google-credentials.json"),
  scopes: ["https://www.googleapis.com/auth/drive.readonly"],
});

const drive = google.drive({ version: "v3", auth });

app.get("/api/audios", async (req, res) => {
  try {
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!folderId) {
      return res.status(500).json({
        error: "Google Drive folder ID is missing from .env",
      });
    }

    const audios = [];
    let pageToken;

    do {
      const response = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: "nextPageToken, files(id, name, mimeType, webViewLink)",
        pageSize: 1000,
        orderBy: "name",
        pageToken,
      });

      const files = response.data.files || [];

      audios.push(
        ...files
          .filter((file) => file.mimeType?.startsWith("audio/"))
          .map((file) => ({
            id: file.id,
            name: file.name,
            link:
              file.webViewLink ||
              `https://drive.google.com/file/d/${file.id}/view`,
          }))
      );

      pageToken = response.data.nextPageToken;
    } while (pageToken);

    res.json({ audios });
  } catch (error) {
    console.error("Google Drive error:", error.message);
    res.status(500).json({
      error: "Failed to retrieve audio files from Google Drive.",
    });
  }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);

    app.use(express.static(path.join(__dirname, "../client/dist")));

    app.get(/.*/, (req, res) => {
        res.sendFile(path.join(__dirname, "../client/dist/index.html"));
    });
});