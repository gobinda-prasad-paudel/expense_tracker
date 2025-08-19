import IPLocate from "node-iplocate";
import dotenv from "dotenv";
dotenv.config();

// Replace with your actual API key from https://iplocate.io
const client = new IPLocate(process.env.NODE_IP_LOCATE_API_KEY);

async function testLookup() {
  try {
    // Example: Apple's IP block (should resolve to US / California)
    const result = await client.lookup("17.253.0.0");
    console.log("Lookup successful ✅");
    console.log(result);
  } catch (err) {
    console.error("Lookup failed ❌");
    console.error(err.message || err);
  }
}

testLookup();
