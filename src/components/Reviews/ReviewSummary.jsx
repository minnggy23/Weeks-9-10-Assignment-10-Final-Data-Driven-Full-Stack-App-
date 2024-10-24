const { GoogleGenerativeAI } = require("@google/generative-ai");
import { getReviewsByRestaurantId } from "@/src/lib/firebase/firestore.js";
import { getAuthenticatedAppForUser } from "@/src/lib/firebase/serverApp";
import { getFirestore } from "firebase/firestore";
import { HarmBlockThreshold, HarmCategory } from "@google/generative-ai";



export async function GeminiSummary({ restaurantId }) {
  const { firebaseServerApp } = await getAuthenticatedAppForUser();
  const reviews = await getReviewsByRestaurantId(
      getFirestore(firebaseServerApp),
      restaurantId
  );

  const genAI= new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const genAISafety = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
  ];
  const model = genAI.getGenerativeModel(
    { 
      model: "gemini-1.5-flash",
      safetySettings: genAISafety
    }
  );

  const reviewSeparator = "@";
  const prompt = `
      Based on the following restaurant reviews, 
      where each review is separated by a '${reviewSeparator}' character, 
      create a one-sentence summary of what people think of the restaurant. 

      Here are the reviews: ${reviews.map(review => review.text).join(reviewSeparator)}
  `;

  try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return (
          <div className="restaurant__review_summary">
              <p>{text}</p>
              <p>✨ Summarized with Gemini</p>
          </div>
      );
  } catch (e) {
      console.error(e);
      return <p>Error contacting Gemini</p>;
  }
}

export function GeminiSummarySkeleton() {
  return (
    <div className="restaurant__review_summary">
      <p>✨ Summarizing reviews with Gemini...</p>
    </div>
  );
}
