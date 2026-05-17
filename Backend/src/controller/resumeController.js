import fs from "fs";
export const uploadResume = async (req, res) => {
    console.log("[resume-upload] ===== START UPLOAD =====");

    try {

        // Validate file
        if (!req.file) {
            console.warn("[resume-upload] No file uploaded");

            return res.status(400).json({
                success: false,
                error: "No file uploaded",
            });
        }

        console.log("[resume-upload] File received:", {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path,
        });

        // Validate file exists
        console.log(
            "[resume-upload] FILE EXISTS:",
            fs.existsSync(req.file.path)
        );

        // Extract PDF text
        console.log("[resume-upload] Extracting PDF text...");

        const extractedText = await extractTextFromPDF(req.file.path);

        // Validate extracted text
        if (!extractedText || !extractedText.trim()) {

            return res.status(422).json({
                success: false,
                error: "No readable text found in PDF",
            });
        }

        console.log(
            "[resume-upload] Text extracted successfully"
        );

        // Save to DB
        const newResume = new Resume({
            userId: null,
            filename: req.file.originalname,
            resumeUrl: req.file.path,
        });

        const savedResume = await newResume.save();

        console.log(
            "[resume-upload] Resume saved:",
            savedResume._id
        );

        return res.status(200).json({
            success: true,
            message: "Resume uploaded successfully",
            extractedText,
            resumeId: savedResume._id,
        });

    } catch (error) {

        console.error("[resume-upload] Server Error:", error);

        return res.status(500).json({
            success: false,
            error: error.message || "Upload failed",
        });
    }
};