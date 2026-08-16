/**
 * POST /api/upload
 * Server-side file upload handler using Firebase Admin SDK.
 * Bypasses App Check and client-side Storage rules entirely.
 *
 * Body: multipart/form-data with fields:
 *   - file: the file to upload
 *   - path: the destination path in Firebase Storage (e.g. "org-logos/myfile.png")
 */

import { NextRequest, NextResponse } from "next/server";
import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

// Initialise Admin app (reuse if already initialised)
function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const storagePath = formData.get("path") as string | null;

    if (!file || !storagePath) {
      return NextResponse.json(
        { error: "Missing 'file' or 'path' in request body." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const adminApp = getAdminApp();
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    const bucket = getStorage(adminApp).bucket(bucketName);

    const fileRef = bucket.file(storagePath);
    await fileRef.save(buffer, {
      metadata: { contentType: file.type },
      public: true,
    });

    // Build the public download URL
    const encodedPath = encodeURIComponent(storagePath);
    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media`;

    return NextResponse.json({ url: downloadUrl });
  } catch (err: any) {
    console.error("[/api/upload] Error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Upload failed." },
      { status: 500 }
    );
  }
}
