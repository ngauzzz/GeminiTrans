import fs from "fs";

const apiKey = process.env.GEMINI_API_KEY;

async function testUpload() {
  const mimeType = "text/plain";
  const size = 1024 * 1024; // 1MB
  const buffer = Buffer.alloc(size, "a");

  // 1. Initiate Resumable Upload
  const startUpload = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files`, {
    method: "POST",
    headers: {
      "x-goog-api-key": apiKey,
      "X-Goog-Upload-Protocol": "resumable",
      "X-Goog-Upload-Command": "start",
      "X-Goog-Upload-Header-Content-Length": size.toString(),
      "X-Goog-Upload-Header-Content-Type": mimeType,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ file: { display_name: "test.txt" } }),
  });

  console.log("Start status:", startUpload.status);
  if (!startUpload.ok) {
    console.log(await startUpload.json());
    return;
  }

  const uploadUrl = startUpload.headers.get("x-goog-upload-url");
  console.log("Upload URL:", uploadUrl);

  const uploadResult = await fetch(uploadUrl!, {
    method: "POST",
    headers: {
      "x-goog-api-key": apiKey,
      "Content-Length": size.toString(),
      "X-Goog-Upload-Offset": "0",
      "X-Goog-Upload-Command": "upload, finalize",
    },
    body: buffer,
  });

  console.log("Upload status:", uploadResult.status);
  if (!uploadResult.ok) {
    console.log(await uploadResult.json());
  } else {
    console.log(await uploadResult.json());
  }
}

testUpload();
