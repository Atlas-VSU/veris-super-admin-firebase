import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/firebase/firebase-admin.config";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  let requestToken: string | undefined;
  try {
    const { idToken } = await request.json();
    requestToken = idToken;

    if (!idToken) {
      return NextResponse.json(
        { error: "ID token is required" },
        { status: 400 }
      );
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const userDoc = await adminDb.collection("users").doc(uid).get();
    const userData = userDoc.data();

    if (!userData) {
      try {
        const logPath = path.join(process.cwd(), "error.log");
        const logMessage = `[${new Date().toISOString()}] User is not registered in Firestore: UID=${uid}\n`;
        fs.appendFileSync(logPath, logMessage, "utf8");
      } catch (e) {
        console.error("Failed to write to error.log:", e);
      }
      return NextResponse.json(
        { error: "User is not registered" },
        { status: 404 }
      );
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000;

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    });

    // Get the cookie store
    const cookieStore = await cookies();

    cookieStore.set("session", sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    const userRole = userData.role ? String(userData.role) : "user";

    cookieStore.set("userRole", userRole, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    return NextResponse.json({ status: "success" });
  } catch (error: any) {
    console.error("Error creating session cookie:", error);
    try {
      const logPath = path.join(process.cwd(), "error.log");
      const logMessage = `[${new Date().toISOString()}] Error creating session: ${error.message}\nStack: ${error.stack}\nID Token: ${requestToken ? requestToken.substring(0, 20) + "..." : "none"}\n\n`;
      fs.appendFileSync(logPath, logMessage, "utf8");
    } catch (e) {
      console.error("Failed to write to error.log:", e);
    }
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 401 }
    );
  }
}
