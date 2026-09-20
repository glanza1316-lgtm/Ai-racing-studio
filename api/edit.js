import OpenAI from "openai";

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "只接受 POST"
    });
  }

  try {

    const form =
      await req.formData();

    const image =
      form.get("image");

    const prompt =
      form.get("prompt");

    if (
      !image ||
      typeof image.arrayBuffer !== "function"
    ) {
      return res.status(400).json({
        error: "請上傳圖片"
      });
    }

    if (
      !prompt ||
      typeof prompt !== "string"
    ) {
      return res.status(400).json({
        error: "請輸入修改要求"
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error:
          "後端未設定 OPENAI_API_KEY"
      });
    }

    const client =
      new OpenAI({
        apiKey:
          process.env.OPENAI_API_KEY
      });

    const bytes =
      Buffer.from(
        await image.arrayBuffer()
      );

    const inputFile =
      new File(
        [bytes],
        image.name || "input.png",
        {
          type:
            image.type ||
            "image/png"
        }
      );

    const result =
      await client.images.edit({

        model:"gpt-image-2",

        image:inputFile,

        prompt:
          `Edit the supplied image according to
the user's request.

Preserve the original subject,
camera angle, composition and
realistic details unless explicitly
asked to change them.

User request:

${prompt}`,

        size:"auto",

        quality:"auto"
      });

    const imageData =
      result.data?.[0]?.b64_json;

    if (!imageData) {
      throw new Error(
        "AI 沒有返回圖片"
      );
    }

    return res.status(200).json({

      mimeType:"image/png",

      image:imageData
    });

  } catch(error) {

    console.error(error);

    return res.status(500).json({

      error:
        error?.message ||
        "AI 圖片修改失敗"
    });
  }
}
