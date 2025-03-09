import dummyBooks from "../dummybooks.json";
import ImageKit from "imagekit";
import { books } from "@/database/schema";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { config } from "dotenv";

config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle({ client: sql });

const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
});

const uploadToImageKit = async (
  url: string,
  fileName: string,
  folder: string,
) => {
  try {
    const response = await imagekit.upload({
      file: url,
      fileName,
      folder,
    });

    return response.filePath;
  } catch (error) {
    console.error("Error uploading image to ImageKit:", error);
  }
};

const seed = async () => {
  console.log("Seeding data...");

  try {
    const BATCH_SIZE = 10;
    for (let i = 0; i < dummyBooks.length; i += BATCH_SIZE) {
      const batch = dummyBooks.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async (book) => {
        //  カバー画像のアップロード
        const coverUrl = (await uploadToImageKit(
          book.coverUrl,  // 元の画像URL
          `${book.title}.jpg`, // 保存するファイル名
          '/books/covers' // ImageKit上のフォルダー名
        )) as string;

        // 動画のアップロード
        const videoUrl = (await uploadToImageKit(
          book.videoUrl,
          `${book.title}.mp4`,
          "/books/videos",
        )) as string;

        // データベースへの保存
        await db.insert(books).values({
          ...book, // 本の基本情報
          coverUrl, // アップロードされたカバー画像のURL
          videoUrl, // アップロードされた動画のURL
        });
      }));
    }

    console.log("Data seeded successfully!");
  } catch (error) {
    console.error("Error seeding data:", error);
  }
};

seed();
