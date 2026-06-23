import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const serviceAccountPath = path.resolve("serviceAccountKey.json");
if (!fs.existsSync(serviceAccountPath)) {
  console.error("❌ serviceAccountKey.json not found in project root!");
  console.log("Please save it as serviceAccountKey.json in the project root.");
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

async function makeAdmin(identifier) {
  let uid = "";
  let email = "";
  let name = "";

  try {
    if (identifier.includes("@")) {
      console.log(`Searching for user with email: ${identifier}...`);
      const userRecord = await auth.getUserByEmail(identifier);
      uid = userRecord.uid;
      email = userRecord.email;
      name = userRecord.displayName || "Admin User";
    } else {
      console.log(`Searching for user with UID: ${identifier}...`);
      const userRecord = await auth.getUser(identifier);
      uid = userRecord.uid;
      email = userRecord.email || "";
      name = userRecord.displayName || "Admin User";
    }

    console.log(`Found user: ${name} (Email: ${email}, UID: ${uid})`);

    // Add to 'admins' collection
    await db.collection("admins").doc(uid).set({
      role: "admin",
      email: email,
      name: name,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`\n✅ Success! User ${name} is now an ADMIN in the database.`);
    console.log("They can now log into the Admin Panel successfully.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error setting admin status:", error.message);
    process.exit(1);
  }
}

const arg = process.argv[2];
if (!arg) {
  console.log("Usage: node add-admin.js <email_address_or_uid>");
  console.log("Example: node add-admin.js test@example.com");
  process.exit(1);
}

makeAdmin(arg);
