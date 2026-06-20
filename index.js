import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';

const app = express();
const port = 3000;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const GEMINI_MODEL = "gemini-2.5-flash";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(express.json());

// === ENDPOINT 1: INPUT TEKS ===
app.post('/generate-text', async (req, res) => {
  const { prompt } = req.body;
  try {
    if (!prompt) return res.status(400).json({ message: "Prompt tidak boleh kosong." });
    
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });
    res.status(200).json({ result: response.text });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// === ENDPOINT 2: KHUSUS GAMBAR (PNG, JPG, WEBP, dll.) ===
app.post('/generate-from-image', upload.single('image'), async (req, res) => {
  const { prompt } = req.body;
  try {
    if (!req.file) return res.status(400).json({ message: "Tidak ada file gambar yang diunggah." });
    
    // Validasi: Pastikan berkas yang diunggah adalah gambar
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ message: "Format berkas salah. Wajib mengunggah gambar!" });
    }

    const base64Data = req.file.buffer.toString("base64");
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        { text: prompt || "Jelaskan isi gambar ini.", type: "text" },
        { inlineData: { data: base64Data, mimeType: req.file.mimetype } }
      ],
    });
    res.status(200).json({ result: response.text });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// === ENDPOINT 3: KHUSUS DOKUMEN (PDF, TXT) ===
app.post('/generate-from-document', upload.single('document'), async (req, res) => {
  const { prompt } = req.body;
  try {
    if (!req.file) return res.status(400).json({ message: "Tidak ada file dokumen yang diunggah." });
    
    // Validasi: Memastikan tipe file adalah PDF atau Teks biasa
    const allowedDocs = ['application/pdf', 'text/plain'];
    if (!allowedDocs.includes(req.file.mimetype)) {
      return res.status(400).json({ message: "Format berkas salah. Wajib PDF atau TXT!" });
    }

    const base64Data = req.file.buffer.toString("base64");
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        { text: prompt || "Beri ringkasan dari dokumen ini.", type: "text" },
        { inlineData: { data: base64Data, mimeType: req.file.mimetype } }
      ],
    });
    res.status(200).json({ result: response.text });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// === ENDPOINT 4: KHUSUS AUDIO (MP3, WAV, dll.) ===
app.post('/generate-from-audio', upload.single('audio'), async (req, res) => {
  const { prompt } = req.body;
  try {
    if (!req.file) return res.status(400).json({ message: "Tidak ada file audio yang diunggah." });
    
    // Validasi: Pastikan berkas yang diunggah adalah suara/audio
    if (!req.file.mimetype.startsWith('audio/')) {
      return res.status(400).json({ message: "Format berkas salah. Wajib mengunggah audio!" });
    }

    const base64Data = req.file.buffer.toString("base64");
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        { text: prompt || "Tuliskan transkrip dari audio ini.", type: "text" },
        { inlineData: { data: base64Data, mimeType: req.file.mimetype } }
      ],
    });
    res.status(200).json({ result: response.text });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.listen(port, () => {
  console.log(`Server siap pada http://localhost:${port}`);
});
